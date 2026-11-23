import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidEmail, normalizeEmail, normalizePhone, validateRow } from "../src/validation.ts";
import { processRows } from "../src/importer.ts";

test("email is trimmed, lowercased and validated", () => {
  assert.equal(normalizeEmail("  John@Example.COM "), "john@example.com");
  assert.equal(isValidEmail("john@example.com"), true);
  assert.equal(isValidEmail("not-an-email"), false);
  assert.equal(isValidEmail("a@b"), false);
});

test("phone keeps digits only and replaces a leading 0 with +972", () => {
  assert.equal(normalizePhone("052-123-4567"), "+972521234567");
  assert.equal(normalizePhone("(03) 555 1234"), "+97235551234");
  assert.equal(normalizePhone("+972 52-123-4567"), "+972521234567");
  assert.equal(normalizePhone("5551234"), "5551234");
  assert.equal(normalizePhone(""), "");
});

test("validateRow rejects missing name, missing email and invalid email", () => {
  assert.deepEqual(validateRow({ full_name: "", email: "a@example.com" }), {
    ok: false,
    reason: "full_name is required",
  });
  assert.deepEqual(validateRow({ full_name: "Dana", email: "" }), {
    ok: false,
    reason: "email is required",
  });
  assert.deepEqual(validateRow({ full_name: "Dana", email: "dana@" }), {
    ok: false,
    reason: "invalid email",
  });
  assert.deepEqual(
    validateRow({
      full_name: " Dana Cohen ",
      email: "Dana@Example.com",
      phone: "052-123-4567",
      company: "Acme",
      created_at: "2024-01-10 09:00",
    }),
    {
      ok: true,
      contact: {
        full_name: "Dana Cohen",
        email: "dana@example.com",
        phone: "+972521234567",
        company: "Acme",
        created_at: "2024-01-10 09:00",
      },
    },
  );
});

test("processRows keeps the newest duplicate and lists skipped rows", () => {
  const result = processRows([
    { full_name: "Dana Old", email: "dana@example.com", created_at: "2024-01-10 09:00" },
    { full_name: "", email: "noname@example.com", created_at: "2024-02-01 09:00" },
    { full_name: "Dana New", email: "DANA@example.com", created_at: "2024-05-20 12:00" },
    { full_name: "Avi", email: "avi@example.com", created_at: "2024-03-01 10:00" },
  ]);

  assert.deepEqual(
    result.contacts.map((contact) => contact.full_name),
    ["Dana New", "Avi"],
  );
  assert.deepEqual(result.errors, [
    { row: 2, reason: "duplicate email, newer row 4 kept" },
    { row: 3, reason: "full_name is required" },
  ]);
});
