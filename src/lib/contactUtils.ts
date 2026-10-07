/**
 * Contact & Messaging Utilities for TripDee
 * Supports WhatsApp, WeChat, LINE, and Phone formatting for Thai & International travelers
 */

/**
 * Builds a direct "Chat on WhatsApp" URL: https://wa.me/<number>?text=<encoded_text>
 * Automatically formats Thai numbers (0812345678 -> 66812345678)
 * and strips non-digits from international numbers (+65 9123 4567 -> 6591234567).
 */
export function formatWhatsAppLink(rawPhone?: string, message?: string): string {
  if (!rawPhone) return '';
  let digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';

  // If Thai phone starting with 0 (mobile 10 digits or landline 9 digits)
  if (digits.startsWith('0') && (digits.length === 10 || digits.length === 9)) {
    digits = '66' + digits.slice(1);
  }

  const url = new URL(`https://wa.me/${digits}`);
  if (message) {
    url.searchParams.set('text', message);
  }
  return url.toString();
}


/**
 * Builds an inquiry message for a vehicle listing on TripDee
 */
export function buildVehicleLineMessage(vehicle: { id: string; title: string; driverName?: string }): string {
  return `สวัสดีครับ สนใจเหมารถตู้จาก TripDee รหัส [${vehicle.id}: ${vehicle.title}] ครับ`;
}

/**
 * Formats a direct LINE link supporting pre-filled message via LINE OA or personal ID
 */
export function formatLineLink(rawLine?: string, message?: string): string {
  if (!rawLine || rawLine.trim() === '') {
    return 'https://line.me';
  }
  const trimmed = rawLine.trim();

  // If it's a LINE Official Account (starts with @)
  if (trimmed.startsWith('@')) {
    if (message) {
      return `https://line.me/R/oaMessage/${encodeURIComponent(trimmed)}/?${encodeURIComponent(message)}`;
    }
    return `https://line.me/R/ti/p/${encodeURIComponent(trimmed)}`;
  }

  // If it's a full LINE URL to an OA (e.g. https://line.me/R/ti/p/@lineoa)
  if (trimmed.includes('/ti/p/@') && message) {
    const oaId = trimmed.split('/ti/p/')[1]?.split('?')[0];
    if (oaId) {
      return `https://line.me/R/oaMessage/${oaId}/?${encodeURIComponent(message)}`;
    }
  }

  // If already a full URL, return as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Otherwise assume personal LINE ID
  return `https://line.me/ti/p/~${trimmed}`;
}

