import Database from "better-sqlite3";
import type { Contact } from "./validation.ts";

export type StoredContact = Contact & { id: number };

const db = new Database("data/contacts.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    company TEXT,
    created_at TEXT
  )
`);

const upsertStatement = db.prepare(`
  INSERT INTO contacts (full_name, email, phone, company, created_at)
  VALUES (@full_name, @email, @phone, @company, @created_at)
  ON CONFLICT(email) DO UPDATE SET
    full_name = excluded.full_name,
    phone = excluded.phone,
    company = excluded.company,
    created_at = excluded.created_at
`);

export const saveContacts = db.transaction((contacts: Contact[]) => {
  for (const contact of contacts) {
    upsertStatement.run(contact);
  }
});

export function listContacts(search = ""): StoredContact[] {
  const pattern = `%${search}%`;
  return db
    .prepare(
      `SELECT * FROM contacts
       WHERE full_name LIKE ? OR email LIKE ? OR company LIKE ?
       ORDER BY full_name`,
    )
    .all(pattern, pattern, pattern) as StoredContact[];
}

export function getContact(id: number): StoredContact | undefined {
  return db.prepare("SELECT * FROM contacts WHERE id = ?").get(id) as StoredContact | undefined;
}
