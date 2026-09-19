'use client';

import React from 'react';
import Image from 'next/image';
import { Phone, MessageCircle, ChevronRight, Zap } from 'lucide-react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';
import type { Vehicle } from '@/data/mockData';
import { getPublicDriverName } from '@/lib/privacy';

interface MobileBottomBarProps {
  activeVehicle?: Vehicle | null;
  onOpenDetail?: (vehicle: Vehicle) => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  activeVehicle,
  onOpenDetail,
}) => {
  const { trackCall } = useAnalytics();
  const { t, locale } = useLanguage();

  const handleCall = () => {
    if (activeVehicle) {
      trackCall({
        targetType: 'vehicle_detail',
        targetId: activeVehicle.id,
        targetTitle: activeVehicle.title,
        phoneNumber: activeVehicle.driverPhone,
        driverName: activeVehicle.driverNickname,
      });
    } else {
      trackCall({
        targetType: 'admin_fleet',
        targetId: 'mobile_bottom_bar_coordinator',
        targetTitle: 'Mobile Coordinator Hotline',
        phoneNumber: '053-000-000',
      });
    }
  };
  const callTel = activeVehicle ? `tel:${activeVehicle.driverPhone}` : 'tel:053000000';
  const driverDisplayName = activeVehicle
    ? getPublicDriverName(activeVehicle.driverName, activeVehicle.driverNickname)
    : null;

  const isSelfDrive = activeVehicle
    ? activeVehicle.rentalType === 'self_drive' ||
      (activeVehicle.type !== 'van' && activeVehicle.rentalType !== 'with_driver')
    : false;
  const basePrice = activeVehicle?.zoneRates?.city || (isSelfDrive ? 1200 : 1900);

  // Driver chat URLs
  const lineUrl = activeVehicle?.driverLine
    ? activeVehicle.driverLine
    : 'https://line.me/R/ti/p/@tripdee';

  const whatsappUrl = activeVehicle?.driverWhatsapp
    ? activeVehicle.driverWhatsapp
    : activeVehicle?.driverPhone
      ? `https://wa.me/66${activeVehicle.driverPhone.replace(/^0/, '').replace(/\D/g, '')}`
      : 'https://wa.me/6653000000';

  return (
    <aside
      aria-label={t('mbar.aria')}
      className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 sm:pb-6 pt-2 pointer-events-none md:hidden transition-transform duration-200"
    >
      {/* Floating Frosted Glass Capsule / Pill Dock */}
      <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-3 border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_40px_-10px_rgba(15,23,42,0.2)] dark:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.6)]">
        {/* Vehicle & Driver Status Micro-Bar (Top row of dock) */}
        {activeVehicle ? (
          <button
            type="button"
            onClick={() => onOpenDetail?.(activeVehicle)}
            aria-label={t('mbar.openDetailAria')}
            className="flex w-full items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/70 dark:border-slate-800/80 cursor-pointer hover:opacity-90 transition-opacity text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              {/* Miniature Driver Avatar with Verified Indicator */}
              <div className="relative flex-shrink-0">
                <Image
                  src={
                    activeVehicle.images?.[0] ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                  }
                  alt={driverDisplayName || t('mbar.driverFallback')}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover border-2 border-amber-500 shadow-xs"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
              </div>
              {/* Driver name and plate badge */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {driverDisplayName || t('mbar.driverFallback')}
                  </span>
                  <span className="text-[9px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950 px-1 py-0.2 rounded border border-amber-300/40">
                    ★ 5.0
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-0.5 font-semibold text-amber-800 dark:text-amber-400 truncate">
                    {isSelfDrive ? (
                      t('mbar.selfDrive')
                    ) : activeVehicle.plateType === 'yellow' ? (
                      <span>🟡 Yellow Plate 30</span>
                    ) : (
                      <span>{t('mbar.bluePlate')}</span>
                    )}
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Upfront Direct Daily Rate */}
            <div className="text-right flex-shrink-0 pl-2">
              <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                  ฿{basePrice.toLocaleString()}
                </span>
                <span className="text-[10px] font-medium text-slate-400 font-normal">{t('vehicle.perDay')}</span>
              </div>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded">
                {t('mbar.zeroComm')}
              </span>
            </div>
          </button>
        ) : (
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/70 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {t('mbar.hotline')}
              </span>
            </div>
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">
              {t('mbar.directDeal')}
            </span>
          </div>
        )}

        {/* Two High-Conversion Action Targets (Min Height 44px, Ergonomic Touch Grid) */}
        <div className="grid grid-cols-2 gap-2">
          {/* Primary Action: Direct Phone Call */}
          <a
            href={callTel}
            onClick={handleCall}
            className="h-11 flex items-center justify-center gap-1.5 px-3 rounded-2xl bg-navy-deep hover:bg-navy-surface active:scale-[0.98] text-white text-xs font-bold shadow-md transition-all select-none"
          >
            <Phone className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
            <span className="truncate">
              {activeVehicle
                ? t('mbar.callDriver', { name: activeVehicle.driverNickname || t('mbar.driverFallback') })
                : t('mbar.callTeam')}
            </span>
          </a>

          {/* Secondary Action: Official LINE Chat or WhatsApp */}
          {locale === 'en' ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 flex items-center justify-center gap-1.5 px-3 rounded-2xl bg-whatsapp hover:brightness-95 active:scale-[0.98] text-white text-xs font-bold shadow-md transition-all select-none"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">WhatsApp Driver</span>
            </a>
          ) : (
            <a
              href={lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 flex items-center justify-center gap-1.5 px-3 rounded-2xl bg-line hover:bg-line-deep active:scale-[0.98] text-white text-xs font-bold shadow-md transition-all select-none"
            >
              {/* LINE Custom Speech Bubble Icon */}
              <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                <path d="M21.9 10.4c0-4.6-4.5-8.4-10-8.4s-10 3.8-10 8.4c0 4.1 3.6 7.6 8.5 8.3.3.1.8.2.9.6.1.3.1.8 0 1.2l-.3 1.6c-.1.5-.4 1.9 1.6 1 2.1-.9 5.6-3.3 7.6-5.7 1.1-1.3 1.7-2.6 1.7-4z" />
              </svg>
              <span className="truncate">{activeVehicle ? t('mbar.lineDriver') : t('mbar.lineOfficial')}</span>
            </a>
          )}
        </div>

        {/* Micro reassurance label */}
        <div className="mt-2 flex items-center justify-center gap-1 text-[9px] text-slate-500 dark:text-slate-400 text-center">
          <Zap className="w-3 h-3 text-amber-500 shrink-0" />
          <span>{t('mbar.reassurance')}</span>
        </div>
      </div>

      {/* iOS Home Indicator bar */}
      <div className="w-28 h-1 bg-slate-900/30 dark:bg-white/30 rounded-full mx-auto mt-2 pointer-events-none" />
    </aside>
  );
};
