'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import { Vehicle, BoardPost, Sponsor } from '@/data/mockData';
import { DriverLead, QuotationLead } from '@/lib/leadsStore';
import { SponsorReportModal } from '@/components/SponsorReportModal';
import { AdminVehicleTab } from '@/components/portals/admin/AdminVehicleTab';
import { AdminDriverTab } from '@/components/portals/admin/AdminDriverTab';
import { AdminQuoteTab } from '@/components/portals/admin/AdminQuoteTab';
import { AdminBoardTab } from '@/components/portals/admin/AdminBoardTab';
import { AdminSponsorTab } from '@/components/portals/admin/AdminSponsorTab';
import { isMockDataEnabled } from '@/lib/mockConfig';
import { subscribeDataSync, broadcastDataSync } from '@/lib/syncEvents';
import { getSupabase } from '@/lib/supabase/client';
type AdminView = 'overview' | 'fleet' | 'bookings' | 'operators' | 'board' | 'sponsors' | 'security';

export interface AdminConsoleContentProps {
  isModal?: boolean;
  onClose?: () => void;
}

export const AdminConsoleContent: React.FC<AdminConsoleContentProps> = ({
  isModal = false,
  onClose = () => {},
}) => {
  const { user, approveDriverVerification } = useAuth();
  const { getSponsorClickCount, refresh: refreshAnalytics } = useAnalytics();

  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [operatorFilter, setOperatorFilter] = useState<'pending' | 'approved' | 'suspended'>('pending');
  const [reportSponsor, setReportSponsor] = useState<Sponsor | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [telemetryTime, setTelemetryTime] = useState('');

  // Admin Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');

  // Real data
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [driverLeads, setDriverLeads] = useState<DriverLead[]>([]);
  const [quoteLeads, setQuoteLeads] = useState<QuotationLead[]>([]);
  const [boardPosts, setBoardPosts] = useState<BoardPost[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  // Telemetry clock timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTelemetryTime(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Ask the server whether this browser holds a valid admin session. The admin
  // secret is server-only, so the client cannot self-authorize. The demo persona
  // is still honoured, but only while mock/demo mode is enabled.
  useEffect(() => {
    let cancelled = false;
    const finish = (authed: boolean) => {
      if (cancelled) return;
      if (authed) setIsAdminAuthenticated(true);
      setAuthChecking(false);
    };
    fetch('/api/auth/admin/session')
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated) {
          finish(true);
          return;
        }
        finish(isMockDataEnabled() && user?.role === 'admin');
      })
      .catch(() => finish(isMockDataEnabled() && user?.role === 'admin'));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/auth/admin/session', { method: 'DELETE' });
    } catch {
      /* ignore */
    }
    setIsAdminAuthenticated(false);
  };

  const refreshAll = useCallback(() => {
    setIsRefreshing(true);

    // Admin-gated reads rely on the httpOnly admin session cookie (sent
    // automatically on same-origin requests), never a client-held secret.
    // scope=admin returns the full fleet including vehicles still awaiting review.
    // Always use cache: 'no-store' so admin console never renders stale cached data.
    const cacheBuster = `_t=${Date.now()}`;
    const p1 = fetch(`/api/vehicles?scope=admin&${cacheBuster}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.vehicles && Array.isArray(data.vehicles)) setVehicles(data.vehicles);
      })
      .catch(() => {});

    const p2 = fetch(`/api/leads/driver?${cacheBuster}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.drivers && Array.isArray(data.drivers)) setDriverLeads(data.drivers);
      })
      .catch(() => {});

    const p3 = fetch(`/api/leads/quote?${cacheBuster}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.quotations && Array.isArray(data.quotations)) setQuoteLeads(data.quotations);
      })
      .catch(() => {});

    // includeClosed so moderators can still see, edit, and remove posts that
    // were auto-closed (travel date passed) or closed by their author.
    const p4 = fetch(`/api/board?includeClosed=true&${cacheBuster}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.posts && Array.isArray(data.posts)) setBoardPosts(data.posts);
      })
      .catch(() => {});

    const p5 = fetch(`/api/sponsors?${cacheBuster}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.sponsors && Array.isArray(data.sponsors)) setSponsors(data.sponsors);
      })
      .catch(() => {});

    Promise.allSettled([p1, p2, p3, p4, p5, refreshAnalytics()]).finally(() => {
      setTimeout(() => setIsRefreshing(false), 300);
    });
  }, [refreshAnalytics]);

  useEffect(() => {
    if (!isAdminAuthenticated) return;
    // Initial load
    queueMicrotask(() => {
      refreshAll();
    });

    // 1. Cross-tab & in-page real-time synchronization
    const unsubscribeSync = subscribeDataSync(() => {
      refreshAll();
    });

    // 2. Refocus / visibility change listener: updates immediately when returning to tab
    const onFocus = () => {
      refreshAll();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAll();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // 3. Heartbeat polling: every 6 seconds while the admin console tab is visible
    const pollInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshAll();
      }
    }, 6000);

    // 4. Supabase Realtime channel subscription (for mutations across different devices/servers)
    const sb = getSupabase();
    const channel = sb ? sb.channel('tripdee_admin_realtime') : null;
    if (channel) {
      try {
        channel
          .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => refreshAll())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_leads' }, () => refreshAll())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'quotations' }, () => refreshAll())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'board_posts' }, () => refreshAll())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsors' }, () => refreshAll())
          .subscribe();
      } catch {
        /* ignore realtime connection errors */
      }
    }

    return () => {
      unsubscribeSync();
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(pollInterval);
      if (channel && sb) {
        sb.removeChannel(channel);
      }
    };
  }, [isAdminAuthenticated, refreshAll]);


  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const pin = passwordInput.trim();
    setAuthError('');
    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        setPasswordInput('');
        setIsAdminAuthenticated(true);
      } else {
        setAuthError('รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง');
      }
    } catch {
      setAuthError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    }
  };
  // Render login screen if not authenticated
  if (!authChecking && !isAdminAuthenticated) {
    return (
      <div className={`bg-slate-950 flex items-center justify-center p-4 ${isModal ? 'w-full h-full min-h-[400px]' : 'min-h-screen'}`}>
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center bg-amber-400 text-slate-950 text-sm font-black">
                TD
              </span>
              <div>
                <h1 className="font-black text-sm tracking-tight text-white">TRIPDEE ADMIN CONSOLE</h1>
                <p className="text-[11px] text-slate-400">กรุณายืนยันตัวตนผู้ดูแลระบบ</p>
              </div>
            </div>
            {isModal && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
                title="ปิดหน้าต่าง (Esc)"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-pin" className="block text-xs font-bold text-slate-300 mb-1.5">
                รหัสผ่านผู้ดูแลระบบ (Admin Key)
              </label>
              <input
                id="admin-pin"
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="กรอกรหัสผ่าน Admin"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {authError && (
              <p className="text-xs text-red-400 font-semibold">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs transition-colors cursor-pointer"
            >
              เข้าสู่ระบบ Admin Console
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            {isModal ? (
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                ✕ ปิดหน้าต่าง (Close)
              </button>
            ) : (
              <Link href="/" className="text-xs text-slate-400 hover:text-white">
                ← กลับสู่หน้าหลัก TripDee
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }
  const handleApprove = async (driverId: string) => {
    approveDriverVerification(driverId);
    setDriverLeads((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, status: 'verified' } : d))
    );
    try {
      await fetch('/api/leads/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', id: driverId }),
      });
      refreshAll();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
      }
      broadcastDataSync('drivers', 'approve', driverId);
      broadcastDataSync('vehicles', 'approve');
    } catch (err) {
      console.error('Error approving driver:', err);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Category', 'ID', 'Title/Name', 'Status', 'Details', 'Contact/Location'],
      ...vehicles.map((v) => ['Fleet Vehicle', v.id, v.title, v.isAvailable ? 'Available' : 'Busy', `Seats: ${v.seats}`, v.location]),
      ...driverLeads.map((d) => ['Driver Lead', d.id, d.driverName || d.nickname, d.status, d.vehicleModel || 'Van', d.phone || '']),
      ...quoteLeads.map((q) => ['Booking Quote', q.id, q.companyName || q.contactName || 'Corporate', q.status, `฿${q.estimatedPrice}`, q.route || '']),
      ...boardPosts.map((b) => ['TripBoard', b.id, b.title, b.isClosed ? 'closed' : 'active', `฿${b.price || 0}`, b.zoneId || '']),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `tripdee_admin_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingDriversCount = driverLeads.filter((d) => d.status === 'pending').length;
  const verifiedDriversCount = driverLeads.filter((d) => d.status === 'verified').length;
  const rejectedDriversCount = driverLeads.filter((d) => d.status === 'rejected').length;
  const pendingQuotesCount = quoteLeads.filter((q) => q.status === 'pending').length;
  const pendingVehiclesCount = vehicles.filter((v) => v.approvalStatus === 'pending').length;
  const yellowPlateCount = vehicles.filter((v) => v.plateType === 'yellow').length;
  const bluePlateCount = vehicles.filter((v) => v.plateType === 'blue').length;
  const openBoardCount = boardPosts.filter((p) => !p.isClosed).length;
  const matchedBoardCount = boardPosts.filter((p) => Boolean(p.acceptedQuoteId)).length;
  const corporateBoardCount = boardPosts.filter((p) => p.category === 'corporate').length;
  const estimatedPipeline = quoteLeads.reduce((sum, q) => sum + (Number(q.estimatedPrice) || 0), 0);
  const cityRates = vehicles
    .map((v) => v.zoneRates?.city)
    .filter((r): r is number => typeof r === 'number' && r > 0);
  const avgCityRate =
    cityRates.length > 0 ? Math.round(cityRates.reduce((s, r) => s + r, 0) / cityRates.length) : null;
  const visibleDriverLeads = driverLeads.filter((d) =>
    operatorFilter === 'pending'
      ? d.status === 'pending'
      : operatorFilter === 'approved'
        ? d.status === 'verified'
        : d.status === 'rejected'
  );

  return (
    <div className={`font-body text-slate-900 dark:text-slate-100 antialiased ${
      isModal ? 'w-full h-full flex flex-col md:flex-row overflow-hidden bg-[#f8fafc] dark:bg-slate-950' : 'bg-[#f8fafc] dark:bg-slate-950 min-h-screen flex flex-col'
    }`}>
      {/* ============================================================== */}
      {/* LEFT SIDEBAR (Desktop) */}
      {/* ============================================================== */}
      <aside className={`w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 hidden lg:flex flex-col justify-between shrink-0 ${
        isModal ? 'h-full overflow-y-auto' : 'fixed left-0 top-0 h-full'
      }`}>
        <div className="flex flex-col">
          <Link href="/" className="min-h-16 py-3 px-4 flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:opacity-90 transition-opacity">
            <span className="grid h-8 w-8 place-items-center bg-slate-950 text-white text-[13px] font-extrabold tracking-tight shrink-0">
              TD
            </span>
            <div className="flex flex-col min-w-0">
              <span className="flex items-center gap-1.5 text-[13px] font-extrabold text-slate-950 dark:text-white leading-tight">
                TripDee
                <span className="px-1 py-px border border-slate-300 text-[10px] font-bold text-slate-600 tracking-wide">
                  ADMIN
                </span>
              </span>
              <span className="text-[10px] tracking-wide text-slate-400 font-medium">CONSOLE MATRIX</span>
            </div>
          </Link>

          <div className="px-4 py-3">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Navigation Matrix</span>
          </div>

          <nav className="flex flex-col gap-0.5 px-2">
            {[
              { id: 'overview', label: 'แผนภาพรวม (Overview)', icon: 'grid_view' },
              { id: 'fleet', label: 'จัดการยานพาหนะ', count: vehicles.length, icon: 'directions_bus' },
              { id: 'bookings', label: 'การจอง & ตรวจสอบ', count: pendingQuotesCount, icon: 'receipt_long', badge: pendingQuotesCount, hot: true },
              { id: 'operators', label: 'พาร์ทเนอร์คนขับ', count: driverLeads.length, icon: 'verified_user', badge: pendingDriversCount },
              { id: 'board', label: 'กระดานงาน TripBoard', count: boardPosts.length, icon: 'sync_alt' },
              { id: 'sponsors', label: 'สปอนเซอร์ & สัญญา', count: sponsors.length, icon: 'campaign' },
              { id: 'security', label: 'ระบบความปลอดภัย (Audit)', icon: 'shield' },
            ].map((item) => {
              const isActive = activeView === item.id;
              return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id as AdminView)}
                className={`relative flex items-center justify-between px-3 py-2.5 text-[13px] font-bold transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {isActive && <span className="absolute left-0 top-0 h-full w-1 bg-amber-400" />}
                <div className="flex items-center gap-2.5">
                  <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-amber-400' : 'text-slate-400'}`}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {typeof (item as { count?: number }).count === 'number' && (
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 min-w-[22px] text-center ${
                    isActive
                      ? 'bg-amber-500 text-white'
                      : (item as { hot?: boolean }).hot
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-500'
                  }`}>
                    {(item as { count?: number }).count}
                  </span>
                )}
              </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Gateway Core</span>
          <div className="mt-1 bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-emerald-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                Active Node: BKK-01
              </span>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-[18px]">dns</span>
          </div>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MAIN LAYOUT WRAPPER */}
      {/* ============================================================== */}
      <div className={`flex flex-col flex-1 min-w-0 ${isModal ? 'h-full overflow-y-auto' : 'lg:pl-64 min-h-screen'}`}>
        {/* TOP COMMAND HEADER */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="min-h-16 h-auto py-2.5 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="grid h-8 w-8 place-items-center bg-slate-950 text-white text-[13px] font-extrabold lg:hidden shrink-0">TD</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50/60 border border-emerald-200 text-[11px] sm:text-xs font-semibold text-emerald-700 whitespace-nowrap">
                <span className="material-symbols-outlined text-[15px]">lock</span>
                <span className="hidden sm:inline">ระบบแอดมิน</span>
                <span className="sm:hidden">แอดมิน</span>
              </div>
              <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700">
                <span className="material-symbols-outlined text-[16px]">campaign</span>
                <span>รถ {vehicles.length} คัน • ประกาศ {boardPosts.length} • รออนุมัติ {pendingVehiclesCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-700">
                <div className="flex flex-col text-right hidden sm:flex leading-tight">
                  <span className="text-[13px] font-extrabold text-slate-950 dark:text-white">Super Admin</span>
                  <span className="text-[11px] text-slate-400">ฝ่ายปฏิบัติการ TripDee</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-950 text-white flex items-center justify-center shrink-0 border border-slate-800">
                  <span className="material-symbols-outlined text-[20px]">account_circle</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await handleAdminLogout();
                    if (isModal) onClose();
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="ออกจากระบบแอดมิน"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span className="hidden md:inline">ออกจากระบบ</span>
                </button>
                {isModal ? (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="ปิดหน้าต่างแอดมิน"
                    className="w-8 h-8 rounded-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 grid place-items-center transition-colors cursor-pointer ml-1"
                    title="ปิดหน้าต่าง (Esc)"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                ) : (
                  <Link
                    href="/"
                    aria-label="กลับสู่หน้าหลัก TripDee"
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer ml-1"
                    title="กลับสู่หน้าหลัก"
                  >
                    <span className="material-symbols-outlined text-[16px]">home</span>
                    <span className="hidden sm:inline">หน้าหลัก</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center overflow-x-auto bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2 gap-1 shrink-0">
          {[
            { id: 'overview', label: 'ภาพรวม', icon: 'grid_view' },
            { id: 'fleet', label: 'ยานพาหนะ', icon: 'directions_bus' },
            { id: 'bookings', label: 'การจอง', icon: 'receipt_long' },
            { id: 'operators', label: 'คนขับ', icon: 'verified_user' },
            { id: 'board', label: 'TripBoard', icon: 'sync_alt' },
            { id: 'sponsors', label: 'สปอนเซอร์', icon: 'campaign' },
            { id: 'security', label: 'Audit Logs', icon: 'shield' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id as AdminView)}
              className={`px-3 py-1.5 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeView === item.id ? 'bg-[#0d1c32] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* MAIN BODY WORKSPACE */}
        <main className="w-full bg-[#f8fafc] dark:bg-slate-950 flex-1">
          {activeView === 'overview' && (
            <div className="flex flex-col w-full">
              {/* Mission Control Header */}
              <section className="w-full bg-white dark:bg-slate-900 px-4 sm:px-6 py-6 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-[1400px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="px-2 py-0.5 bg-[#0d1c32] text-white text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">
                        Mission Control
                      </span>
                      <span className="text-[10px] sm:text-xs text-slate-400 font-mono truncate">Node ID: BKK-CORE-ALPHA-01</span>
                    </div>
                    <h1 className="text-base sm:text-xl md:text-2xl font-bold text-slate-950 dark:text-white tracking-tight leading-tight">
                      แผงควบคุมระบบบริหารจัดการส่วนกลาง
                    </h1>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-snug">
                      <span className="hidden sm:inline">TripDee Admin Central Management & Real-time Operations Console • ดำเนินการระดับ Super-Privilege</span>
                      <span className="sm:hidden">ศูนย์ควบคุมระบบแอดมิน • Super-Privilege</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
                    <button
                      type="button"
                      onClick={refreshAll}
                      className="px-2.5 sm:px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-[11px] sm:text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer"
                    >
                      <span className={`material-symbols-outlined text-[16px] sm:text-[18px] ${isRefreshing ? 'animate-spin' : ''}`}>
                        sync
                      </span>
                      <span className="hidden sm:inline">รีเฟรชข้อมูลสด</span>
                      <span className="sm:hidden">รีเฟรช</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="px-2.5 sm:px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-[11px] sm:text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] sm:text-[18px]">file_download</span>
                      <span className="hidden sm:inline">ส่งออกรายงานรายวัน (CSV)</span>
                      <span className="sm:hidden">CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveView('security')}
                      className="px-2.5 sm:px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-[11px] sm:text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-[#d97706]">warning</span>
                      <span className="hidden sm:inline">ตั้งค่าระบบฉุกเฉิน</span>
                      <span className="sm:hidden">ฉุกเฉิน</span>
                    </button>
                  </div>
                </div>

                <div className="max-w-[1400px] mx-auto mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 px-4 py-2 border border-slate-200 dark:border-slate-700">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <span className="w-2 h-2 rounded-full bg-[#06c755] animate-pulse"></span>
                      ข้อมูลจริงจากระบบ
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span>ยานพาหนะ <strong className="text-slate-900 dark:text-white font-mono">{vehicles.length}</strong></span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span>ประกาศทริป <strong className="text-slate-900 dark:text-white font-mono">{boardPosts.length}</strong></span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span>ใบเสนอราคาองค์กร <strong className="text-slate-900 dark:text-white font-mono">{quoteLeads.length}</strong></span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span>ใบสมัครคนขับ <strong className="text-slate-900 dark:text-white font-mono">{driverLeads.length}</strong></span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span>สปอนเซอร์ <strong className="text-slate-900 dark:text-white font-mono">{sponsors.length}</strong></span>
                  </div>

                  <div className="text-xs font-mono text-slate-400">
                    UTC+07:00 • SYSTEM TICK: <span className="font-bold text-slate-950 dark:text-white">{telemetryTime}</span>
                  </div>
                </div>
              </section>

              {/* Workspace Container */}
              <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
                {/* 4 Monolithic KPI Blocks */}
                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">คาราวาน & ทริปประจำวัน</span>
                        <span className="material-symbols-outlined text-[20px] text-slate-950 dark:text-white">route</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-slate-950 dark:text-white font-mono">
                          {boardPosts.length}
                        </span>
                        <span className="text-xs text-slate-500">ทริป</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-[#06c755] font-bold">
                        <span className="material-symbols-outlined text-[16px]">handshake</span>
                        <span>จับคู่สำเร็จ {matchedBoardCount} ทริป</span>
                      </div>
                      <span className="text-[11px] text-slate-400">เปิดรับอยู่ {openBoardCount} ประกาศ • งานองค์กร {corporateBoardCount} ประกาศ</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">ผู้ขับขี่และฟลีทในระบบ</span>
                        <span className="material-symbols-outlined text-[20px] text-slate-950 dark:text-white">airport_shuttle</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-slate-950 dark:text-white font-mono">
                          {vehicles.length}
                        </span>
                        <span className="text-xs text-slate-500">คัน</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#fef3c7] text-[#d97706] text-xs font-bold w-fit">
                        <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
                        <span>รออนุมัติ {pendingVehiclesCount} คัน</span>
                      </div>
                      <span className="text-[11px] text-slate-400">ป้ายเหลือง {yellowPlateCount} คัน • ป้ายฟ้า {bluePlateCount} คัน</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">คำขอใบเสนอราคาองค์กร</span>
                        <span className="material-symbols-outlined text-[20px] text-slate-950 dark:text-white">groups</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-slate-950 dark:text-white font-mono">{quoteLeads.length}</span>
                        <span className="text-xs text-slate-500">รายการ</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-950 dark:text-white font-semibold">
                        <span className="material-symbols-outlined text-[16px]">domain</span>
                        <span>รออนุมัติ {pendingQuotesCount} รายการ</span>
                      </div>
                      <span className="text-[11px] text-slate-400">ใบสมัครคนขับ {driverLeads.length} ราย (รอตรวจ {pendingDriversCount})</span>
                    </div>
                  </div>

                  <div className="bg-[#0d1c32] text-white p-5 border border-slate-800 flex flex-col justify-between shadow-md">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">มูลค่าประเมินรวม (Pipeline)</span>
                        <span className="material-symbols-outlined text-[20px] text-[#fea619]">payments</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold font-mono text-white">฿{estimatedPipeline.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-800 flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-xs text-[#fea619] font-bold">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        <span>โมเดลดีลตรงคนขับ ตลอดชีพ</span>
                      </div>
                      <span className="text-[11px] text-slate-400">สปอนเซอร์ที่ใช้งาน {sponsors.length} ราย</span>
                    </div>
                  </div>
                </section>

                {/* 2-Column Asymmetric Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Pending Verifications */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
                      <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-slate-950 dark:text-white text-[22px]">badge</span>
                          <div>
                            <h2 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white leading-tight">
                              การตรวจสอบและอนุมัติผู้ขับขี่รายใหม่
                            </h2>
                            <span className="text-[11px] text-slate-500">คัดกรองใบอนุญาตสาธารณะ ตรวจประวัติอาชญากรรม สนง.ตำรวจแห่งชาติ</span>
                          </div>
                        </div>

                        <div className="flex items-center bg-white dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={() => setOperatorFilter('pending')}
                            className={`px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                              operatorFilter === 'pending' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:text-slate-950'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[11px]">schedule</span>
                            รอตรวจ ({pendingDriversCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setOperatorFilter('approved')}
                            className={`px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                              operatorFilter === 'approved' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:text-slate-950'
                            }`}
                          >
                            อนุมัติแล้ว ({verifiedDriversCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setOperatorFilter('suspended')}
                            className={`px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                              operatorFilter === 'suspended' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:text-slate-950'
                            }`}
                          >
                            ไม่ผ่าน ({rejectedDriversCount})
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                        {visibleDriverLeads.slice(0, 3).map((d) => (
                          <div
                            key={d.id}
                            className="p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center text-sm font-bold text-slate-800 dark:text-slate-200">
                                {(d.nickname || d.driverName || '?').trim().slice(0, 2)}
                              </div>
                              <div className="flex flex-col gap-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white">{d.driverName}</span>
                                  <span className="px-2 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px]">
                                    {d.id}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 text-[11px] font-bold flex items-center gap-1 border ${
                                      d.status === 'verified'
                                        ? 'bg-[#e8f9ee] text-[#06c755] border-emerald-200'
                                        : d.status === 'rejected'
                                          ? 'bg-rose-100 text-rose-700 border-rose-200'
                                          : 'bg-[#fef3c7] text-[#d97706] border-amber-300'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[12px]">
                                      {d.status === 'verified' ? 'verified' : d.status === 'rejected' ? 'block' : 'schedule'}
                                    </span>
                                    {d.status === 'verified' ? 'อนุมัติแล้ว' : d.status === 'rejected' ? 'ไม่ผ่านการอนุมัติ' : 'รอตรวจสอบ'}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                  <span className="flex items-center gap-1 text-slate-900 dark:text-white font-medium">
                                    <span className="material-symbols-outlined text-[16px] text-slate-400">directions_car</span>
                                    {d.vehicleModel || '—'}
                                    {d.seats ? ` ${d.seats} ที่นั่ง` : ''}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span>
                                    เส้นทาง: <strong>{d.routes || '—'}</strong>
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                                  {d.plateNumber && (
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800">
                                      {d.plateType === 'yellow' ? 'ป้ายเหลือง' : 'ป้ายฟ้า'} {d.plateNumber}
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800">โทร {d.phone}</span>
                                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800">ยื่นสมัคร {d.submittedAt}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setActiveView('operators')}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                <span>ตรวจเอกสาร</span>
                              </button>
                              {d.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => handleApprove(d.id)}
                                  className="px-4 py-2 bg-[#06c755] hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px]">check</span>
                                  <span>อนุมัติผู้ขับขี่</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        {visibleDriverLeads.length === 0 && (
                          <div className="p-5 text-xs text-slate-500">ยังไม่มีใบสมัครคนขับในสถานะนี้</div>
                        )}
                      </div>

                      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-500">แสดง {Math.min(3, visibleDriverLeads.length)} จาก {visibleDriverLeads.length} รายการในสถานะนี้</span>
                        <button
                          type="button"
                          onClick={() => setActiveView('operators')}
                          className="font-bold text-slate-950 dark:text-white hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>เปิดรายการตรวจสอบทั้งหมด</span>
                          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        </button>
                      </div>
                    </div>

                    {/* TripBoard Audit Console */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
                      <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-slate-950 dark:text-white text-[22px]">radar</span>
                          <div>
                            <h2 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white leading-tight">
                              กระดานตรวจสอบงาน TripBoard & การติดต่อตรง
                            </h2>
                            <span className="text-[11px] text-slate-500">มอนิเตอร์ประกาศจ้างรถตู้ คาราวาน และการเจรจาระหว่างผู้เดินทางกับพาร์ทเนอร์</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">
                          <span className="w-2 h-2 rounded-full bg-[#06c755]"></span>
                          <span>Active {openBoardCount} ประกาศ</span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[11px]">
                              <th className="py-3 px-4 font-semibold">รหัสประกาศ & รายละเอียดทริป</th>
                              <th className="py-3 px-4 font-semibold">ผู้สร้างคำขอ</th>
                              <th className="py-3 px-4 font-semibold">ประเภทรถ & งบประเมิน</th>
                              <th className="py-3 px-4 font-semibold">สถานะระบบ</th>
                              <th className="py-3 px-4 font-semibold text-right">การกำกับดูแล</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-slate-200">
                            {boardPosts.slice(0, 4).map((post) => (
                              <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="py-3.5 px-4">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5 font-bold">
                                      <span>{post.title}</span>
                                      {post.category === 'corporate' && (
                                        <span className="px-1.5 py-0.2 bg-[#0d1c32] text-white text-[10px]">Corporate</span>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                                      {post.id} • {post.date} ({post.days} วัน)
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="font-semibold block">{post.authorName}</span>
                                  <span className="text-[11px] text-slate-400">ผู้โดยสาร {post.seats} คน</span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="font-bold block">{post.vehicleLabel || '—'}</span>
                                  <span className="text-[#06c755] font-mono font-bold">
                                    {post.price > 0 ? `฿${post.price.toLocaleString()}` : 'ตกลงราคาภายหลัง'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  {post.acceptedQuoteId ? (
                                    <span className="px-2 py-0.5 bg-[#e8f9ee] text-[#06c755] font-bold text-[11px] inline-flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[13px]">handshake</span> จับคู่สำเร็จ
                                    </span>
                                  ) : post.isClosed ? (
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold text-[11px] inline-flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[13px]">block</span> ปิดรับงาน
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold text-[11px] inline-flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[13px]">hourglass_empty</span> รอคนขับเสนอราคา ({post.quoteCount || 0})
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setActiveView('board')}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                                    title="ดูรายละเอียดข้อความดีลตรง"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">forum</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {boardPosts.length === 0 && (
                              <tr>
                                <td colSpan={5} className="py-6 px-4 text-center text-xs text-slate-500">
                                  ยังไม่มีประกาศบนกระดานงาน
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-[#06c755]">security</span>
                          จัดการและตรวจสอบประกาศทั้งหมดได้ที่แท็บกระดานงาน TripBoard
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">{boardPosts.length} ประกาศในระบบ</span>
                      </div>
                    </div>
                  </div>

                  {/* 4-col Secondary Core */}
                  <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Sponsor Control */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
                      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-slate-950 dark:text-white text-[20px]">campaign</span>
                          <h3 className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white">
                            จัดการโฆษณา & สปอนเซอร์
                          </h3>
                        </div>
                        <span className="px-2 py-0.5 bg-[#0d1c32] text-white font-mono text-[10px] font-bold">
                          {sponsors.length} ACTIVE
                        </span>
                      </div>

                      <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 grid grid-cols-2 gap-2 text-center border-b border-slate-200 dark:border-slate-800">
                        <div className="bg-white dark:bg-slate-900 p-2.5 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">สปอนเซอร์ทั้งหมด</span>
                          <div className="text-lg font-bold text-slate-950 dark:text-white font-mono mt-0.5">{sponsors.length}</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-2.5 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">หมวดหมู่</span>
                          <div className="text-lg font-bold text-[#06c755] font-mono mt-0.5">{new Set(sponsors.map((s) => s.category)).size}</div>
                        </div>
                      </div>

                      <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800 p-4 gap-2.5 text-xs">
                        {sponsors.map((sp) => (
                          <div key={sp.id} className="flex items-start justify-between gap-3 pt-1">
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                                <span className="truncate">{sp.title}</span>
                                <span className="w-2 h-2 rounded-full bg-[#06c755] shrink-0" title="Active"></span>
                              </div>
                              <span className="text-[11px] text-slate-500">
                                {sp.categoryLabel}
                                {sp.tagline ? ` • ${sp.tagline}` : ''}
                              </span>
                            </div>
                          </div>
                        ))}
                        {sponsors.length === 0 && (
                          <div className="pt-1 text-xs text-slate-500">ยังไม่มีสปอนเซอร์ในระบบ</div>
                        )}
                      </div>

                      <div className="p-4 pt-0">
                        <button
                          type="button"
                          onClick={() => setActiveView('sponsors')}
                          className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">add</span>
                          <span>+ เพิ่มสล็อตสปอนเซอร์ใหม่</span>
                        </button>
                      </div>
                    </div>

                    {/* Security & PDPA Governance Logs */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
                      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-slate-950 dark:text-white text-[20px]">shield_person</span>
                          <h3 className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white">
                            ความปลอดภัยระบบ & PDPA Logs
                          </h3>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{sponsors.length} รายการ</span>
                      </div>

                      <div className="p-4 flex flex-col gap-3 text-xs">
                        <div className="text-xs text-slate-500">
                          ยังไม่มีบันทึกกิจกรรมในระบบ
                        </div>
                      </div>

                      <div className="p-4 pt-0 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveView('security')}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">folder_delete</span>
                          <span>จัดการคำขอทำลายข้อมูล PDPA</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveView('security')}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">history_edu</span>
                          <span>ตรวจสอบบันทึก Audit Logs ฉบับเต็ม</span>
                        </button>
                      </div>
                    </div>

                    {/* Stats Snapshot */}
                    <div className="bg-slate-950 text-white p-5 border border-slate-800 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="uppercase tracking-wider font-semibold">สรุปค่าใช้จ่ายฟลีทเฉลี่ย</span>
                        <span className="material-symbols-outlined text-[18px] text-[#fea619]">query_stats</span>
                      </div>
                      <div className="text-2xl font-bold font-mono text-white">
                        {avgCityRate !== null ? `฿${avgCityRate.toLocaleString()}` : '—'} <span className="text-xs text-slate-400 font-normal">/ คัน / วัน (ราคาในเมือง)</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        คำนวณจากราคาโซนในเมืองของรถที่ลงประกาศไว้จริง {cityRates.length} คัน
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'fleet' && (
            <div className="p-4 sm:px-6 py-6">
              <AdminVehicleTab vehicles={vehicles} onRefresh={refreshAll} />
            </div>
          )}

          {activeView === 'bookings' && (
            <div className="p-4 sm:px-6 py-6">
              <AdminQuoteTab quotes={quoteLeads} onRefresh={refreshAll} />
            </div>
          )}

          {activeView === 'operators' && (
            <div className="w-full bg-white">
              {/* Breadcrumb + Title Matrix — matches UI reference */}
              <div className="px-4 sm:px-8 pt-5 pb-4 border-b border-slate-200">
                <nav className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span>ระบบจัดการข้อมูลยานพาหนะ</span>
                  <span>/</span>
                  <span className="text-slate-800 font-semibold">พาร์ทเนอร์คนขับ & ตรวจสอบเอกสาร (Driver Verification)</span>
                </nav>

                <div className="mt-2 flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="text-[22px] sm:text-[26px] font-extrabold text-slate-950 tracking-tight leading-tight">
                      พาร์ทเนอร์คนขับ & ตรวจสอบเอกสาร
                    </h1>
                    <div className="mt-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-300 text-[12px] font-bold text-amber-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        ทั้งหมด {driverLeads.length} รายการดำเนินการ
                      </span>
                    </div>
                    <p className="mt-1.5 text-[12px] text-slate-500">
                      Driver Partners & Onboarding Quality Assurance Matrix
                    </p>
                  </div>

                  <div className="flex flex-col items-stretch xl:items-end gap-2 shrink-0">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={refreshAll}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <span className={`material-symbols-outlined text-[16px] ${isRefreshing ? 'animate-spin' : ''}`}>sync</span>
                        รีเฟรชข้อมูล
                      </button>
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">file_download</span>
                        ส่งออก CSV รายงานคนขับ
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const name = window.prompt('ชื่อ-นามสกุลคนขับใหม่ (เช่น พี่ทดสอบระบบ สมบูรณ์)');
                        if (!name) return;
                        const phone = window.prompt('เบอร์โทรติดต่อ (10 หลัก)', '0899998811') || '0899998811';
                        fetch('/api/leads/driver', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            driverName: name,
                            nickname: 'พี่ทดสอบ',
                            phone,
                            lineId: 'test_line_' + phone.slice(-4),
                            vehicleModel: 'Toyota Commuter VIP 9 ที่นั่ง',
                            seats: '9',
                            plateNumber: 'ทข-' + phone.slice(-4),
                            routes: 'เชียงใหม่และใกล้เคียง',
                          }),
                        }).then(() => refreshAll());
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-[13px] font-bold transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-amber-400">person_add</span>
                      + เพิ่มพาร์ทเนอร์คนขับใหม่
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-8 py-5 bg-[#f8fafc]">
                <AdminDriverTab driverLeads={driverLeads} onRefresh={refreshAll} onApprove={handleApprove} />
              </div>
            </div>
          )}

          {activeView === 'board' && (
            <div className="p-4 sm:px-6 py-6">
              <AdminBoardTab posts={boardPosts} onRefresh={refreshAll} />
            </div>
          )}

          {activeView === 'sponsors' && (
            <div className="p-4 sm:px-6 py-6">
              <AdminSponsorTab
                sponsors={sponsors}
                onRefresh={refreshAll}
                getSponsorClickCount={getSponsorClickCount}
                onOpenReport={setReportSponsor}
              />
            </div>
          )}

          {activeView === 'security' && (
            <div className="p-4 sm:px-6 py-6 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[24px] text-slate-950 dark:text-white">shield</span>
                    <div>
                      <h2 className="text-lg font-bold text-slate-950 dark:text-white">ศูนย์ตรวจสอบความปลอดภัย & PDPA Compliance</h2>
                      <p className="text-xs text-slate-500">บันทึกการเข้าถึงข้อมูล Audit Trail ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-[#e8f9ee] text-[#06c755] text-xs font-bold border border-emerald-200">
                    PDPA
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">รายการคำขอลบ/ทำลายข้อมูล (Right to Erasure)</h3>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                    ยังไม่มีคำขอลบหรือทำลายข้อมูล
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ============================================================== */}
        {/* FOOTER */}
        {/* ============================================================== */}
        <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-3 px-4 sm:px-6">
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>© 2025 TripDee Co., Ltd. ระบบศูนย์กลางการบริหารยานพาหนะส่วนกลาง</span>
              <span className="hidden md:inline text-slate-300">•</span>
              <span>ทะเบียนพาณิชย์อิเล็กทรอนิกส์ DBD เลขที่ 0105566023812</span>
              <span className="hidden md:inline text-slate-300">•</span>
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">shield</span>
                Audit Trail
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-slate-400">
                BUILD: v0.1.0
              </span>
              <span className="px-2 py-0.5 bg-white text-emerald-700 border border-emerald-500 font-bold text-[11px]">
                ALL SYSTEMS ONLINE
              </span>
            </div>
          </div>
        </footer>
      </div>

      {reportSponsor && (
        <SponsorReportModal
          isOpen={!!reportSponsor}
          onClose={() => setReportSponsor(null)}
          sponsor={reportSponsor}
        />
      )}
    </div>
  );
};

export default AdminConsoleContent;
