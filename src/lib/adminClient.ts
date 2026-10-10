/**
 * Client-side helpers for calling admin-gated API routes.
 *
 * Admin auth is carried by an httpOnly session cookie set by
 * `/api/auth/admin/login`, so same-origin `fetch` calls are authorized
 * automatically. No secret is stored in (or read from) localStorage.
 */

/** No extra auth headers are needed — the admin session cookie authorizes the call. */
export function adminHeaders(): Record<string, string> {
  return {};
}

/**
 * `fetch` wrapper that attaches the admin auth headers and throws when the
 * response is not OK, so a failed moderation action surfaces instead of being
 * silently swallowed.
 */
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  for (const [key, value] of Object.entries(adminHeaders())) {
    headers.set(key, value);
  }

  const res = await fetch(input, { ...init, headers });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `คำขอไม่สำเร็จ (HTTP ${res.status})`);
  }
  return res;
}
