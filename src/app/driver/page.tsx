'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import {
  X,
  Phone,
  MessageSquare,
  Star,
  Check,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Upload,
  RefreshCw,
  LogOut,
  CarFront,
  Users,
  Luggage,
} from 'lucide-react';
import { compressImage } from '@/lib/imageCompression';
import {
  toISODateString,
  generateDateRange,
  getBangkokTodayIso,
} from '@/lib/availabilityUtils';

type TabType = 'profile' | 'perks' | 'jobs' | 'reviews';

export default function DriverDashboardPage() {
  const { user, toggleDriverAvailability, updateDriverProfile, logout, deleteAccount } = useAuth();
  const { t, locale } = useLanguage();
  const { trackCall } = useAnalytics();

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [featuredRequested, setFeaturedRequested] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Form states initialized from user or demo
  const [nickname, setNickname] = useState(user?.driverNickname || '');
  const [phone, setPhone] = useState(user?.emailOrPhone || '');
  const [lineId, setLineId] = useState(user?.lineId || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [wechat, setWechat] = useState(user?.wechat || '');
  const [kakao, setKakao] = useState(user?.kakao || '');
  const [vehicleTitle, setVehicleTitle] = useState(user?.vehicleTitle || '');
  const [vehiclePlate, setVehiclePlate] = useState(user?.vehiclePlate || '');
  const [seats, setSeats] = useState(user?.seats || 9);

  // Images state
  const defaultImages: string[] = [];

  const [images, setImages] = useState<string[]>(() => {
    if (Array.isArray(user?.images) && user.images.length > 0) {
      return user.images;
    }
    return defaultImages;
  });

  const [photoMeta, setPhotoMeta] = useState<Record<number, { name: string; size: string }>>({});

  // Busy Dates state
  const [busyDates, setBusyDates] = useState<string[]>(() => {
    if (Array.isArray(user?.busyDates) && user.busyDates.length > 0) {
      return user.busyDates;
    }
    const bkk = getBangkokTodayIso();
    const [y, m] = bkk.split('-');
    return [`${y}-${m}-11`, `${y}-${m}-12`];
  });

  // Calendar Interval Form states
  const [intervalStart, setIntervalStart] = useState('');
  const [intervalEnd, setIntervalEnd] = useState('');
  const [intervalNote, setIntervalNote] = useState('');

  // Calendar month view
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));

  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  // Driver Meta
  const driverCode = user?.id ? `TD-VN-${user.id.replace(/[^0-9]/g, '').slice(-5)}` : '';
  const driverDisplayName = user?.name || '';
  const driverNick = nickname || user?.driverNickname || '';
  const isAvailable = user?.isAvailable !== false;

  // Profile Save
  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    updateDriverProfile({
      driverNickname: nickname,
      emailOrPhone: phone,
      lineId,
      whatsapp: whatsapp.trim() || undefined,
      wechat: wechat.trim() || undefined,
      kakao: kakao.trim() || undefined,
      vehicleTitle,
      vehiclePlate,
      seats: Number(seats),
      images,
      busyDates,
    });
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }, 600);
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, slotIndex?: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const file = files[0];
      const result = await compressImage(file, { maxWidth: 1600, quality: 0.85 });
      const newImages = [...images];
      const targetIdx = slotIndex !== undefined && slotIndex < newImages.length ? slotIndex : newImages.length;
      newImages[targetIdx] = result.dataUrl;
      setImages(newImages);
      setPhotoMeta((prev) => ({
        ...prev,
        [targetIdx]: {
          name: file.name,
          size: `${(result.compressedSize / (1024 * 1024)).toFixed(1)} MB`,
        },
      }));
    } catch {
      // Fallback
    }
  };

  const handleRemoveImage = (index: number) => {
    if (images.length <= 1) {
      alert('จำเป็นต้องมีรูปถ่ายรถยนต์อย่างน้อย 1 รูปสำหรับแสดงผลหน้าเว็บ');
      return;
    }
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
  };

  // Calendar Helpers
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  const todayIso = toISODateString(today);

  const toggleDateBusy = (isoString: string) => {
    if (busyDates.includes(isoString)) {
      setBusyDates(busyDates.filter((d) => d !== isoString));
    } else {
      setBusyDates([...busyDates, isoString].sort());
    }
  };

  const handleAddInterval = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!intervalStart || !intervalEnd) {
      alert('กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด');
      return;
    }
    const dates = generateDateRange(intervalStart, intervalEnd);
    const merged = Array.from(new Set([...busyDates, ...dates])).sort();
    setBusyDates(merged);
    setIntervalStart('');
    setIntervalEnd('');
    setIntervalNote('');
  };

  const monthNamesTh = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const monthDisplayTitle =
    locale === 'en'
      ? `${monthNamesEn[currentMonth]} ${currentYear}`
      : `${monthNamesTh[currentMonth]} ${currentYear + 543} / ${monthNamesEn[currentMonth]} ${currentYear}`;

  return (
    <div className="bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col antialiased selection:bg-amber-100 selection:text-slate-900">
      <Navbar />

      <main className="w-full pt-16 flex-1">
        <div className="flex flex-col w-full">
          {/* Subtle Architectural Header Scrim / Live Status Strip */}
          <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
              {/* Breadcrumb */}
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
                <a
                  href="/"
                  className="font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px] text-slate-400">home</span>
                  <span>หน้าหลักพาร์ทเนอร์</span>
                </a>
                <span className="text-slate-300 dark:text-slate-600 text-[10px]">/</span>
                <span className="font-bold text-slate-950 dark:text-white">
                  จัดการข้อมูลคนขับและคิวงาน (เชียงใหม่ & ภาคเหนือ)
                </span>
              </nav>

              {/* Live Node & Auto-save Indicator */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 text-slate-600 dark:text-slate-300 text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#06C755] animate-pulse"></span>
                  <span className="hidden sm:inline">ระบบออนไลน์: คลาวด์ซิงก์เรียลไทม์</span>
                  <span className="sm:hidden">ออนไลน์ 24 ชม.</span>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">CNX-SVR-04</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Canvas Container */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex flex-col gap-6">
            {/* 1. Driver Profile Master Bento Module */}
            <div className="bg-white dark:bg-slate-900 p-6 shadow-xs border border-slate-200 dark:border-slate-800 relative overflow-hidden">
              {/* Top Geometric Accent Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0a192f] via-[#fea619] to-[#06C755]"></div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                {/* Identity Block */}
                <div className="flex items-start md:items-center gap-4 min-w-0">
                  {/* Geometric Avatar */}
                  <div className="relative w-16 h-16 bg-[#0d1c32] text-white flex items-center justify-center shrink-0 shadow-xs border border-slate-300 dark:border-slate-700">
                    <span className="material-symbols-outlined text-[32px] text-[#d6e3ff]">
                      airport_shuttle
                    </span>
                    <div className="absolute -bottom-1 -right-1 bg-[#06C755] text-white w-5 h-5 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                    </div>
                  </div>

                  {/* Driver Meta */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white truncate">
                        {driverDisplayName} ({driverNick})
                      </h1>
                      <span className="inline-flex items-center gap-1 bg-[#E8F9EE] text-[#06C755] px-2 py-0.5 text-[11px] font-bold tracking-wider border border-emerald-200 dark:border-emerald-800">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        VERIFIED PARTNER
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-slate-900 dark:text-slate-200 font-semibold">
                        รหัส: {driverCode}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
                      <span className="flex items-center gap-1 text-xs">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">
                          location_on
                        </span>
                        จุดประจำ: ท่าอากาศยานนานาชาติเชียงใหม่ (CNX) / ภาคเหนือตอนบน
                      </span>
                    </div>
                  </div>
                </div>

                {/* Master Availability Toggle Switch */}
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-700 shrink-0">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-950 dark:text-white">
                      สถานะการรับงาน
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        isAvailable ? 'text-[#06C755]' : 'text-slate-500'
                      }`}
                    >
                      {isAvailable ? 'พร้อมรับงานทันที 24 ชม.' : 'พักงานชั่วคราว (ไม่แสดงผล)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-pressed={isAvailable}
                    onClick={toggleDriverAvailability}
                    className={`relative inline-flex h-8 w-16 items-center transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer ${
                      isAvailable ? 'bg-[#06C755]' : 'bg-slate-400 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform bg-white transition-transform shadow-xs ${
                        isAvailable ? 'translate-x-9' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 4 KPI Metrics Monolithic Rail */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-6">
                {/* KPI 1 */}
                <div className="bg-[#F8FAFC] dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-semibold">
                    <span>คะแนนรีวิวคนขับ</span>
                    <span className="material-symbols-outlined text-[18px] text-[#D97706]">
                      star
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-mono text-slate-950 dark:text-white">
                      —
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    ยังไม่มีรีวิวจากผู้โดยสาร
                  </span>
                </div>

                {/* KPI 2 */}
                <div className="bg-[#F8FAFC] dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-semibold">
                    <span>การตอบกลับเฉลี่ย</span>
                    <span className="material-symbols-outlined text-[18px] text-[#06C755]">
                      bolt
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-mono text-slate-950 dark:text-white">
                      &lt; 3
                    </span>
                    <span className="text-xs font-semibold text-slate-500">นาที</span>
                  </div>
                  <span className="text-[11px] text-[#06C755] font-semibold mt-1">
                    ⚡ สถิติตอบไวมากระดับเหรียญทอง
                  </span>
                </div>

                {/* KPI 3 */}
                <div className="bg-[#F8FAFC] dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-semibold">
                    <span>ยอดเข้าชมรถ (30 วัน)</span>
                    <span className="material-symbols-outlined text-[18px] text-slate-400">
                      trending_up
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-mono text-slate-950 dark:text-white">
                      1,420
                    </span>
                    <span className="text-[11px] text-[#06C755] font-bold bg-[#E8F9EE] px-1.5 py-0.2">
                      +24%
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    ผู้ค้นหาเจาะจงโซนเชียงใหม่
                  </span>
                </div>

                {/* KPI 4 */}
                <div className="bg-[#F8FAFC] dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-semibold">
                    <span>ค่าบริการแพลตฟอร์ม</span>
                    <span className="material-symbols-outlined text-[18px] text-slate-950 dark:text-slate-200">
                      savings
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-mono text-slate-950 dark:text-white">
                      ฿0
                    </span>
                    <span className="text-xs font-bold text-[#06C755]">ฟรีตลอดชีพ</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    รับเงินสดตรงจากผู้โดยสาร 100%
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Featured Status Banner */}
            <div className="bg-[#FEF3C7] dark:bg-amber-950/30 border border-[#D97706]/40 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs relative">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 bg-[#D97706] text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">grade</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg text-slate-950 dark:text-amber-100 font-bold">
                      สถานะ: ได้รับคัดเลือกเป็น &apos;รถแนะนำ&apos; (Featured TOP RATED)
                    </h2>
                    <span className="bg-[#D97706] text-white font-mono text-[10px] font-bold px-2 py-0.5 tracking-wider uppercase">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-amber-200/90 mt-1 leading-relaxed">
                    รถตู้ของคุณมีตราดาวทองแนะนำ ช่วยเพิ่มความน่าเชื่อถือ ลูกค้าติดต่อเฉลี่ยเพิ่มขึ้น
                    3-5 เท่า พร้อมสิทธิ์ติดอันดับผลลัพธ์แรกสุดบนหน้าค้นหารถภาคเหนือ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('perks')}
                className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 transition-colors shrink-0 self-stretch md:self-auto justify-center cursor-pointer"
              >
                <span>ดูสิทธิประโยชน์</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>

            {/* 3. Master Navigation Tab Switcher */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-5 sm:px-6 py-3.5 text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer ${
                  activeTab === 'profile'
                    ? 'text-slate-950 dark:text-white border-b-2 border-slate-950 dark:border-white bg-[#F8FAFC] dark:bg-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border-b-2 border-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">directions_car</span>
                <span>ข้อมูลรถและช่องทางติดต่อ</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('perks')}
                className={`flex items-center gap-2 px-5 sm:px-6 py-3.5 text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer ${
                  activeTab === 'perks'
                    ? 'text-slate-950 dark:text-white border-b-2 border-slate-950 dark:border-white bg-[#F8FAFC] dark:bg-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border-b-2 border-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[18px] text-[#D97706]">
                  workspace_premium
                </span>
                <span>สิทธิประโยชน์รถแนะนำ</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('jobs')}
                className={`flex items-center gap-2 px-5 sm:px-6 py-3.5 text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer ${
                  activeTab === 'jobs'
                    ? 'text-slate-950 dark:text-white border-b-2 border-slate-950 dark:border-white bg-[#F8FAFC] dark:bg-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border-b-2 border-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">inbox</span>
                <span>กล่องงานลูกค้า</span>
                <span className="bg-[#D97706] text-white font-mono text-[10px] font-bold px-1.5 py-0.5 leading-none">
                  2 งานใหม่
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`flex items-center gap-2 px-5 sm:px-6 py-3.5 text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer ${
                  activeTab === 'reviews'
                    ? 'text-slate-950 dark:text-white border-b-2 border-slate-950 dark:border-white bg-[#F8FAFC] dark:bg-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border-b-2 border-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[18px] text-[#D97706]">star</span>
                <span>ประวัติรีวิวลูกค้า</span>
              </button>
            </div>

            {/* TAB 1: ข้อมูลรถและช่องทางติดต่อ */}
            {activeTab === 'profile' && (
              <div className="flex flex-col gap-6">
                {/* 4. Real Vehicle Photos Gallery Module */}
                <section className="bg-white dark:bg-slate-900 p-6 shadow-xs border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-950 dark:text-white text-[22px]">
                        photo_library
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
                        รูปถ่ายจริงสำหรับแสดงบนเว็บไซต์ ({images.length}/8 รูป)
                      </h2>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      แนะนำ 3-5 รูปภาพ (ภายนอก, ภายในเบาะ VIP, สิ่งอำนวยความสะดวก) รองรับ JPG, PNG,
                      WebP สูงสุด 15MB
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    {images.map((imgUrl, idx) => {
                      const meta = photoMeta[idx] || {
                        name: `vehicle-photo-${idx + 1}.jpg`,
                        size: '2.5 MB',
                      };
                      return (
                        <div
                          key={idx}
                          className="relative group bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col"
                        >
                          <div className="relative aspect-[16/10] overflow-hidden bg-slate-200 dark:bg-slate-800">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imgUrl}
                              alt={`ภาพรถคันจริง #${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="absolute top-2 left-2 bg-slate-950 text-white text-[10px] px-2 py-0.5 font-bold tracking-wider flex items-center gap-1 shadow-xs">
                              {idx === 0 ? (
                                <>
                                  <span className="material-symbols-outlined text-[12px] text-[#D97706]">
                                    star
                                  </span>
                                  #1 รูปหน้าปกภายนอก
                                </>
                              ) : idx === 1 ? (
                                '#2 ห้องโดยสารเบาะ VIP'
                              ) : (
                                `#${idx + 1} รายละเอียดตัวรถ`
                              )}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              title="ลบรูปภาพนี้"
                              className="absolute top-2 right-2 w-7 h-7 bg-white/90 dark:bg-slate-900/90 hover:bg-rose-600 hover:text-white text-slate-800 dark:text-slate-200 flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>

                          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
                              {meta.name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">{meta.size}</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Upload Slot 1 */}
                    {images.length < 8 && (
                      <label className="cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-950 dark:hover:border-white bg-[#F8FAFC] dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 p-6 flex flex-col items-center justify-center text-center transition-colors min-h-[190px]">
                        <div className="w-10 h-10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-2 shadow-xs border border-slate-200 dark:border-slate-700">
                          <span className="material-symbols-outlined text-[22px]">add_a_photo</span>
                        </div>
                        <span className="text-xs font-bold text-slate-950 dark:text-white">
                          + เพิ่มรูปรถ (รูปที่ {images.length + 1})
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          เช่น ภาพคอนโซล สิ่งอำนวยความสะดวก
                        </span>
                        <input
                          ref={fileInputRef1}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e)}
                        />
                      </label>
                    )}

                    {/* Upload Slot 2 */}
                    {images.length < 7 && (
                      <label className="cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-950 dark:hover:border-white bg-[#F8FAFC]/60 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800 p-6 flex flex-col items-center justify-center text-center transition-colors min-h-[190px]">
                        <div className="w-10 h-10 bg-white dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-2 shadow-xs border border-slate-200 dark:border-slate-700">
                          <span className="material-symbols-outlined text-[22px]">cloud_upload</span>
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          เพิ่มรูปกระเป๋า / ท้ายรถ
                        </span>
                        <span className="text-[11px] text-slate-400 mt-1">
                          ลากวางไฟล์ที่นี่ หรือกดเลือกรูป
                        </span>
                        <input
                          ref={fileInputRef2}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e)}
                        />
                      </label>
                    )}
                  </div>
                </section>

                {/* 5. Direct Contact & Specifications Form */}
                <section className="bg-white dark:bg-slate-900 p-6 shadow-xs border border-slate-200 dark:border-slate-800">
                  <div className="p-4 bg-[#E8F9EE] dark:bg-emerald-950/30 border border-[#06C755]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[22px] text-[#06C755] font-bold">
                        shield_person
                      </span>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-950 dark:text-emerald-100">
                          ข้อมูลติดต่อตรง & ข้อมูลจำเพาะรถยนต์
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-emerald-200/80 mt-0.5">
                          ผู้โดยสารและลูกค้าองค์กร B2B จะติดต่อคุณโดยตรงผ่านเบอร์โทรและ LINE
                          โดยไม่มีการหักค่าบริการ
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#06C755] bg-white dark:bg-slate-900 px-2.5 py-1 border border-[#06C755]/20 shrink-0">
                      <span className="material-symbols-outlined text-[14px]">lock</span>
                      DIRECT CLIENT CONNECTION 100%
                    </div>
                  </div>

                  <form
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8"
                    onSubmit={handleSaveProfile}
                  >
                    {/* Left Column */}
                    <div className="flex flex-col gap-4 sm:gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label
                          className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                          htmlFor="page-driver-title"
                        >
                          <span>ชื่อเล่น / ชื่อทีมรถสำหรับแสดงผลหน้าเว็บ</span>
                          <span className="text-rose-600">*</span>
                        </label>
                        <input
                          id="page-driver-title"
                          type="text"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
                          htmlFor="page-driver-line"
                        >
                          <span className="flex items-center gap-1">
                            <span>LINE ID หรือ ลิงก์ LINE Official</span>
                            <span className="text-rose-600">*</span>
                          </span>
                          <span className="font-mono text-[11px] text-[#06C755] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">chat</span>
                            ปุ่มแอดไลน์อัตโนมัติ
                          </span>
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#06C755] text-white flex items-center justify-center font-bold font-mono text-xs">
                            LINE
                          </div>
                          <input
                            id="page-driver-line"
                            type="text"
                            value={lineId}
                            onChange={(e) => setLineId(e.target.value)}
                            className="w-full h-12 pl-16 pr-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                          htmlFor="page-driver-wechat"
                        >
                          <span>WECHAT ID (สำหรับรองรับนักท่องเที่ยวต่างชาติ)</span>
                        </label>
                        <input
                          id="page-driver-wechat"
                          type="text"
                          value={wechat}
                          onChange={(e) => setWechat(e.target.value)}
                          className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
                          htmlFor="page-driver-plate"
                        >
                          <span className="flex items-center gap-1">
                            <span>ป้ายทะเบียนรถ (ตรวจสอบมาตรฐานกรมการขนส่ง)</span>
                            <span className="text-rose-600">*</span>
                          </span>
                          <span className="text-[11px] text-[#06C755] bg-[#E8F9EE] px-2 py-0.5 font-bold">
                            ✓ ป้ายเหลืองถูกต้อง 100%
                          </span>
                        </label>
                        <input
                          id="page-driver-plate"
                          type="text"
                          value={vehiclePlate}
                          onChange={(e) => setVehiclePlate(e.target.value)}
                          className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono font-semibold focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                          htmlFor="page-driver-headline"
                        >
                          <span>หัวข้อรุ่นรถ & จุดเด่นที่ดึงดูดลูกค้า</span>
                          <span className="text-rose-600">*</span>
                        </label>
                        <textarea
                          id="page-driver-headline"
                          rows={3}
                          maxLength={120}
                          value={vehicleTitle}
                          onChange={(e) => setVehicleTitle(e.target.value)}
                          className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                        />
                        <span className="text-[11px] text-slate-400 text-right">
                          {vehicleTitle.length}/120 ตัวอักษร
                        </span>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-4 sm:gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label
                          className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
                          htmlFor="page-driver-phone"
                        >
                          <span className="flex items-center gap-1">
                            <span>เบอร์โทรติดต่อตรง (ลูกค้ากดโทรออกทันที)</span>
                            <span className="text-rose-600">*</span>
                          </span>
                          <span className="text-[11px] text-[#06C755] flex items-center gap-0.5 font-bold">
                            <span className="material-symbols-outlined text-[13px]">
                              check_circle
                            </span>
                            ตรวจสอบเบอร์แล้ว
                          </span>
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center border-r border-slate-300 dark:border-slate-700">
                            <span className="material-symbols-outlined text-[18px]">call</span>
                          </div>
                          <input
                            id="page-driver-phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full h-12 pl-16 pr-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                          htmlFor="page-driver-whatsapp"
                        >
                          <span>WHATSAPP เบอร์ หรือ ลิงก์ (สำหรับลูกค้ายุโรป/สิงคโปร์)</span>
                        </label>
                        <input
                          id="page-driver-whatsapp"
                          type="text"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                          htmlFor="page-driver-kakao"
                        >
                          <span>KAKAOTALK ID (ตลาดเกาหลี)</span>
                        </label>
                        <input
                          id="page-driver-kakao"
                          type="text"
                          value={kakao}
                          onChange={(e) => setKakao(e.target.value)}
                          className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                          htmlFor="page-driver-capacity"
                        >
                          <span>จำนวนที่นั่งผู้โดยสารตามโครงสร้างจริง</span>
                          <span className="text-rose-600">*</span>
                        </label>
                        <select
                          id="page-driver-capacity"
                          value={seats}
                          onChange={(e) => setSeats(Number(e.target.value))}
                          className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:border-slate-950 dark:focus:border-white focus:outline-none transition-colors cursor-pointer"
                        >
                          <option value={9}>
                            9 ที่นั่ง VIP เบาะใหญ่พิเศษ 3 แถว (นั่งสบายที่สุด ไม่แออัด)
                          </option>
                          <option value={10}>10 ที่นั่ง VIP เบาะหนังพรีเมียม</option>
                          <option value={12}>12 ที่นั่ง Standard สำหรับหมู่คณะ</option>
                          <option value={13}>13-14 ที่นั่ง Commuter มาตรฐานโรงงาน</option>
                          <option value={7}>7 ที่นั่ง SUV / Alphard พรีเมียม</option>
                        </select>
                      </div>

                      <div className="p-4 bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-slate-500 text-[24px]">
                            luggage
                          </span>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-950 dark:text-white">
                              ความจุกระเป๋าสัมภาระสูงสุด
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              กระเป๋าเดินทางขนาด 24-28 นิ้ว ได้ 5-7 ใบ (เมื่อพับเบาะหลังสุด)
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-950 dark:text-white bg-white dark:bg-slate-900 px-2.5 py-1 border border-slate-200 dark:border-slate-700 shrink-0">
                          7 ใบใหญ่
                        </span>
                      </div>
                    </div>
                  </form>
                </section>

                {/* 6. Real-time Live Availability Calendar Module */}
                <section className="bg-white dark:bg-slate-900 p-6 shadow-xs border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[22px] text-slate-950 dark:text-white">
                        calendar_month
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
                        ปฏิทินระบุสถานะ &quot;คิวว่าง / ติดงาน&quot; (อัปเดตสด 24 ชม.)
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-[#06C755]"></span>
                      <span>ซิงก์ตรงกับผลการค้นหาของลูกค้าทันที</span>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-[#E8F9EE] dark:bg-emerald-950/30 border border-[#06C755]/30 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[22px] text-[#06C755] font-bold shrink-0">
                      check_circle
                    </span>
                    <p className="text-xs sm:text-sm text-slate-900 dark:text-emerald-100">
                      {busyDates.length === 0 ? (
                        <>
                          <strong className="font-bold">ขณะนี้ไม่มีคิวติดงาน</strong> —
                          รถของคุณเปิดสถานะว่างพร้อมรับงานทุกวัน 24 ชั่วโมง
                          (ลูกค้าบน TripDee สามารถกดติดต่อจองคิวทริปของคุณได้ตลอดเวลา)
                        </>
                      ) : (
                        <>
                          <strong className="font-bold">
                            ขณะนี้มีคิวติดงาน {busyDates.length} วัน
                          </strong>{' '}
                          — ระบบซิงก์ผลการค้นหากับลูกค้าเพื่อแจ้งเตือนล่วงหน้า และป้องกันการจองซ้อนทับ
                        </>
                      )}
                    </p>
                  </div>

                  {/* Quick Add Blocked Date Interval */}
                  <form
                    onSubmit={handleAddInterval}
                    className="mt-6 p-4 bg-[#F8FAFC] dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-stretch md:items-end gap-3 sm:gap-4"
                  >
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                        วันที่เริ่มต้นติดคิวงาน
                      </label>
                      <input
                        type="date"
                        value={intervalStart}
                        onChange={(e) => setIntervalStart(e.target.value)}
                        className="w-full h-11 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-slate-950 dark:focus:border-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                        ถึงวันที่สิ้นสุด (วันสุดท้าย)
                      </label>
                      <input
                        type="date"
                        value={intervalEnd}
                        onChange={(e) => setIntervalEnd(e.target.value)}
                        className="w-full h-11 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-slate-950 dark:focus:border-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                        หมายเหตุงาน (เห็นเฉพาะคุณ)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น ทริปดอยอินทนนท์ 3 วัน"
                        value={intervalNote}
                        onChange={(e) => setIntervalNote(e.target.value)}
                        className="w-full h-11 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-slate-950 dark:focus:border-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="h-11 px-5 bg-[#D97706] hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      <span>+ เพิ่มวันติดคิว</span>
                    </button>
                  </form>

                  {/* Monthly Calendar Grid */}
                  <div className="mt-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))}
                        className="p-1 hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base text-slate-950 dark:text-white font-bold">
                          {monthDisplayTitle}
                        </span>
                        <span className="font-mono text-xs bg-white dark:bg-slate-900 px-2 py-0.5 text-slate-500 border border-slate-200 dark:border-slate-700 hidden sm:inline">
                          โซนเวลา: Asia/Bangkok
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))}
                        className="p-1 hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-7 text-center text-[12px] font-bold py-2 bg-[#F8FAFC] dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-rose-600">อา (Sun)</span>
                      <span className="text-slate-600 dark:text-slate-400">จ (Mon)</span>
                      <span className="text-slate-600 dark:text-slate-400">อ (Tue)</span>
                      <span className="text-slate-600 dark:text-slate-400">พ (Wed)</span>
                      <span className="text-slate-600 dark:text-slate-400">พฤ (Thu)</span>
                      <span className="text-slate-600 dark:text-slate-400">ศ (Fri)</span>
                      <span className="text-slate-950 dark:text-slate-200">ส (Sat)</span>
                    </div>

                    <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-slate-800">
                      {Array.from({ length: firstDayOfWeek }).map((_, i) => {
                        const dayNum = prevMonthDays - firstDayOfWeek + i + 1;
                        return (
                          <div
                            key={`prev-${i}`}
                            className="p-2 sm:p-3 min-h-[64px] bg-[#F8FAFC] dark:bg-slate-900/40 text-slate-300 dark:text-slate-700"
                          >
                            <span className="font-mono text-xs">{dayNum}</span>
                          </div>
                        );
                      })}

                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const monthStr = String(currentMonth + 1).padStart(2, '0');
                        const dayStr = String(dayNum).padStart(2, '0');
                        const dateIso = `${currentYear}-${monthStr}-${dayStr}`;

                        const isBusy = busyDates.includes(dateIso);
                        const isToday = dateIso === todayIso;
                        const dayOfWeek = (firstDayOfWeek + i) % 7;
                        const isSunday = dayOfWeek === 0;

                        if (isBusy) {
                          return (
                            <div
                              key={dateIso}
                              onClick={() => toggleDateBusy(dateIso)}
                              className="p-2 min-h-[64px] bg-[#ffdad6]/40 dark:bg-rose-950/30 border-l-2 border-l-[#ba1a1a] cursor-pointer hover:opacity-90 transition-opacity"
                              title="คลิกเพื่อปลดล็อคให้ว่าง"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-[#ba1a1a] dark:text-rose-400">
                                  {dayNum}
                                </span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
                              </div>
                              <span className="block mt-1 text-[10px] text-[#ba1a1a] dark:text-rose-300 font-semibold truncate">
                                ติดคิว (เชียงราย)
                              </span>
                            </div>
                          );
                        }

                        if (isToday) {
                          return (
                            <div
                              key={dateIso}
                              onClick={() => toggleDateBusy(dateIso)}
                              className="p-2 min-h-[64px] bg-white dark:bg-slate-800 border-2 border-slate-950 dark:border-white relative shadow-xs cursor-pointer"
                              title="คลิกเพื่อสลับเป็นติดคิว"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-extrabold text-slate-950 dark:text-white">
                                  {dayNum}
                                </span>
                                <span className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-mono text-[9px] px-1 py-0.2 uppercase font-bold">
                                  วันนี้
                                </span>
                              </div>
                              <span className="block mt-1 text-[10px] text-[#06C755] font-bold">
                                ● ว่างพร้อมรับ
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={dateIso}
                            onClick={() => toggleDateBusy(dateIso)}
                            className="p-2 sm:p-3 min-h-[64px] bg-white dark:bg-slate-900 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="คลิกเพื่อสลับสถานะ"
                          >
                            <span
                              className={`font-mono text-xs font-bold ${
                                isSunday ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {dayNum}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-3 bg-[#F8FAFC] dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 inline-block"></span>
                          คิวว่างรับงานได้
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 bg-[#ffdad6] border border-[#ba1a1a] inline-block"></span>
                          ติดงาน / คิวเต็ม
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 border-2 border-slate-950 dark:border-white inline-block"></span>
                          วันนี้ (ปัจจุบัน)
                        </span>
                      </div>
                      <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                        คลิกที่ช่องวันที่ในปฏิทินเพื่อสลับสถานะ ว่าง/ติดงาน ได้โดยตรง
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* TAB 2: สิทธิประโยชน์รถแนะนำ */}
            {activeTab === 'perks' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#D97706] uppercase tracking-wider mb-1">
                      <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                      <span>TripDee Verified Partner Program</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-950 dark:text-white">
                      สิทธิประโยชน์พิเศษสำหรับสถานะ &apos;รถแนะนำยอดนิยม&apos; (TOP RATED)
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                      การได้รับเลือกเป็นรถแนะนำช่วยเพิ่มโอกาสในการถูกเลือกจากลูกค้าบุคคลและองค์กรธุรกิจ
                      B2B สูงสุดถึง 400%
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="w-8 h-8 bg-slate-950 text-white flex items-center justify-center font-bold">
                        1
                      </div>
                      <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                        อันดับแรกบนผลการค้นหา
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        ระบบจะจัดอันดับรถของคุณให้อยู่ในโซนหน้าแรก เมื่อลูกค้าค้นหารถในเขตเชียงใหม่
                        ลำพูน และแม่ฮ่องสอน
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="w-8 h-8 bg-slate-950 text-white flex items-center justify-center font-bold">
                        2
                      </div>
                      <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                        ตราสัญลักษณ์ดาวทองการันตี
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        เพิ่มความมั่นใจให้ผู้โดยสาร ลูกค้าองค์กร และเอเจนซีท่องเที่ยวต่างชาติ
                        ด้วยตราดาวทองรับรองมาตรฐาน
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="w-8 h-8 bg-slate-950 text-white flex items-center justify-center font-bold">
                        3
                      </div>
                      <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                        รับงานสัมมนาองค์กร B2B
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        สิทธิ์เข้าร่วมกองคาราวานทริปสัมมนาบริษัท และงานประชุมนานาชาติของพันธมิตร
                        TripDee
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-slate-950 dark:text-white mb-3">
                      สถานะการตรวจสอบเอกสารเพื่อรักษาสิทธิ์ (Verification Checklist)
                    </h4>
                    <div className="space-y-2.5">
                      {[
                        {
                          title: '1. ประกันภัยชั้น 1 คุ้มครองผู้โดยสาร และ พ.ร.บ.',
                          status: 'ผ่านการตรวจสอบแล้ว (Active)',
                          valid: 'คุ้มครองถึง 31 ธ.ค. 2569',
                        },
                        {
                          title: '2. ป้ายทะเบียนรถยนต์สาธารณะ (ป้ายเหลือง 30 หรือ 36)',
                          status: 'ผ่านการตรวจสอบแล้ว (Active)',
                          valid: 'ตรงตามมาตรฐานกรมการขนส่งทางบก',
                        },
                        {
                          title: '3. การตรวจสภาพความปลอดภัย (ถังดับเพลิง, ค้อนทุบกระจก, GPS)',
                          status: 'ผ่านเกณฑ์มาตรฐานความปลอดภัย',
                          valid: 'ตรวจรอบล่าสุด ก.ย. 2569',
                        },
                        {
                          title: '4. มาตรฐานบริการดีเด่น ปลอดกลิ่นบุหรี่ 100%',
                          status: 'ผ่านการรับรอง (100% Smoke-Free)',
                          valid: 'ประเมินจากรีวิวผู้โดยสารจริง',
                        },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-[#F8FAFC] dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-[#06C755]">
                              check_circle
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {item.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-[#06C755]">{item.status}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500 font-mono text-[11px]">{item.valid}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    {featuredRequested ? (
                      <div className="p-3 bg-[#E8F9EE] text-[#06C755] font-bold text-xs border border-emerald-300">
                        ✓ ส่งคำขออัปเดตเอกสารไปยังทีมงานเรียบร้อยแล้ว (จะดำเนินการภายใน 24 ชม.)
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedRequested(true);
                          setTimeout(() => setFeaturedRequested(false), 5000);
                        }}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">upload_file</span>
                        <span>ส่งเอกสารเพิ่มเติม / ตรวจสอบรอบใหม่</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: กล่องงานลูกค้า */}
            {activeTab === 'jobs' && (
              <div className="space-y-4">
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                      กล่องข้อความและคิวงานใหม่จากผู้โดยสาร
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      งานติดต่อตรงจากลูกค้าที่ค้นหาและเจาะจงเลือกรถของคุณ — ดีลตรง 100% ไม่ผ่านคนกลาง
                    </p>
                  </div>
                  <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-2 py-1 border border-slate-200 dark:border-slate-700">
                    0 งานรอการติดต่อ
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-xs text-xs sm:text-sm text-slate-500">
                  ยังไม่มีงานใหม่จากผู้โดยสาร
                </div>

              </div>
            )}

            {/* TAB 4: ประวัติรีวิวลูกค้า */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h3 className="text-xl font-bold text-slate-950 dark:text-white">
                        ผลคะแนนและความคิดเห็นจากผู้โดยสารจริง
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        คะแนนทั้งหมดรวบรวมจากผู้โดยสารที่ทำการจองและใช้บริการผ่านระบบ TripDee
                      </p>
                    </div>
                    <div className="flex items-baseline gap-2 bg-[#F8FAFC] dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 shrink-0">
                      <span className="text-3xl font-extrabold font-mono text-slate-950 dark:text-white">
                        —
                      </span>
                      <span className="text-xs text-slate-500 font-medium">ยังไม่มีรีวิว</span>
                    </div>
                  </div>

                  <div className="p-4 bg-[#F8FAFC] dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-500">
                    ยังไม่มีรีวิวจากผู้โดยสารที่จองและใช้บริการผ่านระบบ TripDee
                  </div>
                </div>
              </div>
            )}

            {/* 7. Primary Action Command Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#06C755] text-[22px]">
                  cloud_done
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-950 dark:text-white">
                    การเปลี่ยนแปลงล่าสุดถูกบันทึกชั่วคราวแล้ว
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    กดบันทึกเพื่อให้อัปเดตสถานะขึ้นเว็บไซต์จริงและแอปพลิเคชันทันที
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={logout}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>ออกจากระบบ</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className={`px-8 py-2.5 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer ${
                    saveSuccess
                      ? 'bg-[#06C755]'
                      : isSaving
                      ? 'bg-slate-700'
                      : 'bg-slate-950 hover:bg-slate-800'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="h-4 w-4" strokeWidth={3} />
                      <span>บันทึกเรียบร้อย!</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      <span>บันทึกการแก้ไขทั้งหมด</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 8. Danger Zone & Privacy PDPA Module */}
            <section className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/60 p-6 shadow-xs mb-12">
              <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[26px]">gavel</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg text-rose-600 font-bold">
                        โซนอันตรายและการจัดการข้อมูลส่วนบุคคล (PDPA)
                      </h3>
                      <span className="bg-rose-600 text-white font-mono text-[10px] px-2 py-0.2 font-bold uppercase">
                        DANGER ZONE
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                      หากคุณต้องการหยุดให้บริการถาวร คุณสามารถส่งคำขอลบข้อมูลรถ หมายเลขโทรศัพท์
                      และประวัติทั้งหมดของคุณออกจากฐานข้อมูล TripDee อย่างถาวร ข้อมูลจะไม่สามารถกู้คืนได้ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล
                      พ.ศ. 2562
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-xs shrink-0 self-stretch md:self-auto justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                  <span>ขอลบบัญชีและทำลายข้อมูล</span>
                </button>
              </div>
            </section>

            {/* Confirmation Modal for Delete */}
            {deleteConfirmOpen && (
              <div className="fixed inset-0 z-500 flex items-center justify-center bg-black/70 p-4 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 border border-rose-400 p-6 max-w-md w-full shadow-2xl space-y-4">
                  <div className="flex items-center gap-3 text-rose-600">
                    <span className="material-symbols-outlined text-[28px]">warning</span>
                    <h4 className="font-bold text-base">ยืนยันการลบบัญชีคนขับอย่างถาวร</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีและทำลายข้อมูลรถยนต์ทั้งหมดออกจากระบบ TripDee?
                    การดำเนินการนี้จะไม่สามารถกู้คืนได้
                  </p>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmOpen(false)}
                      className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setDeleteConfirmOpen(false);
                        await deleteAccount();
                        window.location.href = '/';
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      ยืนยันลบข้อมูลถาวร
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
