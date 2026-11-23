# Contacts Import Service

A small Node.js service that imports a messy contacts CSV file, cleans and validates each row, and saves the valid contacts to SQLite.

## How to run

You need Node.js 22. I used 22.18. Run these commands from the project folder:

```bash
npm install
npm start    # starts the server at http://localhost:3000
npm test     # runs the unit tests
```

## Usage

Open http://localhost:3000 and click **Import contacts**. The page shows how many rows were imported and skipped, the reason for each skipped row, and a table you can search. The sample data is in `data/contacts.csv` (10 rows, 4 of them invalid on purpose).

You can also call the API directly:

```bash
curl -X POST http://localhost:3000/import          # {"imported":6,"skipped":4,"errors":[...]}
curl "http://localhost:3000/contacts?search=acme"  # search by name, email or company
curl http://localhost:3000/contacts/1              # one contact, or 404
```

## Design decisions

- Validation, normalization and duplicate handling are pure functions in `src/validation.ts` and `src/importer.ts`. They don't touch files or the database, so the tests can call them directly.
- SQLite with plain SQL (`better-sqlite3`). The `email` column is unique and the import does an upsert by email, so running the import twice doesn't create duplicates.
- The same Express server serves the API and the static page in `public/`. You only need one command to run it, and there's no CORS setup.

## Assumptions

- `POST /import` reads `data/contacts.csv` from disk. The assignment didn't ask for a file upload.
- `row` in the errors list is the line number in the CSV file, with the header on line 1.
- `skipped` counts every row that wasn't saved, including older duplicates. Each one appears in `errors` with a reason.
- Rows are validated before duplicates are checked, so an invalid row never replaces a valid one.
- `created_at` is compared as text, which works for the `YYYY-MM-DD HH:MM` format in the sample. If two rows have the same date, the later row in the file wins.
- If a phone number already starts with `+`, I keep the `+`. This way `+972 52-123-4567` and `052-123-4567` are both saved as `+972521234567`.

## What I would improve

- Let the user upload a CSV file from the page instead of reading a fixed file.
- Parse `created_at` as a real date and reject rows where the date is invalid.
- Keep the reported row numbers correct when the file has empty lines in the middle.
