/**
 * Privacy & Masking Utilities for TripDee
 * Protects driver personal identity, plate numbers, and phone numbers from scraping/legal exposure
 * while preserving high conversion rates and click-to-call functionality.
 */

/**
 * Masks the middle digits of a Thai phone number
 * e.g. "081-234-5678" -> "081-xxx-5678"
 * e.g. "0812345678"   -> "081-xxx-5678"
 */
export function maskPhoneNumber(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-xxx-${digits.slice(7)}`;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 2)}-xxx-${digits.slice(6)}`;
  }
  // Fallback for formatted strings
  return phone.replace(/(\d{2,3})[- ]?(\d{3,4})[- ]?(\d{4})/, '$1-xxx-$3');
}

/**
 * Masks the license plate number digits to prevent surveillance/unauthorized lookups
 * e.g. "30-4521 ชม." -> "30-xxxx ชม."
 * e.g. "นข-7788 ภก." -> "นข-xxxx ภก."
 * e.g. "กข-9921 นม." -> "กข-xxxx นม."
 */
export function maskPlateNumber(plate?: string): string {
  if (!plate) return '';
  // Match 3 to 4 consecutive digits after dash or space and replace with xxxx
  if (/[- ]\d{3,4}/.test(plate)) {
    return plate.replace(/[- ]\d{3,4}/, '-xxxx');
  }
  return plate.replace(/\d{3,4}/, 'xxxx');
}

/**
 * Formats a driver's name safely for public display
 * Suppresses full legal surname to protect personal privacy, preferring nicknames/trade names
 * e.g. "นายสุรชัย ใจดี" + "พี่ชัย รถตู้เชียงใหม่" -> "พี่ชัย รถตู้เชียงใหม่"
 * e.g. "นายวรพจน์ กานต์ธนา" -> "คุณวรพจน์"
 */
export function getPublicDriverName(driverName?: string, nickname?: string): string {
  if (nickname && nickname.trim().length > 0) {
    return nickname.trim();
  }
  if (!driverName) return 'คนขับ TripDee';

  // Remove common prefixes
  const cleaned = driverName
    .replace(/^(นาย|นาง|นางสาว|คุณ|ด\.ช\.|ด\.ญ\.)\s*/, '')
    .trim();

  const parts = cleaned.split(/\s+/);
  const firstName = parts[0] || cleaned;

  return `คุณ${firstName}`;
}
