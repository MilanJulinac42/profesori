/**
 * Minimal RFC 4180-ish CSV parser. Handles quoted fields, escaped quotes
 * inside quotes, and \r\n line endings. Enough for spreadsheet exports
 * from Excel / Google Sheets / Numbers.
 */

export type ParsedCsv = {
  headers: string[];
  rows: string[][];
};

export function parseCsv(text: string): ParsedCsv {
  // Strip UTF-8 BOM if present.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        // "" → literal quote
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }

    if (c === "\r") {
      // Handle \r\n
      if (text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }

    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }

    field += c;
    i++;
  }

  // Push trailing field/row if file didn't end with newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop empty trailing rows.
  while (rows.length > 0) {
    const last = rows[rows.length - 1];
    if (last.length === 0 || (last.length === 1 && last[0].trim() === "")) {
      rows.pop();
    } else {
      break;
    }
  }

  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = rows[0].map((h) => h.trim());
  return { headers, rows: rows.slice(1) };
}

/**
 * Normalize a header label for fuzzy matching:
 *   "Roditelj — Telefon" → "roditeljtelefon"
 *   "Ime učenika"        → "imeucenika"
 * Strips diacritics, lowercase, alphanumeric only.
 */
export function normalizeHeader(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}
