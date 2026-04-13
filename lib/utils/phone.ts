export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  const digits = trimmed.replace(/[^\d]/g, "");
  if (trimmed.startsWith("+")) return `+${digits}`;
  return digits;
}

export function toWhatsAppDigits(input: string): string {
  return input.replace(/[^\d]/g, "");
}
