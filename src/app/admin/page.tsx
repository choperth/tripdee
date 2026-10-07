'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import { Vehicle, BoardPost, Sponsor, SPONSORS } from '@/data/mockData';
import { DriverLead, QuotationLead } from '@/lib/leadsStore';
import { SponsorReportModal } from '@/components/SponsorReportModal';
import { AdminVehicleTab } from '@/components/portals/admin/AdminVehicleTab';
import { AdminDriverTab } from '@/components/portals/admin/AdminDriverTab';
import { AdminQuoteTab } from '@/components/portals/admin/AdminQuoteTab';
import { AdminBoardTab } from '@/components/portals/admin/AdminBoardTab';
import { AdminSponsorTab } from '@/components/portals/admin/AdminSponsorTab';

type AdminView = 'overview' | 'fleet' | 'bookings' | 'operators' | 'board' | 'sponsors' | 'security';

export default function AdminConsolePage() {
  const { user, approveDriverVerification, logout } = useAuth();
  const { t } = useLanguage();
  const { summary, getSponsorClickCount } = useAnalytics();

  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [operatorFilter, setOperatorFilter] = useState<'pending' | 'approved' | 'suspended'>('pending');
  const [reportSponsor, setReportSponsor] = useState<Sponsor | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [telemetryTime, setTelemetryTime] = useState('14:32:08');

  // Admin Authentication State
  const [adminToken, setAdminToken] = useState<string>('');
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

  // Check admin session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('td-admin-token');
    if (savedToken) {
      setAdminToken(savedToken);
      setIsAdminAuthenticated(true);
    }
    setAuthChecking(false);
  }, []);

  const refreshAll = useCallback(() => {
    const token = localStorage.getItem('td-admin-token') || adminToken;
    if (!token) return;

    setIsRefreshing(true);
    const headers: HeadersInit = token ? { 'x-admin-pin': token, Authorization: `Bearer ${token}` } : {};

    // scope=admin returns the full fleet including vehicles still awaiting review.
    const p1 = fetch('/api/vehicles?scope=admin', { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.vehicles && Array.isArray(data.vehicles)) setVehicles(data.vehicles);
      })
      .catch(() => {});

    const p2 = fetch('/api/leads/driver', { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.drivers && Array.isArray(data.drivers)) setDriverLeads(data.drivers);
      })
      .catch(() => {});

    const p3 = fetch('/api/leads/quote', { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.quotations && Array.isArray(data.quotations)) setQuoteLeads(data.quotations);
      })
      .catch(() => {});

    const p4 = fetch('/api/board')
      .then((res) => res.json())
      .then((data) => {
        if (data.posts && Array.isArray(data.posts)) setBoardPosts(data.posts);
      })
      .catch(() => {});

    const p5 = fetch('/api/sponsors')
      .then((res) => res.json())
      .then((data) => {
        if (data.sponsors && Array.isArray(data.sponsors)) setSponsors(data.sponsors);
      })
      .catch(() => {});

    Promise.allSettled([p1, p2, p3, p4, p5]).finally(() => {
      setTimeout(() => setIsRefreshing(false), 600);
    });
  }, [adminToken, user]);

  useEffect(() => {
    if (isAdminAuthenticated) {
      refreshAll();
    }
  }, [isAdminAuthenticated, refreshAll]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = passwordInput.trim();
    const expectedPin = process.env.NEXT_PUBLIC_ADMIN_PIN;
    if (expectedPin && pin === expectedPin) {
      localStorage.setItem('td-admin-token', pin);
      setAdminToken(pin);
      setIsAdminAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง');
    }
  };
  // Render login screen if not authenticated
  if (!authChecking && !isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white">
          <div className="flex items-center gap-3 mb-6">
            <span className="grid h-9 w-9 place-items-center bg-amber-400 text-slate-950 text-sm font-black">
              TD
            </span>
            <div>
              <h1 className="font-black text-sm tracking-tight text-white">TRIPDEE ADMIN CONSOLE</h1>
              <p className="text-[11px] text-slate-400">กรุณายืนยันตัวตนผู้ดูแลระบบ</p>
            </div>
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
            <Link href="/" className="text-xs text-slate-400 hover:text-white">
              ← กลับสู่หน้าหลัก TripDee
            </Link>
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
      const token = localStorage.getItem('td-admin-token') || adminToken;
      await fetch('/api/leads/driver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-admin-pin': token, Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'approve', id: driverId }),
      });
      refreshAll();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
      }
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
  const pendingQuotesCount = quoteLeads.filter((q) => q.status === 'pending').length;

  return (
    <div className="bg-[#f8fafc] dark:bg-slate-950 font-body text-slate-900 dark:text-slate-100 antialiased min-h-screen flex flex-col">
      {/* ============================================================== */}
      {/* FIXED LEFT SIDEBAR (Desktop) */}
      {/* ============================================================== */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 hidden lg:flex flex-col justify-between">
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
              <span className="text-[10px] tracking-wide text-slate-400 font-medium">CONSOLE MATRIX v3.14</span>
            </div>
          </Link>

          <div className="px-4 py-3">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Navigation Matrix</span>
          </div>

          <nav className="flex flex-col gap-0.5 px-2">
            {[
              { id: 'overview', label: 'แผนภาพรวม (Overview)', icon: 'grid_view' },
              { id: 'fleet', label: 'จัดการยานพาหนะ', count: vehicles.length || 5, icon: 'directions_bus' },
              { id: 'bookings', label: 'การจอง & ตรวจสอบ', count: pendingQuotesCount || 1, icon: 'receipt_long', badge: pendingQuotesCount, hot: true },
              { id: 'operators', label: 'พาร์ทเนอร์คนขับ', count: pendingDriversCount || driverLeads.length || 2, icon: 'verified_user', badge: pendingDriversCount },
              { id: 'board', label: 'กระดานงาน TripBoard', count: boardPosts.length || 4, icon: 'sync_alt' },
              { id: 'sponsors', label: 'สปอนเซอร์ & สัญญา', count: sponsors.length || SPONSORS.length || 8, icon: 'campaign' },
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
      {/* MAIN LAYOUT WRAPPER (Offset by sidebar on lg:) */}
      {/* ============================================================== */}
      <div className="lg:pl-64 flex flex-col min-h-screen flex-1">
        {/* TOP COMMAND HEADER */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="min-h-16 h-auto py-2.5 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="grid h-8 w-8 place-items-center bg-slate-950 text-white text-[13px] font-extrabold lg:hidden shrink-0">TD</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50/60 border border-emerald-200 text-[11px] sm:text-xs font-semibold text-emerald-700 whitespace-nowrap">
                <span className="material-symbols-outlined text-[15px]">lock</span>
                <span className="hidden sm:inline">ระบบแอดมิน - ปลอดภัยสูง SSL 256-bit</span>
                <span className="sm:hidden">SSL 256-bit</span>
              </div>
              <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700">
                <span className="material-symbols-outlined text-[16px]">campaign</span>
                <span>สถานะ: คลัสเตอร์สำรองพร้อมใช้งาน อัตราส่งงาน 99.98%</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200">
                <span className="material-symbols-outlined text-[16px] text-slate-500">lan</span>
                <span className="text-xs text-slate-600 font-medium">Latency: <strong className="font-extrabold text-slate-900">14ms</strong></span>
              </div>

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
                  onClick={logout}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="ออกจากระบบแอดมิน"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span className="hidden md:inline">ออกจากระบบ</span>
                </button>
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
                      SERVER STATUS: OPTIMAL
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span>Latency: <strong className="text-slate-900 dark:text-white font-mono">24ms</strong></span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span>API Availability: <strong className="text-slate-900 dark:text-white font-mono">99.98% SLA</strong></span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span>Primary Database: <strong className="text-slate-900 dark:text-white font-mono">PostgreSQL HA (BKK-NODE-1)</strong></span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span>PDPA Compliance Engine: <strong className="text-[#06c755] font-semibold">Active</strong></span>
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
                          {boardPosts.length > 0 ? boardPosts.length + 140 : 148}
                        </span>
                        <span className="text-xs text-slate-500">ทริป</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-[#06c755] font-bold">
                        <span className="material-symbols-outlined text-[16px]">trending_up</span>
                        <span>+14.2% เทียบกับสัปดาห์ก่อน</span>
                      </div>
                      <span className="text-[11px] text-slate-400">คาราวานองค์กรพิเศษ 18 ขบวน (B2B Active)</span>
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
                          {vehicles.length > 0 ? vehicles.length + 500 : 542}
                        </span>
                        <span className="text-xs text-slate-500">คัน</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#fef3c7] text-[#d97706] text-xs font-bold w-fit">
                        <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
                        <span>รออนุมัติตรวจเอกสาร {pendingDriversCount || 12} คัน</span>
                      </div>
                      <span className="text-[11px] text-slate-400">ตรวจสอบแล้ว: ป้ายเหลือง 410 คัน • ป้ายเขียว 132 คัน</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">สมาชิกผู้ใช้งานรวม</span>
                        <span className="material-symbols-outlined text-[20px] text-slate-950 dark:text-white">groups</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-slate-950 dark:text-white font-mono">24,890</span>
                        <span className="text-xs text-slate-500">บัญชี</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-950 dark:text-white font-semibold">
                        <span className="material-symbols-outlined text-[16px]">domain</span>
                        <span>B2B Corporate {quoteLeads.length || 184} บริษัท</span>
                      </div>
                      <span className="text-[11px] text-slate-400">อัตราคงอยู่ของผู้ใช้ (Retention Rate) 88.4%</span>
                    </div>
                  </div>

                  <div className="bg-[#0d1c32] text-white p-5 border border-slate-800 flex flex-col justify-between shadow-md">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">มูลค่าธุรกรรมรวม (GMV)</span>
                        <span className="material-symbols-outlined text-[20px] text-[#fea619]">payments</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold font-mono text-white">฿2,845,000</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-800 flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-xs text-[#fea619] font-bold">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        <span>โมเดลดีลตรงคนขับ ตลอดชีพ</span>
                      </div>
                      <span className="text-[11px] text-slate-400">รายได้โฆษณา & สปอนเซอร์ ฿148,500</span>
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
                            รอตรวจ ({pendingDriversCount || 12})
                          </button>
                          <button
                            type="button"
                            onClick={() => setOperatorFilter('approved')}
                            className={`px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                              operatorFilter === 'approved' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:text-slate-950'
                            }`}
                          >
                            อนุมัติแล้ว (524)
                          </button>
                          <button
                            type="button"
                            onClick={() => setOperatorFilter('suspended')}
                            className={`px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                              operatorFilter === 'suspended' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:text-slate-950'
                            }`}
                          >
                            พักใบอนุญาต (6)
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                        {/* Driver 1 */}
                        <div className="p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center text-sm font-bold text-slate-800 dark:text-slate-200">
                              สม
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white">นายสมศักดิ์ วงศ์มณี</span>
                                <span className="px-2 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px]">
                                  ID: DRV-CM-9081
                                </span>
                                <span className="px-2 py-0.5 bg-[#e8f9ee] text-[#06c755] text-[11px] font-bold flex items-center gap-1 border border-emerald-200">
                                  <span className="material-symbols-outlined text-[12px]">verified</span> ประวัติตำรวจ: ผ่านแล้ว
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1 text-slate-900 dark:text-white font-medium">
                                  <span className="material-symbols-outlined text-[16px] text-slate-400">directions_car</span>
                                  Toyota Commuter VIP 9 ที่นั่ง
                                </span>
                                <span className="text-slate-300">•</span>
                                <span>ประจำสถานี: <strong>เชียงใหม่ - ภาคเหนือ</strong></span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800">ป้ายเหลือง 30-8911 ชม.</span>
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800">ใบขับขี่สาธารณะ ท.2</span>
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800">ประกันชั้น 1 คุ้มครองผู้โดยสาร</span>
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
                            <button
                              type="button"
                              onClick={() => handleApprove('DRV-CM-9081')}
                              className="px-4 py-2 bg-[#06c755] hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">check</span>
                              <span>อนุมัติผู้ขับขี่</span>
                            </button>
                          </div>
                        </div>

                        {/* Driver 2 */}
                        <div className="p-5 bg-slate-50/30 dark:bg-slate-800/20 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-[#fef3c7] text-[#d97706] shrink-0 flex items-center justify-center text-sm font-bold">
                              ธน
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white">นายธนกร กิจเจริญ</span>
                                <span className="px-2 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px]">
                                  ID: DRV-BKK-4420
                                </span>
                                <span className="px-2 py-0.5 bg-[#fef3c7] text-[#d97706] text-[11px] font-bold flex items-center gap-1 border border-amber-300">
                                  <span className="material-symbols-outlined text-[12px]">schedule</span> รอตรวจ พ.ร.บ. คุ้มครอง
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1 text-slate-900 dark:text-white font-medium">
                                  <span className="material-symbols-outlined text-[16px] text-slate-400">directions_car</span>
                                  Toyota Majesty 7 ที่นั่ง VIP
                                </span>
                                <span className="text-slate-300">•</span>
                                <span>ประจำสถานี: <strong>กรุงเทพฯ - พัทยา - ชลบุรี</strong></span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800">ป้ายเหลือง 30-1044 กทม.</span>
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800">ใบขับขี่ประเภท ท.2 (มีผลถึง 2027)</span>
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold">ขาดเอกสาร พ.ร.บ. ภาคบังคับ</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setActiveView('operators')}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">forward_to_inbox</span>
                              <span>ขอดูเอกสารเพิ่ม</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveView('operators')}
                              className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">rule</span>
                              <span>ตรวจทานละเอียด</span>
                            </button>
                          </div>
                        </div>

                        {/* Driver 3 */}
                        <div className="p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center text-sm font-bold text-slate-800 dark:text-slate-200">
                              ชัย
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white">นายชัยวัฒน์ ศรีสุข (ภูเก็ต ทัวร์ สเตชั่น)</span>
                                <span className="px-2 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px]">
                                  ID: FLEET-PKT-002
                                </span>
                                <span className="px-2 py-0.5 bg-[#e8f9ee] text-[#06c755] text-[11px] font-bold flex items-center gap-1 border border-emerald-200">
                                  <span className="material-symbols-outlined text-[12px]">verified</span> เอกสารนิติบุคคลครบสมบูรณ์
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1 text-slate-900 dark:text-white font-medium">
                                  <span className="material-symbols-outlined text-[16px] text-slate-400">directions_bus</span>
                                  มินิบัส VIP 20 ที่นั่ง (Hino Liesse II)
                                </span>
                                <span className="text-slate-300">•</span>
                                <span>ประจำสถานี: <strong>ภูเก็ต - พังงา - กระบี่</strong></span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800">ใบอนุญาตประกอบการขนส่ง 30-7788</span>
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800">ใบกำกับภาษี ภ.พ.20</span>
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800">ตรวจสภาพรถรอบ 6 เดือน: ผ่าน</span>
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
                            <button
                              type="button"
                              onClick={() => handleApprove('FLEET-PKT-002')}
                              className="px-4 py-2 bg-[#06c755] hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">check</span>
                              <span>อนุมัติฟลีท</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-500">แสดง 3 จาก {driverLeads.length || 12} รายการที่รอการตรวจสอบคัดกรอง</span>
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
                          <span>Active {boardPosts.length || 42} ประกาศ</span>
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
                            {/* Row 1 */}
                            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5 font-bold">
                                    <span>ทริปสัมมนาประจำปี BKK ➔ เขาใหญ่</span>
                                    <span className="px-1.5 py-0.2 bg-[#0d1c32] text-white text-[10px]">Corporate</span>
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-mono mt-0.5">TB-2025-0891 • 14-16 พ.ย. 2568 (3 วัน 2 คืน)</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-semibold block">คุณกุลธิดา (บจก. เอสซี อินโฟเทค)</span>
                                <span className="text-[11px] text-slate-400">ผู้โดยสาร 45 คน</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-bold block">รถตู้ VIP 4 คัน</span>
                                <span className="text-[#06c755] font-mono font-bold">฿42,000 (เหมาคัน)</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="px-2 py-0.5 bg-[#e8f9ee] text-[#06c755] font-bold text-[11px] inline-flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[13px]">handshake</span> จับคู่สำเร็จ
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setActiveView('board')}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer mr-1"
                                  title="ดูรายละเอียดข้อความดีลตรง"
                                >
                                  <span className="material-symbols-outlined text-[16px]">forum</span>
                                </button>
                                <button
                                  type="button"
                                  className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="ระงับประกาศต้องสงสัย"
                                >
                                  <span className="material-symbols-outlined text-[16px]">block</span>
                                </button>
                              </td>
                            </tr>

                            {/* Row 2 */}
                            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5 font-bold">
                                    <span>ทัวร์บุญไหว้พระ 9 วัด อยุธยา</span>
                                    <span className="px-1.5 py-0.2 bg-[#fef3c7] text-[#d97706] text-[10px]">Leisure</span>
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-mono mt-0.5">TB-2025-0894 • 18 ต.ค. 2568 (วันเดย์ทริป)</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-semibold block">คุณประวิทย์ มั่งมี</span>
                                <span className="text-[11px] text-slate-400">ผู้โดยสาร 8 คน</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-bold block">Commuter VIP 1 คัน</span>
                                <span className="text-[#06c755] font-mono font-bold">฿3,500</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold text-[11px] inline-flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[13px]">hourglass_empty</span> รอคนขับเสนอราคา
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setActiveView('board')}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer mr-1"
                                  title="ดูรายละเอียดข้อความดีลตรง"
                                >
                                  <span className="material-symbols-outlined text-[16px]">forum</span>
                                </button>
                                <button
                                  type="button"
                                  className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="ระงับประกาศต้องสงสัย"
                                >
                                  <span className="material-symbols-outlined text-[16px]">block</span>
                                </button>
                              </td>
                            </tr>

                            {/* Row 3 */}
                            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5 font-bold">
                                    <span>ทริปถ่ายภาพล่าหมอก เชียงดาว - ดอยอินทนนท์</span>
                                    <span className="px-1.5 py-0.2 bg-[#0d1c32] text-white text-[10px]">Caravan</span>
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-mono mt-0.5">TB-2025-0899 • 22-25 ต.ค. 2568 (4 วัน 3 คืน)</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-semibold block">ชมรมช่างภาพสารคดีไทย</span>
                                <span className="text-[11px] text-slate-400">ผู้โดยสาร 16 คน</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-bold block">SUV 4x4 / VIP Van 2 คัน</span>
                                <span className="text-[#06c755] font-mono font-bold">฿28,000</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="px-2 py-0.5 bg-[#e8f9ee] text-[#06c755] font-bold text-[11px] inline-flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[13px]">navigation</span> กำลังเดินทาง
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setActiveView('board')}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer mr-1"
                                  title="ติดตามพิกัด GPS สด"
                                >
                                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                                </button>
                                <button
                                  type="button"
                                  className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="ระงับประกาศต้องสงสัย"
                                >
                                  <span className="material-symbols-outlined text-[16px]">block</span>
                                </button>
                              </td>
                            </tr>

                            {/* Row 4 (Flagged Suspicious) */}
                            <tr className="bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5 font-bold text-rose-600">
                                    <span className="material-symbols-outlined text-[16px]">flag</span>
                                    <span>[ต้องสงสัย] รับส่งด่วนข้ามด่านชายแดนแม่สอด</span>
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-mono mt-0.5">TB-2025-0902 • วันนี้ (ด่วนพิเศษ)</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-bold block">User_Unverified_994</span>
                                <span className="text-[11px] text-rose-600 font-bold">IP ตรวจพบนอกอาณาเขต</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-bold block">ไม่ระบุรุ่น</span>
                                <span className="text-rose-600 font-mono font-bold">฿15,000 โอนสด</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="px-2 py-0.5 bg-rose-600 text-white font-bold text-[11px] inline-flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[13px]">gavel</span> ระบบกักตรวจ AI Flagged
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => alert('ระงับประกาศนี้และส่งคำขอตรวจสอบความปลอดภัยไปยังฝ่ายกฎหมายเรียบร้อยแล้ว')}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer"
                                >
                                  ระงับทันที
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-[#06c755]">security</span>
                          ระบบป้องกันการฟอกเงินและข้อกำหนดขนส่งทางบกทำงานแบบ Real-time ตลอด 24 ชม.
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">TripDee Integrity Filter v4.2.1</span>
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
                          4 ACTIVE
                        </span>
                      </div>

                      <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 grid grid-cols-2 gap-2 text-center border-b border-slate-200 dark:border-slate-800">
                        <div className="bg-white dark:bg-slate-900 p-2.5 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Impression รวม</span>
                          <div className="text-lg font-bold text-slate-950 dark:text-white font-mono mt-0.5">38,420</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-2.5 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Click-Through (CTR)</span>
                          <div className="text-lg font-bold text-[#06c755] font-mono mt-0.5">4.82%</div>
                        </div>
                      </div>

                      <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800 p-4 gap-2.5 text-xs">
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                              <span>The Connect Chiang Mai</span>
                              <span className="w-2 h-2 rounded-full bg-[#06c755]" title="Active"></span>
                            </div>
                            <span className="text-[11px] text-slate-500">Banner หัวทริปภาคเหนือ • สัญญา 6 เดือน</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">฿45,000/ด.</span>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                              <span>Ran-Tong Elephant Camp</span>
                              <span className="w-2 h-2 rounded-full bg-[#06c755]" title="Active"></span>
                            </div>
                            <span className="text-[11px] text-slate-500">Official Ecotourism Partner • สัญญา 1 ปี</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">฿60,000/ด.</span>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                              <span>Vespa Adventures TH</span>
                              <span className="w-2 h-2 rounded-full bg-[#06c755]" title="Active"></span>
                            </div>
                            <span className="text-[11px] text-slate-500">หน้าค้นหารถคาราวานร่วม • สัญญา 3 เดือน</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">฿25,000/ด.</span>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                              <span>Sukjai Thai Cooking</span>
                              <span className="w-2 h-2 rounded-full bg-[#d97706]" title="Expiring"></span>
                            </div>
                            <span className="text-[11px] text-[#d97706] font-semibold">สัญญาหมดอายุใน 4 วัน (รอต่อสัญญา)</span>
                          </div>
                          <span className="font-mono font-bold text-slate-400">฿18,500/ด.</span>
                        </div>
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
                        <span className="text-[10px] text-slate-400 font-mono">ISO 27001</span>
                      </div>

                      <div className="p-4 flex flex-col gap-3 text-xs">
                        <div className="flex items-start gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-[#06c755] mt-1.5 shrink-0"></div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white">Admin user_01 อนุมัติใบกำกับภาษีเต็มรูป</span>
                            <span className="text-[11px] text-slate-500">ผู้รับ: บมจ. สยาม อินโนเวชั่น (INV-2025-0812)</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">14:18 น. • ผ่านสิทธิ์ 2FA สมบูรณ์</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-[#d97706] mt-1.5 shrink-0"></div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#d97706]">คำขอลบบัญชีตามสิทธิ์ PDPA (1 รายการ)</span>
                            <span className="text-[11px] text-slate-500">ID: USR-DEL-29401 (ครบกำหนดพิจารณาใน 48 ชม.)</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">11:05 น. • เจ้าหน้าที่ DPO กำลังดำเนินการ</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-rose-600 mt-1.5 shrink-0"></div>
                          <div className="flex flex-col">
                            <span className="font-bold text-rose-600">ตรวจจับความพยายามล็อกอินผิดปกติ</span>
                            <span className="text-[11px] text-slate-500">IP: 182.232.14.90 พยายามเข้าถึง Admin API Port</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">09:42 น. • ไฟร์วอลล์บล็อกถาวร (IP Blacklisted)</span>
                          </div>
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
                        ฿3,850 <span className="text-xs text-slate-400 font-normal">/ คัน / วัน</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        อัตราพึงพอใจของผู้ใช้บริการโดยรวม 99.4% จากแบบสำรวจ 1,420 ใบประเมินในรอบ 30 วันที่ผ่านมา
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
                        ทั้งหมด {pendingDriversCount || driverLeads.length || 2} รายการดำเนินการ
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
                sponsors={sponsors.length > 0 ? sponsors : SPONSORS}
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
                      <p className="text-xs text-slate-500">บันทึกการเข้าถึงข้อมูล Audit Trail ตามมาตรฐาน ISO/IEC 27001 และ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-[#e8f9ee] text-[#06c755] text-xs font-bold border border-emerald-200">
                    PDPA ENGINE ACTIVE
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">รายการคำขอลบ/ทำลายข้อมูล (Right to Erasure)</h3>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]"></span>
                      <div className="flex flex-col text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">คำขอลบบัญชีคนขับ ID: USR-DEL-29401 (นายสมควร ใจหาญ)</span>
                        <span className="text-slate-500">เหตุผล: ยุติการให้บริการรถตู้ • วันที่ยื่นคำขอ: 29 ก.ย. 2568 (ครบกำหนดภายใน 48 ชม.)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => alert('ยืนยันการทำลายข้อมูลผู้ใช้ USR-DEL-29401 และบันทึก Audit Trail เรียบร้อย')}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        อนุมัติทำลายข้อมูล
                      </button>
                    </div>
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
                Audit Trail ISO/IEC 27001
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-slate-400">
                BUILD: v3.14.2-PROD
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
}
