/**
 * Mock Data Feature Flag & Runtime Toggle for TripDee
 *
 * Controls whether Mock Data (sample vehicles, sample trip board posts, sample sponsors)
 * is loaded for demo/staging presentations vs real production data from Supabase.
 *
 * Hierarchy of control:
 * 1. URL Query Parameter (?demo=1 / ?demo=true / ?demo=false)
 * 2. Environment Variable: NEXT_PUBLIC_ENABLE_MOCK_DATA
 *    - 'false' => Pure Production mode (only real database data)
 *    - 'true' => Demo mode (sample data shown)
 * 3. Default: true (for local development & demo safety)
 */

export function isMockDataEnabled(reqUrl?: string): boolean {
  // 1. Browser runtime: check URL query parameter
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('demo') === '1' || params.get('demo') === 'true' || params.get('preview') === 'demo') {
        return true;
      }
      if (params.get('demo') === '0' || params.get('demo') === 'false') {
        return false;
      }
    } catch {
      // ignore
    }
  }

  // 2. Server runtime: check request URL if provided
  if (reqUrl) {
    try {
      const url = new URL(reqUrl, 'http://localhost');
      const demoParam = url.searchParams.get('demo');
      if (demoParam === '1' || demoParam === 'true' || url.searchParams.get('preview') === 'demo') {
        return true;
      }
      if (demoParam === '0' || demoParam === 'false') {
        return false;
      }
    } catch {
      // ignore
    }
  }

  // 3. Environment variable check
  const envVal = process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA || process.env.ENABLE_MOCK_DATA;
  if (envVal === 'false' || envVal === '0') {
    return false;
  }
  if (envVal === 'true' || envVal === '1') {
    return true;
  }

  // Default: true (safe for local development / demo presentations)
  return true;
}

/**
 * Pure environment variable check (strictly deterministic between SSR and Client initial render).
 * Used for initial React component state to guarantee 0 hydration mismatches.
 */
export function isMockEnvEnabled(): boolean {
  const envVal = process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA || process.env.ENABLE_MOCK_DATA;
  if (envVal === 'false' || envVal === '0') {
    return false;
  }
  return true;
}

/** Check if vehicle ID is one of the built-in mock vehicles (v-1 to v-29, v-sd-*) */
export function isMockVehicleId(id: string): boolean {
  if (/^v-([1-9]|1[0-9]|2[0-9])b?$/.test(id)) return true;
  if (id.startsWith('v-sd-')) return true;
  return false;
}

/** Check if board post ID is one of the built-in mock posts (b-1 to b-22) */
export function isMockPostId(id: string): boolean {
  return /^b-([1-9]|1[0-9]|2[0-2])$/.test(id);
}

/** Check if sponsor ID is one of the built-in mock sponsors (sp-1 to sp-22) */
export function isMockSponsorId(id: string): boolean {
  return /^sp-([1-9]|1[0-9]|2[0-2])$/.test(id);
}
