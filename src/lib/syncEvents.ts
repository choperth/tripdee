/**
 * TripDee Real-Time Synchronization Engine
 * Broadcasts data mutations across browser tabs/windows and inside the active page
 * so Admin Console and user views update instantly without manual page reloads.
 */

export type SyncDomain = 'all' | 'vehicles' | 'drivers' | 'quotes' | 'board' | 'sponsors';

export interface SyncMessage {
  domain: SyncDomain;
  action?: 'create' | 'update' | 'delete' | 'approve' | 'status_change';
  id?: string;
  timestamp: number;
}

const BROADCAST_CHANNEL_NAME = 'tripdee_realtime_sync';
const STORAGE_SYNC_KEY = 'tripdee_realtime_event';

/**
 * Broadcasts a sync event to the current page, all other tabs, and windows.
 */
export function broadcastDataSync(domain: SyncDomain = 'all', action?: SyncMessage['action'], id?: string) {
  if (typeof window === 'undefined') return;

  const message: SyncMessage = {
    domain,
    action,
    id,
    timestamp: Date.now(),
  };

  // 1. In-page CustomEvent (instant for components on the same page)
  try {
    window.dispatchEvent(new CustomEvent('tripdee_data_sync', { detail: message }));
  } catch {
    /* ignore */
  }

  // 2. Cross-tab BroadcastChannel (instant for all open tabs on the same origin)
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.postMessage(message);
      bc.close();
    }
  } catch {
    /* ignore */
  }

  // 3. Fallback localStorage event for cross-tab notification
  try {
    localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify(message));
  } catch {
    /* ignore */
  }
}

/**
 * Subscribes to real-time sync events from any tab or internal mutation.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeDataSync(handler: (message: SyncMessage) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const onCustomEvent = (e: Event) => {
    const detail = (e as CustomEvent<SyncMessage>)?.detail;
    if (detail) {
      handler(detail);
    }
  };
  window.addEventListener('tripdee_data_sync', onCustomEvent);

  let bc: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.onmessage = (event: MessageEvent<SyncMessage>) => {
        if (event.data) {
          handler(event.data);
        }
      };
    }
  } catch {
    /* ignore */
  }

  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_SYNC_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue) as SyncMessage;
        handler(parsed);
      } catch {
        handler({ domain: 'all', timestamp: Date.now() });
      }
    }
  };
  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener('tripdee_data_sync', onCustomEvent);
    window.removeEventListener('storage', onStorage);
    if (bc) {
      bc.close();
    }
  };
}
