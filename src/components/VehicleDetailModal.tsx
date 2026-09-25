'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { Vehicle, STANDARD_TERMS, SPONSORS } from '@/data/mockData';
import {
  vehicleTitle,
  vehicleLocation,
  vehicleAmenities,
  vehicleDescription,
} from '@/data/vehicleI18n';
import { maskPhoneNumber, maskPlateNumber, getPublicDriverName } from '@/lib/privacy';
import {
  X,
  Share2,
  Bookmark,
  Car,
  ChevronRight,
  QrCode,
  Star,
} from 'lucide-react';

import { useAnalytics } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';
import { getLocalizedSponsor } from '@/lib/sponsorLocalization';
import { BookingConfirmationSheet } from '@/components/BookingConfirmationSheet';
import { CustomerAvailabilitySchedule } from '@/components/CustomerAvailabilitySchedule';
import { getUpcomingBusyRanges } from '@/lib/availabilityUtils';
import { VehicleReviewsSection } from '@/components/reviews/VehicleReviewsSection';
import { DriverSmartECardModal } from '@/components/cards/DriverSmartECardModal';
import { formatLineLink, buildVehicleLineMessage } from '@/lib/contactUtils';

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
  const [copiedWechat, setCopiedWechat] = useState<boolean>(false);
  const [copiedKakao, setCopiedKakao] = useState<boolean>(false);
  const [channelNotice, setChannelNotice] = useState<string | null>(null);

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
      targetTitle: vehicleTitle(vehicle, locale),
      phoneNumber: vehicle.driverPhone,
      driverName: vehicle.driverNickname,
    });
  };

  const cleanPhone = vehicle?.driverPhone ? vehicle.driverPhone.replace(/\D/g, '') : '';

  const whatsappUrl = React.useMemo(() => {
    if (!vehicle) return null;
    if (vehicle.driverWhatsapp && vehicle.driverWhatsapp.trim()) {
      if (vehicle.driverWhatsapp.startsWith('http')) return vehicle.driverWhatsapp;
      const clean = vehicle.driverWhatsapp.replace(/\D/g, '');
      return `https://wa.me/${clean}`;
    }
    if (cleanPhone) {
      const intlPhone = cleanPhone.startsWith('0') ? `66${cleanPhone.slice(1)}` : cleanPhone;
      return `https://wa.me/${intlPhone}`;
    }
    return null;
  }, [vehicle, cleanPhone]);

  const handleCopyWechat = () => {
    if (!vehicle) return;
    if (vehicle.driverWechat) {
      if (typeof window !== 'undefined') {
        navigator.clipboard.writeText(vehicle.driverWechat);
        setCopiedWechat(true);
        setChannelNotice(t('detail.wechatCopied', { id: vehicle.driverWechat }));
        setTimeout(() => setCopiedWechat(false), 2500);
        setTimeout(() => setChannelNotice(null), 3000);
      }
    } else {
      setChannelNotice(t('detail.wechatMissing'));
      setTimeout(() => setChannelNotice(null), 3500);
    }
  };

  const handleCopyKakao = () => {
    if (!vehicle) return;
    if (vehicle.driverKakao) {
      if (typeof window !== 'undefined') {
        navigator.clipboard.writeText(vehicle.driverKakao);
        setCopiedKakao(true);
        setChannelNotice(t('detail.kakaoCopied', { id: vehicle.driverKakao }));
        setTimeout(() => setCopiedKakao(false), 2500);
        setTimeout(() => setChannelNotice(null), 3000);
      }
    } else {
      setChannelNotice(t('detail.kakaoMissing'));
      setTimeout(() => setChannelNotice(null), 3500);
    }
  };
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
  const title = vehicleTitle(vehicle, locale);
  const location = vehicleLocation(vehicle, locale);
  const amenities = vehicleAmenities(vehicle, locale);
  const description = vehicleDescription(vehicle, locale);
  const shortLocation = location.split('/')[0].trim();
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
        aria-label={title}
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
                {title}
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
                  <span>{t('detail.basedAt')} {location}</span>
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
                title={t('vdm.ecardTitle')}
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
                alt={title}
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
                    <span className="text-navy-deep dark:text-white font-title-card">{t('vdm.diesel')}</span>
                  </div>
                </div>

                <p className="font-body-base text-body-base text-ink-secondary dark:text-slate-300 leading-relaxed pt-1">
                  {description}
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
                  {amenities.map((item) => (
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
                        <td className="p-space-sm text-ink-secondary dark:text-slate-400">{t('vdm.routeCity')}</td>
                        <td className="p-space-sm text-right font-bold text-blue-action">
                          ฿{(vehicle.zoneRates?.city || 1900).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-space-sm font-bold text-navy-deep dark:text-white">
                          {t('detail.zoneLine', { no: 2, label: t('zone.midHill.label') })}
                        </td>
                        <td className="p-space-sm text-ink-secondary dark:text-slate-400">{t('vdm.routeMid')}</td>
                        <td className="p-space-sm text-right font-bold text-blue-action">
                          ฿{(vehicle.zoneRates?.midHill || 2100).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-space-sm font-bold text-navy-deep dark:text-white">
                          {t('detail.zoneLine', { no: 3, label: t('zone.highHill.label') })}
                        </td>
                        <td className="p-space-sm text-ink-secondary dark:text-slate-400">{t('vdm.routeHigh')}</td>
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

                {/* ช่องทางติดต่อด่วน (Direct Channels) */}
                <div className="p-3.5 rounded-2xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-800 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-navy-deep dark:text-white">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{t('detail.directChannels')}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      {t('detail.directDeal')}
                    </span>
                  </div>

                  {/* Primary Direct Triggers: Phone & LINE */}
                  <div className="space-y-2">
                    <a
                      href={`tel:${vehicle.driverPhone}`}
                      onClick={handleDirectCall}
                      className="w-full h-11 bg-navy-deep hover:bg-navy-surface text-white rounded-xl font-title-card text-title-card flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[19px]">call</span>
                      <span>
                        {isPhoneRevealed
                          ? vehicle.driverPhone
                          : t('detail.callDriver', { phone: maskPhoneNumber(vehicle.driverPhone) })}
                      </span>
                    </a>

                    <a
                      href={formatLineLink(vehicle.driverLine, buildVehicleLineMessage(vehicle))}
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(buildVehicleLineMessage(vehicle)).catch(() => {});
                        }
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-11 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl font-title-card text-title-card flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                    >
                      <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 5.92 2 10.75c0 3.08 1.83 5.79 4.6 7.29-.2.74-.74 2.68-.85 3.08-.13.48.18.47.37.35.15-.09 2.06-1.39 2.87-1.95.66.19 1.34.29 2.01.29 5.52 0 10-3.92 10-8.76S17.52 2 12 2z"/>
                      </svg>
                      <span>{t('detail.lineAsk')}</span>
                    </a>
                  </div>

                  {/* Direct International Messaging Bar: WhatsApp, WeChat, KakaoTalk (Icon Only) */}
                  <div className="grid grid-cols-3 gap-2 pt-0.5">
                    {/* 🟢 WhatsApp Direct Chat (Icon only) */}
                    {whatsappUrl ? (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-11 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title={t('detail.whatsappHint')}
                        aria-label="WhatsApp"
                      >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                        </svg>
                      </a>
                    ) : null}

                    {/* 🟢 WeChat (Icon only - Click to Copy ID) */}
                    <button
                      type="button"
                      onClick={handleCopyWechat}
                      className="h-11 rounded-xl bg-[#07C160] hover:bg-[#06ab55] text-white flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer relative"
                      title={vehicle.driverWechat ? t('detail.wechatCopyHint', { id: vehicle.driverWechat }) : t('detail.wechatEmptyHint')}
                      aria-label="WeChat"
                    >
                      {copiedWechat ? (
                        <span className="material-symbols-outlined text-[20px] text-white animate-scale-in">check</span>
                      ) : (
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M8.5 2C3.8 2 0 5.4 0 9.5c0 2.4 1.3 4.5 3.3 5.9-.2.8-.7 2.6-.8 3 .2 0 1.9-.8 3.1-1.5.9.3 1.9.4 2.9.4 4.7 0 8.5-3.4 8.5-7.5S13.2 2 8.5 2zm-2.2 4.5c.7 0 1.2.6 1.2 1.2s-.6 1.2-1.2 1.2c-.7 0-1.2-.6-1.2-1.2s.5-1.2 1.2-1.2zm4.4 0c.7 0 1.2.6 1.2 1.2s-.6 1.2-1.2 1.2c-.7 0-1.2-.6-1.2-1.2s.5-1.2 1.2-1.2zM17 10c-3.6 0-6.5 2.5-6.5 5.5s2.9 5.5 6.5 5.5c.7 0 1.5-.1 2.2-.4.9.5 2.3 1.1 2.4 1.1-.1-.3-.4-1.6-.6-2.2 1.5-1.1 2.5-2.6 2.5-4 0-3-2.9-5.5-6.5-5.5zm-2.5 3.5c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9zm5 0c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9z"/>
                        </svg>
                      )}
                    </button>

                    {/* 🟡 KakaoTalk (Icon only - Click to Copy ID) */}
                    <button
                      type="button"
                      onClick={handleCopyKakao}
                      className="h-11 rounded-xl bg-[#FEE500] hover:bg-[#ebd300] text-[#191919] flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer relative"
                      title={vehicle.driverKakao ? t('detail.kakaoCopyHint', { id: vehicle.driverKakao }) : t('detail.kakaoEmptyHint')}
                      aria-label="KakaoTalk"
                    >
                      {copiedKakao ? (
                        <span className="material-symbols-outlined text-[20px] text-[#191919] animate-scale-in">check</span>
                      ) : (
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 3c-5.523 0-10 3.582-10 8 0 2.87 1.905 5.39 4.781 6.745-.21.776-.763 2.793-.873 3.226-.138.54.197.533.414.389.171-.114 2.327-1.58 3.262-2.215.776.115 1.579.175 2.416.175 5.523 0 10-3.582 10-8s-4.477-8-10-8z"/>
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* ID display badges for quick manual entry */}
                  {(vehicle.driverWechat || vehicle.driverKakao) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      {vehicle.driverWechat && (
                        <button
                          type="button"
                          onClick={handleCopyWechat}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-900/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors cursor-pointer"
                          title={t('detail.copyWechatTitle')}
                        >
                          <span className="font-bold">WeChat:</span>
                          <span className="font-mono">{vehicle.driverWechat}</span>
                          <span className="material-symbols-outlined text-[13px] text-teal-600 dark:text-teal-400">
                            {copiedWechat ? 'check' : 'content_copy'}
                          </span>
                        </button>
                      )}
                      {vehicle.driverKakao && (
                        <button
                          type="button"
                          onClick={handleCopyKakao}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200/60 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
                          title={t('detail.copyKakaoTitle')}
                        >
                          <span className="font-bold">Kakao:</span>
                          <span className="font-mono">{vehicle.driverKakao}</span>
                          <span className="material-symbols-outlined text-[13px] text-amber-700 dark:text-amber-300">
                            {copiedKakao ? 'check' : 'content_copy'}
                          </span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Notification notice message */}
                  {channelNotice && (
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 animate-fade-in shadow-2xs">
                      <span className="material-symbols-outlined text-[15px] shrink-0 text-blue-600 dark:text-blue-400">info</span>
                      <span className="leading-snug">{channelNotice}</span>
                    </div>
                  )}

                  {/* Request Booking Confirmation Sheet Trigger */}
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
                {(() => {
                  const rawSponsor = SPONSORS.find((s) => s.category === 'insurance') || SPONSORS.find((s) => s.targetAudience === 'traveler' || s.targetAudience === 'all') || SPONSORS[0];
                  if (!rawSponsor) return null;
                  const perkSponsor = getLocalizedSponsor(rawSponsor, locale);
                  return (
                    <div className="p-space-sm rounded-2xl bg-gradient-to-br from-amber-50/70 via-paper-elevated to-paper-canvas dark:from-amber-950/25 dark:via-slate-900 dark:to-slate-900 border border-amber-300/50 dark:border-amber-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-amber-600 dark:text-amber-400">verified</span>
                          <span>{t('spn.travelerPerk')}</span>
                        </span>
                        <span className="text-[10px] text-ink-muted dark:text-slate-400">{t('vdm.partner')}</span>
                      </div>

                      <div className="space-y-0.5">
                        <h4 className="font-bold text-xs text-navy-deep dark:text-white leading-tight">
                          {perkSponsor.title}
                        </h4>
                        <p className="text-[11px] text-ink-secondary dark:text-slate-300 line-clamp-2">
                          {perkSponsor.tagline}
                        </p>
                      </div>

                      <a
                        href={perkSponsor.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          trackSponsor({
                            sponsorId: perkSponsor.id,
                            sponsorTitle: perkSponsor.title,
                            category: perkSponsor.category,
                            variant: 'card',
                            targetUrl: perkSponsor.link,
                          });
                        }}
                        className="w-full py-1.5 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-600 text-amber-950 font-bold text-xs flex items-center justify-center gap-1 transition-colors shadow-xs"
                      >
                        <span className="truncate">{perkSponsor.discountText}</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </a>
                    </div>
                  );
                })()}
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
