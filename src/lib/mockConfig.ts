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
  // If mock data is disabled by environment (e.g. production mode or NEXT_PUBLIC_ENABLE_MOCK_DATA=false),
  // strictly lock mock data to false: NO query parameter (?demo=1) can override or turn on mock data in production!
  if (!isMockEnvEnabled()) {
    return false;
  }

  // When mock environment is enabled (e.g. local dev, staging, or NEXT_PUBLIC_ENABLE_MOCK_DATA=true):
  // 1. Browser runtime: check URL query parameter
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('demo') === '0' || params.get('demo') === 'false') {
        return false;
      }
      if (params.get('demo') === '1' || params.get('demo') === 'true' || params.get('preview') === 'demo') {
        return true;
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
      if (demoParam === '0' || demoParam === 'false') {
        return false;
      }
      if (demoParam === '1' || demoParam === 'true' || url.searchParams.get('preview') === 'demo') {
        return true;
      }
    } catch {
      // ignore
    }
  }

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
  if (envVal === 'true' || envVal === '1') {
    return true;
  }
  // In production builds (NODE_ENV === 'production'), strictly default to false for safety
  // so no mock data leaks to live users even if the env variable was omitted.
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return true;
}

/** Check if vehicle is an unwanted test/sample lead created during manual dev tests */
export function isExcludedTestVehicle(id: string): boolean {
  if (
    id === 'v-test-admin' ||
    id === 'v-drv-lead-01' ||
    id === 'v-mock-test-admin' ||
    id === 'v-mock-drv-lead-01' ||
    id.startsWith('v-test-') ||
    id.startsWith('v-drv-lead-') ||
    id.startsWith('v-mock-test-') ||
    id.startsWith('v-mock-drv-lead-')
  ) {
    return true;
  }
  return false;
}

/** Check if driver lead is an unwanted test/sample lead created during manual dev tests */
export function isExcludedTestDriver(id: string): boolean {
  if (
    id === 'drv-lead-01' ||
    id === 'drv-73446' ||
    id === 'drv-mock-lead-01' ||
    id === 'drv-mock-73446' ||
    id.startsWith('drv-mock-') ||
    id.startsWith('drv-test-')
  ) {
    return true;
  }
  return false;
}

/** Check if vehicle ID is one of the built-in mock vehicles (v-1 to v-29, v-sd-*) */
export function isMockVehicleId(id: string): boolean {
  if (isExcludedTestVehicle(id)) return true;
  if (/^v-([1-9]|1[0-9]|2[0-9])b?$/.test(id)) return true;
  if (id.startsWith('v-sd-')) return true;
  if (id.startsWith('v-mock-')) return true;
  return false;
}

/** Check if board post ID is one of the built-in mock posts (b-1 to b-22, b-khaoyai, b-inthanon, b-mock-*) */
export function isMockPostId(id: string): boolean {
  if (id === 'b-khaoyai' || id === 'b-inthanon') return true;
  if (id.startsWith('b-mock-')) return true;
  return /^b-([1-9]|1[0-9]|2[0-2])$/.test(id);
}

/** Check if sponsor ID is one of the built-in mock sponsors (sp-1 to sp-22, sp-mock-*) */
export function isMockSponsorId(id: string): boolean {
  if (id.startsWith('sp-mock-')) return true;
  return /^sp-([1-9]|1[0-9]|2[0-2])$/.test(id);
}
