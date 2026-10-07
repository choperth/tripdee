'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Vehicle, Sponsor, STANDARD_TERMS, VEHICLES } from '@/data/mockData';
import {
  vehicleTitle,
  vehicleLocation,
  vehicleAmenities,
  vehicleDescription,
} from '@/data/vehicleI18n';
import { maskPhoneNumber, maskPlateNumber, getPublicDriverName } from '@/lib/privacy';
import { Share2, Bookmark, Car, ChevronRight, QrCode, Star } from 'lucide-react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';
import { isMockDataEnabled } from '@/lib/mockConfig';
import { getLocalizedSponsor } from '@/lib/sponsorLocalization';
import { getUpcomingBusyRanges } from '@/lib/availabilityUtils';
import { formatLineLink, buildVehicleLineMessage } from '@/lib/contactUtils';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CustomerAvailabilitySchedule } from '@/components/CustomerAvailabilitySchedule';
import { VehicleReviewsSection } from '@/components/reviews/VehicleReviewsSection';
import { BookingConfirmationSheet } from '@/components/BookingConfirmationSheet';

const LoginModal = dynamic(
  () => import('@/components/LoginModal').then((m) => m.LoginModal),
  { ssr: false }
);
const DriverRegisterModal = dynamic(
  () => import('@/components/DriverRegisterModal').then((m) => m.DriverRegisterModal),
  { ssr: false }
);
const DriverSmartECardModal = dynamic(
  () => import('@/components/cards/DriverSmartECardModal').then((m) => m.DriverSmartECardModal),
  { ssr: false }
);
const DepositPaymentModal = dynamic(
  () => import('@/components/payment/DepositPaymentModal').then((m) => m.DepositPaymentModal),
  { ssr: false }
);

