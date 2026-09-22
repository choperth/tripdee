'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Volume2, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface DriverPushBellProps {
  compact?: boolean;
}

export const DriverPushBell: React.FC<DriverPushBellProps> = ({ compact = false }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Check support & current permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      queueMicrotask(() => {
        setIsSupported(true);
        setPermission(Notification.permission);
      });

      // Register Service Worker
      navigator.serviceWorker
        .register('/sw.js')
        .then(async (reg) => {
          const sub = await reg.pushManager.getSubscription();
          if (sub && Notification.permission === 'granted') {
            setIsSubscribed(true);
          }
        })
        .catch((err) => console.debug('[SW] Registration error:', err));
    }
  }, []);

  const handleSubscribe = async () => {
    if (!isSupported) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const reg = await navigator.serviceWorker.ready;

      // 1. Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        if (perm === 'denied') {
          setErrorMsg('คุณได้ปฏิเสธการแจ้งเตือน สามารถเปิดได้ที่ตั้งค่าเบราว์เซอร์ของอุปกรณ์คุณ');
        }
        setIsLoading(false);
        return;
      }

      // 2. Fetch VAPID public key
      const FALLBACK_VAPID_PUBLIC_KEY =
        'BF78nX6pFnCopBvpmpsHq6iddA33Za6Ipta32Zg4HIw9xKoTFvalivJiOKQFF3zF7_76pJpqctdSV95I7pNyoro';
      const keyRes = await fetch('/api/push/subscribe');
      const keyData = await keyRes.json();
      const vapidPublicKey =
        keyData.publicKey || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || FALLBACK_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        throw new Error('ไม่พบ VAPID Public Key ในระบบ');
      }

      // 3. Subscribe pushManager
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
      }

      // 4. Send subscription to server
      const p256dh = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');

      if (!p256dh || !auth) {
        throw new Error('ไม่สามารถดึง Push Encryption Keys ได้');
      }

      const p256dhBase64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dh))));
      const authBase64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(auth))));

      const saveRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: p256dhBase64,
            auth: authBase64,
          },
          role: 'driver',
        }),
      });

      if (!saveRes.ok) {
        throw new Error('บันทึกการรับแจ้งเตือนไม่สำเร็จ');
      }

      setIsSubscribed(true);

      // Auto trigger quick test notification
      await handleTestPush(subscription.endpoint, p256dhBase64, authBase64);
    } catch (err) {
      console.error('[WebPush] Subscribe error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเปิดการแจ้งเตือน');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!isSupported) return;
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error('[WebPush] Unsubscribe error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPush = async (endpointParam?: string, p256dhParam?: string, authParam?: string) => {
    try {
      setTestSent(true);
      let endpoint = endpointParam;
      let p256dh = p256dhParam;
      let auth = authParam;

      if (!endpoint || !p256dh || !auth) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!sub) return;
        endpoint = sub.endpoint;
        const p256Key = sub.getKey('p256dh');
        const authKey = sub.getKey('auth');
        if (!p256Key || !authKey) return;
        p256dh = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256Key))));
        auth = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authKey))));
      }

      await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          keys: { p256dh, auth },
        }),
      });

      setTimeout(() => setTestSent(false), 3500);
    } catch (e) {
      console.error('[WebPush] Test error:', e);
      setTestSent(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  // Compact variant (e.g. for DriverSelfServiceModal)
  if (compact) {
    return (
      <div className="rounded-xl border border-rule dark:border-slate-800 bg-card dark:bg-slate-900 p-3.5 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`p-2 rounded-xl ${
              isSubscribed
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400'
            }`}>
              {isSubscribed ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </span>
            <div>
              <p className="text-xs font-bold text-ink dark:text-white">
                {isSubscribed ? 'เปิดแจ้งเตือนงานใหม่ทางมือถือแล้ว' : 'แจ้งเตือนงานใหม่ทางมือถือ (ฟรี 100%)'}
              </p>
              <p className="text-[11px] text-ink-2 dark:text-slate-400 mt-0.5">
                {isSubscribed ? 'ระบบจะส่งเสียงและเด้งเตือนเมื่อมีลูกค้าลงบอร์ด' : 'เสียงแจ้งเตือนเด้งบนจอมือถือทันทีที่มีลูกค้าหาคนขับ'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isSubscribed ? (
              <>
                <button
                  type="button"
                  onClick={() => handleTestPush()}
                  disabled={testSent}
                  className="td-btn inline-flex items-center gap-1 rounded-pill bg-paper hover:bg-card dark:bg-slate-800 dark:hover:bg-slate-700 border border-rule dark:border-slate-700 px-2.5 py-1.5 text-[11px] font-extrabold text-ink dark:text-slate-200 transition-colors"
                  title="ทดสอบเสียงแจ้งเตือน"
                >
                  <Volume2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{testSent ? 'ส่งเสียงแล้ว...' : 'ทดสอบเสียง'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleUnsubscribe}
                  disabled={isLoading}
                  className="text-[11px] text-ink-2 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 underline px-1 transition-colors cursor-pointer"
                >
                  ปิด
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={isLoading}
                className="td-btn inline-flex items-center gap-1 rounded-pill bg-accent hover:bg-accent-deep px-3 py-1.5 text-xs font-extrabold text-white shadow-xs"
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
                <span>เปิดแจ้งเตือน</span>
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <p className="text-[11px] text-rose-600 mt-2 flex items-center gap-1 font-medium">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </p>
        )}
      </div>
    );
  }

  // Full banner variant (e.g. for TripBoard header)
  return (
    <div className={`mb-4 rounded-xl border p-3 sm:p-4 text-ink shadow-2xs transition-colors ${
      isSubscribed
        ? 'border-emerald-200/90 dark:border-emerald-800/60 bg-gradient-to-r from-emerald-50/90 via-card to-emerald-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/20'
        : 'border-amber-300/80 dark:border-amber-800/60 bg-gradient-to-r from-amber-50/90 via-card to-amber-50/50 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-950/20'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl shadow-2xs ${
            isSubscribed ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-950'
          }`}>
            {isSubscribed ? <BellRing className="h-4.5 w-4.5" /> : <Bell className="h-4.5 w-4.5" />}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-extrabold text-ink dark:text-white flex items-center gap-1.5">
                <span>{isSubscribed ? '✓ คุณเปิดรับการแจ้งเตือนงานใหม่ทางมือถือแล้ว' : '🔔 สำหรับคนขับ: เปิดรับแจ้งเตือนงานใหม่บนจอมือถือ (ฟรี 0 บาท)'}</span>
                {isSubscribed && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 border border-emerald-300/60 dark:border-emerald-700/60">
                    <CheckCircle className="h-2.5 w-2.5" /> Active
                  </span>
                )}
              </h4>
            </div>
            <p className="text-xs text-ink-2 dark:text-slate-300 mt-0.5 leading-relaxed">
              {isSubscribed
                ? 'ระบบจะส่งเสียงและแจ้งเตือนเด้งขึ้นบนหน้าจอมือถือของคุณทันทีเมื่อมีลูกค้าลงประกาศงานใหม่'
                : 'รับงานไวกว่าใคร! แจ้งเตือนเด้งบนจอมือถือทันทีเมื่อมีลูกค้าลงประกาศหาคนขับหรือรถสัมมนา ไม่ต้องนั่งเฝ้าหน้าจอ'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {isSubscribed ? (
            <>
              <button
                type="button"
                onClick={() => handleTestPush()}
                disabled={testSent}
                className="td-btn inline-flex items-center gap-1.5 rounded-pill bg-card hover:bg-paper dark:bg-slate-800 dark:hover:bg-slate-700 border border-rule dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-ink dark:text-white shadow-2xs transition-all"
                title="ทดสอบเสียงแจ้งเตือนบนอุปกรณ์นี้"
              >
                <Volume2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{testSent ? 'ส่งเสียงเตือนแล้ว...' : 'ทดสอบเสียงแจ้งเตือน'}</span>
              </button>
              <button
                type="button"
                onClick={handleUnsubscribe}
                disabled={isLoading}
                className="text-xs text-ink-2 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 underline font-medium px-2 py-1 transition-colors cursor-pointer"
              >
                ปิดรับแจ้งเตือน
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={isLoading}
              className="td-btn td-pop inline-flex items-center gap-1.5 rounded-pill bg-amber-400 hover:bg-amber-300 text-amber-950 px-4 py-2 text-xs font-extrabold shadow-sm transition-all active:scale-98"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>กำลังเชื่อมต่อ...</span>
                </>
              ) : (
                <>
                  <Bell className="h-3.5 w-3.5" />
                  <span>เปิดแจ้งเตือนงานใหม่ (ฟรี)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mt-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 p-2 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
