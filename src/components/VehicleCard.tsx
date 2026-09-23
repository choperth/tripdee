'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import { Vehicle } from '@/data/mockData';
import { maskPhoneNumber, maskPlateNumber, getPublicDriverName } from '@/lib/privacy';
import { useLanguage } from '@/context/LanguageContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import { getUpcomingBusyRanges, toISODateString } from '@/lib/availabilityUtils';

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
  const [isPhoneRevealed, setIsPhoneRevealed] = React.useState(false);

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
      targetTitle: vehicle.title,
      phoneNumber: vehicle.driverPhone,
      driverName: vehicle.driverNickname,
    });
  };

  const isSelfDrive = vehicle.rentalType === 'self_drive' || (vehicle.type !== 'van' && vehicle.rentalType !== 'with_driver');
  const basePrice = vehicle.zoneRates?.city || (isSelfDrive ? 1200 : 1900);
  const publicName = getPublicDriverName(vehicle.driverName, vehicle.driverNickname);
  const shortLocation = vehicle.location.split('/')[0].trim();

  // Helper icons for amenities
  const getAmenityIcon = (text: string, index: number) => {
    if (text.includes('เบาะ') || text.includes('ที่นั่ง')) return 'airline_seat_recline_extra';
    if (text.includes('เกะ') || text.includes('TV') || text.includes('จอ')) return 'mic';
    if (text.includes('WiFi') || text.includes('เน็ต')) return 'wifi';
    if (text.includes('ชาร์จ') || text.includes('USB')) return 'power';
    if (text.includes('สไลด์') || text.includes('ประตู')) return 'sensor_door';
    if (text.includes('ฟอกอากาศ') || text.includes('แอร์')) return 'air';
    return index === 0 ? 'airline_seat_recline_extra' : index === 1 ? 'tv' : 'verified_user';
  };

  return (
    <div className="bg-paper-elevated dark:bg-slate-900 rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-border-subtle dark:border-slate-800 transition-all flex flex-col justify-between group">
      <div>
        {/* 1. Vehicle Media Cover with Stitch Overlays */}
        <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-navy-deep">
          <button
            type="button"
            onClick={() => onSelectDetail(vehicle)}
            className="w-full h-full relative block text-left"
            aria-label={t('vehicle.detailAria', { title: vehicle.title })}
          >
            <Image
              src={vehicle.images[0]}
              alt={vehicle.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/85 via-navy-deep/20 to-transparent pointer-events-none" />

            {/* Top-left pills: Seats and Plate */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
              <span className="px-space-xs py-space-2xs rounded-md bg-navy-deep/90 text-surface font-bold text-label-badge shadow-sm">
                {t('vehicle.seats', { n: vehicle.seats })}
              </span>
              {vehicle.plateNumber && (
                <span className="px-space-xs py-space-2xs rounded-md bg-surface/90 text-navy-deep font-bold text-label-badge shadow-sm">
                  {maskPlateNumber(vehicle.plateNumber)}
                </span>
              )}
            </div>

            {/* Top-right pill: Verified & Availability */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 pointer-events-none">
              {isBusyToday ? (
                <span className="px-space-xs py-space-2xs rounded-full bg-rose-600 text-white font-bold text-label-badge flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>{t('cal.cardBusyToday')}</span>
                </span>
              ) : upcomingRanges.length > 0 ? (
                <span className="px-space-xs py-space-2xs rounded-full bg-amber-500 text-navy-deep font-extrabold text-[10px] flex items-center gap-1 shadow-sm">
                  <span className="material-symbols-outlined text-[12px]">event_busy</span>
                  <span>{t('cal.cardUpcomingBusy', { range: upcomingRanges[0].label })}</span>
                </span>
              ) : null}

              {vehicle.isVerified && (
                <span className="px-space-xs py-space-2xs rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-slate-950 font-black text-label-badge flex items-center gap-1 shadow-md border border-amber-300/80 tracking-wide">
                  <span className="material-symbols-outlined text-[13px] text-slate-950 font-bold">star</span>
                  <span>{t('hero.verifiedSticker')}</span>
                </span>
              )}
            </div>

            {/* Bottom photo overlay: Driver name & price banner */}
            <div className="absolute bottom-3 left-3 right-3 text-surface pointer-events-none">
              <div className="flex items-center gap-1.5 font-body-subtext text-body-subtext opacity-85 truncate">
                <span className="truncate">{publicName} • {shortLocation}</span>
                {companionVehicles.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-600/90 text-[10px] font-bold text-white shrink-0 shadow-xs">
                    {t('vehicle.fleetCount', { n: companionVehicles.length + 1 })}
                  </span>
                )}
              </div>
              <p className="font-bold text-[13px] text-taxi-yellow-30">
                {t('vehicle.priceNote1')} ฿{basePrice.toLocaleString()}{t('vehicle.perDay')}
              </p>
            </div>
          </button>
        </div>

        {/* 2. Content Details */}
        <div className="p-space-md space-y-space-sm">
          {/* Driver identity & Rating */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-space-xs min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-subtle text-blue-action dark:bg-blue-950 dark:text-blue-300 font-bold flex items-center justify-center text-headline-md shrink-0 border border-blue-action/20">
                {publicName.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="font-title-card text-title-card text-navy-deep dark:text-white leading-tight truncate">
                  {publicName}
                </h3>
                <p className="font-body-subtext text-body-subtext text-ink-muted dark:text-slate-400 truncate">
                  {vehicle.location}
                </p>
                {/* Cute Direct Channel Badges */}
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {vehicle.driverLine && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#06C755]/10 text-[#06C755] dark:bg-[#06C755]/20 dark:text-[#06C755] font-bold text-[10px] leading-none border border-[#06C755]/20 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#06C755]" />
                      LINE
                    </span>
                  )}
                  {(vehicle.driverWhatsapp || vehicle.driverPhone) && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#25D366]/10 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] leading-none border border-[#25D366]/20 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                      WhatsApp
                    </span>
                  )}
                  {vehicle.driverWechat && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#07C160]/10 text-teal-700 dark:text-teal-300 font-bold text-[10px] leading-none border border-[#07C160]/20 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#07C160]" />
                      WeChat
                    </span>
                  )}
                  {vehicle.driverKakao && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#FEE500]/25 text-amber-900 dark:text-amber-200 font-bold text-[10px] leading-none border border-amber-400/40 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FEE500]" />
                      Kakao
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 bg-taxi-yellow-soft dark:bg-amber-950/60 border border-amber-300/40 px-space-xs py-space-2xs rounded-md shrink-0">
              <span className="material-symbols-outlined text-amber-accent text-[14px]">star</span>
              <span className="font-bold text-body-subtext text-navy-deep dark:text-amber-300">
                {vehicle.rating}
              </span>
              <span className="text-ink-muted dark:text-slate-400 text-label-badge">
                ({vehicle.reviewCount})
              </span>
            </div>
          </div>

          {/* Other Fleet Vehicles Pill Link */}
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
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-blue-50/80 hover:bg-blue-100/90 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-blue-200/70 dark:border-blue-800/60 text-blue-action dark:text-blue-300 transition-all text-left group/fleet cursor-pointer shadow-xs"
              aria-label={t('vehicle.fleetAria', { name: publicName, n: companionVehicles.length })}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-5 h-5 rounded-md bg-blue-600/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[14px]">garage_home</span>
                </span>
                <span className="truncate text-body-subtext font-bold text-navy-deep dark:text-blue-200">
                  {t('vehicle.fleetMore', { n: companionVehicles.length })}
                </span>
                <span className="text-[11px] text-ink-muted dark:text-slate-400 truncate hidden sm:inline">
                  ({companionVehicles.map((ov) => (ov.type === 'van' ? t('vehicle.typeVan') : ov.type === 'suv' ? 'SUV' : t('vehicle.typeSedan'))).join(', ')})
                </span>
              </div>
              <span className="text-label-badge font-bold shrink-0 ml-1 flex items-center text-blue-600 dark:text-blue-400 group-hover/fleet:translate-x-0.5 transition-transform">
                {t('vehicle.viewAll')}
              </span>
            </button>
          )}

          {/* Vehicle Title */}
          <h4 className="font-title-card text-title-card text-ink-primary dark:text-slate-100 group-hover:text-blue-action transition-colors line-clamp-2">
            <button
              type="button"
              onClick={() => onSelectDetail(vehicle)}
              className="text-left cursor-pointer hover:underline"
            >
              {vehicle.title}
            </button>
          </h4>

          {/* Document Badges */}
          <div className="flex flex-wrap items-center gap-space-2xs text-label-badge">
            {/* Availability Status Badge */}
            {isBusyToday ? (
              <span className="px-space-xs py-space-2xs rounded bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 font-bold border border-rose-300/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>{t('cal.cardBusyToday')}</span>
              </span>
            ) : upcomingRanges.length > 0 ? (
              <span className="px-space-xs py-space-2xs rounded bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold border border-amber-300/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>{t('cal.cardUpcomingBusy', { range: upcomingRanges[0].label })}</span>
              </span>
            ) : null}

            {isSelfDrive ? (
              <span className="px-space-xs py-space-2xs rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                🚗 {t('vehicle.selfDrive')}
              </span>
            ) : vehicle.plateType === 'yellow' ? (
              <span className="px-space-xs py-space-2xs rounded bg-taxi-yellow-soft text-on-tertiary-container dark:bg-amber-950/70 dark:text-amber-300 font-bold border border-amber-300/40">
                🟡 {t('hero.quickYellow')}
              </span>
            ) : (
              <span className="px-space-xs py-space-2xs rounded bg-blue-subtle text-blue-action dark:bg-blue-950/70 dark:text-blue-300 font-bold">
                {t('vehicle.bluePlate')}
              </span>
            )}

            {vehicle.canIssueTaxInvoice && (
              <span className="px-space-xs py-space-2xs rounded bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 font-bold">
                🏢 {t('vehicle.taxInvoice')}
              </span>
            )}

            <span className="px-space-xs py-space-2xs rounded bg-verified-emerald-soft text-verified-emerald dark:bg-emerald-950/70 dark:text-emerald-300 font-bold">
              {t('vehicle.insured')}
            </span>

            {vehicle.languages?.includes('en') && (
              <span className="px-space-xs py-space-2xs rounded bg-surface-container dark:bg-slate-800 text-ink-secondary dark:text-slate-300">
                🇬🇧 EN
              </span>
            )}
            {vehicle.languages?.includes('zh') && (
              <span className="px-space-xs py-space-2xs rounded bg-surface-container dark:bg-slate-800 text-ink-secondary dark:text-slate-300">
                🇨🇳 中文
              </span>
            )}
          </div>

          {/* Amenity Spec Checklist (Stitch 3-bullet block) */}
          <ul className="space-y-1 text-body-subtext text-ink-secondary dark:text-slate-300 bg-paper-surface-muted/60 dark:bg-slate-800/60 p-space-xs rounded-xl">
            {vehicle.amenities.slice(0, 3).map((item, idx) => {
              const iconName = getAmenityIcon(item, idx);
              return (
                <li key={item} className="flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-verified-emerald text-[14px] shrink-0">
                    {iconName}
                  </span>
                  <span className="truncate">{item}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* 3. Price and Action Footer */}
      <div className="p-space-md pt-0">
        {/* Pricing Row */}
        <div className="flex items-baseline justify-between pt-space-xs mb-space-sm border-t border-border-subtle/70 dark:border-slate-800">
          <div>
            <span className="text-body-subtext text-ink-muted dark:text-slate-400 block">
              {t('vehicle.priceFrom')}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-price-headline text-price-headline text-navy-deep dark:text-white">
                ฿{basePrice.toLocaleString()}
              </span>
              <span className="text-body-subtext text-ink-muted dark:text-slate-400">{t('vehicle.perDay')}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-ink-muted dark:text-slate-400 block">
              {t('vehicle.dealDirect')}
            </span>
            <span className="text-[11px] text-ink-muted dark:text-slate-400 block">
              {t('vehicle.perDistance')}
            </span>
          </div>
        </div>

        {/* 0% Commission Strip */}
        <div className="text-center font-label-badge text-label-badge text-ink-muted dark:text-slate-400 bg-paper-surface-muted dark:bg-slate-800 py-1 rounded-md mb-space-xs">
          {t('vehicle.noCommission')}
        </div>

        {/* Dual CTAs: Phone Call & LINE */}
        <div className="grid grid-cols-2 gap-space-xs">
          {/* Action 1: Call Button */}
          <a
            href={`tel:${vehicle.driverPhone}`}
            onClick={() => {
              setIsPhoneRevealed(true);
              handleCallClick();
            }}
            className="h-10 bg-navy-deep hover:bg-navy-surface text-on-primary rounded-xl font-body-medium text-body-medium flex items-center justify-center gap-1 shadow-sm transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[16px]">call</span>
            <span className="truncate">
              {isPhoneRevealed ? vehicle.driverPhone : t('vehicle.callMasked', { phone: maskPhoneNumber(vehicle.driverPhone) })}
            </span>
          </a>

          {/* Action 2: Chat Button (LINE or WeChat/WhatsApp) */}
          {locale === 'zh' && vehicle.driverWechat ? (
            <button
              type="button"
              onClick={handleWechatClick}
              className="h-10 bg-emerald-600 hover:bg-emerald-700 text-on-primary rounded-xl font-body-medium text-body-medium flex items-center justify-center gap-1 shadow-sm transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              <span className="truncate">{copiedWechat ? t('vehicle.wechatCopied') : 'WeChat'}</span>
            </button>
          ) : (
            <a
              href={vehicle.driverLine}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 bg-line-green hover:bg-line-green-hover text-on-primary rounded-xl font-body-medium text-body-medium flex items-center justify-center gap-1 shadow-sm transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              <span className="truncate">{t('vehicle.lineChat')}</span>
            </a>
          )}
        </div>

        {/* Details & Reviews Button */}
        <button
          type="button"
          onClick={() => onSelectDetail(vehicle)}
          className="w-full text-center text-body-subtext text-ink-muted dark:text-slate-400 hover:text-blue-action dark:hover:text-blue-400 pt-space-xs block font-body-medium transition-colors cursor-pointer"
        >
          {t('vehicle.detailsReviews')} +
        </button>
      </div>
    </div>
  );
});

VehicleCard.displayName = 'VehicleCard';
