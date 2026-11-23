import { parse } from "csv-parse/sync";
import { validateRow, type Contact, type CsvRow } from "./validation.ts";

export type RowError = { row: number; reason: string };

export type ProcessedRows = { contacts: Contact[]; errors: RowError[] };

const FIRST_DATA_ROW = 2;

export function parseCsv(text: string): CsvRow[] {
  return parse(text, { columns: true, skip_empty_lines: true, trim: true });
}

export function processRows(rows: CsvRow[]): ProcessedRows {
  const errors: RowError[] = [];
  const newestByEmail = new Map<string, { row: number; contact: Contact }>();

  rows.forEach((raw, index) => {
    const row = index + FIRST_DATA_ROW;
    const result = validateRow(raw);

    if (!result.ok) {
      errors.push({ row, reason: result.reason });
      return;
    }

    const contact = result.contact;
    const existing = newestByEmail.get(contact.email);

    if (!existing) {
      newestByEmail.set(contact.email, { row, contact });
    } else if (contact.created_at >= existing.contact.created_at) {
      errors.push({ row: existing.row, reason: `duplicate email, newer row ${row} kept` });
      newestByEmail.set(contact.email, { row, contact });
    } else {
      errors.push({ row, reason: `duplicate email, newer row ${existing.row} kept` });
    }
  });

  errors.sort((a, b) => a.row - b.row);
  const contacts = [...newestByEmail.values()].map((entry) => entry.contact);
  return { contacts, errors };
}