export default function VehicleDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const { trackCall } = useAnalytics();
  const { t, locale } = useLanguage();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');

  const [isPhoneRevealed, setIsPhoneRevealed] = useState<boolean>(false);
  const [showBookingSheet, setShowBookingSheet] = useState<boolean>(false);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [showECardModal, setShowECardModal] = useState<boolean>(false);
  const [sharedToast, setSharedToast] = useState<boolean>(false);
  const [copiedWechat, setCopiedWechat] = useState<boolean>(false);
  const [copiedKakao, setCopiedKakao] = useState<boolean>(false);
  const [channelNotice, setChannelNotice] = useState<string | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const isDemo = isMockDataEnabled();
    const demoMatch = () => (isDemo ? VEHICLES.find((v) => v.id === id) || null : null);

    fetch('/api/vehicles' + window.location.search)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load vehicles');
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        const list: Vehicle[] = Array.isArray(data.vehicles) ? data.vehicles : [];
        setAllVehicles(list);
        const match = list.find((v) => v.id === id) || demoMatch();
        setVehicle(match);
        setStatus(match ? 'ready' : 'missing');
      })
      .catch(() => {
        if (!active) return;
        const match = demoMatch();
        setAllVehicles(match ? [match] : []);
        setVehicle(match);
        setStatus(match ? 'ready' : 'missing');
      });

    fetch('/api/sponsors' + window.location.search)
      .then((res) => (res.ok ? res.json() : { sponsors: [] }))
      .then((data) => {
        if (active) setSponsors(Array.isArray(data.sponsors) ? data.sponsors : []);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [id]);

  const upcomingRanges = useMemo(
    () => getUpcomingBusyRanges(vehicle?.busyDates || [], locale),
    [vehicle?.busyDates, locale]
  );

  const cleanPhone = vehicle?.driverPhone ? vehicle.driverPhone.replace(/\D/g, '') : '';

  const companionVehicles = useMemo(() => {
    if (!vehicle || allVehicles.length === 0) return [];
    return allVehicles.filter((v) => {
      if (v.id === vehicle.id) return false;
      const otherPhone = v.driverPhone ? v.driverPhone.replace(/\D/g, '') : '';
      return (
        (cleanPhone && otherPhone === cleanPhone) ||
        (vehicle.driverNickname && v.driverNickname === vehicle.driverNickname)
      );
    });
  }, [allVehicles, vehicle, cleanPhone]);

  const whatsappUrl = useMemo(() => {
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

  useEffect(() => {
    if (vehicle) {
      document.title = `${vehicleTitle(vehicle, locale)} | TripDee`;
    }
  }, [vehicle, locale]);

  if (status === 'loading' || !vehicle) {
    return (
      <div className="flex min-h-dvh flex-col bg-paper font-body text-ink">
        <Navbar onOpenLoginModal={() => setIsLoginOpen(true)} />
        <div aria-hidden="true" className="h-16 shrink-0" />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-16 text-center">
          {status === 'loading' ? (
            <p className="text-sm font-bold text-ink-2">กำลังโหลดข้อมูลรถ...</p>
          ) : (
            <div className="mx-auto max-w-xl space-y-3 rounded-2xl border border-rule bg-card p-8">
              <h1 className="text-base font-extrabold">ไม่พบข้อมูลรถคันนี้</h1>
              <p className="text-sm text-ink-2">
                รถอาจถูกปิดการแสดงผลชั่วคราวหรือลิงก์ไม่ถูกต้อง กรุณากลับไปค้นหารถคันอื่น
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-xl bg-navy-deep px-4 py-2 text-xs font-bold text-white hover:bg-navy-surface transition-colors"
              >
                กลับหน้าหลัก
              </Link>
            </div>
          )}
        </main>
        <Footer />
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onOpenRegisterModal={() => {
            setIsLoginOpen(false);
            setIsRegisterOpen(true);
          }}
        />
        <DriverRegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
      </div>
    );
  }

  const isSelfDrive = vehicle.rentalType === 'self_drive' || (vehicle.type !== 'van' && vehicle.rentalType !== 'with_driver');
  const basePrice = vehicle.zoneRates?.city ?? null;
  const hasRating = typeof vehicle.rating === 'number' && vehicle.rating > 0 && vehicle.reviewCount > 0;
  const publicName = getPublicDriverName(vehicle.driverName, vehicle.driverNickname);
  const title = vehicleTitle(vehicle, locale);
  const location = vehicleLocation(vehicle, locale);
  const amenities = vehicleAmenities(vehicle, locale);
  const description = vehicleDescription(vehicle, locale);
  const shortLocation = location.split('/')[0].trim();
  const galleryImages = Array.isArray(vehicle.images) ? vehicle.images.filter(Boolean) : [];

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/vehicle/${vehicle.id}`);
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 2500);
    }
  };

  const handleDirectCall = () => {
    setIsPhoneRevealed(true);
    trackCall({
      targetType: 'vehicle_detail',
      targetId: vehicle.id,
      targetTitle: title,
      phoneNumber: vehicle.driverPhone,
      driverName: vehicle.driverNickname,
    });
  };

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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    image: galleryImages.slice(0, 4),
    description,
    brand: { '@type': 'Brand', name: 'TripDee' },
    ...(hasRating
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: vehicle.rating, reviewCount: vehicle.reviewCount } }
      : {}),
    ...(basePrice !== null
      ? { offers: { '@type': 'Offer', priceCurrency: 'THB', price: basePrice, availability: 'https://schema.org/InStock' } }
      : {}),
  };

  return (
    <div className="flex min-h-dvh flex-col bg-paper font-body text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar onOpenLoginModal={() => setIsLoginOpen(true)} />
      <div aria-hidden="true" className="h-16 shrink-0" />

      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        <div className="flex items-center justify-between gap-2 text-xs text-ink-2">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0">
            <Link href="/" className="shrink-0 hover:text-ink transition-colors">
              {t('detail.breadcrumbHome')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[100px] sm:max-w-none">{shortLocation}</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-navy-deep font-bold truncate">{publicName}</span>
          </nav>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rule">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {isSelfDrive ? (
                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-[2px] rounded text-[11px] font-bold">
                  <Car className="w-3 h-3" />
                  <span>{t('detail.selfDriveBadge')}</span>
                </span>
              ) : vehicle.plateType === 'yellow' ? (
                <span className="inline-flex items-center gap-1 bg-taxi-yellow-soft text-amber-800 px-2 py-[2px] rounded text-[11px] font-bold border border-amber-300/40">
                  <span className="material-symbols-outlined text-[13px] text-amber-accent">local_taxi</span>
                  <span>{t('detail.yellowPlateLong')}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-blue-subtle text-blue-action px-2 py-[2px] rounded text-[11px] font-bold">
                  <span>{t('vehicle.bluePlate')}</span>
                </span>
              )}
              {vehicle.isVerified ? (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-slate-950 px-2 py-[2px] rounded text-[11px] font-black shadow-xs border border-amber-300">
                  <span className="material-symbols-outlined text-[13px] font-bold">star</span>
                  <span>{t('detail.featuredBadge')}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-blue-subtle text-blue-action px-2 py-[2px] rounded text-[11px] font-bold">
                  <span>{t('detail.standardListing')}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 bg-blue-subtle text-blue-action px-2 py-[2px] rounded text-[11px] font-bold">
                <span className="material-symbols-outlined text-[13px]">handshake</span>
                <span>{t('detail.zeroCommission')}</span>
              </span>
            </div>

            <h1 className="font-headline-xl text-headline-xl text-navy-deep tracking-tight">{title}</h1>

            <div className="flex items-center flex-wrap gap-3 text-xs text-ink-2 mt-1.5">
              <a
                href="#vehicle-reviews"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('vehicle-reviews')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer group"
              >
                <span className="material-symbols-outlined text-[16px] text-amber-accent">star</span>
                <strong className="text-navy-deep group-hover:underline">
                  {hasRating ? vehicle.rating : '—'}
                </strong>
                <span className="group-hover:underline">
                  {hasRating ? t('detail.reviews', { n: vehicle.reviewCount }) : t('detail.noReviews')}
                </span>
              </a>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                <span>{t('detail.basedAt')} {location}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-verified-emerald">
                <span className="material-symbols-outlined text-[16px]">shield_with_heart</span>
                <span>{t('detail.insuranceFull')}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={() => setShowECardModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-paper-2 text-ink-2 hover:bg-rule rounded-xl text-sm font-semibold transition-all cursor-pointer"
              title={t('vdm.ecardTitle')}
            >
              <QrCode className="w-4 h-4 text-amber-500" />
              <span>{t('ecard.btn')}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isBookmarked ? 'bg-amber-accent text-white shadow-sm' : 'bg-paper-2 text-ink-2 hover:bg-rule'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>{isBookmarked ? t('detail.saved') : t('detail.save')}</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-paper-2 text-ink-2 hover:bg-rule rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>{sharedToast ? t('detail.shared') : t('detail.share')}</span>
            </button>
          </div>
        </div>

        {galleryImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 rounded-2xl overflow-hidden shadow-sm">
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
              <div className="absolute bottom-4 left-4 text-white flex flex-col gap-1 pointer-events-none">
                <span className="bg-navy-deep/80 backdrop-blur-md px-2 py-1 rounded text-[11px] font-bold w-fit">
                  {t('detail.cabinCaption', { n: vehicle.seats })}
                </span>
                <p className="font-bold text-base text-white">{publicName}</p>
              </div>
            </div>
            <div className="relative h-40 md:h-[185px] overflow-hidden group bg-slate-900">
              <Image
                src={galleryImages[1] || galleryImages[0]}
                alt={t('detail.photoInteriorAlt')}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-2 left-2 bg-navy-deep/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded">
                {t('detail.capKaraoke')}
              </span>
            </div>
            <div className="relative h-40 md:h-[185px] overflow-hidden group bg-slate-900">
              <Image
                src={galleryImages[0]}
                alt={t('detail.photoExteriorAlt')}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-2 left-2 bg-taxi-yellow-soft text-amber-800 text-[10px] px-2 py-0.5 rounded font-bold">
                {vehicle.plateNumber ? maskPlateNumber(vehicle.plateNumber) : t('detail.plateLegal')}
              </span>
            </div>
            <div className="relative h-40 md:h-[185px] overflow-hidden group bg-slate-900">
              <Image
                src={galleryImages[1] || galleryImages[0]}
                alt={t('detail.photoChargeAlt')}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-2 left-2 bg-navy-deep/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded">
                {t('detail.capCharge')}
              </span>
            </div>
            <div className="relative h-40 md:h-[185px] overflow-hidden group bg-navy-deep">
              <Image
                src={galleryImages[0]}
                alt={t('detail.viewAllPhotos', { n: galleryImages.length })}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-navy-deep/60 flex items-center justify-center gap-1.5 text-white text-sm font-semibold">
                <span className="material-symbols-outlined text-[20px]">photo_library</span>
                <span>{t('detail.viewAllPhotos', { n: galleryImages.length })}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-rule bg-card p-8 text-center">
            <span className="material-symbols-outlined text-ink-3 text-[32px]">photo_library</span>
            <p className="text-sm font-bold mt-2">{t('detail.noPhotosTitle')}</p>
            <p className="text-xs text-ink-2 mt-1">{t('detail.noPhotosDesc')}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <section className="bg-paper-canvas p-4 sm:p-6 rounded-2xl border border-rule space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-blue-action text-[11px] font-bold uppercase tracking-wider">
                    {t('detail.eyebrowSpecs')}
                  </span>
                  <h2 className="text-[22px] leading-7 font-bold text-navy-deep mt-1">{t('detail.specsTitle')}</h2>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-blue-subtle text-blue-action font-bold text-lg">
                  {t('vehicle.seats', { n: vehicle.seats })}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 bg-card rounded-xl flex flex-col gap-1 border border-rule">
                  <span className="material-symbols-outlined text-blue-action text-[22px]">airline_seat_recline_extra</span>
                  <span className="text-ink-2 text-xs">{t('detail.seatingPlan')}</span>
                  <span className="text-navy-deep font-bold text-base">{t('detail.vipSeats', { n: vehicle.seats })}</span>
                </div>
                <div className="p-2.5 bg-card rounded-xl flex flex-col gap-1 border border-rule">
                  <span className="material-symbols-outlined text-blue-action text-[22px]">speed</span>
                  <span className="text-ink-2 text-xs">{t('detail.engineLabel')}</span>
                  <span className="text-navy-deep font-bold text-base">2.8 GD Diesel Turbo</span>
                </div>
                <div className="p-2.5 bg-card rounded-xl flex flex-col gap-1 border border-rule">
                  <span className="material-symbols-outlined text-blue-action text-[22px]">luggage</span>
                  <span className="text-ink-2 text-xs">{t('detail.luggageLabel')}</span>
                  <span className="text-navy-deep font-bold text-base">{t('detail.luggageValue')}</span>
                </div>
                <div className="p-2.5 bg-card rounded-xl flex flex-col gap-1 border border-rule">
                  <span className="material-symbols-outlined text-blue-action text-[22px]">local_gas_station</span>
                  <span className="text-ink-2 text-xs">{t('detail.fuelLabel')}</span>
                  <span className="text-navy-deep font-bold text-base">{t('vdm.diesel')}</span>
                </div>
              </div>
              <p className="text-sm text-ink-2 leading-relaxed pt-1">{description}</p>
            </section>

            <section className="bg-paper-canvas p-4 sm:p-6 rounded-2xl border border-rule space-y-4">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-verified-emerald text-[22px]">verified_user</span>
                <h2 className="text-[22px] leading-7 font-bold text-navy-deep">{t('detail.driverTitle')}</h2>
              </div>
              <div className="p-4 bg-card rounded-2xl border border-rule flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-blue-subtle text-blue-action font-bold flex items-center justify-center text-2xl border-2 border-blue-action/30">
                      {publicName.charAt(0)}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm ring-2 ring-white">
                      <Star className="w-3.5 h-3.5 fill-white text-white" />
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-navy-deep">{publicName}</h3>
                      {vehicle.isVerified ? (
                        <span className="px-2 py-[2px] rounded-full bg-amber-500/20 text-amber-800 text-[11px] font-bold border border-amber-400/40 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{t('detail.featuredBadge')}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-[2px] rounded-full bg-blue-subtle text-blue-action text-[11px] font-bold">
                          {t('detail.standardListing')}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowECardModal(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300/60 text-[11px] font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                      >
                        <QrCode className="w-3 h-3 text-amber-600" />
                        <span>{t('ecard.btn')}</span>
                      </button>
                    </div>
                    <p className="text-xs text-ink-2 mt-0.5">{t('detail.driverExp', { loc: shortLocation })}</p>
                    <div className="flex items-center gap-1.5 text-xs text-ink-2 mt-1">
                      <span>{t('detail.langLabel')} 🇹🇭 {t('detail.langTh')}</span>
                      {vehicle.languages?.includes('en') && <span>• 🇬🇧 {t('vehicle.langEn')}</span>}
                      {vehicle.languages?.includes('zh') && <span>• 🇨🇳 {t('vehicle.langZh')}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-rule w-full sm:w-auto">
                  <span className="text-xs text-ink-2 block">{t('detail.licenseLabel')}</span>
                  <span className="font-semibold text-navy-deep text-sm flex items-center gap-1 sm:justify-end">
                    <span className="material-symbols-outlined text-[16px] text-amber-500">
                      {vehicle.plateType === 'yellow' ? 'local_taxi' : 'directions_car'}
                    </span>
                    <span>{vehicle.plateType === 'yellow' ? t('detail.yellowPlateLong') : t('detail.licenseOk')}</span>
                  </span>
                </div>
              </div>
            </section>

            <CustomerAvailabilitySchedule
              busyDates={vehicle.busyDates}
              isAvailable={vehicle.isAvailable !== false}
              driverPhone={vehicle.driverPhone}
              driverNickname={vehicle.driverNickname}
            />

            <VehicleReviewsSection vehicle={vehicle} />

            <section className="bg-paper-canvas p-4 sm:p-6 rounded-2xl border border-rule space-y-4">
              <h2 className="text-[22px] leading-7 font-bold text-navy-deep">{t('detail.amenities')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {amenities.map((item) => (
                  <div key={item} className="p-2 px-3 rounded-xl bg-card border border-rule flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-verified-emerald text-[20px] shrink-0">check_circle</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-paper-canvas p-4 sm:p-6 rounded-2xl border border-rule space-y-4">
              <h2 className="text-[22px] leading-7 font-bold text-navy-deep">{t('detail.ratesTitle')}</h2>
              <div className="overflow-hidden rounded-xl border border-rule bg-card">
                <table className="w-full text-left text-sm">
                  <thead className="bg-paper-2 text-ink-2 text-[11px] font-bold uppercase">
                    <tr>
                      <th className="p-2.5">{t('detail.colZone')}</th>
                      <th className="p-2.5">{t('detail.colRoute')}</th>
                      <th className="p-2.5 text-right">{t('detail.colPrice')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
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
                          <td className="p-2.5 font-bold text-navy-deep">{t('detail.zoneLine', { no: idx + 1, label: row.label })}</td>
                          <td className="p-2.5 text-ink-2">{row.route}</td>
                          <td className="p-2.5 text-right font-bold text-blue-action">
                            ฿{Number(vehicle.zoneRates![row.key]).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-ink-2">
                <div className="p-2.5 rounded-xl bg-card border border-rule space-y-1">
                  <span className="font-bold text-navy-deep block">{t('detail.hoursTitle')}</span>
                  <p>• {t('detail.termsHours', { h: 10, start: '08:00', end: '18:00', rate: `${STANDARD_TERMS.overtimeRatePerHour} ฿` })}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-rule space-y-1">
                  <span className="font-bold text-navy-deep block">{t('detail.stayTitle')}</span>
                  <p>• {t('detail.termsStay', { rate: `${STANDARD_TERMS.overnightStayRate} ฿` })}</p>
                  <p>• {t('terms.fuelNote')}</p>
                </div>
              </div>
            </section>

            {companionVehicles.length > 0 && (
              <section className="bg-blue-50/50 p-4 sm:p-6 rounded-2xl border border-blue-200/70 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-[22px] leading-7 font-bold text-navy-deep flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-action">garage_home</span>
                      <span>{t('detail.fleetTitle', { name: publicName })}</span>
                    </h2>
                    <p className="text-xs text-ink-2 mt-1">{t('detail.fleetDesc', { n: companionVehicles.length })}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-action font-bold text-xs">
                    {t('detail.fleetTotal', { n: companionVehicles.length + 1 })}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {companionVehicles.map((comp) => {
                    const compBasePrice = comp.zoneRates?.city ?? null;
                    return (
                      <div key={comp.id} className="p-3 rounded-xl bg-card border border-rule shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="relative h-28 w-full rounded-lg overflow-hidden bg-navy-deep mb-2">
                            {comp.images?.[0] ? (
                              <Image src={comp.images[0]} alt={comp.title} fill sizes="(max-width: 640px) 100vw, 250px" className="object-cover" />
                            ) : (
                              <div className="w-full h-full grid place-items-center">
                                <span className="material-symbols-outlined text-slate-600 text-[28px]">directions_car</span>
                              </div>
                            )}
                            <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded bg-navy-deep/90 text-white text-[10px] font-bold">
                                {t('vehicle.seats', { n: comp.seats })}
                              </span>
                              {comp.plateType === 'yellow' ? (
                                <span className="px-1.5 py-0.5 rounded bg-amber-400 text-amber-950 text-[10px] font-bold">{t('hero.quickYellow')}</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">{t('fleet.plateBlue')}</span>
                              )}
                            </div>
                          </div>
                          <h3 className="font-bold text-sm text-navy-deep line-clamp-1 mb-1">{comp.title}</h3>
                          <p className="text-xs text-ink-2 truncate mb-2">{(comp.amenities ?? []).slice(0, 2).join(' • ')}</p>
                        </div>
                        <div className="pt-2 border-t border-rule flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-ink-2 block">{t('detail.fromPrice')}</span>
                            {compBasePrice !== null ? (
                              <span className="text-xs font-bold text-blue-action">฿{compBasePrice.toLocaleString()}{t('vehicle.perDay')}</span>
                            ) : (
                              <span className="text-xs font-bold text-amber-600">{t('vehicle.priceOnRequest')}</span>
                            )}
                          </div>
                          <Link
                            href={`/vehicle/${comp.id}`}
                            className="px-3 py-1.5 rounded-lg bg-blue-action hover:bg-blue-action-hover text-white text-xs font-bold transition-all shadow-xs"
                          >
                            {t('detail.switchTo')}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <div className="bg-paper-canvas rounded-3xl p-4 sm:p-6 border border-rule shadow-xl space-y-4">
              <div>
                <span className="text-xs text-ink-2 block">{t('vehicle.priceFrom')}</span>
                <div className="flex items-baseline gap-1">
                  {basePrice !== null ? (
                    <>
                      <span className="text-[32px] leading-tight font-black text-navy-deep">฿{basePrice.toLocaleString()}</span>
                      <span className="text-sm text-ink-2">{t('vehicle.perDay')}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-black text-amber-600 leading-tight">{t('vehicle.priceOnRequest')}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>{t('vehicle.noCommission')}</span>
                  </span>
                  <a
                    href="#vehicle-reviews"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('vehicle-reviews')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-xs text-ink-2 hover:text-blue-action flex items-center gap-1 cursor-pointer font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px] text-amber-accent">star</span>
                    <span>{hasRating ? `${vehicle.rating} (${vehicle.reviewCount})` : t('detail.noReviews')}</span>
                  </a>
                </div>
              </div>

              {upcomingRanges.length > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  <span className="truncate">
                    {t('cal.cardUpcomingBusy', { range: upcomingRanges[0].label })}
                    {upcomingRanges.length > 1 && ` (+${upcomingRanges.length - 1})`}
                  </span>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-card border border-rule space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-navy-deep">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{t('detail.directChannels')}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                    {t('detail.directDeal')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDepositModal(true)}
                  className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer border border-amber-500"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>{t('vc.depositCta')}</span>
                </button>

                <div className="space-y-2">
                  <a
                    href={`tel:${vehicle.driverPhone}`}
                    onClick={handleDirectCall}
                    className="w-full h-11 bg-navy-deep hover:bg-navy-surface text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[19px]">call</span>
                    <span>{isPhoneRevealed ? vehicle.driverPhone : t('detail.callDriver', { phone: maskPhoneNumber(vehicle.driverPhone) })}</span>
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
                    className="w-full h-11 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 5.92 2 10.75c0 3.08 1.83 5.79 4.6 7.29-.2.74-.74 2.68-.85 3.08-.13.48.18.47.37.35.15-.09 2.06-1.39 2.87-1.95.66.19 1.34.29 2.01.29 5.52 0 10-3.92 10-8.76S17.52 2 12 2z" />
                    </svg>
                    <span>{t('detail.lineAsk')}</span>
                  </a>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-0.5">
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
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                      </svg>
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleCopyWechat}
                    className="h-11 rounded-xl bg-[#07C160] hover:bg-[#06ab55] text-white flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer relative"
                    title={vehicle.driverWechat ? t('detail.wechatCopyHint', { id: vehicle.driverWechat }) : t('detail.wechatEmptyHint')}
                    aria-label="WeChat"
                  >
                    {copiedWechat ? (
                      <span className="material-symbols-outlined text-[20px] text-white">check</span>
                    ) : (
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M8.5 2C3.8 2 0 5.4 0 9.5c0 2.4 1.3 4.5 3.3 5.9-.2.8-.7 2.6-.8 3 .2 0 1.9-.8 3.1-1.5.9.3 1.9.4 2.9.4 4.7 0 8.5-3.4 8.5-7.5S13.2 2 8.5 2zm-2.2 4.5c.7 0 1.2.6 1.2 1.2s-.6 1.2-1.2 1.2c-.7 0-1.2-.6-1.2-1.2s.5-1.2 1.2-1.2zm4.4 0c.7 0 1.2.6 1.2 1.2s-.6 1.2-1.2 1.2c-.7 0-1.2-.6-1.2-1.2s.5-1.2 1.2-1.2zM17 10c-3.6 0-6.5 2.5-6.5 5.5s2.9 5.5 6.5 5.5c.7 0 1.5-.1 2.2-.4.9.5 2.3 1.1 2.4 1.1-.1-.3-.4-1.6-.6-2.2 1.5-1.1 2.5-2.6 2.5-4 0-3-2.9-5.5-6.5-5.5zm-2.5 3.5c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9zm5 0c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9z" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyKakao}
                    className="h-11 rounded-xl bg-[#FEE500] hover:bg-[#ebd300] text-[#191919] flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer relative"
                    title={vehicle.driverKakao ? t('detail.kakaoCopyHint', { id: vehicle.driverKakao }) : t('detail.kakaoEmptyHint')}
                    aria-label="KakaoTalk"
                  >
                    {copiedKakao ? (
                      <span className="material-symbols-outlined text-[20px] text-[#191919]">check</span>
                    ) : (
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 3c-5.523 0-10 3.582-10 8 0 2.87 1.905 5.39 4.781 6.745-.21.776-.763 2.793-.873 3.226-.138.54.197.533.414.389.171-.114 2.327-1.58 3.262-2.215.776.115 1.579.175 2.416.175 5.523 0 10-3.582 10-8s-4.477-8-10-8z" />
                      </svg>
                    )}
                  </button>
                </div>

                {(vehicle.driverWechat || vehicle.driverKakao) && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                    {vehicle.driverWechat && (
                      <button
                        type="button"
                        onClick={handleCopyWechat}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/60 hover:bg-teal-100 transition-colors cursor-pointer"
                        title={t('detail.copyWechatTitle')}
                      >
                        <span className="font-bold">WeChat:</span>
                        <span className="font-mono">{vehicle.driverWechat}</span>
                        <span className="material-symbols-outlined text-[13px] text-teal-600">{copiedWechat ? 'check' : 'content_copy'}</span>
                      </button>
                    )}
                    {vehicle.driverKakao && (
                      <button
                        type="button"
                        onClick={handleCopyKakao}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/60 hover:bg-amber-100 transition-colors cursor-pointer"
                        title={t('detail.copyKakaoTitle')}
                      >
                        <span className="font-bold">Kakao:</span>
                        <span className="font-mono">{vehicle.driverKakao}</span>
                        <span className="material-symbols-outlined text-[13px] text-amber-700">{copiedKakao ? 'check' : 'content_copy'}</span>
                      </button>
                    )}
                  </div>
                )}

                {channelNotice && (
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-700 flex items-center gap-1.5 animate-fade-in shadow-2xs">
                    <span className="material-symbols-outlined text-[15px] shrink-0 text-blue-600">info</span>
                    <span className="leading-snug">{channelNotice}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowBookingSheet(true)}
                  className="w-full h-11 bg-blue-action hover:bg-blue-action-hover text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  <span>{t('detail.requestBooking')}</span>
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-card border border-rule space-y-1 text-xs text-ink-2">
                <div className="flex items-center gap-1 text-navy-deep font-bold">
                  <span className="material-symbols-outlined text-[16px] text-verified-emerald">shield</span>
                  <span>{t('detail.guaranteeTitle')}</span>
                </div>
                <p>{t('detail.guarantee1')}</p>
                <p>{t('detail.guarantee2')}</p>
              </div>

              {(() => {
                const rawSponsor =
                  sponsors.find((s) => s.category === 'insurance') ||
                  sponsors.find((s) => s.targetAudience === 'traveler' || s.targetAudience === 'all') ||
                  sponsors[0];
                if (!rawSponsor) return null;
                const perkSponsor = getLocalizedSponsor(rawSponsor, locale);
                return (
                  <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-stone-50 border border-amber-300/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 font-bold text-[11px] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-amber-600">verified</span>
                        <span>{t('spn.travelerPerk')}</span>
                      </span>
                      <span className="text-[10px] text-ink-2">{t('vdm.partner')}</span>
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs text-navy-deep leading-tight">{perkSponsor.title}</h4>
                      <p className="text-[11px] text-ink-2 line-clamp-2">{perkSponsor.tagline}</p>
                    </div>
                    <a
                      href={perkSponsor.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-1.5 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs flex items-center justify-center gap-1 transition-colors shadow-xs"
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

        <div className="lg:hidden sticky bottom-0 z-40 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-white/95 backdrop-blur-md border-t border-rule grid grid-cols-2 gap-2">
          <a
            href={`tel:${vehicle.driverPhone}`}
            onClick={handleDirectCall}
            className="h-11 bg-navy-deep text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">call</span>
            <span>{t('vehicle.directCall')}</span>
          </a>
          <a
            href={formatLineLink(vehicle.driverLine, buildVehicleLineMessage(vehicle))}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 bg-[#06C755] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span>{t('vehicle.lineChat')}</span>
          </a>
        </div>
      </main>

      <Footer />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onOpenRegisterModal={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
      />
      <DriverRegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
      {showBookingSheet && (
        <BookingConfirmationSheet vehicle={vehicle} isModal={true} onClose={() => setShowBookingSheet(false)} />
      )}
      <DriverSmartECardModal vehicle={vehicle} isOpen={showECardModal} onClose={() => setShowECardModal(false)} />
      {showDepositModal && (
        <DepositPaymentModal vehicle={vehicle} isOpen={showDepositModal} onClose={() => setShowDepositModal(false)} />
      )}
    </div>
  );
}
