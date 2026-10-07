'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { VEHICLES, Vehicle, ZONE_RATE_CARDS } from '@/data/mockData';
import { vehicleTitle } from '@/data/vehicleI18n';
import { getPublicDriverName, maskPlateNumber } from '@/lib/privacy';
import { formatLineLink } from '@/lib/contactUtils';
import { isMockDataEnabled, isMockEnvEnabled } from '@/lib/mockConfig';
import { useLanguage } from '@/context/LanguageContext';
import { useAnalytics } from '@/context/AnalyticsContext';

export default function DriverBusinessCardPage() {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const qId = params.get('id') || params.get('vehicleId');

    if (!qId) {
      queueMicrotask(() => {
        if (active) setStatus('missing');
      });
      return () => {
        active = false;
      };
    }

    const demoMatch = () => (isMockDataEnabled() ? VEHICLES.find((v) => v.id === qId) || null : null);

    fetch('/api/vehicles' + window.location.search)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load vehicles');
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        const list: Vehicle[] = Array.isArray(data.vehicles) ? data.vehicles : [];
        const match = list.find((v) => v.id === qId) || demoMatch();
        setVehicle(match);
        setStatus(match ? 'ready' : 'missing');
      })
      .catch(() => {
        if (!active) return;
        const match = demoMatch();
        setVehicle(match);
        setStatus(match ? 'ready' : 'missing');
      });

    return () => {
      active = false;
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-950 text-slate-600 dark:text-slate-300 text-sm font-bold">
        กำลังโหลดนามบัตรคนขับ...
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc] dark:bg-slate-950 px-4 text-center">
        <h1 className="text-lg font-bold text-slate-950 dark:text-white">ไม่พบข้อมูลนามบัตรคนขับ</h1>
        <p className="text-sm text-slate-500 max-w-md">
          ไม่พบข้อมูลรถหรือคนขับที่ตรงกับลิงก์นี้ หรือคนขับอาจยังไม่ได้รับการอนุมัติ กรุณาตรวจสอบลิงก์อีกครั้ง
        </p>
        <Link href="/" className="inline-flex items-center px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-colors">
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  return <DriverBusinessCard matchedVehicle={vehicle} />;
}

