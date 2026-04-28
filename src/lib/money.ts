/**
 * Money utilities. Internally we store RSD as integer paras (1500 RSD = 150000).
 * Pre-rounded to whole dinars when displaying.
 */

const FORMATTER = new Intl.NumberFormat("sr-Latn-RS", {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export function parasToRsd(paras: number): number {
  return Math.round(paras / 100);
}

export function rsdToParas(rsd: number): number {
  return Math.round(rsd * 100);
}

export function formatRsd(paras: number, withSuffix = true): string {
  const rsd = parasToRsd(paras);
  const formatted = FORMATTER.format(rsd);
  return withSuffix ? `${formatted} RSD` : formatted;
}

/**
 * Parse a user-entered RSD string into paras. Accepts "1.500", "1500", "1 500", "1500,50".
 * Returns null if invalid.
 */
export function parseRsdInput(input: string): number | null {
  const cleaned = input.trim().replace(/\s|\./g, "").replace(",", ".");
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num < 0) return null;
  return rsdToParas(num);
}
