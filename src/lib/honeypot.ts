/**
 * TripDee Anti-Spam Honeypot Utility
 *
 * Provides server-side & client-side defense against automated bots:
 * 1. Hidden trap field (hp_website): Invisible to human users, but filled by scrapers/bots.
 * 2. Submission speed check (_hp_timestamp): Rejects form fills completed in < 800ms.
 */

export const HONEYPOT_FIELD_NAME = 'hp_website';
export const TIMESTAMP_FIELD_NAME = '_hp_timestamp';

export interface HoneypotValidationResult {
  isSpam: boolean;
  reason?: 'trap_field_filled' | 'submitted_too_fast' | 'invalid_timestamp';
  elapsedMs?: number;
}

/**
 * Validate a form payload against honeypot traps.
 * @param body Request body payload object
 * @param options Configuration for timing thresholds
 */
export function validateHoneypot(
  body: Record<string, unknown>,
  options: { minElapsedMs?: number } = {}
): HoneypotValidationResult {
  const minElapsedMs = options.minElapsedMs ?? 800;

  // 1. Trap field check
  const trapValue = body[HONEYPOT_FIELD_NAME];
  if (typeof trapValue === 'string' && trapValue.trim().length > 0) {
    return {
      isSpam: true,
      reason: 'trap_field_filled',
    };
  }

  // 2. Timing check
  const rawTimestamp = body[TIMESTAMP_FIELD_NAME];
  if (rawTimestamp !== undefined && rawTimestamp !== null && rawTimestamp !== '') {
    const timestamp = Number(rawTimestamp);
    if (isNaN(timestamp) || timestamp <= 0) {
      return {
        isSpam: true,
        reason: 'invalid_timestamp',
      };
    }

    const elapsed = Date.now() - timestamp;
    // If submitted under minElapsedMs (e.g. 800ms) or timestamp is far in the future (> 24 hours clock skew)
    if (elapsed < minElapsedMs || elapsed < -86400000) {
      return {
        isSpam: true,
        reason: 'submitted_too_fast',
        elapsedMs: elapsed,
      };
    }
  }

  return { isSpam: false };
}
