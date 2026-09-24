'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { Vehicle } from '@/data/mockData';
import { vehicleTitle, vehicleLocation, vehicleAmenities } from '@/data/vehicleI18n';
import { maskPhoneNumber, getPublicDriverName } from '@/lib/privacy';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';
import { X, Phone, MessageSquare, ExternalLink, Star, Users } from 'lucide-react';

interface DriverFleetModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverPhone: string;
  driverName: string;
  fleetVehicles: Vehicle[];
  onSelectVehicleDetail: (vehicle: Vehicle) => void;
  onFilterFleetOnHome?: (keyword: string) => void;
}

export const DriverFleetModal: React.FC<DriverFleetModalProps> = ({
  isOpen,
  onClose,
  driverPhone,
  driverName,
  fleetVehicles,
  onSelectVehicleDetail,
  onFilterFleetOnHome,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, { onClose, enabled: isOpen });
  const { trackCall } = useAnalytics();
  const { t, locale } = useLanguage();

  if (!isOpen || fleetVehicles.length === 0) return null;

  const leadVehicle = fleetVehicles[0];
  const publicDriverName = driverName || getPublicDriverName(leadVehicle.driverName, leadVehicle.driverNickname);
  const locationText = vehicleLocation(leadVehicle, locale);
  const rating = leadVehicle.rating || 5.0;
  const reviewCount = fleetVehicles.reduce((acc, v) => acc + (v.reviewCount || 0), 0);

  const handleCall = (v: Vehicle) => {
    trackCall({
      targetType: 'driver_fleet',
      targetId: v.id,
      targetTitle: `${publicDriverName} (${vehicleTitle(v, locale)})`,
      phoneNumber: v.driverPhone,
      driverName: publicDriverName,
    });
  };

  const handleFilterHome = () => {
    if (onFilterFleetOnHome) {
      onFilterFleetOnHome(publicDriverName);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-400 flex items-center justify-center overflow-y-auto bg-navy-deep/80 backdrop-blur-sm p-3 sm:p-5 animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fleet-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-3xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-800 shadow-2xl text-ink-primary dark:text-slate-100 overflow-hidden"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-navy-deep text-white border-b border-navy-surface">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/40 text-white font-bold text-xl flex items-center justify-center shrink-0">
              {publicDriverName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="fleet-modal-title" className="font-headline-md text-lg sm:text-xl font-bold text-white truncate">
                  {publicDriverName}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-xs font-semibold flex items-center gap-1 border border-blue-400/30">
                  <span className="material-symbols-outlined text-[14px]">garage_home</span>
                  <span>{t('fleet.count', { n: fleetVehicles.length })}</span>
                </span>
                {leadVehicle.isVerified && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-xs font-semibold flex items-center gap-1 border border-amber-400/40">
                    <span className="material-symbols-outlined text-[14px] text-amber-300">star</span>
                    <span>{t('fleet.verified')}</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 truncate mt-0.5">
                {locationText} • {t('fleet.phone', { phone: maskPhoneNumber(driverPhone || leadVehicle.driverPhone) })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('auth.close')}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fleet Description Subhead */}
        <div className="px-4 sm:px-6 py-3 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between gap-3 text-xs sm:text-sm text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[18px]">verified</span>
            <span>{t('fleet.trustNote')}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-500 shrink-0 font-bold">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{rating}</span>
            <span className="text-ink-muted dark:text-slate-400 text-xs font-normal">({t('detail.reviews', { n: reviewCount })})</span>
          </div>
        </div>

        {/* Vehicle List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fleetVehicles.map((vehicle) => {
              const isSelfDrive = vehicle.rentalType === 'self_drive' || (vehicle.type !== 'van' && vehicle.rentalType !== 'with_driver');
              const basePrice = vehicle.zoneRates?.city || (isSelfDrive ? 1200 : 1900);

              return (
                <div
                  key={vehicle.id}
                  className="rounded-2xl border border-border-subtle dark:border-slate-800 bg-paper-canvas dark:bg-slate-800/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Thumbnail Image */}
                    <div className="relative h-40 w-full overflow-hidden bg-navy-deep group cursor-pointer" onClick={() => { onSelectVehicleDetail(vehicle); onClose(); }}>
                      <Image
                        src={vehicle.images[0]}
                        alt={vehicleTitle(vehicle, locale)}
                        fill
                        sizes="(max-width: 768px) 100vw, 360px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/80 via-transparent to-transparent" />
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded bg-navy-deep/90 text-white text-[11px] font-bold">
                          {t('vehicle.seats', { n: vehicle.seats })}
                        </span>
                        {vehicle.plateType === 'yellow' ? (
                          <span className="px-2 py-0.5 rounded bg-amber-400 text-amber-950 text-[11px] font-bold">
                            {t('hero.quickYellow')}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[11px] font-bold">
                            {t('fleet.plateBlue')}
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-2 left-3 right-3 text-white">
                        <span className="text-xs font-bold text-amber-300">
                          {t('fleet.fromPrice', { price: basePrice.toLocaleString() })}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-3.5 space-y-2">
                      <h3
                        onClick={() => { onSelectVehicleDetail(vehicle); onClose(); }}
                        className="font-bold text-sm text-navy-deep dark:text-white line-clamp-2 hover:text-blue-action cursor-pointer"
                      >
                        {vehicleTitle(vehicle, locale)}
                      </h3>

                      {/* Amenities (first 2) */}
                      <div className="flex flex-wrap gap-1">
                        {vehicleAmenities(vehicle, locale).slice(0, 2).map((amenity) => (
                          <span
                            key={amenity}
                            className="px-2 py-0.5 rounded-md bg-paper-surface-muted dark:bg-slate-700/60 text-ink-secondary dark:text-slate-300 text-[11px] truncate max-w-[180px]"
                          >
                            ✓ {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-3.5 pt-0 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectVehicleDetail(vehicle);
                        onClose();
                      }}
                      className="w-full h-9 rounded-xl bg-blue-action/10 dark:bg-blue-400/20 hover:bg-blue-action hover:text-white dark:hover:bg-blue-500 text-blue-action dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t('fleet.viewSpec')}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-1.5">
                      <a
                        href={`tel:${vehicle.driverPhone}`}
                        onClick={() => handleCall(vehicle)}
                        className="h-8 rounded-lg bg-navy-deep hover:bg-navy-surface text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{t('fleet.callDirect')}</span>
                      </a>
                      <a
                        href={vehicle.driverLine}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 rounded-lg bg-line-green hover:bg-line-green-hover text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>{t('vehicle.lineChat')}</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with Filter Shortcut */}
        <div className="p-3 sm:p-4 bg-paper-canvas dark:bg-slate-800/90 border-t border-border-subtle dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          {onFilterFleetOnHome && (
            <button
              type="button"
              onClick={handleFilterHome}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-action hover:underline cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{t('fleet.showOnly', { name: publicDriverName })}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-4 py-2 rounded-xl bg-paper-surface-muted hover:bg-border-subtle dark:bg-slate-700 dark:hover:bg-slate-600 text-ink-primary dark:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {t('auth.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
