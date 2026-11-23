export type Contact = {
  full_name: string;
  email: string;
  phone: string;
  company: string;
  created_at: string;
};

export type CsvRow = Record<string, string | undefined>;

export type RowResult =
  | { ok: true; contact: Contact }
  | { ok: false; reason: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return "+972" + digits.slice(1);
  }
  if (trimmed.startsWith("+") && digits) {
    return "+" + digits;
  }
  return digits;
}

export function validateRow(row: CsvRow): RowResult {
  const fullName = (row.full_name ?? "").trim();
  const email = normalizeEmail(row.email ?? "");

  if (!email) {
    return { ok: false, reason: "email is required" };
  }
  if (!isValidEmail(email)) {
    return { ok: false, reason: "invalid email" };
  }
  if (!fullName) {
    return { ok: false, reason: "full_name is required" };
  }

  return {
    ok: true,
    contact: {
      full_name: fullName,
      email,
      phone: normalizePhone(row.phone ?? ""),
      company: (row.company ?? "").trim(),
      created_at: (row.created_at ?? "").trim(),
    },
  };
}
