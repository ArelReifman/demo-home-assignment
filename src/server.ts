import express, { type NextFunction, type Request, type Response } from "express";
import { readFileSync } from "node:fs";
import { parseCsv, processRows } from "./importer.ts";
import { getContact, listContacts, saveContacts } from "./db.ts";

const PORT = 3000;
const CSV_PATH = "data/contacts.csv";

const app = express();
app.use(express.static("public"));

app.post("/import", (_req, res) => {
  const rows = parseCsv(readFileSync(CSV_PATH, "utf8"));
  const { contacts, errors } = processRows(rows);
  saveContacts(contacts);
  res.json({ imported: contacts.length, skipped: errors.length, errors });
});

app.get("/contacts", (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  res.json(listContacts(search));
});

app.get("/contacts/:id", (req, res) => {
  const contact = getContact(Number(req.params.id));
  if (!contact) {
    res.status(404).json({ error: "Contact not found" });
    return;
  }
  res.json(contact);
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Contacts service running at http://localhost:${PORT}`);
});
