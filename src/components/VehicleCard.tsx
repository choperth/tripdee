'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import { Vehicle } from '@/data/mockData';
import { vehicleTitle, vehicleLocation, vehicleAmenities, vehicleDescription } from '@/data/vehicleI18n';
import { maskPlateNumber, getPublicDriverName } from '@/lib/privacy';
import { useLanguage } from '@/context/LanguageContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import { getUpcomingBusyRanges, toISODateString } from '@/lib/availabilityUtils';
import { formatLineLink, buildVehicleLineMessage } from '@/lib/contactUtils';
import { useIsFavorite, toggleFavorite } from '@/lib/favoritesStore';

import { DepositPaymentModal } from '@/components/payment/DepositPaymentModal';
import { ENABLE_QR_PAYMENT } from '@/lib/constants';

interface VehicleCardProps {
  vehicle: Vehicle;
  onSelectDetail: (vehicle: Vehicle) => void;
  allVehicles?: Vehicle[];
  onViewFleet?: (driverPhone: string, driverName: string, fleetVehicles: Vehicle[]) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = memo(({ vehicle, onSelectDetail, allVehicles, onViewFleet }) => {
  const { t, locale } = useLanguage();
  const { trackCall } = useAnalytics();
  const [copiedWechat, setCopiedWechat] = React.useState(false);
  const isFavorite = useIsFavorite(vehicle.id);

  const [showDepositModal, setShowDepositModal] = React.useState(false);
  const todayIso = React.useMemo(() => toISODateString(new Date()), []);
  const isBusyToday = Boolean(vehicle.busyDates && vehicle.busyDates.includes(todayIso));
  const upcomingRanges = React.useMemo(
    () => getUpcomingBusyRanges(vehicle.busyDates || [], locale),
    [vehicle.busyDates, locale]
  );

  const cleanPhone = vehicle.driverPhone ? vehicle.driverPhone.replace(/\D/g, '') : '';
  const companionVehicles = React.useMemo(() => {
    if (!allVehicles || allVehicles.length === 0) return [];
    return allVehicles.filter((v) => {
      if (v.id === vehicle.id) return false;
      const otherPhone = v.driverPhone ? v.driverPhone.replace(/\D/g, '') : '';
      if (cleanPhone && otherPhone && cleanPhone === otherPhone) return true;
      if (vehicle.driverNickname && v.driverNickname && vehicle.driverNickname === v.driverNickname) return true;
      return false;
    });
  }, [allVehicles, vehicle.id, cleanPhone, vehicle.driverNickname]);

  const handleWechatClick = (e: React.MouseEvent) => {
    if (vehicle.driverWechat) {
      e.preventDefault();
      navigator.clipboard.writeText(vehicle.driverWechat);
      setCopiedWechat(true);
      setTimeout(() => setCopiedWechat(false), 2000);
    }
  };

  const handleCallClick = () => {
    trackCall({
      targetType: 'vehicle_card',
      targetId: vehicle.id,
      targetTitle: title,
      phoneNumber: vehicle.driverPhone,
      driverName: vehicle.driverNickname,
    });
  };

  const isSelfDrive = vehicle.rentalType === 'self_drive' || (vehicle.type !== 'van' && vehicle.rentalType !== 'with_driver');
  const rates = vehicle.zoneRates ? Object.values(vehicle.zoneRates).filter((r): r is number => typeof r === 'number' && r > 0) : [];
  const minRate = rates.length > 0 ? Math.min(...rates) : null;
  const maxRate = rates.length > 0 ? Math.max(...rates) : null;
  const priceDisplay =
    minRate === null || maxRate === null
      ? t('vehicle.priceOnRequest')
      : minRate < maxRate
        ? `฿${minRate.toLocaleString()} - ${maxRate.toLocaleString()}`
        : `฿${minRate.toLocaleString()}`;
  const publicName = getPublicDriverName(vehicle.driverName, vehicle.driverNickname);
  const title = vehicleTitle(vehicle, locale);
  const location = vehicleLocation(vehicle, locale);
  const amenities = vehicleAmenities(vehicle, locale);
  const shortLocation = location.split('/')[0].trim();
  const isYellowPlate = vehicle.plateType === 'yellow' || (vehicle.plateNumber ? vehicle.plateNumber.trim().startsWith('3') : false);
  const hasClass1Insurance = vehicle.insuranceType === 'class1' || (Array.isArray(vehicle.amenities) && vehicle.amenities.some((a) => a.includes('ชั้น 1') || a.toLowerCase().includes('first class')));
  const isInsured = hasClass1Insurance || vehicle.insuranceType || (Array.isArray(vehicle.amenities) && vehicle.amenities.some((a) => a.includes('ประกัน')));

  // Helper icons for amenities
  const getAmenityIcon = (text: string, index: number) => {
    if (text.includes('เบาะ') || text.includes('ที่นั่ง') || text.includes('seat') || text.includes('Seat')) return 'chair';
    if (text.includes('เกะ') || text.includes('TV') || text.includes('จอ') || text.includes('karaoke') || text.includes('Karaoke')) return 'mic';
    if (text.includes('WiFi') || text.includes('เน็ต') || text.includes('Wi-Fi')) return 'wifi';
    if (text.includes('ชาร์จ') || text.includes('USB') || text.includes('charg') || text.includes('Charg')) return 'power';
    if (text.includes('สไลด์') || text.includes('ประตู') || text.includes('sliding') || text.includes('Sliding') || text.includes('door') || text.includes('Door')) return 'sensor_door';
    if (text.includes('ฟอกอากาศ') || text.includes('แอร์') || text.includes('air') || text.includes('Air') || text.includes('A/C') || text.includes('climate')) return 'air';
    return index === 0 ? 'chair' : index === 1 ? 'tv' : 'verified_user';
  };

  return (
    <article className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-none flex flex-col justify-between hover:border-slate-500 dark:hover:border-slate-600 transition-colors shadow-2xs group">
      <div>
        {/* 1. Vehicle Photo Header */}
        <div className="relative h-52 sm:h-56 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 rounded-none overflow-hidden">
          <button
            type="button"
            onClick={() => onSelectDetail(vehicle)}
            className="w-full h-full relative block text-left cursor-pointer"
            aria-label={t('vehicle.detailAria', { title })}
          >
            {vehicle.images?.[0] ? (
              <Image
                src={vehicle.images[0]}
                alt={title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full grid place-items-center bg-slate-100 dark:bg-slate-800">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[36px]">
                  directions_car
                </span>
              </div>
            )}

            {/* Top-left Badges */}
            {/* Top-left Badges: Yellow Plate 30, Insurance, Self-drive, Verified */}
            <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1 pointer-events-none max-w-[88%]">
              {isYellowPlate ? (
                <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 text-[11px] font-black px-2 py-0.5 border border-amber-500 rounded-none shadow-xs">
                  <span className="material-symbols-outlined text-[13px] leading-none">local_taxi</span>
                  <span>{t('vehicle.plateYellow30Short')}</span>
                </span>
              ) : isSelfDrive ? (
                <span className="inline-flex items-center gap-1 bg-indigo-700 text-white text-[11px] font-black px-2 py-0.5 border border-indigo-800 rounded-none shadow-xs">
                  <span className="material-symbols-outlined text-[13px] leading-none">key</span>
                  <span>{t('vehicle.selfDrive')}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-slate-900/90 text-white text-[11px] font-bold px-2 py-0.5 border border-slate-700 rounded-none shadow-xs">
                  <span>{t('vehicle.bluePlate')}</span>
                </span>
              )}

              {isInsured && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5 border border-emerald-300 dark:border-emerald-700 rounded-none shadow-xs">
                  <span className="material-symbols-outlined text-[13px] text-emerald-600 dark:text-emerald-400 leading-none">shield_with_heart</span>
                  <span>{hasClass1Insurance ? t('vehicle.insuranceClass1Short') : t('vehicle.insured')}</span>
                </span>
              )}

              {vehicle.isVerified && (
                <span className="inline-flex items-center gap-1 bg-slate-900/95 text-amber-400 text-[11px] font-black px-2 py-0.5 border border-slate-700 uppercase rounded-none shadow-xs">
                  <span>⭐ {t('hero.verifiedSticker')}</span>
                </span>
              )}

              {vehicle.plateNumber && (
                <span className="bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200 text-[11px] font-bold px-1.5 py-0.5 border border-slate-300 dark:border-slate-700 rounded-none shadow-xs">
                  {maskPlateNumber(vehicle.plateNumber)}
                </span>
              )}
            </div>

            {/* Availability Alert — clear green when free, red when busy */}
            {isBusyToday ? (
              <div className="absolute bottom-2 left-2 bg-rose-600/90 text-white text-xs font-bold px-2 py-0.5 flex items-center gap-1 rounded-none">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span>{t('cal.cardBusyToday')}</span>
              </div>
            ) : upcomingRanges.length > 0 ? (
              <div className="absolute bottom-2 left-2 bg-amber-500/90 text-slate-950 text-xs font-bold px-2 py-0.5 flex items-center gap-1 rounded-none">
                <span className="material-symbols-outlined text-[13px]">event_busy</span>
                <span>{t('cal.cardUpcomingBusy', { range: upcomingRanges[0].label })}</span>
              </div>
            ) : vehicle.isAvailable !== false ? (
              <div className="absolute bottom-2 left-2 bg-emerald-600/90 text-white text-xs font-bold px-2 py-0.5 flex items-center gap-1 rounded-none">
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                <span>{t('vehicle.availableNow')}</span>
              </div>
            ) : (
              <div className="absolute bottom-2 left-2 bg-slate-700/90 text-white text-xs font-bold px-2 py-0.5 flex items-center gap-1 rounded-none">
                <span className="material-symbols-outlined text-[13px]">pause_circle</span>
                <span>{t('vehicle.paused')}</span>
              </div>
            )}
          </button>

          {/* Save to favourites (heart) — hydration-safe client-only read */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(vehicle.id);
            }}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? t('vehicle.favoriteRemove') : t('vehicle.favoriteSave')}
            title={isFavorite ? t('vehicle.favoriteRemove') : t('vehicle.favoriteSave')}
            className={`absolute top-2 right-2 z-10 grid h-9 w-9 place-items-center rounded-none border shadow-xs transition-colors cursor-pointer ${
              isFavorite
                ? 'bg-rose-600 border-rose-700 text-white'
                : 'bg-white/90 dark:bg-slate-900/90 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:text-rose-600'
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
          </button>
        </div>

        {/* 2. Content Details (Bauhaus Architectural Spec Sheet) */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            {/* Top Specification Strip */}
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                {t('vehicle.seats', { n: vehicle.seats })} VIP
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 text-xs">
                <span className="material-symbols-outlined text-[13px]">phone_in_talk</span>
                <span>{t('vc.direct100')}</span>
              </span>
            </div>

            {/* Vehicle Title & Driver Info */}
            <h3 className="text-base font-bold text-slate-950 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              <button
                type="button"
                onClick={() => onSelectDetail(vehicle)}
                className="text-left cursor-pointer hover:underline"
              >
                {title}
              </button>
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-1 mb-2">
              <span className="material-symbols-outlined text-[14px] text-slate-400">person</span>
              <span>{publicName} • {shortLocation}</span>
              <a
                href={`/driver/card?id=${vehicle.id}`}
                className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-1.5 py-0.2 hover:bg-amber-100 transition-colors ml-1 font-bold"
                title="เปิดดูนามบัตรดิจิทัลคนขับ (Digital Business Card)"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="material-symbols-outlined text-[11px]">contact_phone</span>
                <span>นามบัตร</span>
              </a>
              {companionVehicles.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onViewFleet) {
                      onViewFleet(vehicle.driverPhone, publicName, [vehicle, ...companionVehicles]);
                    } else {
                      onSelectDetail(companionVehicles[0]);
                    }
                  }}
                  className="ml-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  {t('vc.teamCount', { n: companionVehicles.length })}
                </button>
              )}
            </p>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
              {vehicleDescription(vehicle, locale) || t('vc.descFallback')}
            </p>

            {/* Crisp 4-cell Spec Grid (Bauhaus Hairline Grid) */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-none">
                <span className="material-symbols-outlined text-[16px] text-slate-900 dark:text-slate-200">
                  {amenities[0] ? getAmenityIcon(amenities[0], 0) : 'chair'}
                </span>
                <span className="truncate font-semibold">{amenities[0] || t('vc.amSeatFallback')}</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-none">
                <span className="material-symbols-outlined text-[16px] text-slate-900 dark:text-slate-200">luggage</span>
                <span className="truncate font-semibold">{amenities[1] || t('vc.amLuggageFallback')}</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-none">
                <span className="material-symbols-outlined text-[16px] text-slate-900 dark:text-slate-200">receipt_long</span>
                <span className="truncate font-semibold">{vehicle.canIssueTaxInvoice ? t('vc.taxInvoice') : t('vc.receipt')}</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-none">
                <span className="material-symbols-outlined text-[16px] text-slate-900 dark:text-slate-200">verified_user</span>
                <span className="truncate font-semibold">{t('vc.driverChecked')}</span>
              </div>
            </div>
          </div>

          {/* 3. Price & Action Buttons */}
          <div className="mt-5 pt-3.5 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-baseline justify-between gap-2 mb-2.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t('vehicle.priceFrom')}
              </span>
              <div className="flex items-baseline gap-1 whitespace-nowrap">
                <span className="text-base sm:text-lg font-black text-slate-950 dark:text-white font-mono">
                  {priceDisplay}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t('vehicle.perDay')}
                </span>
              </div>
            </div>

            {/* Instant Deposit Booking CTA Button (Hidden when ENABLE_QR_PAYMENT is false) */}
            {/* Quick Action Buttons on Card */}
            <div className="grid grid-cols-12 gap-1.5">
              {/* Quick Deposit CTA Button */}
              {ENABLE_QR_PAYMENT && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDepositModal(true);
                  }}
                  className="col-span-6 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm py-2 px-2 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs border border-amber-500 active:scale-95 whitespace-nowrap"
                  title={t('vehicle.bookDepositMobile')}
                >
                  <span className="material-symbols-outlined text-[16px] text-slate-950">verified</span>
                  <span>{t('vehicle.bookDepositShort')}</span>
                </button>
              )}

              {/* LINE / WeChat Chat Button */}
              {locale === 'zh' && vehicle.driverWechat ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWechatClick(e);
                  }}
                  className={`${ENABLE_QR_PAYMENT ? 'col-span-4' : 'col-span-8'} inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm py-2 px-2 border border-emerald-600 transition-colors rounded-none cursor-pointer shadow-2xs active:scale-95`}
                  title="微信联系司机"
                >
                  <span className="material-symbols-outlined text-[15px] text-white">chat</span>
                  <span className="whitespace-nowrap">{copiedWechat ? '已复制' : 'WeChat'}</span>
                </button>
              ) : (
                <a
                  href={formatLineLink(vehicle.driverLine, buildVehicleLineMessage(vehicle))}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(buildVehicleLineMessage(vehicle)).catch(() => {});
                    }
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${ENABLE_QR_PAYMENT ? 'col-span-4' : 'col-span-8'} inline-flex items-center justify-center gap-1 bg-[#06C755] hover:bg-[#05b04b] text-white font-bold text-xs sm:text-sm py-2 px-2 border border-[#06C755] transition-colors rounded-none cursor-pointer shadow-2xs active:scale-95`}
                  title={t('vc.lineTitle')}
                >
                  <span className="material-symbols-outlined text-[15px] text-white">chat</span>
                  <span className="whitespace-nowrap">{t('vehicle.lineChat')}</span>
                </a>
              )}

              {/* Call Button */}
              {vehicle.driverPhone && (
                <a
                  href={`tel:${vehicle.driverPhone}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCallClick();
                  }}
                  className={`${ENABLE_QR_PAYMENT ? 'col-span-2' : 'col-span-4'} inline-flex items-center justify-center bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-950 dark:text-white font-bold text-xs sm:text-sm py-2 px-1 border border-slate-300 dark:border-slate-700 transition-colors rounded-none cursor-pointer shadow-2xs active:scale-95`}
                  title={t('vc.callTitle', { phone: vehicle.driverPhone })}
                >
                  <span className="material-symbols-outlined text-[16px] text-teal-700 dark:text-teal-400">call</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ChillPay Deposit Payment Modal */}
      {ENABLE_QR_PAYMENT && showDepositModal && (
        <DepositPaymentModal
          vehicle={vehicle}
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
        />
      )}
    </article>
  );
});

VehicleCard.displayName = 'VehicleCard';
