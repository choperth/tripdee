'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  ExternalLink,
  Star,
  QrCode,
  Download,
  Copy,
  Check,
  Share2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Send,
  ShieldCheck,
  Tv,
  Luggage,
  Users,
  Award,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { Vehicle } from '@/data/mockData';
import { vehicleTitle, vehicleLocation, vehicleAmenities } from '@/data/vehicleI18n';
import { getPublicDriverName, maskPlateNumber } from '@/lib/privacy';
import { formatLineLink } from '@/lib/contactUtils';
import { generateQrMatrix, renderQrSvgPath } from '@/lib/qrCode';
import { getBangkokTodayIso } from '@/lib/availabilityUtils';
import { fetchVehicleReviews, Review } from '@/lib/reviewsStore';
import { useLanguage } from '@/context/LanguageContext';
import { useAnalytics } from '@/context/AnalyticsContext';

export interface DriverBusinessCardViewProps {
  vehicle: Vehicle;
  isModal?: boolean;
  onClose?: () => void;
}

export const DriverBusinessCardView: React.FC<DriverBusinessCardViewProps> = ({
  vehicle,
  isModal = false,
  onClose = () => {},
}) => {
  const { t, locale } = useLanguage();
  const { trackCall } = useAnalytics();

  // Driver meta, straight from the vehicle record.
  // No fallback contact details: a missing LINE id or plate must not be
  // filled with another driver's real values, and this card is exported as a
  // vCard into the customer's phone.
  const publicName = getPublicDriverName(vehicle.driverName, vehicle.driverNickname);
  const driverNick = vehicle.driverNickname || publicName.split(' ')[0] || '';
  const cleanPhone = vehicle.driverPhone?.replace(/\D/g, '') || '';
  const displayPhone = vehicle.driverPhone || '';
  const lineId = vehicle.driverLine || '';
  const cleanPlate = vehicle.plateNumber ? maskPlateNumber(vehicle.plateNumber) : '';
  const title = vehicleTitle(vehicle, locale);
  const location = vehicleLocation(vehicle, locale);
  const rating = vehicle.rating;
  const reviewCount = vehicle.reviewCount ?? 0;
  const hasRating = typeof rating === 'number' && reviewCount > 0;
  // Derived from the vehicle id so it is stable for a given vehicle; there is
  // no separate issued driver code in the database yet.
  const driverCode = `DRV-${(vehicle.region || 'CM').toUpperCase()}-${vehicle.id.replace(/[^0-9]/g, '').slice(-5) || vehicle.id.slice(-5).toUpperCase()}`;

  // Interactive Fare Calculator State
  const [selectedRouteKey, setSelectedRouteKey] = useState('city');
  const [startDate, setStartDate] = useState(() =>
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [daysCount, setDaysCount] = useState(3);
  const [passengers, setPassengers] = useState('5-7');
  const [copiedLink, setCopiedLink] = useState(false);

  // Zone rates come from the vehicle record, not a fixed price list.
  const zoneRates = vehicle.zoneRates;
  const routeRates: Record<string, { label: string; price: number | null }> = {
    city: { label: 'ในเมืองเชียงใหม่ / แม่ริม / ม่อนแจ่ม', price: zoneRates?.city ?? null },
    inthanon: { label: 'ดอยอินทนนท์ / กิ่วแม่ปาน / แม่แจ่ม', price: zoneRates?.highHill ?? null },
    chiangdao: { label: 'เชียงดาว / เมืองคอง / ดอยอ่างขาง', price: zoneRates?.midHill ?? null },
    pai: { label: 'ทริปข้ามจังหวัด: ปาย - แม่ฮ่องสอน', price: zoneRates?.crossProvince ?? null },
    chiangrai: { label: 'ทริปข้ามจังหวัด: เชียงราย - สามเหลี่ยมทองคำ', price: zoneRates?.crossProvince ?? null },
    custom: { label: 'กำหนดเส้นทางเอง / จัดทริปตามใจชอบ', price: null },
  };

  const currentRate = routeRates[selectedRouteKey] || routeRates.city;
  const estimatedTotal = currentRate.price !== null ? currentRate.price * daysCount : null;

  // Images: use what the driver uploaded, nothing else.
  const vehicleImages = Array.isArray(vehicle.images) ? vehicle.images.filter(Boolean) : [];
  const heroImage = vehicleImages[0] || null;
  const interiorImage = vehicleImages[1] || null;
  const luggageImage = vehicleImages[2] || null;

  // Availability calendar built from the driver's own busyDates.
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const busyDates = Array.isArray(vehicle.busyDates) ? vehicle.busyDates : [];
  const busySet = useMemo(() => new Set(busyDates), [vehicle.busyDates]);

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayIso = getBangkokTodayIso();

    const cells: ({ iso: string; day: number; isBusy: boolean; isToday: boolean } | null)[] =
      Array.from({ length: firstWeekday }, () => null);

    for (let day = 1; day <= daysInMonth; day++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ iso, day, isBusy: busySet.has(iso), isToday: iso === todayIso });
    }
    return cells;
  }, [calendarMonth, busySet]);

  const calendarLabel = useMemo(() => {
    const monthNamesTh = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
    ];
    const monthNamesEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const m = calendarMonth.getMonth();
    return `${monthNamesTh[m]} ${calendarMonth.getFullYear() + 543} / ${monthNamesEn[m]} ${calendarMonth.getFullYear()}`;
  }, [calendarMonth]);

  // Real reviews for this vehicle, loaded from the database.
  const [cardReviews, setCardReviews] = useState<Review[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchVehicleReviews(vehicle.id).then((loaded) => {
      if (!cancelled) setCardReviews(loaded.slice(0, 3));
    });
    return () => {
      cancelled = true;
    };
  }, [vehicle.id]);


  // vCard generator & download
  const handleDownloadVCard = () => {
    const notes = [
      title,
      cleanPlate ? `ทะเบียน ${cleanPlate}` : '',
      lineId ? `LINE: ${lineId}` : '',
    ]
      .filter(Boolean)
      .join(' ');
    const vcardContent = `BEGIN:VCARD
    VERSION:3.0
    N:${publicName};;;;
    FN:${publicName} (${driverNick})
    ORG:TripDee Driver Network
    TITLE:Chauffeur / Van Operator ${driverCode}
    TEL;TYPE=CELL:${cleanPhone}
    NOTE:${notes}
    URL:${publicCardUrl}
    END:VCARD`;

    const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${driverCode}_vCard.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const publicCardUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/driver/card?id=${encodeURIComponent(vehicle.id)}`;
    }
    return `https://tripdee.co/driver/card?id=${encodeURIComponent(vehicle.id)}`;
  }, [vehicle.id]);

  // A real, scannable code pointing directly to this driver's digital card.
  const qrSvgPath = useMemo(() => {
    try {
      return renderQrSvgPath(generateQrMatrix(publicCardUrl));
    } catch {
      return null;
    }
  }, [publicCardUrl]);

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(publicCardUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareLine = () => {
    if (typeof window === 'undefined') return;
    const shareUrl = encodeURIComponent(publicCardUrl);
    window.open(`https://social-plugins.line.me/lineit/share?url=${shareUrl}`, '_blank');
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lineText =
      `สวัสดีครับ ${driverNick} สนใจสอบถามคิวรถตู้ VIP:\n` +
      `- เส้นทาง: ${currentRate.label}\n` +
      `- เริ่มเดินทาง: ${startDate} (${daysCount} วัน)\n` +
      `- จำนวนผู้โดยสาร: ${passengers} ท่าน\n` +
      (estimatedTotal !== null
        ? `- ยอดประเมินเบื้องต้น: ฿${estimatedTotal.toLocaleString()} บาท\n`
        : `- ขอสอบถามราคาโดยประมาณสำหรับเส้นทางนี้ครับ\n`) +
      `(ติดต่อผ่านนามบัตรดิจิทัล TripDee ${driverCode})`;

    if (!lineId) {
      alert('คนขับยังไม่ได้ระบุ LINE ID กรุณาติดต่อผ่านเบอร์โทรศัพท์แทน');
      return;
    }
    const targetUrl = formatLineLink(lineId, lineText);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`relative flex flex-col w-full ${isModal ? 'max-w-[1280px] max-h-[96vh] overflow-y-auto' : 'max-w-5xl mx-auto min-h-screen my-4 sm:my-8'} rounded-none bg-[#f8fafc] dark:bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-slate-100`}>
        {/* Top Header Scrim */}
        <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-950 dark:text-white uppercase tracking-tight">TripDee</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="font-semibold text-slate-600 dark:text-slate-400">นามบัตรดิจิทัลคนขับ (Digital Business Card)</span>
            <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#fef3c7] text-[#d97706] text-[10px] font-bold">
              ดีลตรงเจ้าของรถ
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#e8f9ee] text-[#06c755] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#06c755] animate-pulse"></span>
              <span>เปิดรับงานคิวว่างวันนี้</span>
            </div>

            {isModal ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="ปิดหน้าต่างนามบัตร"
                className="w-8 h-8 rounded-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 grid place-items-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>กลับหน้าหลัก</span>
              </Link>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 1: HERO BUSINESS CARD PANEL */}
        {/* ============================================================== */}
        <section className="w-full p-4 sm:p-6 lg:p-8 bg-[#f8fafc] dark:bg-slate-950">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
            {/* Top Monolithic Accent Gradient Bar */}
            <div className="h-2 w-full bg-gradient-to-r from-slate-950 via-[#0d1c32] to-[#fea619]"></div>

            <div className="p-5 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 overflow-hidden relative shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDz488179DjzHie7dsIiRrYrw0yXZoErZifBiDXQ3IerK4d_-WxciLdb2JECxzGg_fa-LKEe7TZyJrik0apwNik09UANoVQgev_NflQ0x2FKmPOFyTYJHBhO08DMDA3lWtzsBZa7ZrguGFeVxTCK2lTaaJPz-W6pfPiNHPCsMq12W1_FZkenqaF2GN311lA2mu8x8Swj5PIhY3jmx4_clFCMJ4cI3ev7ltlJziYiTzzqMripFPjngSCAQ"
                        alt={`ภาพถ่ายคนขับ ${publicName}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-slate-950 text-white px-1.5 py-0.5 text-[10px] tracking-wider uppercase font-bold border border-white">
                      VIP CNX
                    </div>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-[#fef3c7] text-[#d97706] text-xs font-bold tracking-tight inline-flex items-center gap-1 border border-amber-300">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        VERIFIED DRIVER 100%
                      </span>
                      <span className="px-2 py-0.5 bg-[#e8f9ee] text-[#06c755] text-xs font-semibold border border-emerald-200">
                        ป้ายเหลือง 30 ถูกกฎหมาย
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight flex flex-wrap items-baseline gap-2">
                      <span>{publicName}</span>
                      <span className="text-sm sm:text-base text-slate-500 font-semibold">({driverNick})</span>
                    </h1>

                    <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
                      <span>รหัส: <strong className="text-slate-950 dark:text-white font-bold">{driverCode}</strong></span>
                      {vehicle.plateNumber && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>ทะเบียน {cleanPlate}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trust Meta Pillars — only figures backed by real records */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="flex flex-col items-center justify-center p-2">
                    {hasRating ? (
                      <>
                        <div className="flex items-center gap-1 text-[#fea619]">
                          <span className="text-lg font-bold text-slate-950 dark:text-white">{rating}</span>
                          <span className="material-symbols-outlined text-[18px]">star</span>
                        </div>
                        <span className="text-[11px] text-slate-500">จากผู้โดยสารจริง {reviewCount} รีวิว</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-bold text-slate-400 dark:text-slate-500">—</span>
                        <span className="text-[11px] text-slate-500">ยังไม่มีรีวิว</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center p-2 border-l border-slate-200 dark:border-slate-700">
                    {vehicle.seats ? (
                      <>
                        <span className="text-lg font-bold text-slate-950 dark:text-white">{vehicle.seats} ที่นั่ง</span>
                        <span className="text-[11px] text-slate-500">ความจุโดยสาร</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-bold text-slate-400 dark:text-slate-500">—</span>
                        <span className="text-[11px] text-slate-500">ยังไม่ระบุที่นั่ง</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center p-2 border-l border-slate-200 dark:border-slate-700">
                    {vehicle.plateType ? (
                      <>
                        <span className="text-lg font-bold text-slate-950 dark:text-white">
                          {vehicle.plateType === 'yellow' ? 'ป้ายเหลือง' : 'ป้ายขาว'}
                        </span>
                        <span className="text-[11px] text-slate-500">ประเภทป้ายทะเบียน</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-bold text-slate-400 dark:text-slate-500">—</span>
                        <span className="text-[11px] text-slate-500">ยังไม่ระบุป้าย</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center p-2 border-l border-slate-200 dark:border-slate-700">
                    <span className="text-lg font-bold text-[#d97706]">ดีลตรง</span>
                    <span className="text-[11px] text-slate-500">ไม่ผ่านคนกลาง</span>
                  </div>
                </div>

                {/* Location & Coverage */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-950 dark:text-white">
                    <span className="material-symbols-outlined text-[#fea619] text-[20px]">explore</span>
                    <span>สถานีประจำการ & เส้นทางชำนาญการพิเศษ</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {(vehicle.popularRoutes?.length ? vehicle.popularRoutes : [location])
                      .filter(Boolean)
                      .map((tag, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs">
                          {tag}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Value Propositions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/40 p-3 border border-slate-200 dark:border-slate-700">
                    <span className="material-symbols-outlined text-[#06c755] text-[20px] shrink-0 mt-0.5">verified_user</span>
                    <div>
                      <span className="font-bold text-slate-950 dark:text-white block">ผ่านตรวจประวัติอาชญากรรม ตร.</span>
                      <span className="text-slate-500 text-[11px]">ตรวจสอบความปลอดภัยระดับประวัติอาชญากรรม 100%</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/40 p-3 border border-slate-200 dark:border-slate-700">
                    <span className="material-symbols-outlined text-[#fea619] text-[20px] shrink-0 mt-0.5">receipt_long</span>
                    <div>
                      <span className="font-bold text-slate-950 dark:text-white block">ออกใบกำกับภาษีเต็มรูปแบบได้</span>
                      <span className="text-slate-500 text-[11px]">รองรับองค์กร B2B หัก ณ ที่จ่าย 3% ถูกต้อง</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Direct Contact & QR Box (5 Cols) */}
              <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 p-5 sm:p-6 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-950 dark:text-white text-[22px]">contact_phone</span>
                      <h3 className="text-xs uppercase tracking-wider text-slate-950 dark:text-white font-bold">
                        Digital Business Card
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-950 text-white font-mono text-[10px] uppercase font-bold tracking-widest">
                      DIRECT DEAL
                    </span>
                  </div>

                  {/* Direct Contact Actions */}
                  <div className="space-y-3">
                    <a
                      href={`tel:${cleanPhone}`}
                      onClick={() =>
                        trackCall({
                          targetType: 'driver_card',
                          targetId: vehicle.id,
                          targetTitle: `${publicName} (${title})`,
                          phoneNumber: cleanPhone,
                          driverName: publicName,
                        })
                      }
                      className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-950 hover:bg-slate-800 text-white transition-colors text-left group shadow-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/10 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[#fea619] text-[22px]">call</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-300 block uppercase tracking-wide">
                            โทรติดต่อ{driverNick}โดยตรง (สายด่วน 24 ชม.)
                          </span>
                          <span className="text-base font-bold font-mono tracking-wide text-white group-hover:text-amber-200 transition-colors">
                            {displayPhone}
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-white text-[20px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </a>

                    {/* International channels only appear when the driver
                        actually supplied them. */}
                    {lineId && (
                      <a
                        href={formatLineLink(lineId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-between px-4 py-3 bg-[#06c755] hover:brightness-105 text-white transition-all shadow-xs cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-white/20 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-white text-[22px]">chat</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-emerald-100 block uppercase tracking-wide">
                              คุยไลน์ส่งโปรแกรมเที่ยว & นัดหมาย
                            </span>
                            <span className="text-xs font-bold tracking-wide">LINE ID: {lineId}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-white text-[#06c755] text-xs font-bold">ทักแชท</span>
                      </a>
                    )}

                    {(vehicle.driverWhatsapp || vehicle.driverWechat || vehicle.driverKakao) && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                        {vehicle.driverWhatsapp && (
                          <a
                            href={`https://wa.me/${vehicle.driverWhatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px] text-[#06c755]">forum</span>
                            <span>WhatsApp</span>
                          </a>
                        )}
                        {vehicle.driverWechat && (
                          <button
                            type="button"
                            onClick={() => alert(`WeChat ID คนขับ: ${vehicle.driverWechat}`)}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px] text-slate-950 dark:text-white">chat_bubble</span>
                            <span>WeChat</span>
                          </button>
                        )}
                        {vehicle.driverKakao && (
                          <button
                            type="button"
                            onClick={() => alert(`KakaoTalk ID คนขับ: ${vehicle.driverKakao}`)}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px] text-[#FEE500]">chat</span>
                            <span>KakaoTalk</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code Card & Download vCard Container */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-slate-950 p-1.5 shrink-0 flex items-center justify-center">
                      <div className="w-full h-full bg-white p-1 flex items-center justify-center relative">
                        {qrSvgPath ? (
                          <svg
                            className="w-full h-full fill-current text-slate-950"
                            viewBox="0 0 100 100"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d={qrSvgPath} />
                          </svg>
                        ) : (
                          <span className="material-symbols-outlined text-slate-300 text-[20px]">qr_code_2</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-950 dark:text-white">สแกนบันทึกนามบัตรดิจิทัล</h4>
                      <p className="text-[11px] text-slate-500 leading-snug">บันทึกลงสมุดโทรศัพท์ (vCard) พร้อมลิงก์ไลน์คนขับได้ทันที</p>
                      <div className="flex items-center gap-2 pt-1 text-[11px]">
                        <span className="inline-flex items-center text-[#06c755] font-semibold gap-1">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span> vCard 3.0
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400">iOS / Android</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={handleDownloadVCard}
                      className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-slate-900 dark:text-white transition-colors flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">download</span>
                      <span>บันทึก (.vcf)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-slate-900 dark:text-white transition-colors flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">content_copy</span>
                      <span>{copiedLink ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleShareLine}
                      className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-[#06c755] transition-colors flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">share</span>
                      <span>แชร์ LINE</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 2: REAL VEHICLE SHOWCASE & GALLERY */}
        {/* ============================================================== */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-6 bg-[#f8fafc] dark:bg-slate-950">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 bg-[#fea619]"></span>
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">VERIFIED VEHICLE PROFILE</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white tracking-tight">
                  พาหนะประจำตัว: {title}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  รถจริงตรงปก 100% เบาะนวดไฟฟ้าพร้อมระบบแอร์ Microbus กระจายความเย็นรอบคัน
                </p>
              </div>

              <div className="flex items-center gap-3">
                {cleanPlate && (
                  <span className="font-mono text-xs px-3 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                    ทะเบียน {cleanPlate}
                  </span>
                )}
                {vehicle.isVerified && (
                  <span className="px-2.5 py-1 bg-[#e8f9ee] text-[#06c755] text-xs font-bold border border-emerald-200">
                    ผ่านการตรวจสอบโดย TripDee
                  </span>
                )}
              </div>
            </div>

            {/* Bento Mosaic Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="aspect-[16/10] w-full relative">
                  {heroImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={heroImage}
                      alt={`ภาพภายนอกตัวรถ ${title}`}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 p-4 text-center">
                      คนขับยังไม่ได้เพิ่มรูปภาพรถ
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-slate-950 text-white px-3 py-1 text-xs font-semibold">
                    ภาพภายนอกตัวรถจริง (Exterior 360°)
                  </div>
                  {title && (
                    <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono">
                      {title}
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
                <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="aspect-[16/10] md:aspect-[16/9.5] w-full relative">
                    {interiorImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={interiorImage}
                        alt="ห้องโดยสาร VIP"
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 p-4 text-center">
                        ยังไม่มีรูปห้องโดยสาร
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-slate-950/90 text-white px-2.5 py-0.5 text-[11px] font-bold">
                      เบาะนวดไฟฟ้าระดับ First Class
                    </div>
                  </div>
                </div>

                <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="aspect-[16/10] md:aspect-[16/9.5] w-full relative">
                    {luggageImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={luggageImage}
                        alt="พื้นที่กระเป๋าสัมภาระ"
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 p-4 text-center">
                        ยังไม่มีรูปพื้นที่เก็บสัมภาระ
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-slate-950/90 text-white px-2.5 py-0.5 text-[11px] font-bold">
                      พื้นที่วางกระเป๋าเดินทางขนาดใหญ่ (5-7 ใบ)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Technical Specifications Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-950 dark:text-white">
                  <span className="material-symbols-outlined text-[24px]">airline_seat_recline_extra</span>
                </div>
                <h4 className="font-bold text-slate-950 dark:text-white">{vehicle.seats || 9} ที่นั่ง VIP เบาะใหญ่พิเศษ</h4>
                <p className="text-slate-500 leading-relaxed">
                  ผังที่นั่ง 3 แถว ระยะห่างวางขา Legroom กว้างพิเศษ เบาะปรับเอนนอน 150 องศา พร้อมระบบนวดไฟฟ้า
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-950 dark:text-white">
                  <span className="material-symbols-outlined text-[24px]">luggage</span>
                </div>
                <h4 className="font-bold text-slate-950 dark:text-white">พื้นที่จุสัมภาระขนาดใหญ่</h4>
                <p className="text-slate-500 leading-relaxed">
                  รองรับกระเป๋าเดินทาง 28 นิ้วได้ 5-6 ใบ หรือขนาด 24 นิ้วได้ถึง 8 ใบ พร้อมช่องเก็บของสัมภาระส่วนตัว
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-950 dark:text-white">
                  <span className="material-symbols-outlined text-[24px]">tv_gen</span>
                </div>
                <h4 className="font-bold text-slate-950 dark:text-white">ความบันเทิง & ชาร์จไฟครบครัน</h4>
                <p className="text-slate-500 leading-relaxed">
                  สมาร์ททีวี Android 24 นิ้ว คาราโอเกะ ไวไฟ 5G พร้อมช่องชาร์จ Type-C & USB ทุกที่นั่ง และปลั๊กไฟ 220V
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#06c755]">
                  <span className="material-symbols-outlined text-[24px]">shield_with_heart</span>
                </div>
                <h4 className="font-bold text-slate-950 dark:text-white">ความปลอดภัยและประกันภัย</h4>
                <p className="text-slate-500 leading-relaxed">
                  ป้ายเหลือง 30 ถูกต้อง, GPS ตรวจจับความเร็ว DLT 24 ชม., ประกันภัยผู้โดยสารชั้น 1 สูงสุด 1,000,000 บาท/ที่นั่ง
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 3: AVAILABILITY CALENDAR & ROUTE FARE CALCULATOR */}
        {/* ============================================================== */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-6 bg-[#f8fafc] dark:bg-slate-950">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Monthly availability calendar, driven by vehicle.busyDates */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-[#06c755] text-[20px]">calendar_month</span>
                    <h3 className="text-base font-bold text-slate-950 dark:text-white">ปฏิทินคิวงาน{driverNick}</h3>
                  </div>
                  <p className="text-xs text-slate-500">ตรวจสอบวันที่คิวว่างเพื่อวางแผนการเดินทางล่วงหน้า</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                    aria-label="เดือนก่อนหน้า"
                    className="w-7 h-7 grid place-items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  </button>
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 px-3 py-1 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono whitespace-nowrap">
                    <span>{calendarLabel}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                    aria-label="เดือนถัดไป"
                    className="w-7 h-7 grid place-items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Calendar Legend */}
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                  <span className="w-3 h-3 bg-white border border-[#06c755] text-[#06c755] flex items-center justify-center font-bold text-[9px]">●</span>
                  <span>คิ��ว่างพร้อมรับงาน</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-3 h-3 bg-slate-100 border border-slate-300 text-slate-400 flex items-center justify-center text-[10px]">✕</span>
                  <span>ติดงานแล้ว (Booked)</span>
                </span>
                <span className="flex items-center gap-1.5 text-[#d97706] font-semibold">
                  <span className="w-3 h-3 bg-[#fef3c7] border border-[#d97706]"></span>
                  <span>วันนี้ (Today)</span>
                </span>
              </div>

              {/* Calendar Table Grid */}
              <div className="border border-slate-200 dark:border-slate-800 text-center font-mono text-xs">
                <div className="grid grid-cols-7 font-bold py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <div className="text-rose-600">อา.</div>
                  <div>จ.</div>
                  <div>อ.</div>
                  <div>พ.</div>
                  <div>พฤ.</div>
                  <div>ศ.</div>
                  <div className="text-slate-950 dark:text-white">ส.</div>
                </div>

                <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {calendarCells.map((cell, idx) =>
                    cell ? (
                      <div
                        key={cell.iso}
                        className={`p-2 ${
                          cell.isToday
                            ? 'bg-[#fef3c7] border-2 border-[#d97706] text-slate-950 font-bold'
                            : cell.isBusy
                              ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400'
                              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold hover:bg-[#e8f9ee] transition-colors'
                        }`}
                      >
                        <span className="block">{cell.day}</span>
                        <span
                          className={`text-[9px] block ${
                            cell.isToday
                              ? 'text-[#d97706] font-bold'
                              : cell.isBusy
                                ? ''
                                : 'text-[#06c755]'
                          }`}
                        >
                          {cell.isBusy ? 'ติดงาน' : cell.isToday ? 'วันนี้' : 'ว่าง'}
                        </span>
                      </div>
                    ) : (
                      <div key={`pad-${idx}`} className="p-2.5 bg-slate-50/50" />
                    )
                  )}
                </div>
              </div>

              {busyDates.length > 0 ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>วันที่คนขับระบุว่าติดงานอยู่ {busyDates.length} วัน</span>
                  <span className="font-bold text-slate-950 dark:text-white shrink-0">
                    อัปเดตล่าสุดจากข้อมูลในระบบ
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                  คนขับยังไม่ได้ระบุวันที่ติดงาน ปฏิทินจึงแสดงทุกวันว่าง
                  กรุณาสอบถามยืนยันกับคนขับก่อนวางแผนการเดินทาง
                </div>
              )}
            </div>

            {/* Quick Route Inquiry & Fare Estimator (5 Cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-xs uppercase tracking-wider text-[#d97706] font-bold block mb-1">INSTANT INQUIRY</span>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">เช็คคิวรถ & ประเมินราคาทริปกับ{driverNick}</h3>
                <p className="text-xs text-slate-500 mt-0.5">ระบุวันเดินทางและเส้นทาง ระบบจะสร้างข้อความสรุปพร้อมส่งเข้า LINE ให้ทันที</p>
              </div>

              <form onSubmit={handleInquirySubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">จุดหมาย / เส้นทางท่องเที่ยวหลัก</label>
                  <select
                    value={selectedRouteKey}
                    onChange={(e) => setSelectedRouteKey(e.target.value)}
                    className="w-full h-11 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 text-slate-900 dark:text-white focus:outline-none focus:border-slate-950 cursor-pointer"
                  >
                    {Object.entries(routeRates).map(([k, val]) => (
                      <option key={k} value={k}>
                        {val.label}
                        {val.price !== null ? ` (฿${val.price.toLocaleString()} / วัน)` : ' (สอบถามราคา)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block">วันที่เริ่มเดินทาง</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-11 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block">จำนวนวันเดินทาง</label>
                    <select
                      value={daysCount}
                      onChange={(e) => setDaysCount(Number(e.target.value))}
                      className="w-full h-11 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value={1}>1 วัน (ไปเช้า-เย็นกลับ)</option>
                      <option value={2}>2 วัน 1 คืน</option>
                      <option value={3}>3 วัน 2 คืน</option>
                      <option value={4}>4 วัน 3 คืน</option>
                      <option value={5}>5 วันขึ้นไป</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">จำนวนผู้โดยสารโดยประมาณ</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['1-4', '5-7', '8-9'].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setPassengers(count)}
                        className={`py-2 px-3 border text-center font-semibold transition-colors cursor-pointer ${
                          passengers === count
                            ? 'bg-slate-950 text-white border-slate-950'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {count} ท่าน
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculation summary */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>อัตราค่าบริการคนขับ + รถตู้ VIP:</span>
                    <span className="font-mono font-bold text-slate-950 dark:text-white">
                      {currentRate.price !== null ? `฿${currentRate.price.toLocaleString()} / วัน` : 'ยังไม่ระบุ'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>ระยะเวลาการใช้งาน:</span>
                    <span className="font-mono font-bold text-slate-950 dark:text-white">{daysCount} วัน</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>ค่าบริการ TripDee:</span>
                    <span className="font-mono font-bold text-[#06c755]">฿0 (ไม่มีบวกเพิ่ม)</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex items-baseline justify-between">
                    <div>
                      <span className="font-bold text-slate-950 dark:text-white block text-sm">ยอดประเมินรวม</span>
                      <span className="text-[10px] text-slate-400">*ไม่รวมค่าน้ำมันและค่าผ่านทางตามจริง</span>
                    </div>
                    <div className="text-right">
                      {estimatedTotal !== null ? (
                        <>
                          <span className="text-2xl font-bold font-mono text-slate-950 dark:text-white">
                            ฿{estimatedTotal.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-slate-500 block">บาท</span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                            สอบถามคนขับ
                          </span>
                          <span className="text-[11px] text-slate-500 block">คนขับยังไม่ได้ระบุราคา</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-[#06c755] hover:brightness-105 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer text-xs sm:text-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                  <span>ส่งข้อมูลเช็คคิวตรงกับ{driverNick}ผ่าน LINE</span>
                </button>
                <p className="text-[11px] text-center text-slate-400">
                  ระบบจะเปิดแอป LINE พร้อมข้อความรายละเอียดทริป เพื่อให้คนขับตอบคอนเฟิร์มภายใน 3 นาที
                </p>
              </form>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 4: SERVICE RATES & STANDARD POPULAR ROUTES */}
        {/* ============================================================== */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-6 bg-[#f8fafc] dark:bg-slate-950">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 bg-[#06c755]"></span>
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">TRANSPARENT DIRECT RATES</span>
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">อัตราค่าบริการมาตรฐานคนขับ</h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold">จ่ายเงินสดหรือโอนตรงเข้าบัญชีคนขับเมื่อสิ้นสุดวัน</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <span className="font-mono text-[10px] text-slate-400 block uppercase">ROUTE TIER 01</span>
                <h4 className="font-bold text-slate-950 dark:text-white text-sm">เมืองเชียงใหม่ & แม่ริม</h4>
                <p className="text-slate-500 text-[11px]">ม่อนแจ่ม, ปางช้างแม่สา, สวนสิริกิติ์, คาเฟ่หางดง, ไนท์ซาฟารี</p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xl font-bold font-mono text-slate-950 dark:text-white">
                    {zoneRates?.city != null ? (
                      <>
                        ฿{zoneRates.city.toLocaleString()}{' '}
                        <span className="text-xs text-slate-400 font-normal">/ วัน</span>
                      </>
                    ) : (
                      <span className="text-base text-amber-600 dark:text-amber-400">ยังไม่ระบุราคา</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">ให้บริการ 10-12 ชม./วัน • ฟรีน้ำดื่มผ้าเย็น</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <span className="font-mono text-[10px] text-[#d97706] block uppercase font-bold">ROUTE TIER 02 • ยอดนิยม</span>
                <h4 className="font-bold text-slate-950 dark:text-white text-sm">ดอยอินทนนท์ / เชียงดาว</h4>
                <p className="text-slate-500 text-[11px]">ยอดดอยอินทนนท์, กิ่วแม่ปาน, ป่าบงเปียง, อ่างขาง, สันป่าเกี๊ยะ</p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xl font-bold font-mono text-slate-950 dark:text-white">
                    {zoneRates?.highHill != null ? (
                      <>
                        ฿{zoneRates.highHill.toLocaleString()}{' '}
                        <span className="text-xs text-slate-400 font-normal">/ วัน</span>
                      </>
                    ) : (
                      <span className="text-base text-amber-600 dark:text-amber-400">ยังไม่ระบุราคา</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">ชำนาญทางโค้งลาดชันสูง • แนะนำจุดชมวิว</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <span className="font-mono text-[10px] text-slate-400 block uppercase">ROUTE TIER 03</span>
                <h4 className="font-bold text-slate-950 dark:text-white text-sm">ปาย - แม่ฮ่องสอน / เชียงราย</h4>
                <p className="text-slate-500 text-[11px]">ปาย 762 โค้ง, บ้านรักไทย, ปางอุ๋ง, วัดร่องขุ่น, สิงห์ปาร์ค, ดอยตุง</p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xl font-bold font-mono text-slate-950 dark:text-white">
                    {zoneRates?.crossProvince != null ? (
                      <>
                        ฿{zoneRates.crossProvince.toLocaleString()}{' '}
                        <span className="text-xs text-slate-400 font-normal">/ วัน</span>
                      </>
                    ) : (
                      <span className="text-base text-amber-600 dark:text-amber-400">ยังไม่ระบุราคา</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">ขับนุ่มนวล ไม่เมารถ • พักค้างคืนต่างจังหวัด</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-5 space-y-3">
                <span className="font-mono text-[10px] text-slate-950 dark:text-white block uppercase font-bold">CORPORATE B2B</span>
                <h4 className="font-bold text-slate-950 dark:text-white text-sm">คาราวานสัมมนา & องค์กร</h4>
                <p className="text-slate-500 text-[11px]">รับส่งสนามบิน, ศึกษาดูงานหน่วยงานราชการและบริษัทเอกชน</p>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-xl font-bold font-mono text-slate-950 dark:text-white">e-Tax เต็มรูป</div>
                  <span className="text-[11px] text-slate-400 block mt-1">หัก 3% ถูกต้อง • เครือข่ายฟลีทถึง 10 คัน</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 5: REVIEWS FROM REAL PASSENGERS */}
        {/* ============================================================== */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-6 bg-[#f8fafc] dark:bg-slate-950">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#fea619] text-[20px]">rate_review</span>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">
                  เสียงตอบรับจากผู้โดยสาร ({reviewCount} รีวิว)
                </h3>
              </div>
              {hasRating && (
                <div className="flex items-center gap-2 font-mono font-bold text-xs text-[#fea619]">
                  <span>
                    ★ {rating} / 5.0
                  </span>
                </div>
              )}
            </div>

            {cardReviews.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center shadow-xs">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[36px]">
                  rate_review
                </span>
                <p className="text-sm font-bold text-slate-950 dark:text-white mt-2">
                  ยังไม่มีรีวิวสำหรับรถคันนี้
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  รีวิวจะปรากฏที่นี่เมื่อมีผู้โดยสารเขียนรีวิวหลังใช้บริการ
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {cardReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[#fea619] font-bold">
                      <span>
                        {'★'.repeat(Math.max(1, Math.min(5, Math.round(rev.rating))))}
                      </span>
                      {rev.travelDate && (
                        <span className="text-slate-400 font-normal text-[11px]">
                          {rev.travelDate}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                      &quot;{rev.comment}&quot;
                    </p>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {rev.authorName}
                      </span>
                      {rev.verifiedTrip && (
                        <span className="px-2 py-0.5 bg-[#e8f9ee] text-[#06c755] text-[10px] font-bold shrink-0">
                          VERIFIED RIDER
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Sticky Floating Bottom Bar */}
        <div className="sticky bottom-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-3 px-4 sm:px-6 shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-slate-950 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {driverNick.charAt(0)}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                {publicName} ({driverNick})
              </span>
              <span className="text-[11px] text-slate-500 block truncate">
                {[title, cleanPlate ? `ทะเบียน ${cleanPlate}` : ''].filter(Boolean).join(' • ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs">
            {displayPhone && (
              <a
                href={`tel:${cleanPhone}`}
                className="inline-flex items-center gap-1 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold transition-colors shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">call</span>
                <span>โทร {displayPhone}</span>
              </a>
            )}
            {lineId && (
              <a
                href={formatLineLink(lineId)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3.5 py-2 bg-[#06c755] hover:brightness-105 text-white font-bold transition-all shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span>คุยไลน์ทันที</span>
              </a>
            )}
          </div>
        </div>
      </div>
  );
};
