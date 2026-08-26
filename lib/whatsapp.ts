/**
 * Normalizes a phone number for WhatsApp use. Accepts common Indian formats
 * (with/without +91, spaces, dashes) and returns digits-only with country
 * code, e.g. "+91 98765 43210" -> "919876543210".
 * Returns null if the number doesn't look like a valid 10-digit mobile
 * number (with or without a country code).
 */
export function normalizeWhatsAppNumber(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length === 10) return `91${digits}`; // assume India, bare 10-digit number
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return null; // doesn't look like a valid mobile number — don't guess further
}

export function isValidWhatsAppNumber(raw: string | undefined | null): boolean {
  return normalizeWhatsAppNumber(raw) !== null;
}

/** Builds a wa.me deep link with a pre-filled, URL-encoded message. */
export function buildWhatsAppLink(phone: string, message: string): string {
  const normalized = normalizeWhatsAppNumber(phone);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
