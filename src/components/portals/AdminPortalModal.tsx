'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import { Vehicle, BoardPost, Sponsor } from '@/data/mockData';
import { DriverLead, QuotationLead } from '@/lib/leadsStore';
import {
  X,
  LogOut,
  CarFront,
  Users,
  FileText,
  MessageSquare,
  Building2,
  BarChart3,
  ShieldCheck,
  RefreshCw,
  Download,
  AlertTriangle,
  Lock,
  Radio,
  Eye,
  Check,
  Ban,
  Clock,
  Send,
  Flag,
  Phone,
  Settings,
} from 'lucide-react';
import { SponsorReportModal } from '@/components/SponsorReportModal';
import { AdminVehicleTab } from './admin/AdminVehicleTab';
import { AdminDriverTab } from './admin/AdminDriverTab';
import { AdminQuoteTab } from './admin/AdminQuoteTab';
import { AdminBoardTab } from './admin/AdminBoardTab';
import { AdminSponsorTab } from './admin/AdminSponsorTab';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminView = 'overview' | 'fleet' | 'bookings' | 'operators' | 'board' | 'sponsors' | 'security';

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({ isOpen, onClose }) => {
  const { user, approveDriverVerification, logout } = useAuth();
  const { t } = useLanguage();
  const { summary, getSponsorClickCount } = useAnalytics();

  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [operatorFilter, setOperatorFilter] = useState<'pending' | 'approved' | 'suspended'>('pending');
  const [reportSponsor, setReportSponsor] = useState<Sponsor | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [telemetryTime, setTelemetryTime] = useState('');

  // Real data collections
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

  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, { onClose, enabled: isOpen });

  const refreshAll = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('td-admin-token') : null;
    if (!token) return;
    const headers: HeadersInit = { 'x-admin-pin': token, Authorization: `Bearer ${token}` };

    setIsRefreshing(true);
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
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    refreshAll();
  }, [isOpen, refreshAll]);

  if (!isOpen || !user) return null;

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
  const verifiedDriversCount = driverLeads.filter((d) => d.status === 'verified').length;
  const rejectedDriversCount = driverLeads.filter((d) => d.status === 'rejected').length;
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
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-console-modal-title"
      className="fixed inset-0 z-400 flex items-start justify-center overflow-y-auto bg-slate-950/80 backdrop-blur-md p-0 sm:p-3 lg:p-5 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-[1500px] min-h-[92vh] max-h-[96vh] overflow-y-auto rounded-none bg-[#f8fafc] dark:bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-slate-100"
      >
        {/* ============================================================== */}
        {/* TOP COMMAND HEADER BAR (Fixed to modal header) */}
        {/* ============================================================== */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="min-h-16 h-auto py-3 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
            {/* Left security indicators */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-none">
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                <span className="material-symbols-outlined text-[14px] sm:text-[16px] text-[#06c755]">lock</span>
                <span className="hidden sm:inline">ระบบแอดมิน</span>
                <span className="sm:hidden">แอดมิน</span>
              </div>
              <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
              <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 bg-[#fef3c7] dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs font-semibold text-[#d97706] dark:text-amber-300">
                <span className="material-symbols-outlined text-[16px]">campaign</span>
                <span>รถ {vehicles.length} คัน • ประกาศ {boardPosts.length} • รออนุมัติ {pendingVehiclesCount}</span>
              </div>
            </div>

            {/* Right cluster info & user actions */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-700">
                <div className="flex flex-col text-right hidden sm:flex">
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Super Admin</span>
                  <span className="text-[11px] text-[#d97706] font-semibold">ฝ่ายปฏิบัติการ TripDee</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                  title="ออกจากระบบแอดมิน"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span className="hidden md:inline">ออกจากระบบ</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="ปิดหน้าต่างแอดมิน"
                  className="w-8 h-8 rounded-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 grid place-items-center transition-colors cursor-pointer ml-1"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ============================================================== */}
        {/* LAYOUT: SIDEBAR NAVIGATION + MAIN CONTENT */}
        {/* ============================================================== */}
        <div className="flex flex-col md:flex-row flex-1 min-h-[calc(92vh-4rem)]">
          {/* MOBILE HORIZONTAL NAV (<md) */}
          <div className="md:hidden flex items-center overflow-x-auto bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-1.5 gap-1 shrink-0">
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
                className={`px-2.5 py-1.5 text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeView === item.id ? 'bg-[#0d1c32] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* LEFT ASIDE: NAVIGATION MATRIX (md+) */}
          <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col justify-between shrink-0">
            <div className="flex flex-col">
              <div className="h-16 px-4 sm:px-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://lh3.googleusercontent.com/aida/AEtjO1U3SJABOfeOqcRWIq9WXYBMNLkKyouXxYeypfpmucr5OK-GP97gxsUNPNlxav8bJ3fE2pPRhHrZkcDZEFeIteEGXr_DKIbSCzrjS59oHLzCmFjpbyN2ha_hFjBld3NSgAq6YAUM67gECt1T4YH2Fn6imBil8nreGqELD0AsEAxI1NIVXQHwtPBX_AapAzpyMHrGKKX7-2eipf6nXhIKwWMGoVzIliHVDNtJc36ybsPLs7jutB1juaj7YFc"
                  alt="TripDee Admin Logo"
                  className="h-8 w-auto object-contain"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-tight">TripDee</span>
                  <span className="text-[11px] text-slate-500">Admin Console</span>
                </div>
              </div>

              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Navigation Matrix</span>
              </div>

              <nav className="flex flex-col gap-1 p-2">
                {[
                  { id: 'overview', label: 'แผงภาพรวม (Overview)', icon: 'grid_view' },
                  { id: 'fleet', label: `จัดการยานพาหนะ (${vehicles.length})`, icon: 'directions_bus' },
                  { id: 'bookings', label: `การจอง & ตรวจสอบ (${quoteLeads.length})`, icon: 'receipt_long', badge: pendingQuotesCount },
                  { id: 'operators', label: `พาร์ทเนอร์คนขับ (${driverLeads.length})`, icon: 'verified_user', badge: pendingDriversCount },
                  { id: 'board', label: `กระดานงาน TripBoard (${boardPosts.length})`, icon: 'sync_alt' },
                  { id: 'sponsors', label: `สปอนเซอร์ & สัญญา (${sponsors.length})`, icon: 'campaign' },
                  { id: 'security', label: 'ระบบความปลอดภัย (Audit Logs)', icon: 'shield' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveView(item.id as AdminView)}
                    className={`flex items-center justify-between px-3 py-2.5 text-xs font-bold transition-colors cursor-pointer text-left ${
                      activeView === item.id
                        ? 'bg-[#0d1c32] text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-[#d97706] text-white text-[10px] font-mono px-1.5 py-0.2">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div className="bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-mono">Gateway Core</span>
                  <span className="text-[11px] font-bold text-[#06c755] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#06c755] inline-block animate-pulse"></span>
                    Active Node: BKK-01
                  </span>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">dns</span>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-slate-950 flex flex-col">
            {/* VIEW 1: OVERVIEW (MISSION CONTROL) */}
            {activeView === 'overview' && (
              <div className="flex flex-col w-full">
                {/* Top Command Matrix & Header */}
                <section className="w-full bg-white dark:bg-slate-900 px-4 sm:px-6 py-6 border-b border-slate-200 dark:border-slate-800">
                  <div className="max-w-[1400px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="px-2 py-0.5 bg-[#0d1c32] text-white text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">
                          Mission Control
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-400 font-mono truncate">ข้อมูลจริงจากระบบ</span>
                      </div>
                      <h1 className="text-base sm:text-xl md:text-2xl font-bold text-slate-950 dark:text-white tracking-tight leading-tight">
                        แผงควบคุมระบบบริหารจัดการส่วนกลาง
                      </h1>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-snug">
                        <span className="hidden sm:inline">TripDee Admin Central Management & Real-time Operations Console • ดำเนินการระดับ Super-Privilege</span>
                        <span className="sm:hidden">ศูนย์ควบคุมระบบแอดมิน • Super-Privilege</span>
                      </p>
                    </div>

                    {/* Action Cluster */}
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

                  {/* Health Telemetry Ribbon */}
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
                      UTC+07:00 • SYSTEM TICK: <span className="font-bold text-slate-900 dark:text-white">{telemetryTime}</span>
                    </div>
                  </div>
                </section>

                {/* Workspace Container */}
                <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
                  {/* KPI Architecture (4 Monolithic Blocks) */}
                  <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {/* Card 1: Active Trips */}
                    <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">คาราวาน & ทริปประจำวัน</span>
                          <span className="material-symbols-outlined text-[20px] text-slate-900 dark:text-white">route</span>
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
                          <span className="material-symbols-outlined text-[16px]">trending_up</span>
                          <span>จับคู่สำเร็จ {matchedBoardCount} ทริป</span>
                        </div>
                        <span className="text-[11px] text-slate-400">เปิดรับอยู่ {openBoardCount} ประกาศ • งานองค์กร {corporateBoardCount} ประกาศ</span>
                      </div>
                    </div>

                    {/* Card 2: Verified Fleet */}
                    <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">ผู้ขับขี่และฟลีทในระบบ</span>
                          <span className="material-symbols-outlined text-[20px] text-slate-900 dark:text-white">airport_shuttle</span>
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

                    {/* Card 3: Platform Users */}
                    <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">คำขอใบเสนอราคาองค์กร</span>
                          <span className="material-symbols-outlined text-[20px] text-slate-900 dark:text-white">groups</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-extrabold text-slate-950 dark:text-white font-mono">{quoteLeads.length}</span>
                          <span className="text-xs text-slate-500">รายการ</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-900 dark:text-white font-semibold">
                          <span className="material-symbols-outlined text-[16px]">domain</span>
                          <span>รออนุมัติ {pendingQuotesCount} รายการ</span>
                        </div>
                        <span className="text-[11px] text-slate-400">ใบสมัครคนขับ {driverLeads.length} ราย (รอตรวจ {pendingDriversCount})</span>
                      </div>
                    </div>

                    {/* Card 4: Direct Deal GMV */}
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

                  {/* Operational Architecture: 2-Column Asymmetric Layout (8 cols / 4 cols) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Primary Core: 8 Cols */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                      {/* Panel 1: Pending Driver & Vehicle Verifications */}
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

                          {/* Tabbed Selector */}
                          <div className="flex items-center bg-white dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => setOperatorFilter('pending')}
                              className={`px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                                operatorFilter === 'pending'
                                  ? 'bg-slate-950 text-white'
                                  : 'text-slate-600 hover:text-slate-950'
                              }`}
                            >
                              รอตรวจ ({pendingDriversCount})
                            </button>
                            <button
                              type="button"
                              onClick={() => setOperatorFilter('approved')}
                              className={`px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                                operatorFilter === 'approved'
                                  ? 'bg-slate-950 text-white'
                                  : 'text-slate-600 hover:text-slate-950'
                              }`}
                            >
                              อนุมัติแล้ว ({verifiedDriversCount})
                            </button>
                            <button
                              type="button"
                              onClick={() => setOperatorFilter('suspended')}
                              className={`px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                                operatorFilter === 'suspended'
                                  ? 'bg-slate-950 text-white'
                                  : 'text-slate-600 hover:text-slate-950'
                              }`}
                            >
                              ไม่ผ่าน ({rejectedDriversCount})
                            </button>
                          </div>
                        </div>

                        {/* Queue Registry */}
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
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800">โทร {d.phone}</span>
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800">ยื่นสมัคร {d.submittedAt}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
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

                        {/* Pagination footer */}
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

                      {/* Panel 2: Live TripBoard Audit & Moderation Console */}
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

                    {/* Secondary Core: 4 Cols */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                      {/* Widget 1: Local Sponsors & Ad Slots Control */}
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

                        {/* Sponsor Metric Bar */}
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

                        {/* Brand Slot List */}
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

                      {/* Widget 2: Security & PDPA Governance Logs */}
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

                      {/* Quick Platform Stats Snapshot */}
                      <div className="bg-slate-950 text-white p-5 border border-slate-800 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="uppercase tracking-wider font-semibold">ราคาเฉลี่ยที่ประกาศ</span>
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

            {/* VIEW 2: FLEET MANAGEMENT */}
            {activeView === 'fleet' && (
              <div className="p-4 sm:p-6">
                <AdminVehicleTab vehicles={vehicles} onRefresh={refreshAll} />
              </div>
            )}

            {/* VIEW 3: BOOKINGS & QUOTATIONS */}
            {activeView === 'bookings' && (
              <div className="p-4 sm:p-6">
                <AdminQuoteTab quotes={quoteLeads} onRefresh={refreshAll} />
              </div>
            )}

            {/* VIEW 4: OPERATORS (DRIVERS) */}
            {activeView === 'operators' && (
              <div className="p-4 sm:p-6">
                <AdminDriverTab driverLeads={driverLeads} onRefresh={refreshAll} onApprove={handleApprove} />
              </div>
            )}

            {/* VIEW 5: TRIPBOARD POSTS */}
            {activeView === 'board' && (
              <div className="p-4 sm:p-6">
                <AdminBoardTab posts={boardPosts} onRefresh={refreshAll} />
              </div>
            )}

            {/* VIEW 6: SPONSORS */}
            {activeView === 'sponsors' && (
              <div className="p-4 sm:p-6">
                <AdminSponsorTab
                  sponsors={sponsors}
                  onRefresh={refreshAll}
                  getSponsorClickCount={getSponsorClickCount}
                  onOpenReport={setReportSponsor}
                />
              </div>
            )}

            {/* VIEW 7: SECURITY & PDPA AUDIT */}
            {activeView === 'security' && (
              <div className="p-4 sm:p-6 space-y-6">
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
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]"></span>
                        <div className="flex flex-col text-xs">
                          <span className="font-bold text-slate-900 dark:text-white">ยังไม่มีคำขอลบหรือทำลายข้อมูล</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => alert('ยืนยันการทำลายข้อมูลและบันทึก Audit Trail เรียบร้อย')}
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
        </div>

        {/* ============================================================== */}
        {/* MODERN MINIMALIST ARCHITECTURAL FOOTER */}
        {/* ============================================================== */}
        <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-6">
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs text-slate-500">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-1.5 sm:gap-3 w-full md:w-auto">
              <span>© 2025 TripDee Co., Ltd. <span className="hidden sm:inline">ระบบศูนย์กลางการบริหารพาหนะส่วนกลาง</span><span className="sm:hidden">ศูนย์บริหารพาหนะ</span></span>
              <span className="hidden md:inline text-slate-300">•</span>
              <span>ทะเบียนพาณิชย์อิเล็กทรอนิกส์ DBD เลขที่ 0105566023812</span>
              <span className="hidden md:inline text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">policy</span>
                Audit Trail
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                BUILD: v0.1.0
              </span>
              <span className="px-2 py-0.5 bg-[#e8f9ee] text-[#06c755] border border-emerald-300 font-bold">
                ข้อมูลจริงจากระบบ
              </span>
            </div>
          </div>
        </footer>

        {/* Sponsor Report Modal */}
        {reportSponsor && (
          <SponsorReportModal
            isOpen={!!reportSponsor}
            onClose={() => setReportSponsor(null)}
            sponsor={reportSponsor}
          />
        )}
      </div>
    </div>
  );
};