function DriverBusinessCard({ matchedVehicle }: { matchedVehicle: Vehicle }) {
  const { locale } = useLanguage();
  const { trackCall } = useAnalytics();
  const showDemoContent = isMockEnvEnabled() && isMockDataEnabled();

  const publicName = getPublicDriverName(matchedVehicle.driverName, matchedVehicle.driverNickname) || 'คนขับ TripDee';
  const driverNick = matchedVehicle.driverNickname || 'คนขับ';
  const cleanPhone = (matchedVehicle.driverPhone || '').replace(/\D/g, '');
  const displayPhone = matchedVehicle.driverPhone || '';
  const lineId = matchedVehicle.driverLine || '';
  const cleanPlate = matchedVehicle.plateNumber ? maskPlateNumber(matchedVehicle.plateNumber) : 'ไม่ระบุ';
  const title = vehicleTitle(matchedVehicle, locale) || matchedVehicle.title || 'รถพร้อมคนขับ';
  const rating = matchedVehicle.rating || 0;
  const reviewCount = matchedVehicle.reviewCount || 0;
  const hasRating = rating > 0 && reviewCount > 0;
  const driverCode = `TD-VN-${(matchedVehicle.id || '').replace(/[^0-9]/g, '').slice(-5) || matchedVehicle.id}`;

  // Interactive Fare Calculator State
  const [selectedRouteKey, setSelectedRouteKey] = useState<string>('city');
  const [startDate, setStartDate] = useState('');
  const [daysCount, setDaysCount] = useState(1);
  const [passengers, setPassengers] = useState('1-4');
  const [copiedLink, setCopiedLink] = useState(false);

  const routeRates = ZONE_RATE_CARDS.map((zone) => ({
    key: zone.id as string,
    label: zone.label,
    price: Number(matchedVehicle.zoneRates?.[zone.id]) || 0,
  }));

  const currentRate = routeRates.find((r) => r.key === selectedRouteKey) || routeRates[0];
  const hasPrice = currentRate.price > 0;
  const estimatedTotal = currentRate.price * daysCount;

  const galleryImages = (Array.isArray(matchedVehicle.images) ? matchedVehicle.images : []).filter(Boolean);

  const handleDownloadVCard = () => {
    const vcardContent = `BEGIN:VCARD
VERSION:3.0
N:${publicName};;;;
FN:${publicName} (${driverNick})
ORG:TripDee Driver Network
TITLE:Chauffeur / Van Operator ${driverCode}
${cleanPhone ? `TEL;TYPE=CELL:${cleanPhone}\n` : ''}NOTE:${title} ทะเบียน ${cleanPlate}${lineId ? ` LINE: ${lineId}` : ''}
URL:${typeof window !== 'undefined' ? window.location.href : 'https://tripdee.co'}
END:VCARD`;

    const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${driverCode}_vCard.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareLine = () => {
    if (typeof window === 'undefined') return;
    const shareUrl = encodeURIComponent(window.location.href);
    window.open(`https://social-plugins.line.me/lineit/share?url=${shareUrl}`, '_blank');
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineId) return;
    const lineText =
      `สวัสดีครับ ${driverNick} สนใจสอบถามคิวรถ:\n` +
      `- เส้นทาง: ${currentRate.label}\n` +
      `- เริ่มเดินทาง: ${startDate || 'ยังไม่ระบุ'} (${daysCount} วัน)\n` +
      `- จำนวนผู้โดยสาร: ${passengers} ท่าน\n` +
      (hasPrice ? `- ยอดประเมินเบื้องต้น: ฿${estimatedTotal.toLocaleString()} บาท\n` : '') +
      `(ติดต่อผ่านนามบัตรดิจิทัล TripDee ${driverCode})`;

    const targetUrl = formatLineLink(lineId, lineText);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-[#f8fafc] dark:bg-slate-950 font-body text-slate-900 dark:text-slate-100 antialiased min-h-screen flex flex-col">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs border-b border-slate-200 dark:border-slate-800">
        <div className="h-16 max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="flex items-center gap-1.5 font-bold text-lg tracking-tight text-slate-950 dark:text-white">
              <span>Trip<span className="text-[#fea619]">Dee</span></span>
            </Link>
            <span className="hidden xl:inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#fef3c7] text-[#d97706] text-xs font-semibold">
              ดีลตรงเจ้าของรถ
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Link href="/" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              รถตู้พร้อมคนขับ
            </Link>
            <Link href="/" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              รถเก๋ง/SUV
            </Link>
            <Link href="/" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              TripBoard
            </Link>
            <Link href="/" className="hover:text-slate-950 dark:hover:text-white transition-colors">
              องค์กร B2B
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {cleanPhone && (
              <a
                href={`tel:${cleanPhone}`}
                className="inline-flex items-center px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
              >
                จองรถตรงกับคนขับ
              </a>
            )}
            <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full pt-16 bg-[#f8fafc] dark:bg-slate-950 flex-1">
        <div className="flex flex-col w-full">
          {/* Top Breadcrumb & Status */}
          <section className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <nav className="flex items-center gap-2 text-slate-500 overflow-x-auto whitespace-nowrap">
                <Link href="/" className="hover:text-slate-950 dark:hover:text-white transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">home</span>
                  <span>หน้าหลัก</span>
                </Link>
                <span>/</span>
                <span className="text-slate-400">ค้นหารถตู้เชียงใหม่</span>
                <span>/</span>
                <span className="text-slate-950 dark:text-white font-semibold">
                  {publicName} ({driverNick}) รหัส {driverCode}
                </span>
              </nav>

              <div className="flex items-center gap-3">
                {matchedVehicle.isAvailable === true && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#e8f9ee] text-[#06c755] font-semibold text-xs border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-[#06c755] animate-pulse"></span>
                    <span>เปิดรับงานคิวว่าง</span>
                  </div>
                )}
                {showDemoContent && (
                  <span className="text-slate-400 text-[11px] hidden sm:inline">อัปเดตสถานะล่าสุด: วันนี้ 09:42 น.</span>
                )}
              </div>
            </div>
          </section>

          {/* Section 1: Business Card Hero */}
          <section className="w-full py-8 lg:py-12">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
                <div className="h-2 w-full bg-gradient-to-r from-slate-950 via-[#0d1c32] to-[#fea619]"></div>

                <div className="p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column (7 Cols) */}
                  <div className="lg:col-span-7 flex flex-col space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                      <div className="relative shrink-0">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 overflow-hidden relative shadow-xs flex items-center justify-center">
                          {showDemoContent ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDz488179DjzHie7dsIiRrYrw0yXZoErZifBiDXQ3IerK4d_-WxciLdb2JECxzGg_fa-LKEe7TZyJrik0apwNik09UANoVQgev_NflQ0x2FKmPOFyTYJHBhO08DMDA3lWtzsBZa7ZrguGFeVxTCK2lTaaJPz-W6pfPiNHPCsMq12W1_FZkenqaF2GN311lA2mu8x8Swj5PIhY3jmx4_clFCMJ4cI3ev7ltlJziYiTzzqMripFPjngSCAQ"
                              alt={`ภาพถ่ายคนขับ ${publicName}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-slate-400 text-[48px]">person</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {matchedVehicle.isVerified && (
                            <span className="px-2.5 py-0.5 bg-[#fef3c7] text-[#d97706] text-xs font-bold tracking-tight inline-flex items-center gap-1 border border-amber-300">
                              <span className="material-symbols-outlined text-[16px]">verified</span>
                              VERIFIED DRIVER
                            </span>
                          )}
                          {matchedVehicle.plateType === 'yellow' && (
                            <span className="px-2 py-0.5 bg-[#e8f9ee] text-[#06c755] text-xs font-semibold border border-emerald-200">
                              ป้ายเหลือง 30 ถูกกฎหมาย
                            </span>
                          )}
                        </div>

                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight flex flex-wrap items-baseline gap-2">
                          <span>{publicName}</span>
                          <span className="text-sm sm:text-base text-slate-500 font-semibold">({driverNick})</span>
                        </h1>

                        <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
                          <span>รหัส: <strong className="text-slate-950 dark:text-white font-bold">{driverCode}</strong></span>
                          <span className="text-slate-300">•</span>
                          <span>ทะเบียน {cleanPlate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Trust Pillars */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-700 text-center">
                      <div className="flex flex-col items-center justify-center p-2">
                        {hasRating ? (
                          <>
                            <div className="flex items-center gap-1 text-[#fea619]">
                              <span className="text-lg font-bold text-slate-950 dark:text-white">{rating}</span>
                              <span className="material-symbols-outlined text-[18px]">star</span>
                            </div>
                            <span className="text-[11px] text-slate-500">ผู้โดยสารจริง {reviewCount} ทริป</span>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-500">ยังไม่มีรีวิว</span>
                        )}
                      </div>

                      {showDemoContent && (
                        <>
                          <div className="flex flex-col items-center justify-center p-2 border-l border-slate-200 dark:border-slate-700">
                            <span className="text-lg font-bold text-slate-950 dark:text-white">14 ปี</span>
                            <span className="text-[11px] text-slate-500">ประสบการณ์ขับขึ้นดอย</span>
                          </div>

                          <div className="flex flex-col items-center justify-center p-2 border-l border-slate-200 dark:border-slate-700">
                            <span className="text-lg font-bold text-[#06c755]">&lt; 3 นาที</span>
                            <span className="text-[11px] text-slate-500">อัตราตอบกลับรวดเร็ว</span>
                          </div>
                        </>
                      )}

                      <div className="flex flex-col items-center justify-center p-2 border-l border-slate-200 dark:border-slate-700">
                        <span className="text-lg font-bold text-[#d97706]">ดีลตรง</span>
                        <span className="text-[11px] text-slate-500">ไม่ผ่านคนกลาง</span>
                      </div>
                    </div>

                    {/* Location & Coverage */}
                    {(matchedVehicle.location || (matchedVehicle.popularRoutes || []).length > 0) && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-950 dark:text-white">
                          <span className="material-symbols-outlined text-[#fea619] text-[20px]">explore</span>
                          <span>สถานีประจำการ & เส้นทางที่ให้บริการ</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {[matchedVehicle.location, ...(matchedVehicle.popularRoutes || [])].filter(Boolean).map((tag, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Value Propositions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {matchedVehicle.isVerified && (
                        <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/40 p-3 border border-slate-200 dark:border-slate-700">
                          <span className="material-symbols-outlined text-[#06c755] text-[20px] shrink-0 mt-0.5">verified_user</span>
                          <div>
                            <span className="font-bold text-slate-950 dark:text-white block">ผ่านการตรวจสอบโดย TripDee</span>
                            <span className="text-slate-500 text-[11px]">ข้อมูลคนขับและรถได้รับการอนุมัติจากทีมงาน</span>
                          </div>
                        </div>
                      )}

                      {matchedVehicle.canIssueTaxInvoice && (
                        <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/40 p-3 border border-slate-200 dark:border-slate-700">
                          <span className="material-symbols-outlined text-[#fea619] text-[20px] shrink-0 mt-0.5">receipt_long</span>
                          <div>
                            <span className="font-bold text-slate-950 dark:text-white block">ออกใบกำกับภาษีเต็มรูปแบบได้</span>
                            <span className="text-slate-500 text-[11px]">รองรับองค์กร B2B หัก ณ ที่จ่าย 3%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column (5 Cols) */}
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

                      <div className="space-y-3">
                        {cleanPhone && (
                          <a
                            href={`tel:${cleanPhone}`}
                            onClick={() =>
                              trackCall({
                                targetType: 'driver_card',
                                targetId: matchedVehicle.id,
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
                                  โทรติดต่อ{driverNick}โดยตรง
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
                        )}

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

                        {!cleanPhone && !lineId && (
                          <p className="text-xs text-slate-500 text-center py-2">คนขับยังไม่ได้ระบุช่องทางติดต่อ</p>
                        )}

                        {(matchedVehicle.driverWhatsapp || matchedVehicle.driverWechat) && (
                          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                            {matchedVehicle.driverWhatsapp && (
                              <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href={`https://wa.me/${matchedVehicle.driverWhatsapp.replace(/\D/g, '')}`}
                                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px] text-[#06c755]">forum</span>
                                <span>WhatsApp</span>
                              </a>
                            )}
                            {matchedVehicle.driverWechat && (
                              <button
                                type="button"
                                onClick={() => alert(`WeChat ID คนขับ: ${matchedVehicle.driverWechat}`)}
                                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px] text-slate-950 dark:text-white">chat_bubble</span>
                                <span>WeChat ID</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* QR Code Container */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4">
                      <div className="flex items-center gap-4">
                        {showDemoContent && (
                        <div className="w-20 h-20 bg-slate-950 p-1.5 shrink-0 flex items-center justify-center">
                          <div className="w-full h-full bg-white p-1 flex items-center justify-center relative">
                            <svg className="w-full h-full fill-current text-slate-950" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                              <rect height="30" width="30" x="0" y="0"></rect>
                              <rect fill="white" height="20" width="20" x="5" y="5"></rect>
                              <rect height="12" width="12" x="9" y="9"></rect>
                              <rect height="30" width="30" x="70" y="0"></rect>
                              <rect fill="white" height="20" width="20" x="75" y="5"></rect>
                              <rect height="12" width="12" x="79" y="9"></rect>
                              <rect height="30" width="30" x="0" y="70"></rect>
                              <rect fill="white" height="20" width="20" x="5" y="75"></rect>
                              <rect height="12" width="12" x="9" y="79"></rect>
                              <rect height="8" width="8" x="36" y="10"></rect>
                              <rect height="8" width="8" x="48" y="10"></rect>
                              <rect height="8" width="8" x="36" y="24"></rect>
                              <rect height="8" width="16" x="48" y="32"></rect>
                              <rect height="8" width="12" x="10" y="44"></rect>
                              <rect height="8" width="8" x="30" y="44"></rect>
                              <rect height="12" width="12" x="44" y="48"></rect>
                              <rect height="8" width="12" x="64" y="44"></rect>
                              <rect height="12" width="10" x="80" y="40"></rect>
                              <rect height="16" width="8" x="36" y="70"></rect>
                              <rect height="8" width="12" x="50" y="74"></rect>
                              <rect height="8" width="16" x="72" y="70"></rect>
                              <rect height="12" width="8" x="70" y="84"></rect>
                              <rect height="10" width="10" x="84" y="84"></rect>
                            </svg>
                          </div>
                        </div>
                        )}

                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-950 dark:text-white">บันทึกนามบัตรดิจิทัล</h4>
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
            </div>
          </section>

          {/* Section 2: Vehicle Profile */}
          <section className="w-full px-4 sm:px-6 py-6 bg-[#f8fafc] dark:bg-slate-950">
            <div className="max-w-[1200px] mx-auto space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 bg-[#fea619]"></span>
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">VEHICLE PROFILE</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white tracking-tight">
                    พาหนะประจำตัว: {title}
                  </h2>
                  {matchedVehicle.description && (
                    <p className="text-xs text-slate-500 mt-1">{matchedVehicle.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs px-3 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-slate-950 dark:text-white">
                    ทะเบียน {cleanPlate}
                  </span>
                </div>
              </div>

              {galleryImages.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8 group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="aspect-[16/10] w-full relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={galleryImages[0]}
                        alt={`ภาพตัวรถ ${title}`}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                      <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono">
                        {title}
                      </div>
                    </div>
                  </div>

                  {galleryImages.length > 1 && (
                    <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
                      {galleryImages.slice(1, 3).map((src, idx) => (
                        <div key={idx} className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                          <div className="aspect-[16/10] md:aspect-[16/9.5] w-full relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt={`ภาพตัวรถ ${title} ${idx + 2}`}
                              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {matchedVehicle.seats > 0 && (
                  <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-950 dark:text-white">
                      <span className="material-symbols-outlined text-[24px]">airline_seat_recline_extra</span>
                    </div>
                    <h4 className="font-bold text-slate-950 dark:text-white">{matchedVehicle.seats} ที่นั่ง</h4>
                  </div>
                )}

                {(matchedVehicle.amenities || []).length > 0 && (
                  <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 sm:col-span-1 lg:col-span-3">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-950 dark:text-white">
                      <span className="material-symbols-outlined text-[24px]">tv_gen</span>
                    </div>
                    <h4 className="font-bold text-slate-950 dark:text-white">สิ่งอำนวยความสะดวก</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(matchedVehicle.amenities ?? []).map((item, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 3: Availability Calendar & Route Fare Estimator */}
          <section className="w-full px-4 sm:px-6 py-6 bg-[#f8fafc] dark:bg-slate-950">
            <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {showDemoContent && (
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-[#06c755] text-[20px]">calendar_month</span>
                      <h3 className="text-base font-bold text-slate-950 dark:text-white">ปฏิทินคิวงาน{driverNick} (อัปเดตแบบเรียลไทม์)</h3>
                    </div>
                    <p className="text-xs text-slate-500">ตรวจสอบวันที่คิวว่างเพื่อวางแผนการเดินทางล่วงหน้า</p>
                  </div>
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 px-3 py-1 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono">
                    <span>ตุลาคม 2569 / Oct 2026</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                    <span className="w-3 h-3 bg-white border border-[#06c755] text-[#06c755] flex items-center justify-center font-bold text-[9px]">●</span>
                    <span>คิวว่างพร้อมรับงาน</span>
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
                    <div className="p-2.5 text-slate-300 bg-slate-50/50">28</div>
                    <div className="p-2.5 text-slate-300 bg-slate-50/50">29</div>
                    <div className="p-2.5 text-slate-300 bg-slate-50/50">30</div>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800/40 text-slate-400">
                      <span className="block font-bold">1</span>
                      <span className="text-[9px] block">ติดงาน</span>
                    </div>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800/40 text-slate-400">
                      <span className="block font-bold">2</span>
                      <span className="text-[9px] block">ติดงาน</span>
                    </div>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800/40 text-slate-400">
                      <span className="block font-bold">3</span>
                      <span className="text-[9px] block">ติดงาน</span>
                    </div>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800/40 text-slate-400">
                      <span className="block font-bold">4</span>
                      <span className="text-[9px] block">ติดงาน</span>
                    </div>

                    <div className="p-2 bg-[#fef3c7] border-2 border-[#d97706] text-slate-950 font-bold">
                      <span className="block">5</span>
                      <span className="text-[9px] text-[#d97706] font-bold block">วันนี้-ว่าง</span>
                    </div>

                    {[6, 7, 8, 9].map((d) => (
                      <div key={d} className="p-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold hover:bg-[#e8f9ee] transition-colors">
                        <span className="block">{d}</span>
                        <span className="text-[9px] text-[#06c755] block">ว่าง</span>
                      </div>
                    ))}

                    <div className="p-2 bg-slate-100 dark:bg-slate-800/40 text-slate-400">
                      <span className="block font-bold">10</span>
                      <span className="text-[9px] block">ติดงาน</span>
                    </div>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800/40 text-slate-400">
                      <span className="block font-bold">11</span>
                      <span className="text-[9px] block">ติดงาน</span>
                    </div>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800/40 text-slate-400">
                      <span className="block font-bold">12</span>
                      <span className="text-[9px] block">ติดงาน</span>
                    </div>

                    {[13, 14, 15, 16, 17].map((d) => (
                      <div key={d} className="p-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold hover:bg-[#e8f9ee] transition-colors">
                        <span className="block">{d}</span>
                        <span className="text-[9px] text-[#06c755] block">ว่าง</span>
                      </div>
                    ))}

                    <div className="p-2 bg-slate-100 dark:bg-slate-800/40 text-slate-400">
                      <span className="block font-bold">18</span>
                      <span className="text-[9px] block">ติดงาน</span>
                    </div>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800/40 text-slate-400">
                      <span className="block font-bold">19</span>
                      <span className="text-[9px] block">ติดงาน</span>
                    </div>

                    {[20, 21, 22].map((d) => (
                      <div key={d} className="p-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold hover:bg-[#e8f9ee] transition-colors">
                        <span className="block">{d}</span>
                        <span className="text-[9px] text-[#06c755] block">ว่าง</span>
                      </div>
                    ))}

                    <div className="p-2 bg-slate-100 dark:bg-slate-800/40 text-slate-400">
                      <span className="block font-bold">23</span>
                      <span className="text-[9px] block">ติดงาน</span>
                    </div>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800/40 text-slate-400">
                      <span className="block font-bold">24</span>
                      <span className="text-[9px] block">ติดงาน</span>
                    </div>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800/40 text-slate-400">
                      <span className="block font-bold">25</span>
                      <span className="text-[9px] block">ติดงาน</span>
                    </div>

                    {[26, 27, 28, 29, 30, 31].map((d) => (
                      <div key={d} className="p-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold hover:bg-[#e8f9ee] transition-colors">
                        <span className="block">{d}</span>
                        <span className="text-[9px] text-[#06c755] block">ว่าง</span>
                      </div>
                    ))}
                    <div className="p-2.5 text-slate-300 bg-slate-50/50">1</div>
                  </div>
                </div>
              </div>
              )}

              <div className={`${showDemoContent ? 'lg:col-span-5' : 'lg:col-span-12'} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4`}>
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
                      {routeRates.map((val) => (
                        <option key={val.key} value={val.key}>
                          {val.label}
                          {val.price > 0 ? ` (฿${val.price.toLocaleString()} / วัน)` : ''}
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

                  {!hasPrice && (
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700 text-slate-500">
                      คนขับยังไม่ได้ระบุราคาสำหรับเส้นทางนี้ กรุณาสอบถามราคากับคนขับโดยตรง
                    </div>
                  )}

                  {hasPrice && (
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>อัตราค่าบริการคนขับ + รถ:</span>
                      <span className="font-mono font-bold text-slate-950 dark:text-white">฿{currentRate.price.toLocaleString()} / วัน</span>
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
                        <span className="text-2xl font-bold font-mono text-slate-950 dark:text-white">฿{estimatedTotal.toLocaleString()}</span>
                        <span className="text-[11px] text-slate-500 block">บาท</span>
                      </div>
                    </div>
                  </div>
                  )}

                  {lineId ? (
                    <>
                      <button
                        type="submit"
                        className="w-full h-12 bg-[#06c755] hover:brightness-105 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer text-xs sm:text-sm"
                      >
                        <span className="material-symbols-outlined text-[20px]">send</span>
                        <span>ส่งข้อมูลเช็คคิวตรงกับ{driverNick}ผ่าน LINE</span>
                      </button>
                      <p className="text-[11px] text-center text-slate-400">
                        ระบบจะเปิดแอป LINE พร้อมข้อความรายละเอียดทริป เพื่อส่งให้คนขับ
                      </p>
                    </>
                  ) : (
                    <p className="text-[11px] text-center text-slate-400">คนขับยังไม่ได้ระบุ LINE สำหรับรับข้อความจากแบบฟอร์มนี้</p>
                  )}
                </form>
              </div>
            </div>
          </section>

          {routeRates.some((r) => r.price > 0) && (
            <section className="w-full px-4 sm:px-6 py-6 bg-[#f8fafc] dark:bg-slate-950">
              <div className="max-w-[1200px] mx-auto space-y-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 bg-[#06c755]"></span>
                      <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">DIRECT RATES</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-950 dark:text-white">อัตราค่าบริการของคนขับ</h3>
                  </div>
                  {matchedVehicle.rateNote && (
                    <span className="text-xs text-slate-500 font-semibold">{matchedVehicle.rateNote}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {ZONE_RATE_CARDS.filter((zone) => Number(matchedVehicle.zoneRates?.[zone.id]) > 0).map((zone) => (
                    <div key={zone.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                      <span className="font-mono text-[10px] text-slate-400 block uppercase">ZONE {zone.zoneNo}</span>
                      <h4 className="font-bold text-slate-950 dark:text-white text-sm">{zone.shortLabel}</h4>
                      <p className="text-slate-500 text-[11px]">{zone.examples}</p>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-xl font-bold font-mono text-slate-950 dark:text-white">
                          ฿{Number(matchedVehicle.zoneRates?.[zone.id]).toLocaleString()}{' '}
                          <span className="text-xs text-slate-400 font-normal">/ วัน</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {showDemoContent && (
          <section className="w-full px-4 sm:px-6 py-6 bg-[#f8fafc] dark:bg-slate-950">
            <div className="max-w-[1200px] mx-auto space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#fea619] text-[20px]">rate_review</span>
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">เสียงตอบรับจริงจากผู้โดยสาร ({reviewCount} ทริป)</h3>
                </div>
                <div className="flex items-center gap-2 font-mono font-bold text-xs text-[#fea619]">
                  <span>★ {rating} / 5.0</span>
                  <span className="text-slate-400 font-normal">ความพึงพอใจ 99.2%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between text-[#fea619] font-bold">
                    <span>★★★★★</span>
                    <span className="text-slate-400 font-normal text-[11px]">22 ก.ย. 2569</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                    &quot;พาคุณพ่อคุณแม่และญาติผู้ใหญ่ 7 คนไปเที่ยวดอยอินทนนท์และกิ่วแม่ปาน {driverNick}ขับรถนิ่มมาก ไม่กระชากเลย ผู้สูงอายุไม่เมารถ เบาะนวดไฟฟ้าถูกใจคุณแม่มาก รถสะอาดเหมือนใหม่ออกห้าง แนะนำเลยครับ!&quot;
                  </p>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">คุณพงศกร และครอบครัว</span>
                    <span className="px-2 py-0.5 bg-[#e8f9ee] text-[#06c755] text-[10px] font-bold">VERIFIED RIDER</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between text-[#fea619] font-bold">
                    <span>★★★★★</span>
                    <span className="text-slate-400 font-normal text-[11px]">14 ก.ย. 2569</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                    &quot;ทางบริษัทจัดทริปพาลูกค้า VIP จากสิงคโปร์มาสัมมนาที่เชียงใหม่ {driverNick}แต่งตัวสุภาพเรียบร้อย พูดภาษาอังกฤษพื้นฐานสื่อสารได้ดีมาก ตรงต่อเวลาก่อนนัด 20 นาทีทุกวัน เรื่องเอกสารใบเสร็จออกได้รวดเร็ว มืออาชีพตัวจริง&quot;
                  </p>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">คุณณิชาภัทร (ฝ่ายจัดซื้อ บมจ.)</span>
                    <span className="px-2 py-0.5 bg-[#e8f9ee] text-[#06c755] text-[10px] font-bold">CORPORATE CLIENT</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between text-[#fea619] font-bold">
                    <span>★★★★★</span>
                    <span className="text-slate-400 font-normal text-[11px]">28 ส.ค. 2569</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                    &quot;เส้นทางปาย-ปางอุ๋งโค้งโหดมาก แต่{driverNick}ขับนิ่งและปลอดภัยสุดๆ รู้จักมุมถ่ายรูปสวยๆ แวะร้านกาแฟวิวเด็ดที่คนไม่ค่อยรู้จัก คอยช่วยยกกระเป๋าทุกครั้ง ประทับใจมาก ทริปหน้าจะจองอีกแน่นอนค่ะ&quot;
                  </p>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">คุณธนภรณ์ และแก๊งเพื่อน</span>
                    <span className="px-2 py-0.5 bg-[#e8f9ee] text-[#06c755] text-[10px] font-bold">VERIFIED RIDER</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          )}

          {/* Section 6: Official TripDee Safety Guarantee */}
          <section className="w-full py-8 lg:py-10 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-950 text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[28px]">verified</span>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-950 dark:text-white">
                      การันตีมาตรฐานความปลอดภัยโดย TripDee Verified Chauffeur
                    </h4>
                    <p className="text-xs text-slate-500">
                      ผู้ขับขี่ทุกคนผ่านการคัดกรองประวัติอาชญากรรม ตรวจสภาพพาหนะ และคุ้มครองด้วยประกันภัยตามกฎหมาย
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-950 dark:text-white">
                    DLT COMPLIANT
                  </span>
                  <span className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-[#06c755]">
                    DIRECT DEALS
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Floating Bottom Sticky Bar */}
      <div className="sticky bottom-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-3 px-4 sm:px-6 shadow-xl">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-slate-950 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {driverNick.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-slate-950 dark:text-white truncate">
                  {publicName}
                </span>
                <span className="w-2 h-2 rounded-full bg-[#06c755] shrink-0"></span>
              </div>
              <span className="text-xs text-slate-500 truncate block">
                {title} • ทะเบียน {cleanPlate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs">
            {cleanPhone && (
              <a
                href={`tel:${cleanPhone}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold transition-colors shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">call</span>
                <span className="hidden sm:inline">โทร</span> {displayPhone}
              </a>
            )}
            {lineId && (
              <a
                href={formatLineLink(lineId)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#06c755] hover:brightness-105 text-white font-bold transition-all shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>คุยไลน์ทันที</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>© 2025 TripDee Co., Ltd. แพลตฟอร์มเครือข่ายรถตู้และคนขับมืออาชีพทั่วไทย • ทะเบียนพาณิชย์ DBD Registered</div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white">หน้าหลัก</Link>
            <span>/</span>
            <Link href="/driver" className="hover:text-slate-900 dark:hover:text-white">ศูนย์คนขับ</Link>
            <span>/</span>
            <Link href="/admin" className="hover:text-slate-900 dark:hover:text-white">แอดมิน</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

