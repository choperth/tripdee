'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { Vehicle, STANDARD_TERMS, SPONSORS } from '@/data/mockData';
import { maskPhoneNumber, maskPlateNumber, getPublicDriverName } from '@/lib/privacy';
import {
  X,
  Share2,
  Bookmark,
  CheckCircle2,
  Car,
  ChevronRight,
  QrCode,
  Star,
} from 'lucide-react';

import { useAnalytics } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';
import { BookingConfirmationSheet } from '@/components/BookingConfirmationSheet';
import { CustomerAvailabilitySchedule } from '@/components/CustomerAvailabilitySchedule';
import { getUpcomingBusyRanges } from '@/lib/availabilityUtils';
import { VehicleReviewsSection } from '@/components/reviews/VehicleReviewsSection';
import { DriverSmartECardModal } from '@/components/cards/DriverSmartECardModal';

interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  allVehicles?: Vehicle[];
  onSelectVehicle?: (vehicle: Vehicle) => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  onClose,
  allVehicles,
  onSelectVehicle,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, { onClose, enabled: !!vehicle });

  const { trackCall, trackSponsor } = useAnalytics();
  const { t, locale } = useLanguage();
  const [isPhoneRevealed, setIsPhoneRevealed] = useState<boolean>(false);
  const [showBookingSheet, setShowBookingSheet] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [showECardModal, setShowECardModal] = useState<boolean>(false);
  const [sharedToast, setSharedToast] = useState<boolean>(false);

  const upcomingRanges = React.useMemo(
    () => getUpcomingBusyRanges(vehicle?.busyDates || [], locale),
    [vehicle?.busyDates, locale]
  );

  const isSelfDrive = vehicle
    ? vehicle.rentalType === 'self_drive' || (vehicle.type !== 'van' && vehicle.rentalType !== 'with_driver')
    : false;

  const handleShare = () => {
    if (!vehicle) return;
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/#vehicle-${vehicle.id}`;
      navigator.clipboard.writeText(url);
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 2500);
    }
  };

  const handleDirectCall = () => {
    if (!vehicle) return;
    setIsPhoneRevealed(true);
    trackCall({
      targetType: 'vehicle_detail',
      targetId: vehicle.id,
      targetTitle: vehicle.title,
      phoneNumber: vehicle.driverPhone,
      driverName: vehicle.driverNickname,
    });
  };

  const cleanPhone = vehicle?.driverPhone ? vehicle.driverPhone.replace(/\D/g, '') : '';
  const companionVehicles = React.useMemo(() => {
    if (!vehicle || !allVehicles || allVehicles.length === 0) return [];
    return allVehicles.filter((v) => {
      if (v.id === vehicle.id) return false;
      const otherPhone = v.driverPhone ? v.driverPhone.replace(/\D/g, '') : '';
      return (
        (cleanPhone && otherPhone === cleanPhone) ||
        (vehicle.driverNickname && v.driverNickname === vehicle.driverNickname)
      );
    });
  }, [allVehicles, vehicle, cleanPhone]);

  if (!vehicle) return null;

  const basePrice = vehicle.zoneRates?.city || (isSelfDrive ? 1200 : 1900);
  const publicName = getPublicDriverName(vehicle.driverName, vehicle.driverNickname);
  const shortLocation = vehicle.location.split('/')[0].trim();
  const galleryImages =
    vehicle.images && vehicle.images.length > 0
      ? vehicle.images
      : ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80'];
  return (
    <div
      className="fixed inset-0 z-400 flex items-center justify-center overflow-y-auto bg-navy-deep/75 backdrop-blur-sm p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={vehicle.title}
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-800 shadow-2xl text-ink-primary dark:text-slate-100"
      >
        {/* Sticky Close Bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-space-md py-space-xs bg-paper-elevated/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-border-subtle dark:border-slate-800">
          <div className="flex items-center gap-1.5 sm:gap-2 text-body-subtext font-body-subtext text-ink-muted dark:text-slate-400 min-w-0">
            <span className="shrink-0">{t('detail.breadcrumbHome')}</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[80px] sm:max-w-none">{shortLocation}</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-navy-deep dark:text-white font-bold truncate">
              {publicName}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('auth.close')}
            className="w-8 h-8 rounded-full bg-paper-surface-muted dark:bg-slate-800 flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:bg-surface-variant transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-space-md lg:p-space-xl space-y-space-lg">
          {/* Top Guarantee Strip & Badges Bar (Stitch Redesign) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-sm border-b border-border-subtle/70 dark:border-slate-800">
            <div>
              <div className="flex flex-wrap items-center gap-space-xs mb-space-2xs">
                {isSelfDrive ? (
                  <span className="inline-flex items-center gap-space-2xs bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-space-xs py-[2px] rounded font-label-badge text-label-badge font-bold">
                    <Car className="w-3 h-3" />
                    <span>{t('detail.selfDriveBadge')}</span>
                  </span>
                ) : vehicle.plateType === 'yellow' ? (
                  <span className="inline-flex items-center gap-space-2xs bg-taxi-yellow-soft text-on-tertiary-fixed-variant dark:bg-amber-950/70 dark:text-amber-300 px-space-xs py-[2px] rounded font-label-badge text-label-badge font-bold border border-amber-300/40">
                    <span className="material-symbols-outlined text-[13px] text-amber-accent">
                      local_taxi
                    </span>
                    <span>{t('detail.yellowPlateLong')}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-space-2xs bg-blue-subtle text-blue-action dark:bg-blue-950 dark:text-blue-300 px-space-xs py-[2px] rounded font-label-badge text-label-badge font-bold">
                    <span>{t('vehicle.bluePlate')}</span>
                  </span>
                )}

                {vehicle.isVerified ? (
                  <span className="inline-flex items-center gap-space-2xs bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-slate-950 px-space-xs py-[2px] rounded font-label-badge text-label-badge font-black shadow-xs border border-amber-300">
                    <span className="material-symbols-outlined text-[13px] text-slate-950 font-bold">star</span>
                    <span>{t('detail.featuredBadge')}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-space-2xs bg-blue-subtle text-blue-action dark:bg-blue-950/70 dark:text-blue-300 px-space-xs py-[2px] rounded font-label-badge text-label-badge font-bold">
                    <span>{t('detail.standardListing')}</span>
                  </span>
                )}

                <span className="inline-flex items-center gap-space-2xs bg-blue-subtle text-blue-action dark:bg-blue-950/60 dark:text-blue-300 px-space-xs py-[2px] rounded font-label-badge text-label-badge font-bold">
                  <span className="material-symbols-outlined text-[13px]">handshake</span>
                  <span>{t('detail.zeroCommission')}</span>
                </span>
              </div>

              <h1 className="font-headline-xl text-headline-xl text-navy-deep dark:text-white tracking-tight">
                {vehicle.title}
              </h1>

              <div className="flex items-center flex-wrap gap-space-md text-body-subtext font-body-subtext text-ink-secondary dark:text-slate-300 mt-space-2xs">
                <a
                  href="#vehicle-reviews"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('vehicle-reviews')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center gap-space-2xs hover:opacity-80 transition-opacity cursor-pointer group"
                >
                  <span className="material-symbols-outlined text-[16px] text-amber-accent">
                    star
                  </span>
                  <strong className="text-navy-deep dark:text-white font-body-medium group-hover:underline">
                    {vehicle.rating}
                  </strong>
                  <span className="group-hover:underline">{t('detail.reviews', { n: vehicle.reviewCount })}</span>
                </a>
                <span>•</span>
                <span className="flex items-center gap-space-2xs">
                  <span className="material-symbols-outlined text-[16px] text-ink-muted">
                    pin_drop
                  </span>
                  <span>{t('detail.basedAt')} {vehicle.location}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-space-2xs text-verified-emerald">
                  <span className="material-symbols-outlined text-[16px]">shield_with_heart</span>
                  <span>{t('detail.insuranceFull')}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-space-xs self-start md:self-center shrink-0">
              <button
                type="button"
                onClick={() => setShowECardModal(true)}
                className="inline-flex items-center gap-space-2xs px-space-md py-space-xs bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:bg-surface-variant rounded-xl font-body-medium text-body-medium transition-all cursor-pointer"
                title="นามบัตรดิจิทัล & QR Code"
              >
                <QrCode className="w-4 h-4 text-amber-500" />
                <span>{t('ecard.btn')}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`inline-flex items-center gap-space-2xs px-space-md py-space-xs rounded-xl font-body-medium text-body-medium transition-all cursor-pointer ${
                  isBookmarked
                    ? 'bg-amber-accent text-white shadow-sm'
                    : 'bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:bg-surface-variant'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>{isBookmarked ? t('detail.saved') : t('detail.save')}</span>
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-space-2xs px-space-md py-space-xs bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:bg-surface-variant rounded-xl font-body-medium text-body-medium transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>{sharedToast ? t('detail.shared') : t('detail.share')}</span>
              </button>
            </div>
          </div>

          {/* Photo Gallery Bento Layout (Stitch Signature 5-photo bento) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm rounded-2xl overflow-hidden shadow-sm">
            {/* Large Feature Photo */}
            <div className="col-span-2 md:col-span-2 md:row-span-2 relative h-56 sm:h-64 md:h-[380px] bg-navy-deep group overflow-hidden">
              <Image
                src={galleryImages[0]}
                alt={vehicle.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-space-md left-space-md text-surface flex flex-col gap-1 pointer-events-none">
                <span className="bg-navy-deep/80 backdrop-blur-md px-space-xs py-1 rounded text-surface font-label-badge text-label-badge w-fit">
                  {t('detail.cabinCaption', { n: vehicle.seats })}
                </span>
                <p className="font-title-card text-title-card font-bold text-surface">
                  {publicName} • {t('detail.safetyChecked')}
                </p>
              </div>
            </div>

            {/* Grid Photo 2 */}
            <div className="relative h-40 md:h-[185px] overflow-hidden group bg-ink-primary">
              <Image
                src={galleryImages[1] || galleryImages[0]}
                alt={t('detail.photoInteriorAlt')}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-space-xs left-space-xs bg-navy-deep/80 backdrop-blur-md text-surface font-label-badge text-[10px] px-space-xs py-0.5 rounded">
                {t('detail.capKaraoke')}
              </span>
            </div>

            {/* Grid Photo 3 */}
            <div className="relative h-40 md:h-[185px] overflow-hidden group bg-ink-primary">
              <Image
                src={galleryImages[0]}
                alt={t('detail.photoExteriorAlt')}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-space-xs left-space-xs bg-taxi-yellow-soft text-on-tertiary-fixed-variant font-label-badge text-[10px] px-space-xs py-0.5 rounded font-bold">
                {vehicle.plateNumber ? maskPlateNumber(vehicle.plateNumber) : t('detail.plateLegal')}
              </span>
            </div>

            {/* Grid Photo 4 */}
            <div className="relative h-40 md:h-[185px] overflow-hidden group bg-ink-primary">
              <Image
                src={galleryImages[1] || galleryImages[0]}
                alt={t('detail.photoChargeAlt')}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-space-xs left-space-xs bg-navy-deep/80 backdrop-blur-md text-surface font-label-badge text-[10px] px-space-xs py-0.5 rounded">
                {t('detail.capCharge')}
              </span>
            </div>

            {/* Grid Photo 5 with View All overlay */}
            <div className="relative h-40 md:h-[185px] overflow-hidden group bg-navy-deep">
              <Image
                src={galleryImages[0]}
                alt={t('detail.viewAllPhotos', { n: galleryImages.length })}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-navy-deep/60 hover:bg-navy-deep/75 transition-colors flex items-center justify-center gap-space-xs text-surface font-body-medium text-body-medium">
                <span className="material-symbols-outlined text-[20px]">photo_library</span>
                <span>{t('detail.viewAllPhotos', { n: galleryImages.length })}</span>
              </div>
            </div>
          </div>

          {/* Main Content & Sticky Rail (8 Cols left, 4 Cols right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
            {/* Left Column: Specs, Driver Dossier, Amenities, Policies (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-space-xl">
              {/* Vehicle Core Highlights */}
              <section className="bg-paper-canvas dark:bg-slate-800/60 p-space-lg rounded-2xl border border-border-subtle dark:border-slate-700/70 space-y-space-md">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-blue-action font-label-badge text-label-badge uppercase tracking-wider">
                      {t('detail.eyebrowSpecs')}
                    </span>
                    <h2 className="font-headline-lg text-headline-lg text-navy-deep dark:text-white mt-1">
                      {t('detail.specsTitle')}
                    </h2>
                  </div>
                  <span className="px-space-md py-space-xs rounded-full bg-blue-subtle text-blue-action font-bold text-headline-md">
                    {t('vehicle.seats', { n: vehicle.seats })}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
                  <div className="p-space-sm bg-paper-elevated dark:bg-slate-900 rounded-xl flex flex-col gap-1 border border-border-subtle/70 dark:border-slate-800">
                    <span className="material-symbols-outlined text-blue-action text-[22px]">
                      airline_seat_recline_extra
                    </span>
                    <span className="text-ink-muted dark:text-slate-400 font-body-subtext">{t('detail.seatingPlan')}</span>
                    <span className="text-navy-deep dark:text-white font-title-card">{t('detail.vipSeats', { n: vehicle.seats })}</span>
                  </div>

                  <div className="p-space-sm bg-paper-elevated dark:bg-slate-900 rounded-xl flex flex-col gap-1 border border-border-subtle/70 dark:border-slate-800">
                    <span className="material-symbols-outlined text-blue-action text-[22px]">speed</span>
                    <span className="text-ink-muted dark:text-slate-400 font-body-subtext">{t('detail.engineLabel')}</span>
                    <span className="text-navy-deep dark:text-white font-title-card">2.8 GD Diesel Turbo</span>
                  </div>

                  <div className="p-space-sm bg-paper-elevated dark:bg-slate-900 rounded-xl flex flex-col gap-1 border border-border-subtle/70 dark:border-slate-800">
                    <span className="material-symbols-outlined text-blue-action text-[22px]">luggage</span>
                    <span className="text-ink-muted dark:text-slate-400 font-body-subtext">{t('detail.luggageLabel')}</span>
                    <span className="text-navy-deep dark:text-white font-title-card">{t('detail.luggageValue')}</span>
                  </div>

                  <div className="p-space-sm bg-paper-elevated dark:bg-slate-900 rounded-xl flex flex-col gap-1 border border-border-subtle/70 dark:border-slate-800">
                    <span className="material-symbols-outlined text-blue-action text-[22px]">local_gas_station</span>
                    <span className="text-ink-muted dark:text-slate-400 font-body-subtext">{t('detail.fuelLabel')}</span>
                    <span className="text-navy-deep dark:text-white font-title-card">ดีเซล B7 / B10</span>
                  </div>
                </div>

                <p className="font-body-base text-body-base text-ink-secondary dark:text-slate-300 leading-relaxed pt-1">
                  {vehicle.description}
                </p>
              </section>

              {/* Driver Dossier & Verified Documents */}
              <section className="bg-paper-canvas dark:bg-slate-800/60 p-space-lg rounded-2xl border border-border-subtle dark:border-slate-700/70 space-y-space-md">
                <div className="flex items-center gap-space-2xs">
                  <span className="material-symbols-outlined text-verified-emerald text-[22px]">
                    verified_user
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-navy-deep dark:text-white">
                    {t('detail.driverTitle')}
                  </h2>
                </div>

                <div className="p-space-md bg-paper-elevated dark:bg-slate-900 rounded-2xl border border-border-subtle dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md">
                  <div className="flex items-center gap-space-md">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-blue-subtle text-blue-action font-bold flex items-center justify-center text-2xl border-2 border-blue-action/30">
                        {publicName.charAt(0)}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                        <Star className="w-3.5 h-3.5 fill-white text-white" />
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline-md text-headline-md text-navy-deep dark:text-white">
                          {publicName}
                        </h3>
                        {vehicle.isVerified ? (
                          <span className="px-space-xs py-[2px] rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-label-badge font-bold border border-amber-400/40 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{t('detail.featuredBadge')}</span>
                          </span>
                        ) : (
                          <span className="px-space-xs py-[2px] rounded-full bg-blue-subtle text-blue-action dark:bg-blue-950/60 dark:text-blue-300 font-label-badge font-bold">
                            {t('detail.standardListing')}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowECardModal(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 font-label-badge font-bold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
                        >
                          <QrCode className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>{t('ecard.btn')}</span>
                        </button>
                      </div>
                      <p className="font-body-subtext text-body-subtext text-ink-muted dark:text-slate-400 mt-0.5">
                        {t('detail.driverExp', { loc: shortLocation })}
                      </p>
                      <div className="flex items-center gap-space-xs text-body-subtext text-ink-secondary dark:text-slate-300 mt-1">
                        <span>{t('detail.langLabel')} 🇹🇭 {t('detail.langTh')}</span>
                        {vehicle.languages?.includes('en') && <span>• 🇬🇧 {t('vehicle.langEn')}</span>}
                        {vehicle.languages?.includes('zh') && <span>• 🇨🇳 {t('vehicle.langZh')}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right border-t sm:border-t-0 pt-space-xs sm:pt-0 border-border-subtle w-full sm:w-auto">
                    <span className="text-body-subtext text-ink-muted dark:text-slate-400 block">
                      {t('detail.licenseLabel')}
                    </span>
                    <span className="font-body-medium text-navy-deep dark:text-white font-bold flex items-center gap-1 sm:justify-end">
                      <span className="material-symbols-outlined text-[16px] text-amber-500">
                        {vehicle.plateType === 'yellow' ? 'local_taxi' : 'directions_car'}
                      </span>
                      <span>
                        {vehicle.plateType === 'yellow'
                          ? t('detail.yellowPlateLong')
                          : t('detail.licenseOk')}
                      </span>
                    </span>
                  </div>
                </div>
              </section>

              {/* 1.3 Driver Availability & Booked Dates Calendar */}
              <CustomerAvailabilitySchedule
                busyDates={vehicle.busyDates}
                isAvailable={vehicle.isAvailable !== false}
                driverPhone={vehicle.driverPhone}
                driverNickname={vehicle.driverNickname}
              />

              {/* Customer Reviews & Ratings */}
              <VehicleReviewsSection vehicle={vehicle} />

              {/* Amenity Spec Checklist */}
              <section className="bg-paper-canvas dark:bg-slate-800/60 p-space-lg rounded-2xl border border-border-subtle dark:border-slate-700/70 space-y-space-md">
                <h2 className="font-headline-lg text-headline-lg text-navy-deep dark:text-white">
                  {t('detail.amenities')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
                  {vehicle.amenities.map((item) => (
                    <div
                      key={item}
                      className="p-space-xs px-space-sm rounded-xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle/70 dark:border-slate-800 flex items-center gap-space-xs text-body-base"
                    >
                      <span className="material-symbols-outlined text-verified-emerald text-[20px] shrink-0">
                        check_circle
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Transparent Pricing Breakdown Table by Zones */}
              <section className="bg-paper-canvas dark:bg-slate-800/60 p-space-lg rounded-2xl border border-border-subtle dark:border-slate-700/70 space-y-space-md">
                <h2 className="font-headline-lg text-headline-lg text-navy-deep dark:text-white">
                  {t('detail.ratesTitle')}
                </h2>

                <div className="overflow-hidden rounded-xl border border-border-subtle dark:border-slate-700 bg-paper-elevated dark:bg-slate-900">
                  <table className="w-full text-left font-body-base text-body-base">
                    <thead className="bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 font-label-badge text-label-badge uppercase">
                      <tr>
                        <th className="p-space-sm">{t('detail.colZone')}</th>
                        <th className="p-space-sm">{t('detail.colRoute')}</th>
                        <th className="p-space-sm text-right">{t('detail.colPrice')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle dark:divide-slate-800">
                      <tr>
                        <td className="p-space-sm font-bold text-navy-deep dark:text-white">
                          {t('detail.zoneLine', { no: 1, label: t('zone.city.label') })}
                        </td>
                        <td className="p-space-sm text-ink-secondary dark:text-slate-400">ตัวเมือง, สนามบิน, วัดพระธาตุดอยสุเทพ</td>
                        <td className="p-space-sm text-right font-bold text-blue-action">
                          ฿{(vehicle.zoneRates?.city || 1900).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-space-sm font-bold text-navy-deep dark:text-white">
                          {t('detail.zoneLine', { no: 2, label: t('zone.midHill.label') })}
                        </td>
                        <td className="p-space-sm text-ink-secondary dark:text-slate-400">ม่อนแจ่ม, แม่ริม, สวนพฤกษศาสตร์, แม่กำปอง</td>
                        <td className="p-space-sm text-right font-bold text-blue-action">
                          ฿{(vehicle.zoneRates?.midHill || 2100).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-space-sm font-bold text-navy-deep dark:text-white">
                          {t('detail.zoneLine', { no: 3, label: t('zone.highHill.label') })}
                        </td>
                        <td className="p-space-sm text-ink-secondary dark:text-slate-400">ดอยอินทนนท์, กิ่วแม่ปาน, ดอยอ่างขาง, เชียงราย</td>
                        <td className="p-space-sm text-right font-bold text-blue-action">
                          ฿{(vehicle.zoneRates?.highHill || 2300).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-space-xs text-body-subtext text-ink-secondary dark:text-slate-400">
                  <div className="p-space-sm rounded-xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle/70 dark:border-slate-800 space-y-1">
                    <span className="font-bold text-navy-deep dark:text-white block">{t('detail.hoursTitle')}</span>
                    <p>• {t('detail.termsHours', { h: 10, start: '08:00', end: '18:00', rate: `${STANDARD_TERMS.overtimeRatePerHour} ฿` })}</p>
                  </div>
                  <div className="p-space-sm rounded-xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle/70 dark:border-slate-800 space-y-1">
                    <span className="font-bold text-navy-deep dark:text-white block">{t('detail.stayTitle')}</span>
                    <p>• {t('detail.termsStay', { rate: `${STANDARD_TERMS.overnightStayRate} ฿` })}</p>
                    <p>• {t('terms.fuelNote')}</p>
                  </div>
                </div>
              </section>

              {/* Other Fleet Vehicles of this Driver */}
              {companionVehicles.length > 0 && (
                <section className="bg-blue-50/50 dark:bg-slate-800/50 p-space-lg rounded-2xl border border-blue-200/70 dark:border-slate-700/80 space-y-space-md">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h2 className="font-headline-lg text-headline-lg text-navy-deep dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-action dark:text-blue-400">garage_home</span>
                        <span>{t('detail.fleetTitle', { name: publicName })}</span>
                      </h2>
                      <p className="text-body-subtext text-ink-muted dark:text-slate-400 mt-1">
                        {t('detail.fleetDesc', { n: companionVehicles.length })}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-action dark:text-blue-300 font-bold text-xs">
                      {t('detail.fleetTotal', { n: companionVehicles.length + 1 })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-1">
                    {companionVehicles.map((comp) => {
                      const compIsSelfDrive = comp.rentalType === 'self_drive' || (comp.type !== 'van' && comp.rentalType !== 'with_driver');
                      const compBasePrice = comp.zoneRates?.city || (compIsSelfDrive ? 1200 : 1900);

                      return (
                        <div
                          key={comp.id}
                          className="p-3 rounded-xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-800 shadow-xs hover:border-blue-action/40 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="relative h-28 w-full rounded-lg overflow-hidden bg-navy-deep mb-2">
                              <Image
                                src={comp.images[0]}
                                alt={comp.title}
                                fill
                                sizes="(max-width: 640px) 100vw, 250px"
                                className="object-cover"
                              />
                              <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                                <span className="px-1.5 py-0.5 rounded bg-navy-deep/90 text-white text-[10px] font-bold">
                                  {t('vehicle.seats', { n: comp.seats })}
                                </span>
                                {comp.plateType === 'yellow' ? (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-400 text-amber-950 text-[10px] font-bold">
                                    {t('hero.quickYellow')}
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">
                                    {t('fleet.plateBlue')}
                                  </span>
                                )}
                              </div>
                            </div>

                            <h3 className="font-bold text-sm text-navy-deep dark:text-white line-clamp-1 mb-1">
                              {comp.title}
                            </h3>
                            <p className="text-xs text-ink-muted dark:text-slate-400 truncate mb-2">
                              {comp.amenities.slice(0, 2).join(' • ')}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-border-subtle/70 dark:border-slate-800 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-ink-muted dark:text-slate-400 block">{t('detail.fromPrice')}</span>
                              <span className="text-xs font-bold text-blue-action dark:text-blue-400">
                                ฿{compBasePrice.toLocaleString()}{t('vehicle.perDay')}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectVehicle) {
                                  onSelectVehicle(comp);
                                  dialogRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-blue-action hover:bg-blue-action-hover text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                              {t('detail.switchTo')}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column: Sticky Booking & Direct Actions (4 cols) */}
            <div className="lg:col-span-4 sticky top-24 space-y-space-md">
              <div className="bg-paper-canvas dark:bg-slate-800/80 rounded-3xl p-space-lg border border-border-subtle dark:border-slate-700 shadow-xl space-y-space-md">
                <div>
                  <span className="font-body-subtext text-body-subtext text-ink-muted dark:text-slate-400 block">
                    {t('vehicle.priceFrom')}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-price-headline text-[32px] font-black text-navy-deep dark:text-white leading-tight">
                      ฿{basePrice.toLocaleString()}
                    </span>
                    <span className="text-body-base text-ink-muted dark:text-slate-400">{t('vehicle.perDay')}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-body-subtext">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>{t('vehicle.noCommission')}</span>
                    </span>
                    <a
                      href="#vehicle-reviews"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('vehicle-reviews')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-xs text-ink-muted hover:text-blue-action dark:text-slate-400 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer font-medium transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px] text-amber-accent">star</span>
                      <span>{vehicle.rating} ({vehicle.reviewCount})</span>
                    </a>
                  </div>
                </div>

                {/* Upcoming Busy Dates Alert Pill */}
                {upcomingRanges.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                    <span className="truncate">
                      {t('cal.cardUpcomingBusy', { range: upcomingRanges[0].label })}
                      {upcomingRanges.length > 1 && ` (+${upcomingRanges.length - 1})`}
                    </span>
                  </div>
                )}

                {/* Instant Action Dual Triggers */}
                <div className="space-y-space-xs">
                  <a
                    href={`tel:${vehicle.driverPhone}`}
                    onClick={handleDirectCall}
                    className="w-full h-12 bg-navy-deep hover:bg-navy-surface text-on-primary rounded-xl font-title-card text-title-card flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[20px]">call</span>
                    <span>
                      {isPhoneRevealed
                        ? vehicle.driverPhone
                        : t('detail.callDriver', { phone: maskPhoneNumber(vehicle.driverPhone) })}
                    </span>
                  </a>

                  <a
                    href={vehicle.driverLine}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-12 bg-line-green hover:bg-line-green-hover text-on-primary rounded-xl font-title-card text-title-card flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[20px]">chat</span>
                    <span>{t('detail.lineAsk')}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowBookingSheet(true)}
                    className="w-full h-11 bg-blue-action hover:bg-blue-action-hover text-on-primary rounded-xl font-body-medium text-body-medium flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    <span>{t('detail.requestBooking')}</span>
                  </button>
                </div>

                {/* Trust Guarantee Box */}
                <div className="p-space-sm rounded-xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle/70 dark:border-slate-800 space-y-1 text-body-subtext text-ink-secondary dark:text-slate-400">
                  <div className="flex items-center gap-1 text-navy-deep dark:text-white font-bold">
                    <span className="material-symbols-outlined text-[16px] text-verified-emerald">
                      shield
                    </span>
                    <span>{t('detail.guaranteeTitle')}</span>
                  </div>
                  <p>{t('detail.guarantee1')}</p>
                  <p>{t('detail.guarantee2')}</p>
                </div>

                {/* Traveler Partner Perk Sponsor Box */}
                {SPONSORS[2] && (
                  <div className="p-space-sm rounded-2xl bg-gradient-to-br from-amber-50/70 via-paper-elevated to-paper-canvas dark:from-amber-950/25 dark:via-slate-900 dark:to-slate-900 border border-amber-300/50 dark:border-amber-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-amber-600 dark:text-amber-400">verified</span>
                        <span>สิทธิพิเศษผู้เดินทาง</span>
                      </span>
                      <span className="text-[10px] text-ink-muted dark:text-slate-400">พันธมิตร TripDee</span>
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs text-navy-deep dark:text-white leading-tight">
                        {SPONSORS[2].title}
                      </h4>
                      <p className="text-[11px] text-ink-secondary dark:text-slate-300 line-clamp-2">
                        {SPONSORS[2].tagline}
                      </p>
                    </div>

                    <a
                      href={SPONSORS[2].link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        trackSponsor({
                          sponsorId: SPONSORS[2].id,
                          sponsorTitle: SPONSORS[2].title,
                          category: SPONSORS[2].category,
                          variant: 'card',
                          targetUrl: SPONSORS[2].link,
                        });
                      }}
                      className="w-full py-1.5 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-600 text-amber-950 font-bold text-xs flex items-center justify-center gap-1 transition-colors shadow-xs"
                    >
                      <span className="truncate">{SPONSORS[2].discountText}</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Confirmation Sheet */}
      {showBookingSheet && (
        <BookingConfirmationSheet
          vehicle={vehicle}
          onClose={() => setShowBookingSheet(false)}
        />
      )}

      {/* Driver Smart E-Card Modal */}
      <DriverSmartECardModal
        vehicle={vehicle}
        isOpen={showECardModal}
        onClose={() => setShowECardModal(false)}
      />
    </div>
  );
};
