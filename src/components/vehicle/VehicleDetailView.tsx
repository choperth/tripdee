'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Vehicle, Sponsor } from '@/data/mockData';
import { parseVehicleTerms } from '@/lib/vehicleTerms';
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
import { formatLineLink, formatWhatsAppLink, buildVehicleLineMessage } from '@/lib/contactUtils';
import { useIsFavorite, toggleFavorite } from '@/lib/favoritesStore';
import { DepositPaymentModal } from '@/components/payment/DepositPaymentModal';
import { ENABLE_QR_PAYMENT } from '@/lib/constants';

export interface VehicleDetailViewProps {
  vehicle: Vehicle;
  allVehicles?: Vehicle[];
  sponsors?: Sponsor[];
  isModal?: boolean;
  onClose?: () => void;
  onSelectVehicle?: (vehicle: Vehicle) => void;
}

export const VehicleDetailView: React.FC<VehicleDetailViewProps> = ({
  vehicle,
  allVehicles = [],
  sponsors = [],
  isModal = false,
  onClose = () => {},
  onSelectVehicle,
}) => {
  const { trackCall, trackSponsor } = useAnalytics();
  const { t, locale } = useLanguage();
  const [isPhoneRevealed, setIsPhoneRevealed] = useState<boolean>(false);
  const [showBookingSheet, setShowBookingSheet] = useState<boolean>(false);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const isFavorite = useIsFavorite(vehicle.id);
  const [showECardModal, setShowECardModal] = useState<boolean>(false);
  const [sharedToast, setSharedToast] = useState<boolean>(false);
  const [copiedWechat, setCopiedWechat] = useState<boolean>(false);
  const [copiedKakao, setCopiedKakao] = useState<boolean>(false);
  const [channelNotice, setChannelNotice] = useState<string | null>(null);

  const upcomingRanges = useMemo(
    () => getUpcomingBusyRanges(vehicle.busyDates || [], locale),
    [vehicle.busyDates, locale]
  );

  // Driver-defined service terms, with automatic fallback to the standard defaults.
  const terms = useMemo(() => parseVehicleTerms(vehicle), [vehicle]);

  const plateType = vehicle.plateType || terms.plateType || 'yellow';
  const insuranceTier =
    vehicle.insuranceType ||
    terms.insuranceType ||
    (Array.isArray(vehicle.amenities) && vehicle.amenities.includes('ประกันภัยชั้น 1')
      ? 'class1'
      : 'transport_passenger');

  const insuranceLabel = useMemo(() => {
    switch (insuranceTier) {
      case 'class1':
        return t('insurance.class1.short');
      case 'class2_plus':
        return t('insurance.class2_plus.short');
      case 'transport_passenger':
        return t('insurance.transport_passenger.short');
      case 'compulsory_only':
        return t('insurance.compulsory_only.short');
      default:
        return t('insurance.transport_passenger.short');
    }
  }, [insuranceTier, t]);

  const plateLabel = useMemo(() => {
    switch (plateType) {
      case 'yellow':
        return t('detail.yellowPlateLong');
      case 'green':
        return t('sheet.plateGreenLong');
      case 'blue':
        return t('detail.licenseOk');
      case 'white':
        return t('sheet.plateWhiteLong');
      default:
        return t('detail.yellowPlateLong');
    }
  }, [plateType, t]);

  const plateBadgeClass = useMemo(() => {
    switch (plateType) {
      case 'yellow':
        return 'bg-amber-400 text-slate-950 border-amber-500';
      case 'green':
        return 'bg-emerald-600 text-white border-emerald-700';
      case 'blue':
        return 'bg-blue-600 text-white border-blue-700';
      case 'white':
        return 'bg-white text-slate-950 border-slate-300 dark:border-slate-700';
      default:
        return 'bg-amber-400 text-slate-950 border-amber-500';
    }
  }, [plateType]);

  const isSelfDrive =
    vehicle.rentalType === 'self_drive' ||
    (vehicle.type !== 'van' && vehicle.rentalType !== 'with_driver');

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/vehicle/${vehicle.id}`;
      navigator.clipboard.writeText(url);
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 2500);
    }
  };

  const cleanPhone = vehicle.driverPhone ? vehicle.driverPhone.replace(/\D/g, '') : '';

  const handleDirectCall = () => {
    setIsPhoneRevealed(true);
    trackCall({
      targetType: 'vehicle_detail',
      targetId: vehicle.id,
      targetTitle: vehicleTitle(vehicle, locale),
      phoneNumber: vehicle.driverPhone,
      driverName: vehicle.driverNickname,
    });
  };

  const whatsappUrl = useMemo(() => {
    const target = vehicle.driverWhatsapp?.trim() || cleanPhone;
    if (!target) return null;
    return formatWhatsAppLink(target);
  }, [vehicle.driverWhatsapp, cleanPhone]);

  const handleCopyWechat = () => {
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

  const companionVehicles = useMemo(() => {
    if (!allVehicles || allVehicles.length === 0) return [];
    return allVehicles.filter((v) => {
      if (v.id === vehicle.id) return false;
      const otherPhone = v.driverPhone ? v.driverPhone.replace(/\D/g, '') : '';
      return (
        (cleanPhone && otherPhone === cleanPhone) ||
        (vehicle.driverNickname && v.driverNickname === vehicle.driverNickname)
      );
    });
  }, [allVehicles, vehicle, cleanPhone]);

  const basePrice = vehicle.zoneRates?.city ?? null;
  const hasRating = typeof vehicle.rating === 'number' && vehicle.rating > 0 && vehicle.reviewCount > 0;
  const publicName = getPublicDriverName(vehicle.driverName, vehicle.driverNickname);
  const title = vehicleTitle(vehicle, locale);
  const location = vehicleLocation(vehicle, locale);
  const amenities = vehicleAmenities(vehicle, locale);
  const description = vehicleDescription(vehicle, locale);
  const shortLocation = location.split('/')[0].trim();
  const galleryImages = Array.isArray(vehicle.images) ? vehicle.images.filter(Boolean) : [];

  return (
    <div className="flex flex-col w-full pb-24 lg:pb-0 text-ink-primary dark:text-slate-100">
      {/* Top Header Bar */}
      {isModal ? (
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-5 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 dark:text-slate-400 min-w-0">
            <span className="shrink-0">{t('detail.breadcrumbHome')}</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[80px] sm:max-w-none">{shortLocation}</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-slate-950 dark:text-white font-bold truncate">
              {publicName}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('auth.close')}
            className="w-8 h-8 rounded-none border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4">
          <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
            <Link href="/" className="hover:text-slate-950 dark:hover:text-white font-semibold">
              {t('detail.breadcrumbHome')}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <Link href="/" className="hover:text-slate-950 dark:hover:text-white font-semibold">
              {t('nav.van')}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span className="font-bold text-slate-950 dark:text-white truncate">{title}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-3">
            <button
              type="button"
              onClick={handleShare}
              className="flex h-8 w-8 items-center justify-center rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="แชร์ลิงก์"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => toggleFavorite(vehicle.id)}
              aria-pressed={isFavorite}
              className={`flex h-8 w-8 items-center justify-center rounded-none border transition-colors cursor-pointer ${
                isFavorite
                  ? 'bg-rose-600 text-white border-rose-700'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title={isFavorite ? t('vehicle.favoriteRemove') : t('vehicle.favoriteSave')}
            >
              <Bookmark className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Main Body Content */}
      <div className={isModal ? 'p-4 sm:p-6 lg:p-7 space-y-6' : 'space-y-6'}>
        {/* Top Guarantee Strip & Badges Bar (Bauhaus Redesign) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {isSelfDrive ? (
                <span className="inline-flex items-center gap-1 bg-indigo-700 text-white text-[10px] font-black px-2 py-0.5 border border-indigo-800 uppercase rounded-none">
                  <Car className="w-3 h-3" />
                  <span>{t('detail.selfDriveBadge')}</span>
                </span>
              ) : (
                <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 border uppercase rounded-none ${plateBadgeClass}`}>
                  <span className="material-symbols-outlined text-[13px]">
                    {plateType === 'yellow' ? 'local_taxi' : 'directions_car'}
                  </span>
                  <span>{plateLabel}</span>
                </span>
              )}

              {vehicle.isVerified ? (
                <span className="inline-flex items-center gap-1 bg-slate-900 text-amber-400 text-[10px] font-black px-2 py-0.5 border border-slate-900 uppercase rounded-none">
                  <span className="material-symbols-outlined text-[13px] text-amber-400 font-bold">star</span>
                  <span>{t('detail.featuredBadge')}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 border border-slate-200 dark:border-slate-700 rounded-none">
                  <span>{t('detail.standardListing')}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 border border-slate-200 dark:border-slate-700 rounded-none">
                <span className="material-symbols-outlined text-[13px]">handshake</span>
                <span>{t('detail.zeroCommission')}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
              {title}
            </h1>

            <div className="flex items-center flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
              <a
                href="#vehicle-reviews"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('vehicle-reviews')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer group"
              >
                <span className="material-symbols-outlined text-[16px] text-amber-500">
                  star
                </span>
                <strong className="text-slate-950 dark:text-white font-bold group-hover:underline">
                  {hasRating ? vehicle.rating : '—'}
                </strong>
                <span className="group-hover:underline">
                  {hasRating ? t('detail.reviews', { n: vehicle.reviewCount }) : t('detail.noReviews')}
                </span>
              </a>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-slate-400">
                  pin_drop
                </span>
                <span>{t('detail.basedAt')} {location}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="material-symbols-outlined text-[16px]">shield_with_heart</span>
                <span>{insuranceLabel}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={() => setShowECardModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-none border border-slate-300 dark:border-slate-700 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              title={t('vdm.ecardTitle')}
            >
              <QrCode className="w-4 h-4 text-amber-500" />
              <span>{t('ecard.btn')}</span>
            </button>
            <button
              type="button"
              onClick={() => toggleFavorite(vehicle.id)}
              aria-pressed={isFavorite}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none border text-xs font-bold transition-colors shadow-2xs cursor-pointer ${
                isFavorite
                  ? 'bg-rose-600 text-white border-rose-700'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              <span>{isFavorite ? t('detail.saved') : t('detail.save')}</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-none border border-slate-300 dark:border-slate-700 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>{sharedToast ? t('detail.shared') : t('detail.share')}</span>
            </button>
          </div>
        </div>

        {/* Photo Gallery Bento Layout */}
        {galleryImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 rounded-none border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            {/* Large Feature Photo */}
            <div className="col-span-2 md:col-span-2 md:row-span-2 relative h-56 sm:h-64 md:h-[380px] bg-slate-900 group overflow-hidden">
              <Image
                src={galleryImages[0]}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 text-white flex flex-col gap-1 pointer-events-none">
                <span className="bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-none text-white text-[10px] font-black uppercase tracking-wider w-fit border border-slate-700">
                  {t('detail.cabinCaption', { n: vehicle.seats })}
                </span>
                <p className="font-bold text-sm sm:text-base text-white">
                  {publicName}
                </p>
              </div>
            </div>

            {/* Grid Photo 2 */}
            <div className="relative h-40 md:h-[185px] overflow-hidden group bg-slate-900">
              <Image
                src={galleryImages[1] || galleryImages[0]}
                alt={t('detail.photoInteriorAlt')}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-2 left-2 bg-slate-950/85 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-none border border-slate-700 uppercase">
                {t('detail.capKaraoke')}
              </span>
            </div>

            {/* Grid Photo 3 */}
            <div className="relative h-40 md:h-[185px] overflow-hidden group bg-slate-900">
              <Image
                src={galleryImages[0]}
                alt={t('detail.photoExteriorAlt')}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-none font-black border uppercase ${plateBadgeClass}`}>
                {vehicle.plateNumber ? maskPlateNumber(vehicle.plateNumber) : t('detail.plateLegal')}
              </span>
            </div>

            {/* Grid Photo 4 */}
            <div className="relative h-40 md:h-[185px] overflow-hidden group bg-slate-900">
              <Image
                src={galleryImages[1] || galleryImages[0]}
                alt={t('detail.photoChargeAlt')}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-2 left-2 bg-slate-950/85 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-none border border-slate-700 uppercase">
                {t('detail.capCharge')}
              </span>
            </div>

            {/* Grid Photo 5 with View All overlay */}
            <div className="relative h-40 md:h-[185px] overflow-hidden group bg-slate-900">
              <Image
                src={galleryImages[0]}
                alt={t('detail.viewAllPhotos', { n: galleryImages.length })}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-slate-950/60 hover:bg-slate-950/75 transition-colors flex items-center justify-center gap-1.5 text-white font-bold text-xs sm:text-sm">
                <span className="material-symbols-outlined text-[18px]">photo_library</span>
                <span>{t('detail.viewAllPhotos', { n: galleryImages.length })}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-none border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-6 text-center">
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[32px]">
              photo_library
            </span>
            <p className="text-sm font-bold text-slate-950 dark:text-white mt-2">
              {t('detail.noPhotosTitle')}
            </p>
            <p className="text-xs text-slate-500 mt-1">{t('detail.noPhotosDesc')}</p>
          </div>
        )}

        {/* Main Content & Sticky Rail (8 Cols left, 4 Cols right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Specs, Driver Dossier, Amenities, Policies (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Vehicle Core Highlights */}
            <section className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-none border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                    {t('detail.eyebrowSpecs')}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white mt-0.5">
                    {t('detail.specsTitle')}
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-none bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm uppercase tracking-wider">
                  {t('vehicle.seats', { n: vehicle.seats })}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-none flex flex-col gap-1 border border-slate-200 dark:border-slate-700">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px]">
                    airline_seat_recline_extra
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">{t('detail.seatingPlan')}</span>
                  <span className="text-slate-950 dark:text-white font-bold text-sm">{t('detail.vipSeats', { n: vehicle.seats })}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-none flex flex-col gap-1 border border-slate-200 dark:border-slate-700">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px]">speed</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">{t('detail.engineLabel')}</span>
                  <span className="text-slate-950 dark:text-white font-bold text-sm">2.8 GD Diesel Turbo</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-none flex flex-col gap-1 border border-slate-200 dark:border-slate-700">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px]">luggage</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">{t('detail.luggageLabel')}</span>
                  <span className="text-slate-950 dark:text-white font-bold text-sm">{t('detail.luggageValue')}</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-none flex flex-col gap-1 border border-slate-200 dark:border-slate-700">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px]">local_gas_station</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">{t('detail.fuelLabel')}</span>
                  <span className="text-slate-950 dark:text-white font-bold text-sm">{t('vdm.diesel')}</span>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                {description}
              </p>
            </section>

            {/* Driver Dossier & Verified Documents */}
            <section className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-none border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">
                  verified_user
                </span>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                  {t('detail.driverTitle')}
                </h2>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-none border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-none bg-slate-900 text-white font-bold flex items-center justify-center text-xl border border-slate-300 dark:border-slate-700">
                      {publicName.charAt(0)}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-none bg-amber-400 flex items-center justify-center text-slate-950 shadow-2xs border border-amber-500">
                      <Star className="w-3 h-3 fill-slate-950 text-slate-950" />
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-slate-950 dark:text-white">
                        {publicName}
                      </h3>
                      {vehicle.isVerified ? (
                        <span className="px-2 py-0.5 rounded-none bg-slate-900 text-amber-400 font-black text-[10px] border border-slate-900 flex items-center gap-1 uppercase">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{t('detail.featuredBadge')}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] border border-slate-200 dark:border-slate-700">
                          {t('detail.standardListing')}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowECardModal(true)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300/80 font-bold text-[10px] hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
                      >
                        <QrCode className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                        <span>{t('ecard.btn')}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('detail.driverExp', { loc: shortLocation })}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mt-1">
                      <span>{t('detail.langLabel')} 🇹🇭 {t('detail.langTh')}</span>
                      {vehicle.languages?.includes('en') && <span>• 🇬🇧 {t('vehicle.langEn')}</span>}
                      {vehicle.languages?.includes('zh') && <span>• 🇨🇳 {t('vehicle.langZh')}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-700 w-full sm:w-auto">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    {t('detail.licenseLabel')}
                  </span>
                  <span className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-1 sm:justify-end mt-0.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-500">
                      {plateType === 'yellow' ? 'local_taxi' : 'directions_car'}
                    </span>
                    <span>{plateLabel}</span>
                  </span>
                </div>
              </div>
            </section>

            {/* Driver Availability & Booked Dates Calendar */}
            <CustomerAvailabilitySchedule
              busyDates={vehicle.busyDates}
              isAvailable={vehicle.isAvailable !== false}
              driverPhone={vehicle.driverPhone}
              driverNickname={vehicle.driverNickname}
            />

            {/* Customer Reviews & Ratings */}
            <VehicleReviewsSection vehicle={vehicle} />

            {/* Amenity Spec Checklist */}
            <section className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-none border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                {t('detail.amenities')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {amenities.map((item) => (
                  <div
                    key={item}
                    className="p-2.5 rounded-none bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200"
                  >
                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px] shrink-0">
                      check_circle
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Transparent Pricing Breakdown Table by Zones */}
            <section className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-none border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                {t('detail.ratesTitle')}
              </h2>

              <div className="overflow-hidden rounded-none border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3">{t('detail.colZone')}</th>
                      <th className="p-3">{t('detail.colRoute')}</th>
                      <th className="p-3 text-right">{t('detail.colPrice')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {(
                      [
                        { key: 'city' as const, label: t('zone.city.label'), route: t('vdm.routeCity') },
                        { key: 'midHill' as const, label: t('zone.midHill.label'), route: t('vdm.routeMid') },
                        { key: 'highHill' as const, label: t('zone.highHill.label'), route: t('vdm.routeHigh') },
                      ]
                    )
                      .filter((row) => Number(vehicle.zoneRates?.[row.key]) > 0)
                      .map((row, idx) => (
                        <tr key={row.key}>
                          <td className="p-3 font-bold text-slate-950 dark:text-white">
                            {t('detail.zoneLine', { no: idx + 1, label: row.label })}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{row.route}</td>
                          <td className="p-3 text-right font-black text-slate-950 dark:text-white font-mono">
                            ฿{Number(vehicle.zoneRates![row.key]).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
                <div className="p-3 rounded-none bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="font-bold text-slate-950 dark:text-white block">{t('detail.hoursTitle')}</span>
                  <p>• {t('detail.termsHoursOnly', { h: String(terms.workHoursPerDay), rate: `${terms.overtimeRatePerHour} ฿` })}</p>
                </div>
                <div className="p-3 rounded-none bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="font-bold text-slate-950 dark:text-white block">{t('detail.stayTitle')}</span>
                  <p>• {t('detail.termsStay', { rate: `${terms.overnightStayRate} ฿` })}</p>
                  <p>
                    •{' '}
                    {terms.fuelIncluded
                      ? `${t('detail.fuelIncluded')}${terms.fuelNote ? ` (${terms.fuelNote})` : ''}`
                      : terms.fuelNote
                        ? `${t('detail.fuelExcluded')} (${terms.fuelNote})`
                        : t('terms.fuelNote')}
                  </p>
                </div>
              </div>
            </section>

            {/* Other Fleet Vehicles of this Driver */}
            {companionVehicles.length > 0 && (
              <section className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-none border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-900 dark:text-slate-200">garage_home</span>
                      <span>{t('detail.fleetTitle', { name: publicName })}</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('detail.fleetDesc', { n: companionVehicles.length })}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700">
                    {t('detail.fleetTotal', { n: companionVehicles.length + 1 })}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {companionVehicles.map((comp) => {
                    const compBasePrice = comp.zoneRates?.city ?? null;

                    return (
                      <div
                        key={comp.id}
                        className="p-3 rounded-none bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-slate-400 dark:hover:border-slate-600 transition-colors flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative h-28 w-full rounded-none overflow-hidden bg-slate-900 mb-2 border border-slate-200 dark:border-slate-700">
                            {comp.images?.[0] ? (
                              <Image
                                src={comp.images[0]}
                                alt={comp.title}
                                fill
                                sizes="(max-width: 640px) 100vw, 250px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full grid place-items-center">
                                <span className="material-symbols-outlined text-slate-600 text-[28px]">
                                  directions_car
                                </span>
                              </div>
                            )}
                            <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded-none bg-slate-900/90 text-white text-[10px] font-bold">
                                {t('vehicle.seats', { n: comp.seats })}
                              </span>
                              {comp.plateType === 'yellow' ? (
                                <span className="px-1.5 py-0.5 rounded-none bg-amber-400 text-slate-950 text-[10px] font-black border border-amber-500 uppercase">
                                  {t('hero.quickYellow')}
                                </span>
                              ) : comp.plateType === 'green' ? (
                                <span className="px-1.5 py-0.5 rounded-none bg-emerald-600 text-white text-[10px] font-black border border-emerald-700 uppercase">
                                  {t('plate.green.short')}
                                </span>
                              ) : comp.plateType === 'white' ? (
                                <span className="px-1.5 py-0.5 rounded-none bg-white text-slate-950 text-[10px] font-bold border border-slate-300">
                                  {t('plate.white.short')}
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-none bg-blue-600 text-white text-[10px] font-bold border border-blue-700">
                                  {t('fleet.plateBlue')}
                                </span>
                              )}
                            </div>
                          </div>

                          <h3 className="font-bold text-sm text-slate-950 dark:text-white line-clamp-1 mb-1">
                            {comp.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2">
                            {(comp.amenities ?? []).slice(0, 2).join(' • ')}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{t('detail.fromPrice')}</span>
                            {compBasePrice !== null ? (
                              <span className="text-xs font-black text-slate-950 dark:text-white font-mono">
                                ฿{compBasePrice.toLocaleString()}{t('vehicle.perDay')}
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                {t('vehicle.priceOnRequest')}
                              </span>
                            )}
                          </div>

                          {onSelectVehicle ? (
                            <button
                              type="button"
                              onClick={() => onSelectVehicle(comp)}
                              className="px-3 py-1.5 rounded-none bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer shadow-2xs active:scale-95"
                            >
                              {t('detail.switchTo')}
                            </button>
                          ) : (
                            <Link
                              href={`/vehicle/${comp.id}`}
                              className="px-3 py-1.5 rounded-none bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer shadow-2xs active:scale-95 inline-block text-center"
                            >
                              {t('detail.switchTo')}
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Sticky Booking & Direct Actions (4 cols) */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-none p-5 sm:p-6 border border-slate-300 dark:border-slate-800 shadow-md space-y-4">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                  {t('vehicle.priceFrom')}
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  {basePrice !== null ? (
                    <>
                      <span className="text-3xl font-black text-slate-950 dark:text-white font-mono leading-tight">
                        ฿{basePrice.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{t('vehicle.perDay')}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400 leading-tight">
                      {t('vehicle.priceOnRequest')}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>{t('vehicle.noCommission')}</span>
                  </span>
                  <a
                    href="#vehicle-reviews"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('vehicle-reviews')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px] text-amber-500">star</span>
                    <span>{hasRating ? `${vehicle.rating} (${vehicle.reviewCount})` : t('detail.noReviews')}</span>
                  </a>
                </div>
              </div>

              {/* Upcoming Busy Dates Alert Pill */}
              {upcomingRanges.length > 0 && (
                <div className="p-2.5 rounded-none bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-none bg-rose-500 animate-pulse shrink-0" />
                  <span className="truncate">
                    {t('cal.cardUpcomingBusy', { range: upcomingRanges[0].label })}
                    {upcomingRanges.length > 1 && ` (+${upcomingRanges.length - 1})`}
                  </span>
                </div>
              )}

              {/* ช่องทางติดต่อด่วน (Direct Channels) */}
              <div className="p-4 rounded-none bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-950 dark:text-white">
                    <span className="w-2 h-2 rounded-none bg-emerald-500 animate-pulse" />
                    <span>{t('detail.directChannels')}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-none bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 uppercase">
                    {t('detail.directDeal')}
                  </span>
                </div>

                {/* ChillPay Instant Deposit CTA Button (Hidden when ENABLE_QR_PAYMENT is false) */}
                {ENABLE_QR_PAYMENT && (
                  <button
                    type="button"
                    onClick={() => setShowDepositModal(true)}
                    className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-none text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-colors active:scale-[0.98] cursor-pointer border border-amber-500"
                  >
                    <span className="material-symbols-outlined text-[17px]">verified</span>
                    <span>{t('vc.depositCta')}</span>
                  </button>
                )}

                <div className="space-y-2">
                  <a
                    href={`tel:${vehicle.driverPhone}`}
                    onClick={handleDirectCall}
                    className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-none font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-colors active:scale-[0.98] cursor-pointer border border-slate-900 dark:border-white"
                  >
                    <span className="material-symbols-outlined text-[18px]">call</span>
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
                    className="w-full h-11 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-none font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-colors active:scale-[0.98] cursor-pointer border border-[#06C755]"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 5.92 2 10.75c0 3.08 1.83 5.79 4.6 7.29-.2.74-.74 2.68-.85 3.08-.13.48.18.47.37.35.15-.09 2.06-1.39 2.87-1.95.66.19 1.34.29 2.01.29 5.52 0 10-3.92 10-8.76S17.52 2 12 2z"/>
                    </svg>
                    <span>{t('detail.lineAsk')}</span>
                  </a>
                </div>

                {/* Direct International Messaging Bar: WhatsApp, WeChat, KakaoTalk */}
                <div className="grid grid-cols-3 gap-2 pt-0.5">
                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 rounded-none bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center shadow-2xs transition-colors active:scale-95 cursor-pointer border border-[#25D366]"
                      title={t('detail.whatsappHint')}
                      aria-label="WhatsApp"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                      </svg>
                    </a>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleCopyWechat}
                    className="h-10 rounded-none bg-[#07C160] hover:bg-[#06ab55] text-white flex items-center justify-center shadow-2xs transition-colors active:scale-95 cursor-pointer relative border border-[#07C160]"
                    title={vehicle.driverWechat ? t('detail.wechatCopyHint', { id: vehicle.driverWechat }) : t('detail.wechatEmptyHint')}
                    aria-label="WeChat"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M8.5 2C4.36 2 1 4.91 1 8.5c0 2.05 1.08 3.89 2.78 5.07L3 17l3.81-1.12c.54.14 1.1.22 1.69.22.25 0 .5-.02.74-.05-.34-.78-.54-1.64-.54-2.55 0-3.87 3.8-7 8.5-7 .31 0 .61.02.91.05C16.88 3.97 12.98 2 8.5 2zm-2.25 4c.69 0 1.25.56 1.25 1.25S6.94 8.5 6.25 8.5 5 7.94 5 7.25 5.56 6 6.25 6zm4.5 0c.69 0 1.25.56 1.25 1.25S11.44 8.5 10.75 8.5 9.5 7.94 9.5 7.25 10.06 6 10.75 6zM15.5 8c-3.87 0-7 2.69-7 6s3.13 6 7 6c.52 0 1.02-.05 1.5-.16L20 21l-.73-2.61C20.9 17.29 22 15.74 22 14c0-3.31-3.13-6-7-6zm-2 3.5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyKakao}
                    className="h-10 rounded-none bg-[#FEE500] hover:bg-[#edd600] text-[#3C1E1E] flex items-center justify-center shadow-2xs transition-colors active:scale-95 cursor-pointer relative border border-[#ebd300]"
                    title={vehicle.driverKakao ? t('detail.kakaoCopyHint', { id: vehicle.driverKakao }) : t('detail.kakaoEmptyHint')}
                    aria-label="KakaoTalk"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 3c-5.52 0-10 3.58-10 8 0 2.83 1.83 5.31 4.6 6.67l-1.18 4.34c-.1.38.33.7.67.48l5.12-3.39c.26.02.52.03.79.03 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                    </svg>
                  </button>
                </div>

                {/* ID display badges for quick manual entry */}
                {(vehicle.driverWechat || vehicle.driverKakao) && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                    {vehicle.driverWechat && (
                      <button
                        type="button"
                        onClick={handleCopyWechat}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-900/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors cursor-pointer"
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
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200/60 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer"
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
                  <div className="p-2 rounded-none bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 animate-fade-in shadow-2xs">
                    <span className="material-symbols-outlined text-[15px] shrink-0 text-blue-600 dark:text-blue-400">info</span>
                    <span className="leading-snug">{channelNotice}</span>
                  </div>
                )}

                {/* Request Booking Confirmation Sheet Trigger */}
                <button
                  type="button"
                  onClick={() => setShowBookingSheet(true)}
                  className="w-full h-11 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-none font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-600 transition-colors shadow-2xs active:scale-[0.98] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  <span>{t('detail.requestBooking')}</span>
                </button>
              </div>

              {/* Trust Guarantee Box */}
              <div className="p-3 rounded-none bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1 text-slate-950 dark:text-white font-bold">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400">
                    shield
                  </span>
                  <span>{t('detail.guaranteeTitle')}</span>
                </div>
                <p>{t('detail.guarantee1')}</p>
                <p>{t('detail.guarantee2')}</p>
              </div>

              {/* Traveler Partner Perk Sponsor Box */}
              {(() => {
                const rawSponsor = sponsors.find((s) => s.category === 'insurance') || sponsors.find((s) => s.targetAudience === 'traveler' || s.targetAudience === 'all') || sponsors[0];
                if (!rawSponsor) return null;
                const perkSponsor = getLocalizedSponsor(rawSponsor, locale);
                return (
                  <div className="p-3.5 rounded-none bg-amber-50/60 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-none bg-amber-400 text-slate-950 font-black text-[10px] border border-amber-500 uppercase flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-slate-950 font-bold">verified</span>
                        <span>{t('spn.travelerPerk')}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{t('vdm.partner')}</span>
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs text-slate-950 dark:text-white leading-tight">
                        {perkSponsor.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
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
                      className="w-full py-2 px-3 rounded-none bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1 transition-colors shadow-xs border border-amber-500"
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

      {/* Mobile Sticky Bottom Contact Bar (mobile & tablet only) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('vehicle.priceFrom')}
            </span>
            {basePrice !== null ? (
              <span className="flex items-baseline gap-1">
                <span className="text-lg font-black font-mono text-slate-950 dark:text-white">
                  ฿{basePrice.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{t('vehicle.perDay')}</span>
              </span>
            ) : (
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {t('vehicle.priceOnRequest')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {vehicle.driverPhone && (
              <a
                href={`tel:${vehicle.driverPhone}`}
                onClick={handleDirectCall}
                className="inline-flex h-11 items-center gap-1.5 rounded-none bg-slate-900 dark:bg-white px-4 text-white dark:text-slate-900 text-xs font-bold border border-slate-900 dark:border-white active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[18px]">call</span>
                <span>{t('vehicle.directCall')}</span>
              </a>
            )}
            <a
              href={formatLineLink(vehicle.driverLine, buildVehicleLineMessage(vehicle))}
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(buildVehicleLineMessage(vehicle)).catch(() => {});
                }
              }}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-1.5 rounded-none bg-[#06C755] hover:bg-[#05b34c] px-4 text-white text-xs font-bold border border-[#06C755] active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              <span>{t('vehicle.lineChat')}</span>
            </a>
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
      {showECardModal && (
        <DriverSmartECardModal
          vehicle={vehicle}
          isOpen={showECardModal}
          onClose={() => setShowECardModal(false)}
        />
      )}

      {/* ChillPay Deposit Payment Modal */}
      {ENABLE_QR_PAYMENT && showDepositModal && (
        <DepositPaymentModal
          vehicle={vehicle}
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
        />
      )}
    </div>
  );
};

export default VehicleDetailView;
