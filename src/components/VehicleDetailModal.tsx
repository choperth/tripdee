'use client';

import React, { useEffect, useState } from 'react';
import { Vehicle, STANDARD_TERMS, formatTHB } from '@/data/mockData';
import { maskPhoneNumber, maskPlateNumber, getPublicDriverName } from '@/lib/privacy';
import { X, ShieldCheck, Star, Phone, MessageCircle, MapPin, Check, Info, Users, CheckCircle2, Clock, Calendar, Copy, Award, FileCheck2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import type { DictKey } from '@/i18n/dictionaries';

interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({ vehicle, onClose }) => {
  const { t } = useLanguage();
  const { trackCall } = useAnalytics();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isPhoneRevealed, setIsPhoneRevealed] = useState<boolean>(false);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  useEffect(() => {
    if (!vehicle) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [vehicle, onClose]);

  if (!vehicle) return null;

  return (
    <div
      className="td-scrim-enter fixed inset-0 z-400 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4 backdrop-blur-xs"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={vehicle.title}
        onClick={(e) => e.stopPropagation()}
        className="td-modal-enter relative my-6 grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-modal bg-card border border-rule shadow-2xl md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label={t('detail.close')}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-card/90 text-ink-2 hover:text-ink hover:bg-card border border-rule shadow-xs transition-all focus:outline-none"
        >
          <X className="h-5 w-5" aria-hidden="true" strokeWidth={2.5} />
        </button>

        {/* Left Column: Visual & Specs Gallery */}
        <div className="relative flex flex-col justify-between bg-paper-2 min-h-64 md:min-h-full">
          <div className="relative h-64 md:h-full w-full overflow-hidden">
            <img
              src={vehicle.images[0]}
              alt={vehicle.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

            {/* Badges on Image */}
            <div className="absolute left-3 top-3 flex items-center gap-1.5 flex-wrap max-w-[85%]">
              <span className="inline-flex items-center gap-1 rounded-pill bg-black/75 px-3 py-1 text-xs font-bold text-white shadow-xs backdrop-blur-xs">
                <Users className="h-3.5 w-3.5 text-accent" aria-hidden="true" strokeWidth={2.5} />
                {t('detail.vipSeats', { n: vehicle.seats })}
              </span>
              {vehicle.plateNumber && (
                <span className="inline-flex items-center gap-1 rounded-pill bg-black/65 px-2.5 py-1 text-xs font-mono font-bold text-white shadow-xs backdrop-blur-xs border border-white/20">
                  {vehicle.plateNumber}
                </span>
              )}
            </div>

            {vehicle.isVerified && (
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 rounded-input bg-card/95 backdrop-blur-xs p-2 text-xs font-extrabold text-leaf border border-leaf/20 shadow-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                <span>{t('detail.verifiedBadge')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Specification & Pricing Details */}
        <div className="max-h-[85vh] min-w-0 overflow-y-auto p-5 sm:p-7">
          {/* Header row with rating */}
          <div className="flex items-center justify-between gap-2 pr-8">
            <span className="td-fig inline-flex items-center gap-1 rounded-pill bg-sun-soft px-2.5 py-1 text-xs font-bold text-sun-ink border border-sun/20">
              <Star className="h-3.5 w-3.5 fill-sun text-sun" aria-hidden="true" />
              <span>{vehicle.rating}</span>
              <span className="text-ink-2 font-normal">({t('detail.reviews', { n: vehicle.reviewCount })})</span>
            </span>

            <span className="text-xs font-bold text-accent bg-accent-soft px-2.5 py-0.5 rounded-pill border border-accent/20">
              {vehicle.type === 'van' ? 'รถตู้พร้อมคนขับ' : 'รถเช่าขับเอง'}
            </span>
          </div>

          <h2 className="mt-2.5 font-display text-xl sm:text-2xl font-extrabold leading-snug tracking-tight text-ink">
            {vehicle.title}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-ink-2">
            <MapPin className="h-4 w-4 text-accent" aria-hidden="true" />
            <span>{t('detail.basedAt')} {vehicle.location}</span>
          </p>

          {/* Legal Plate & Corporate Status Bar */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {vehicle.plateType === 'yellow' ? (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30 px-3 py-1 text-xs font-bold">
                <Award className="h-3.5 w-3.5 text-amber-600" />
                🟡 ป้ายเหลือง 30 (ขนส่งสาธารณะ)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-sky-500/15 text-sky-800 dark:text-sky-200 border border-sky-500/30 px-3 py-1 text-xs font-bold">
                <Award className="h-3.5 w-3.5 text-sky-600" />
                🔵 ป้ายฟ้า (รถตู้ส่วนบุคคล)
              </span>
            )}

            {vehicle.canIssueTaxInvoice && (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 px-3 py-1 text-xs font-bold">
                <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" />
                🏢 ออกใบกำกับภาษี & หัก 3% ได้
              </span>
            )}

            {vehicle.plateNumber && (
              <span className="inline-flex items-center gap-1 rounded-pill bg-paper px-2.5 py-1 text-xs font-mono font-bold text-ink-2 border border-rule">
                ทะเบียน: {maskPlateNumber(vehicle.plateNumber)}
              </span>
            )}

            {vehicle.isAvailable === false && (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 px-3 py-1 text-xs font-bold">
                ⏸️ คิวเต็มชั่วคราว
              </span>
            )}
          </div>

          <p className="mt-3 text-sm font-normal leading-relaxed text-ink-2">
            {vehicle.description}
          </p>

          {/* Amenities Grid */}
          <div className="mt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-2 mb-2">
              {t('detail.amenities')}
            </h3>
            <ul className="flex flex-wrap gap-1.5">
              {vehicle.amenities.map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5 rounded-pill bg-paper px-3 py-1 text-xs font-semibold text-ink border border-rule">
                  <Check className="h-3 w-3 text-leaf" aria-hidden="true" strokeWidth={3} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Transparent Daily Rate (No Destination Zones) */}
          <div className="mt-5 rounded-card bg-paper p-4 border border-rule">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink">
                อัตราค่าบริการ (รวมคนขับและยานพาหนะ)
              </span>
              <span className="text-[11px] font-semibold text-leaf bg-leaf-soft px-2 py-0.5 rounded-pill border border-leaf/20">
                0% คอมมิชชั่น ดีลตรง
              </span>
            </div>
            <div className="flex items-baseline justify-between py-2 border-b border-rule/60">
              <span className="text-sm font-bold text-ink">ราคาเริ่มต้นต่อวัน</span>
              <span className="text-2xl font-extrabold text-accent">
                {formatTHB(vehicle.zoneRates?.city || 1900)}{' '}
                <span className="text-xs font-normal text-ink-2">/วัน</span>
              </span>
            </div>
            {vehicle.rateNote ? (
              <p className="mt-2.5 flex items-start gap-1.5 text-xs font-medium leading-relaxed text-ink-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                <span>{vehicle.rateNote}</span>
              </p>
            ) : (
              <p className="mt-2 text-[11px] text-ink-2">
                * ราคารวมคนขับ ไม่รวมค่าน้ำมันและค่าทางด่วน (สามารถสอบถามและตกลงราคากับคนขับโดยตรงตามเส้นทางจริง)
              </p>
            )}
          </div>

          {/* Standard Terms & Conditions */}
          <div className="mt-4 rounded-card border border-rule bg-card p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-2 block mb-2">
              {t('detail.termsTitle')}
            </span>
            <ul className="flex flex-col gap-1 text-xs text-ink-2 font-medium">
              <li className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-accent shrink-0" />
                <span>{t('detail.termsHours', { h: STANDARD_TERMS.workHoursPerDay, start: STANDARD_TERMS.workStart, end: STANDARD_TERMS.workEnd, rate: formatTHB(STANDARD_TERMS.overtimeRatePerHour) })}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-accent shrink-0" />
                <span>{t('detail.termsStay', { rate: formatTHB(STANDARD_TERMS.overnightStayRate) })}</span>
              </li>
              <li className="text-[11px] text-ink-2/80 mt-1 pl-5">
                {t('terms.fuelNote')}
              </li>
            </ul>
          </div>

          {/* Direct Driver Contact Card */}
          <div className="mt-4 rounded-card bg-paper p-4 border border-rule">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-2">{t('detail.contactChannels')}</p>
              {vehicle.languages && vehicle.languages.length > 0 && (
                <div className="flex items-center gap-1">
                  {vehicle.languages.includes('en') && (
                    <span className="rounded-pill bg-card px-2 py-0.5 text-[10px] font-bold text-ink-2 border border-rule">
                      🇬🇧 EN
                    </span>
                  )}
                  {vehicle.languages.includes('zh') && (
                    <span className="rounded-pill bg-card px-2 py-0.5 text-[10px] font-bold text-ink-2 border border-rule">
                      🇨🇳 中文
                    </span>
                  )}
                  {vehicle.languages.includes('ko') && (
                    <span className="rounded-pill bg-card px-2 py-0.5 text-[10px] font-bold text-ink-2 border border-rule">
                      🇰🇷 한국어
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="mt-2.5 flex items-center gap-3">
              <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-sm font-extrabold text-white">
                {getPublicDriverName(vehicle.driverName, vehicle.driverNickname).charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-ink">
                  {getPublicDriverName(vehicle.driverName, vehicle.driverNickname)}
                </p>
                <p className="td-fig text-xs font-bold text-ink-2">
                  {isPhoneRevealed ? vehicle.driverPhone : maskPhoneNumber(vehicle.driverPhone)}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs font-medium text-ink-2">{t('detail.contactNote')}</p>

            {/* Direct Multi-App Channels Grid */}
            <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Primary: Direct Call */}
              <a
                href={`tel:${vehicle.driverPhone}`}
                onClick={() => {
                  setIsPhoneRevealed(true);
                  trackCall({
                    targetType: 'vehicle_detail',
                    targetId: vehicle.id,
                    targetTitle: vehicle.title,
                    phoneNumber: vehicle.driverPhone,
                    driverName: vehicle.driverNickname,
                  });
                }}
                data-analytics-call={vehicle.id}
                className="td-btn inline-flex items-center justify-center gap-2 rounded-input bg-accent hover:bg-accent-deep px-3 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-xs transition-all active:scale-[0.98]"
              >
                <Phone className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
                <span>
                  {isPhoneRevealed
                    ? `${t('detail.callNow')} (${vehicle.driverPhone})`
                    : `📞 ${maskPhoneNumber(vehicle.driverPhone)} (กดโทรออก)`}
                </span>
              </a>

              {/* LINE */}
              {vehicle.driverLine && (
                <a
                  href={vehicle.driverLine}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="td-btn inline-flex items-center justify-center gap-2 rounded-input bg-[#06C755] hover:bg-[#05b34c] px-3 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-xs transition-all active:scale-[0.98]"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
                  <span>LINE Chat</span>
                </a>
              )}

              {/* WhatsApp (International / Western / ASEAN) */}
              {vehicle.driverWhatsapp && (
                <a
                  href={vehicle.driverWhatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="td-btn inline-flex items-center justify-center gap-2 rounded-input bg-[#25D366] hover:bg-[#20bd5a] px-3 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-xs transition-all active:scale-[0.98]"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
                  <span>WhatsApp Chat</span>
                </a>
              )}

              {/* WeChat (Chinese travelers - 1 Click Copy ID) */}
              {vehicle.driverWechat && (
                <button
                  type="button"
                  onClick={() => handleCopy(vehicle.driverWechat!, 'wechat')}
                  className="td-btn inline-flex items-center justify-between rounded-input bg-[#07C160] hover:bg-[#06ad56] px-3 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-xs transition-all active:scale-[0.98]"
                >
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2.5} />
                    <span>WeChat: {vehicle.driverWechat}</span>
                  </span>
                  <span className="shrink-0 rounded-pill bg-white/25 px-2 py-0.5 text-[11px] font-bold">
                    {copiedField === 'wechat' ? <Check className="h-3 w-3 inline" /> : t('detail.copyId')}
                  </span>
                </button>
              )}

              {/* KakaoTalk (Korean travelers - 1 Click Copy ID / OpenChat) */}
              {vehicle.driverKakao && (
                <button
                  type="button"
                  onClick={() => handleCopy(vehicle.driverKakao!, 'kakao')}
                  className="td-btn inline-flex items-center justify-between rounded-input bg-[#FEE500] hover:bg-[#ebd300] px-3 py-2.5 text-xs sm:text-sm font-extrabold text-[#191919] shadow-xs transition-all active:scale-[0.98]"
                >
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={2.5} />
                    <span>Kakao: {vehicle.driverKakao}</span>
                  </span>
                  <span className="shrink-0 rounded-pill bg-black/10 px-2 py-0.5 text-[11px] font-bold">
                    {copiedField === 'kakao' ? <Check className="h-3 w-3 inline" /> : t('detail.copyId')}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* TripDee Verified Direct Booking Guarantee & Safety Standards Card */}
          <div className="mt-4 rounded-card border border-leaf/30 bg-leaf-soft/40 p-4 shadow-2xs">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-leaf text-white shadow-2xs">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-xs font-black text-ink">
                  มั่นใจทุกการเดินทาง · มาตรฐาน TripDee Verified
                </h4>
                <p className="text-[11px] font-medium text-ink-2">
                  0% ค่านายหน้า ดีลตรงกับคนขับ ตรวจสอบประวัติแล้ว
                </p>
              </div>
            </div>

            <ul className="space-y-1.5 pt-2 border-t border-leaf/20 text-[11px] font-semibold text-ink-2">
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-leaf shrink-0 mt-0.5" strokeWidth={3} />
                <span>ติดต่อและตกลงราคากับคนขับโดยตรง ไม่มีการบวกเพิ่มส่วนต่างใดๆ</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-leaf shrink-0 mt-0.5" strokeWidth={3} />
                <span>ตรวจสอบข้อมูลยานพาหนะและใบขับขี่ประจำตัวคนขับทุกคัน</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-leaf shrink-0 mt-0.5" strokeWidth={3} />
                <span>แนะนำสอบถามจุดรับ-ส่ง เวลาเดินทาง และเงื่อนไขน้ำมันให้ชัดเจนก่อนออกทริป</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
