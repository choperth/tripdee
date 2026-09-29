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
  const minRate = rates.length > 0 ? Math.min(...rates) : (isSelfDrive ? 1200 : 1800);
  const maxRate = rates.length > 0 ? Math.max(...rates) : (isSelfDrive ? 1800 : 2500);
  const priceDisplay = minRate < maxRate
    ? `฿${minRate.toLocaleString()} - ${maxRate.toLocaleString()}`
    : `฿${minRate.toLocaleString()}`;
  const publicName = getPublicDriverName(vehicle.driverName, vehicle.driverNickname);
  const title = vehicleTitle(vehicle, locale);
  const location = vehicleLocation(vehicle, locale);
  const amenities = vehicleAmenities(vehicle, locale);
  const shortLocation = location.split('/')[0].trim();

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
            <Image
              src={vehicle.images[0]}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
            />

            {/* Top-left Badges */}
            <div className="absolute top-2 left-2 flex flex-wrap gap-1 pointer-events-none">
              {isSelfDrive ? (
                <span className="bg-indigo-700 text-white text-[10px] font-black px-2 py-0.5 border border-indigo-800 uppercase rounded-none">
                  🚗 {t('vehicle.selfDrive')}
                </span>
              ) : vehicle.plateType === 'yellow' ? (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 border border-amber-500 uppercase rounded-none">
                  🟡 {t('hero.quickYellow')}
                </span>
              ) : (
                <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 border border-slate-900 rounded-none">
                  {t('vehicle.bluePlate')}
                </span>
              )}

              {vehicle.isVerified && (
                <span className="bg-slate-900 text-amber-400 text-[10px] font-black px-2 py-0.5 border border-slate-900 uppercase rounded-none">
                  ⭐ {t('hero.verifiedSticker')}
                </span>
              )}

              {vehicle.plateNumber && (
                <span className="bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-200 text-[10px] font-bold px-1.5 py-0.5 border border-slate-300 dark:border-slate-700 rounded-none">
                  {maskPlateNumber(vehicle.plateNumber)}
                </span>
              )}
            </div>

            {/* Availability Alert if Busy or Upcoming */}
            {isBusyToday ? (
              <div className="absolute bottom-2 left-2 bg-rose-600/90 text-white text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 rounded-none">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span>{t('cal.cardBusyToday')}</span>
              </div>
            ) : upcomingRanges.length > 0 ? (
              <div className="absolute bottom-2 left-2 bg-amber-500/90 text-slate-950 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 rounded-none">
                <span className="material-symbols-outlined text-[12px]">event_busy</span>
                <span>{t('cal.cardUpcomingBusy', { range: upcomingRanges[0].label })}</span>
              </div>
            ) : null}
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
              <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
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

            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
              <span className="material-symbols-outlined text-[14px] text-slate-400">person</span>
              <span>{publicName} • {shortLocation}</span>
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
                <span className="truncate">{amenities[0] || t('vc.amSeatFallback')}</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-none">
                <span className="material-symbols-outlined text-[16px] text-slate-900 dark:text-slate-200">luggage</span>
                <span className="truncate">{amenities[1] || t('vc.amLuggageFallback')}</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-none">
                <span className="material-symbols-outlined text-[16px] text-slate-900 dark:text-slate-200">receipt_long</span>
                <span className="truncate">{vehicle.canIssueTaxInvoice ? t('vc.taxInvoice') : t('vc.receipt')}</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-none">
                <span className="material-symbols-outlined text-[16px] text-slate-900 dark:text-slate-200">verified_user</span>
                <span className="truncate">{t('vc.driverChecked')}</span>
              </div>
            </div>
          </div>

          {/* 3. Price & Action Buttons */}
          <div className="mt-5 pt-3.5 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-baseline justify-between gap-2 mb-2.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
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

            <div className="grid grid-cols-2 gap-2">
              {/* Call CTA - matching attached image: white bg, border, teal call icon, "โทรตรง" */}
              <a
                href={`tel:${vehicle.driverPhone}`}
                onClick={() => {
                  handleCallClick();
                }}
                className="inline-flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-950 dark:text-white font-bold text-xs sm:text-sm py-2 px-2 border border-slate-300 dark:border-slate-700 transition-colors rounded-none cursor-pointer shadow-2xs"
                title={t('vc.callTitle', { phone: vehicle.driverPhone })}
              >
                <span className="material-symbols-outlined text-[15px] text-teal-700 dark:text-teal-400">call</span>
                <span className="whitespace-nowrap">{t('vehicle.directCall')}</span>
              </a>

              {/* LINE / WeChat CTA - matching attached image: green bg, white chat icon, "ทัก LINE" */}
              {locale === 'zh' && vehicle.driverWechat ? (
                <button
                  type="button"
                  onClick={handleWechatClick}
                  className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm py-2 px-2 border border-emerald-600 transition-colors rounded-none cursor-pointer shadow-2xs"
                  title="微信联系司机"
                >
                  <span className="material-symbols-outlined text-[15px] text-white">chat</span>
                  <span className="whitespace-nowrap">{copiedWechat ? '已复制' : 'WeChat'}</span>
                </button>
              ) : (
                <a
                  href={formatLineLink(vehicle.driverLine, buildVehicleLineMessage(vehicle))}
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(buildVehicleLineMessage(vehicle)).catch(() => {});
                    }
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 bg-[#06C755] hover:bg-[#05b04b] text-white font-bold text-xs sm:text-sm py-2 px-2 border border-[#06C755] transition-colors rounded-none cursor-pointer shadow-2xs"
                  title={t('vc.lineTitle')}
                >
                  <span className="material-symbols-outlined text-[15px] text-white">chat</span>
                  <span className="whitespace-nowrap">{t('vehicle.lineChat')}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
});

VehicleCard.displayName = 'VehicleCard';
