/**
 * Deterministic fuzzy match between free-text "topics_covered" tags and
 * curriculum unit titles. Used after AI extraction to suggest which units
 * the teacher likely covered, so the dialog can offer a soft "Potvrdi?"
 * confirmation. Never auto-applied — UX decision in plan §2 Q7.
 *
 * Strategy (no AI, purely string ops):
 *   1. Normalize both strings — lowercase, strip diacritics, drop punctuation.
 *   2. For each topic, find the best-scoring unit by:
 *        - exact normalized match     → 1.0
 *        - substring containment      → 0.85
 *        - token-set Jaccard overlap  → up to 0.7
 *        - levenshtein-similarity     → up to 0.65
 *   3. Keep matches whose score ≥ THRESHOLD.
 *   4. De-duplicate so each unit_id appears at most once.
 */

const THRESHOLD = 0.65;

export type SuggestableUnit = {
  unit_id: string;
  unit_title: string;
};

export function suggestUnitsFromTopics(
  topics: string[],
  units: SuggestableUnit[],
): string[] {
  if (topics.length === 0 || units.length === 0) return [];

  const normalizedUnits = units.map((u) => ({
    ...u,
    normalized: normalize(u.unit_title),
    tokens: tokenize(u.unit_title),
  }));

  const suggested = new Set<string>();
  for (const topic of topics) {
    const tNorm = normalize(topic);
    const tTokens = tokenize(topic);
    if (!tNorm) continue;

    // Collect every unit whose score clears the threshold, not just best.
    // A topic like "Sinus i kosinus" should match both "Sinus" and "Kosinus".
    for (const u of normalizedUnits) {
      const score = scorePair(tNorm, tTokens, u.normalized, u.tokens);
      if (score >= THRESHOLD) suggested.add(u.unit_id);
    }
  }
  return [...suggested];
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritical marks
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): string[] {
  const n = normalize(s);
  if (!n) return [];
  return n.split(" ").filter((t) => t.length >= 3);
}

function scorePair(
  a: string,
  aTokens: string[],
  b: string,
  bTokens: string[],
): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length >= 4 && b.includes(a)) return 0.85;
  if (b.length >= 4 && a.includes(b)) return 0.85;

  // Token-level matching that tolerates Serbian inflection
  // ("Pitagora" ↔ "Pitagorina"). Two tokens "match" if either:
  //   - they share a common prefix of ≥ 4 chars AND one length is within
  //     +/- 3 chars of the other (catches inflection: "pitagora"/"pitagorina")
  //   - OR Levenshtein(t1, t2) ≤ 2 (catches typos)
  function tokenMatches(t1: string, t2: string): boolean {
    if (t1 === t2) return true;
    if (t1.length < 4 || t2.length < 4) return false;
    const prefixLen = commonPrefix(t1, t2);
    if (prefixLen >= 4 && Math.abs(t1.length - t2.length) <= 4) return true;
    if (levenshtein(t1, t2) <= 2) return true;
    return false;
  }

  if (aTokens.length > 0 && bTokens.length > 0) {
    let matched = 0;
    const aUsed = new Set<number>();
    const bUsed = new Set<number>();
    for (let i = 0; i < aTokens.length; i++) {
      if (aUsed.has(i)) continue;
      for (let j = 0; j < bTokens.length; j++) {
        if (bUsed.has(j)) continue;
        if (tokenMatches(aTokens[i]!, bTokens[j]!)) {
          matched++;
          aUsed.add(i);
          bUsed.add(j);
          break;
        }
      }
    }
    if (matched === 0) {
      // Fall through to Levenshtein on full strings.
    } else {
      // If all tokens of the SHORTER side matched, treat as strong hit.
      const shorterLen = Math.min(aTokens.length, bTokens.length);
      if (matched === shorterLen) return 0.85;
      const jaccard = matched / (aTokens.length + bTokens.length - matched);
      if (jaccard >= 0.4) return Math.max(0.7, jaccard);
    }
  }

  // Levenshtein-based similarity for short titles.
  const maxLen = Math.max(a.length, b.length);
  if (maxLen <= 30) {
    const d = levenshtein(a, b);
    return 1 - d / maxLen;
  }
  return 0;
}

function commonPrefix(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i++;
  return i;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const dp: number[] = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) dp[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]!;
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]!;
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = 1 + Math.min(prev, dp[j - 1]!, dp[j]!);
      }
      prev = tmp;
    }
  }
  return dp[b.length]!;
}
