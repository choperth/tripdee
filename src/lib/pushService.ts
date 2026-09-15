import webpush from 'web-push';
import {
  getLocalPushSubscriptions,
  removeLocalPushSubscription,
  saveLocalPushSubscription,
  PushSubscriptionRecord,
} from './leadsStore';
import { getSupabase } from './supabase/client';

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@tripdee.com';

let isConfigured = false;
if (publicVapidKey && privateVapidKey) {
  try {
    webpush.setVapidDetails(vapidSubject, publicVapidKey, privateVapidKey);
    isConfigured = true;
  } catch (err) {
    console.error('[WebPush] Error configuring VAPID:', err);
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
}

export async function saveSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
  role?: 'driver' | 'customer' | 'admin';
}): Promise<PushSubscriptionRecord> {
  const role = sub.role || 'driver';
  const localRecord = saveLocalPushSubscription({
    endpoint: sub.endpoint,
    p256dh: sub.p256dh,
    auth: sub.auth,
    role,
  });

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from('push_subscriptions')
        .upsert(
          {
            id: localRecord.id,
            endpoint: sub.endpoint,
            p256dh: sub.p256dh,
            auth: sub.auth,
            role,
          },
          { onConflict: 'endpoint' }
        );
    } catch (err) {
      console.warn('[WebPush] Supabase save subscription error:', err);
    }
  }

  return localRecord;
}

export async function removeSubscription(endpoint: string): Promise<boolean> {
  removeLocalPushSubscription(endpoint);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    } catch (err) {
      console.warn('[WebPush] Supabase delete subscription error:', err);
    }
  }

  return true;
}

export async function fetchDriverSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('role', 'driver');

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          endpoint: d.endpoint,
          p256dh: d.p256dh,
          auth: d.auth,
          role: d.role as 'driver',
          createdAt: d.created_at,
        }));
      }
    } catch (err) {
      console.warn('[WebPush] Supabase fetch error, fallback to local:', err);
    }
  }

  return getLocalPushSubscriptions('driver');
}

export async function sendPushToSubscription(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: PushNotificationPayload
) {
  if (!isConfigured) {
    throw new Error('VAPID keys are not configured on the server');
  }

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/#trip-board',
    tag: payload.tag || `tripdee-msg-${Date.now()}`,
    icon: payload.icon || '/app-icon.png',
  });

  return webpush.sendNotification(
    {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    },
    pushPayload
  );
}

export async function sendPushToDrivers(payload: PushNotificationPayload) {
  if (!isConfigured) {
    console.warn('[WebPush] Cannot send push: VAPID keys not configured');
    return { sent: 0, failed: 0, pruned: 0 };
  }

  const subs = await fetchDriverSubscriptions();
  if (subs.length === 0) {
    return { sent: 0, failed: 0, pruned: 0 };
  }

  let sent = 0;
  let failed = 0;
  let pruned = 0;

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/#trip-board',
    tag: payload.tag || `tripdee-job-${Date.now()}`,
    icon: payload.icon || '/app-icon.png',
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          pushPayload
        );
        sent++;
      } catch (err: unknown) {
        const error = err as { statusCode?: number };
        // Status 410 (Gone) or 404 (Not Found) means the driver unsubscribed or browser cleared data
        if (error.statusCode === 410 || error.statusCode === 404) {
          await removeSubscription(sub.endpoint);
          pruned++;
        } else {
          failed++;
        }
      }
    })
  );

  return { sent, failed, pruned };
}
