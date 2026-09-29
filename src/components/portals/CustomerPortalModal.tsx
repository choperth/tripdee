'use client';

import React, { useState, useRef } from 'react';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { OFFICIAL_LINE_URL } from '@/lib/constants';
import {
  X,
  Building2,
  User,
  CarFront,
  Download,
  Printer,
  Plus,
  LogOut,
  Check,
  FileText,
  Calendar,
  Users,
  ShieldCheck,
  Phone,
  MessageCircle,
  LogIn,
  KeyRound,
  BadgeCheck,
  Landmark,
} from 'lucide-react';
import { BookingConfirmationSheet, BookingSheetData } from '@/components/BookingConfirmationSheet';
import { DangerZone } from '@/components/portals/DangerZone';

interface CustomerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewQuote: () => void;
}

type InnerTab = 'quotes' | 'taxProfile' | 'caravans';

export const CustomerPortalModal: React.FC<CustomerPortalModalProps> = ({
  isOpen,
  onClose,
  onOpenNewQuote,
}) => {
  const { user, quotations, updateCorporateProfile, updateCustomerProfile, logout, deleteAccount } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<InnerTab>('quotes');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sessionVerified, setSessionVerified] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [activeSheetData, setActiveSheetData] = useState<Partial<BookingSheetData> | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, { onClose, enabled: isOpen });

  // Account Type state: Defaults to corporate if companyName is present, or user's explicit preference
  const [customerType, setCustomerType] = useState<'individual' | 'corporate'>(() => {
    if (user?.customerType) return user.customerType;
    if (user?.companyName && user.companyName.trim().length > 0) return 'corporate';
    return 'corporate'; // Default to demo corporate or keep current
  });

  // Corporate Profile State
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [taxId, setTaxId] = useState(user?.taxId || '');
  const [address, setAddress] = useState(user?.companyAddress || '');
  const [branch, setBranch] = useState(user?.branch || t('pcus.branchHq'));

  // Individual Profile State
  const [personalName, setPersonalName] = useState(user?.name || '');
  const [personalPhone, setPersonalPhone] = useState(user?.emailOrPhone || '');
  const [personalLine, setPersonalLine] = useState(user?.lineId || '');
  const [personalEmail, setPersonalEmail] = useState(
    user?.emailOrPhone && user.emailOrPhone.includes('@') ? user.emailOrPhone : ''
  );
  const [personalTaxId, setPersonalTaxId] = useState(user?.taxId || '');

  if (!isOpen || !user) return null;

  const effectiveType = customerType;
  const isCorporate = effectiveType === 'corporate';

  const handleSwitchAccountType = (newType: 'individual' | 'corporate') => {
    setCustomerType(newType);
    const updateFn = updateCustomerProfile || updateCorporateProfile;
    updateFn({ customerType: newType });
  };

  const handleOpenBookingSheet = (q: (typeof quotations)[0]) => {
    const deposit = Math.round(q.estimatedPrice * 0.3);
    setActiveSheetData({
      bookingId: q.id.startsWith('TD-') ? q.id : `TD-${q.id.toUpperCase()}`,
      customerName: isCorporate
        ? (companyName || user.companyName || user.name || 'บจก. สยามอินโนเวชั่น เทรดดิ้ง')
        : (personalName || user.name || 'คุณสมชาย ใจดี'),
      customerPhone: personalPhone || user.emailOrPhone || '081-998-7766',
      customerLine: personalLine || user.lineId || '',
      passengers: q.passengers || '10-15 ท่าน',
      travelDates: q.date || '15-17 ธ.ค. 2569 (3 วัน 2 คืน)',
      totalDays: q.totalDays || 2,
      pickupLocation: 'กรุงเทพฯ หรือ จุดนัดรับตามตกลง',
      pickupTime: '07:30 น.',
      routeDetails: q.route || 'กรุงเทพฯ - เชียงใหม่ - ม่อนแจ่ม',
      dailyRate: Math.round(q.estimatedPrice / (q.totalDays || 2)),
      totalPrice: q.estimatedPrice,
      depositAmount: deposit,
      remainingAmount: q.estimatedPrice - deposit,
      canIssueTaxInvoice: Boolean(q.needsTaxInvoice),
      status: q.status === 'confirmed' ? 'confirmed' : 'deposit_paid',
    });
  };

  const handleSaveTaxProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updateFn = updateCustomerProfile || updateCorporateProfile;

    if (isCorporate) {
      updateFn({
        customerType: 'corporate',
        companyName,
        taxId,
        companyAddress: address,
        branch,
      });
    } else {
      updateFn({
        customerType: 'individual',
        name: personalName,
        emailOrPhone: personalPhone || personalEmail,
        lineId: personalLine,
        taxId: personalTaxId,
      });
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // ---- Derived enterprise stats (computed from real quotations) ----
  const approvedQuotes = quotations.filter((q) => q.status === 'confirmed' || q.status === 'completed');
  const pendingQuotes = quotations.filter((q) => q.status === 'pending');
  const billedTotal = approvedQuotes.reduce((sum, q) => sum + q.estimatedPrice, 0);
  const withholding3 = Math.round(billedTotal * 0.03);
  const activeCaravans = quotations.filter((q) => q.status === 'confirmed');
  const displayCompany = companyName || user.companyName || user.name || 'บมจ. สยาม อินโนเวชั่น';
  const displayTaxId = taxId || user.taxId || '0105558012345';
  const companyInitials = displayCompany.replace(/^(บริษัท|บมจ\.|หจก\.)\s*/, '').slice(0, 2).toUpperCase();
  const b2bCode = `B2B-TH-${(user.id || 'corp01').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(-5).padStart(5, '0')}`;
  const firstApproved = approvedQuotes[0] || quotations[0];

  const inputCls =
    'w-full h-11 rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors';

  return (
    <div
      className="fixed inset-0 z-400 flex items-start sm:items-center justify-center overflow-y-auto bg-slate-950/70 backdrop-blur-sm p-2 sm:p-4 animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-portal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-6xl max-h-[94vh] overflow-y-auto rounded-none bg-[#f4f6fa] dark:bg-slate-950 border border-slate-300 dark:border-slate-700 shadow-2xl text-slate-900 dark:text-slate-100"
      >
        {/* Sticky top bar */}
        <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-none bg-slate-950 text-amber-400">
              <Landmark className="h-4.5 w-4.5" strokeWidth={2.5} />
            </span>
            <span className="text-xs font-black tracking-wide uppercase">Enterprise Fleet Suite</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-500" />
              LIVE CONNECTED
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1">
              <span className="grid h-7 w-7 place-items-center rounded-none bg-slate-950 text-white text-[11px] font-black">
                {companyInitials}
              </span>
              <div className="leading-tight">
                <p className="text-xs font-bold truncate max-w-[160px]">{displayCompany}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Tax ID: {displayTaxId} · เครดิต ฿85,000
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleSwitchAccountType(isCorporate ? 'individual' : 'corporate')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold hover:border-slate-500 transition-colors cursor-pointer"
              title="สลับผู้ใช้"
            >
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">สลับผู้ใช้</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewQuote();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-none bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold border border-amber-600 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
              <span className="hidden sm:inline">{t('pcus.newQuote')}</span>
            </button>
            <button
              onClick={onClose}
              aria-label={t('pcus.close')}
              className="w-8 h-8 rounded-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 grid place-items-center transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* Suite title */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 px-2 py-0.5">
                Enterprise Fleet Suite 2026
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-500" />
                LIVE CONNECTED
              </span>
            </div>
            <h2 id="customer-portal-title" className="text-xl sm:text-2xl font-black tracking-tight">
              ศูนย์บริหารจัดการพอร์ตแบบบูรณาการ (Unified Portal)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              เข้าถึงระบบควบคุม 3 สิทธิ์หลัก: องค์กรธุรกิจ B2B, ผู้เดินทางส่วนบุคคล และศูนย์คนขับรถที่พันธมิตร
            </p>
          </div>

          {/* 3 role cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleSwitchAccountType('corporate')}
              className={`flex items-center gap-3 p-3.5 rounded-none border text-left transition-colors cursor-pointer ${
                isCorporate
                  ? 'bg-white dark:bg-slate-900 border-slate-950 dark:border-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
              }`}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-none bg-slate-950 text-white">
                <Building2 className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold">1. บัญชีองค์กร B2B</span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">ใบกำกับภาษี & สัมมนาคาราวาน</span>
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 shrink-0 ${isCorporate ? 'bg-slate-950 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                ใช้งานอยู่
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchAccountType('individual')}
              className={`flex items-center gap-3 p-3.5 rounded-none border text-left transition-colors cursor-pointer ${
                !isCorporate
                  ? 'bg-white dark:bg-slate-900 border-slate-950 dark:border-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
              }`}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <User className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold">2. ผู้เดินทาง / ลูกค้าบุคคล</span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">ทริปส่วนตัว & คูปองสิทธิพิเศษ</span>
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 shrink-0 ${!isCorporate ? 'bg-slate-950 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                {pendingQuotes.length > 0 ? `${pendingQuotes.length} ทริปกําลังถึง` : '1 ทริปกําลังถึง'}
              </span>
            </button>
            <div className="flex items-center gap-3 p-3.5 rounded-none border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <CarFront className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold">3. พาร์ทเนอร์คนขับ (Driver)</span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">รับงานตรง 0% ค่าหัวคิว</span>
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 shrink-0 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                คิวว่าง
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* LEFT: document center + quotes */}
            <div className="lg:col-span-2 space-y-5 min-w-0">
              {/* Company document center */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-none bg-slate-950 text-white">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold">ศูนย์เอกสาร & บัญชีองค์กร</h3>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5">
                          <ShieldCheck className="h-3 w-3" />
                          นิติบุคคลรับรองแล้ว
                        </span>
                      </div>
                      <p className="text-sm font-bold mt-1">{displayCompany}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        เลขผู้เสียภาษี: {displayTaxId} ({branch || 'สำนักงานใหญ่'})
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        · รหัสลูกค้า B2B: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{b2bCode}</span> ·
                      </p>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        วงเงินเครดิตเทอม: 30 วัน
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenNewQuote();
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-none bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold border border-amber-600 transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                      <span>ขอใบเสนอราคาใหม่</span>
                    </button>
                    <button
                      type="button"
                      disabled={!firstApproved}
                      onClick={() => firstApproved && handleOpenBookingSheet(firstApproved)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-none bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold border border-slate-300 dark:border-slate-600 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>หนังสือหัก 3%</span>
                    </button>
                  </div>
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 -mx-4 sm:-mx-5 px-4 sm:px-5 pb-1">
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">ใบเสนอราคาที่อนุมัติ</p>
                    <p className="text-base font-black tabular-nums">{approvedQuotes.length} ฉบับ</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">ยอดรวมที่วางบิล</p>
                    <p className="text-base font-black tabular-nums">฿{billedTotal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">หักภาษี ณ ที่จ่าย (3%)</p>
                    <p className="text-base font-black tabular-nums text-amber-700 dark:text-amber-400">฿{withholding3.toLocaleString()}.00</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">สถานะคาราวาน</p>
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {activeCaravans.length > 0 ? 'พร้อมออกเดินทาง' : approvedQuotes.length > 0 ? 'รอออกเดินทาง' : 'รอเอกสาร'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Inner tabs */}
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: 'quotes', label: `ประวัติใบเสนอราคา & เอกสาร (${quotations.length})`, icon: FileText },
                    { id: 'taxProfile', label: 'ข้อมูลบริษัทสำหรับออกบิล (ภ.พ.20)', icon: Building2 },
                    { id: 'caravans', label: 'คาราวานที่กำลังเดินทาง', icon: CarFront },
                  ] as { id: InnerTab; label: string; icon: typeof FileText }[]
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-none text-xs font-bold border transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950 dark:border-white'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* TAB: quotes */}
              {activeTab === 'quotes' && (
                <div className="space-y-4">
                  {quotations.length === 0 ? (
                    <div className="text-center py-12 px-4 rounded-none border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
                      <div className="w-12 h-12 rounded-none bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                        <FileText className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold">{t('pcus.noQuotes')}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                        {t('pcus.startNewQuote')}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenNewQuote();
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-none bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold border border-amber-600 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>ขอใบเสนอราคาใหม่</span>
                      </button>
                    </div>
                  ) : (
                    quotations.map((q) => (
                      <article
                        key={q.id}
                        className="rounded-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 border border-slate-200 dark:border-slate-700">
                              {q.id}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{q.date}</span>
                            </span>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 text-[11px] font-bold border ${
                              q.status === 'confirmed'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : q.status === 'completed'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {q.status === 'confirmed' && '✓ ยืนยันการจองแล้ว'}
                            {q.status === 'completed' && '✓ ชำระและส่งมอบบิลแล้ว'}
                            {q.status === 'pending' && `○ ${t('pcus.stPending')}`}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm sm:text-base font-bold leading-snug">{q.route}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            ระยะเวลา: {q.totalDays} วัน | ผู้โดยสาร: {q.passengers} |{' '}
                            {q.needsTaxInvoice ? 'ออกใบกำกับภาษีเต็มรูปแบบ (หัก ณ ที่จ่าย 3%)' : t('pcus.total')}
                          </p>
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>ประกันภัยคุ้มครองผู้โดยสาร 1,000,000 บาท/ที่นั่ง</span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">ยอดรวมสุทธิ:</span>
                            <p className="text-lg font-black tabular-nums">
                              ฿{q.estimatedPrice.toLocaleString()}{' '}
                              <span className="text-[11px] font-medium text-slate-400">(รวมน้ำมัน • ทางด่วน • ที่พักคนขับ)</span>
                            </p>
                            {q.status === 'completed' && (
                              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                ✓ ชำระและส่งมอบบิลแล้ว
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenBookingSheet(q)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              <span>{t('pcus.print')}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenBookingSheet(q)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-none bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold border border-amber-600 transition-colors cursor-pointer"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>PDF</span>
                            </button>
                            <a
                              href={OFFICIAL_LINE_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-none bg-[#06C755] hover:bg-[#05b04b] text-white text-xs font-bold transition-colors"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>ติดต่อหัวหน้าขบวน</span>
                            </a>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              )}

              {/* TAB: caravans */}
              {activeTab === 'caravans' && (
                <div className="space-y-3">
                  {activeCaravans.length === 0 ? (
                    <div className="text-center py-10 px-4 rounded-none border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                      <CarFront className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                      <h4 className="text-sm font-bold mt-2">ยังไม่มีคาราวานที่กำลังเดินทาง</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        ใบเสนอราคาที่กดยืนยันแล้วจะแสดงสถานะขบวนรถที่นี่
                      </p>
                    </div>
                  ) : (
                    activeCaravans.map((q) => (
                      <div
                        key={q.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-none border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 p-4"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-300">{q.id}</p>
                          <h4 className="text-sm font-bold truncate">{q.route}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {q.totalDays} วัน · {q.passengers} · {q.date}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 dark:text-emerald-300">
                          <span className="w-2 h-2 bg-emerald-500 animate-pulse" />
                          พร้อมออกเดินทาง
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB: tax profile */}
              {activeTab === 'taxProfile' && (
                <form onSubmit={handleSaveTaxProfile} className="rounded-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {isCorporate ? t('pcus.taxIntro') : t('pcus.personalTaxIntro')}
                  </p>

                  {isCorporate ? (
                    <div className="space-y-3.5">
                      <div>
                        <label htmlFor="cus-company" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                          {t('pcus.fCompany')}
                        </label>
                        <input
                          id="cus-company"
                          type="text"
                          required
                          placeholder={t('pcus.fCompanyPh')}
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label htmlFor="cus-taxid" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                            {t('pcus.fTaxId')}
                          </label>
                          <input
                            id="cus-taxid"
                            type="text"
                            required
                            placeholder="0105559088123"
                            value={taxId}
                            onChange={(e) => setTaxId(e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label htmlFor="cus-branch" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                            {t('pcus.fBranch')}
                          </label>
                          <input
                            id="cus-branch"
                            type="text"
                            placeholder={t('pcus.fBranchPh')}
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            className={inputCls}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="cus-addr" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                          {t('pcus.fAddr')}
                        </label>
                        <textarea
                          id="cus-addr"
                          rows={2}
                          required
                          placeholder={t('pcus.fAddrPh')}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label htmlFor="cus-personal-name" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                            {t('pcus.fPersonalName')}
                          </label>
                          <input
                            id="cus-personal-name"
                            type="text"
                            required
                            placeholder={t('pcus.fPersonalNamePh')}
                            value={personalName}
                            onChange={(e) => setPersonalName(e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label htmlFor="cus-personal-phone" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                            {t('pcus.fPersonalPhone')}
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              id="cus-personal-phone"
                              type="tel"
                              required
                              placeholder="081-234-5678"
                              value={personalPhone}
                              onChange={(e) => setPersonalPhone(e.target.value)}
                              className={`${inputCls} pl-10`}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label htmlFor="cus-personal-line" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                            {t('pcus.fPersonalLine')}
                          </label>
                          <div className="relative">
                            <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                            <input
                              id="cus-personal-line"
                              type="text"
                              placeholder="@yourlineid"
                              value={personalLine}
                              onChange={(e) => setPersonalLine(e.target.value)}
                            className={`${inputCls} pl-10`}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="cus-personal-email" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                          อีเมล (สำหรับรับเอกสาร e-Tax)
                        </label>
                        <input
                          id="cus-personal-email"
                          type="email"
                          placeholder="name@example.com"
                          value={personalEmail}
                          onChange={(e) => setPersonalEmail(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    </div>
                      <div>
                        <label htmlFor="cus-personal-taxid" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                          {t('pcus.fPersonalTaxId')}
                        </label>
                        <input
                          id="cus-personal-taxid"
                          type="text"
                          placeholder="1234567890123"
                          value={personalTaxId}
                          onChange={(e) => setPersonalTaxId(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    </div>
                  )}

                  {saveSuccess && (
                    <div className="flex items-center gap-2 rounded-none bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <Check className="h-4 w-4 shrink-0" strokeWidth={3} />
                      <span>{isCorporate ? t('pcus.savedTax') : t('pcus.savedPersonal')}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center px-6 py-2.5 rounded-none bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-950 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                    >
                      {isCorporate ? t('pcus.saveBtn') : t('pcus.savePersonalBtn')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        onClose();
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors cursor-pointer hover:underline"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t('pcus.logout')}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* PDPA */}
              <section className="rounded-none border border-red-300 dark:border-red-900 bg-red-50/60 dark:bg-red-950/20 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-none bg-red-700 text-white">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-black text-red-800 dark:text-red-300">
                          โซนอันตรายและการจัดการข้อมูลส่วนบุคคล (PDPA)
                        </h3>
                        <span className="text-[10px] font-black px-1.5 py-0.5 bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-200">
                          PDPA / Privacy
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md leading-relaxed">
                        ขอลบบัญชีองค์กร ข้อมูลผู้เสียภาษี และประวัติใบเสนอราคาทั้งหมดออกจากระบบ
                        ข้อมูลจะไม่สามารถกู้คืนได้ตามข้อกำหนดการเก็บรักษาข้อมูลพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <DangerZone
                    targetName={
                      isCorporate
                        ? (companyName || user.companyName || user.name)
                        : (personalName || user.name || user.emailOrPhone)
                    }
                    title={t('danger.title')}
                    description={isCorporate ? t('danger.customerDesc') : t('danger.customerIndividualDesc')}
                    buttonLabel="ขอลบบัญชีและทำลายข้อมูล"
                    onDelete={async () => {
                      await deleteAccount();
                      onClose();
                    }}
                  />
                </div>
              </section>
            </div>

            {/* RIGHT sidebar */}
            <div className="space-y-5 min-w-0">
              {/* SSO quick panel */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-amber-500" />
                    เข้าสู่ระบบด่วน 3 บทบาท
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">SSO v24</span>
                </div>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 mb-3 text-[11px] font-bold">
                  {['องค์กร', 'เบอร์โทร OTP', 'ใบขับขี่คนขับ'].map((label, i) => (
                    <span
                      key={label}
                      className={`text-center py-1.5 px-1 ${i === 0 ? 'bg-white dark:bg-slate-900 shadow-xs' : 'text-slate-400'}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      เลขประจำตัวผู้เสียภาษี (Tax ID)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={displayTaxId}
                      className="w-full h-10 rounded-none border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-mono font-bold text-slate-700 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      อีเมลผู้อำนวยหรือรหัสผ่านองค์กร
                    </label>
                    <input
                      type="password"
                      disabled
                      value="••••••••"
                      className="w-full h-10 rounded-none border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 text-xs text-slate-400"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <label className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.target.checked)}
                        className="w-3.5 h-3.5 accent-slate-950"
                      />
                      <span>จดจำข้อมูลเครื่องนี้</span>
                    </label>
                    <a href={OFFICIAL_LINE_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-amber-700 dark:text-amber-400 hover:underline">
                      ลืมรหัสผ่าน?
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSessionVerified(true);
                      setTimeout(() => setSessionVerified(false), 3000);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-none bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    {sessionVerified ? <Check className="h-4 w-4 text-emerald-400" strokeWidth={3} /> : <LogIn className="h-4 w-4" />}
                    <span>{sessionVerified ? 'เซสชันปลอดภัย • ต่ออายุแล้ว' : 'ยืนยันเข้าสู่ระบบความปลอดภัยสูง'}</span>
                  </button>
                  <p className="text-center text-[11px] text-slate-400">หรือเข้าสู่ระบบด้วยบัญชีทางเลือก</p>
                  <a
                    href={OFFICIAL_LINE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-none bg-[#06C755] hover:bg-[#05b04b] text-white text-xs font-bold transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>LINE One-Click Login</span>
                  </a>
                </div>
              </section>

              {/* Tax compliance */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none p-4 sm:p-5">
                <h3 className="text-xs font-black flex items-center gap-1.5 mb-3">
                  <BadgeCheck className="h-4 w-4 text-amber-600" />
                  มาตรฐานรับรองเอกสารภาษี
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-2.5">
                    <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-600" strokeWidth={3} />
                    <span>ใบกำกับภาษีอิเล็กทรอนิกส์ (e-Tax Invoice by Email / RD Prep) ตามมาตรฐานกรมสรรพากร</span>
                  </li>
                  <li className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-2.5">
                    <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-600" strokeWidth={3} />
                    <span>หักภาษี ณ ที่จ่าย 3% (ภ.ง.ด. 53) ออกใบรับรองพร้อมส่งไฟล์ PDF ให้ฝ่ายบัญชีทันที</span>
                  </li>
                  <li className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-2.5">
                    <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-600" strokeWidth={3} />
                    <span>ประกันภัยคุ้มครอง พ.ร.บ. ภาคบังคับและประกันอุบัติเหตุขั้น 1 ทุกที่นั่ง</span>
                  </li>
                </ul>
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">ดาวน์โหลด ภ.พ.20 ของทริปดี</span>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>ภ.พ.20 pdf</span>
                  </button>
                </div>
              </section>

              {/* B2B key account */}
              <section className="bg-slate-950 text-white rounded-none p-4 sm:p-5 border border-slate-950">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  ผู้จัดการดูแลลูกค้านิติบุคคล (B2B Key Account)
                </h3>
                <p className="text-sm font-bold mt-2">คุณป๊ะตา (เจ้าหน้าที่ประสานบัญชีคุณ)</p>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  พร้อมประสานงานขบวนคาราวานสัมมนา จัดหารถตู้เสริม และออกเอกสารเร่งด่วน 24 ชม.
                </p>
                <a
                  href="tel:02-123-4567"
                  className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-none bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>โทรสายตรง: 02-123-4567 ต่อ 802</span>
                </a>
                <a
                  href={OFFICIAL_LINE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-none bg-[#06C755] hover:bg-[#05b04b] text-white text-xs font-bold transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>LINE: @tripdee_corp</span>
                </a>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Confirmation Sheet Modal */}
      {activeSheetData && (
        <BookingConfirmationSheet
          initialData={activeSheetData}
          isModal={true}
          onClose={() => setActiveSheetData(null)}
        />
      )}
    </div>
  );
};
