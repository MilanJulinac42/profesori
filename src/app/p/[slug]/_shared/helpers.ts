/** Best-effort years extraction from `years_experience` text (e.g., "8+ godina iskustva"). */
export function extractYearsToken(text: string | null): string | null {
  if (!text) return null;
  const match = text.match(/(\d+\+?)\s*godin/i);
  return match ? match[1] : null;
}

/** Serbian plural for 1 / 2-4 / 5+ form. */
export function pluralSr(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
