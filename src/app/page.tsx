'use client';

import React, { useState, useMemo, useEffect, useCallback, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { VEHICLES, Vehicle, Sponsor } from '@/data/mockData';
import { isMockDataEnabled, isMockEnvEnabled, isMockVehicleId, isExcludedTestVehicle } from '@/lib/mockConfig';
import { Navbar } from '@/components/Navbar';
import { LiveTickerRibbon } from '@/components/LiveTickerRibbon';
import { Hero } from '@/components/Hero';
import { MemberPerksSection } from '@/components/MemberPerksSection';
import { VehicleCard } from '@/components/VehicleCard';
import { InFeedSponsorCard } from '@/components/InFeedSponsorCard';
import { SponsorBanner } from '@/components/SponsorBanner';
import { PlatformShowcase } from '@/components/PlatformShowcase';
import { CorporateSection } from '@/components/CorporateSection';
import { TrustedPartnersSection } from '@/components/TrustedPartnersSection';
import { DriverEnrollmentBanner } from '@/components/DriverEnrollmentBanner';
import { TripBoard } from '@/components/TripBoard';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { getLocalizedSponsor } from '@/lib/sponsorLocalization';
import { OFFICIAL_LINE_URL } from '@/lib/constants';
const VehicleDetailModal = dynamic(
  () => import('@/components/VehicleDetailModal').then((m) => m.VehicleDetailModal),
  { ssr: false }
);
const DriverFleetModal = dynamic(
  () => import('@/components/DriverFleetModal').then((m) => m.DriverFleetModal),
  { ssr: false }
);
const DriverRegisterModal = dynamic(
  () => import('@/components/DriverRegisterModal').then((m) => m.DriverRegisterModal),
  { ssr: false }
);
const LoginModal = dynamic(
  () => import('@/components/LoginModal').then((m) => m.LoginModal),
  { ssr: false }
);
const DriverPortalModal = dynamic(
  () => import('@/components/portals/DriverPortalModal').then((m) => m.DriverPortalModal),
  { ssr: false }
);

const CustomerPortalModal = dynamic(
  () => import('@/components/portals/CustomerPortalModal').then((m) => m.CustomerPortalModal),
  { ssr: false }
);
const AdminPortalModal = dynamic(
  () => import('@/components/portals/AdminPortalModal').then((m) => m.AdminPortalModal),
  { ssr: false }
);
import { useAuth } from '@/context/AuthContext';
import { Footer } from '@/components/Footer';
import { ScrollQualityMonitor } from '@/components/ScrollQualityMonitor';
import { useLanguage } from '@/context/LanguageContext';

import { SearchX, ArrowRight, X, SlidersHorizontal, RotateCcw, UserPlus, MessageCircle } from 'lucide-react';




function SectionHead({
  title,
  count,
  caption,
  action,
}: {
  title: string;
  count: string;
  caption: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-3 border-b border-slate-300 dark:border-slate-800 mb-4 sm:mb-5">
      <div>
        <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px]">verified</span>
          <span>Standardized Verified Fleet</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-2">
          <span>{title}</span>
          <span className="text-sm font-bold text-slate-500 font-mono">({count})</span>
        </h2>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-normal mt-0.5">
          {caption}
        </p>
      </div>
      {action ? (
        <div className="flex items-center gap-2 flex-wrap">
          {action}
        </div>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('van');
  const [selectedZone, setSelectedZone] = useState<string>('north');
  const [selectedSeats, setSelectedSeats] = useState<string>('9');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const isDemo = isClient && isMockDataEnabled();
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => (isMockEnvEnabled() ? VEHICLES : []));
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [demoBannerDismissed, setDemoBannerDismissed] = useState<boolean>(false);

  const loadVehicles = useCallback(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    fetch('/api/vehicles' + search)
      .then((res) => res.json())
      .then((data) => {
        if (data.vehicles && Array.isArray(data.vehicles)) {
          // Fair Random Rotation: shuffle vehicles on load
          const shuffled = [...data.vehicles].sort(() => Math.random() - 0.5);
          setVehicles(shuffled);
        }
      })
      .catch((err) => console.debug('Failed to fetch vehicles:', err));
  }, []);

  const [plateFilter, setPlateFilter] = useState<'all' | 'yellow' | 'blue' | 'tax'>('all');
  const [authBanner, setAuthBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const authErr = params.get('auth_error');
    const authOk = params.get('auth');
    if (authErr) {
      setAuthBanner({ type: 'error', message: `เข้าสู่ระบบไม่สำเร็จ: ${authErr}` });
      const url = new URL(window.location.href);
      url.searchParams.delete('auth_error');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    } else if (authOk === 'success') {
      setAuthBanner({ type: 'success', message: 'เข้าสู่ระบบสำเร็จ ยินดีต้อนรับสู่ TripDee' });
      const url = new URL(window.location.href);
      url.searchParams.delete('auth');
      url.searchParams.delete('role');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
  }, []);

  useEffect(() => {
    loadVehicles();
    const handleUpdate = () => loadVehicles();
    window.addEventListener('tripdee-vehicles-updated', handleUpdate);
    return () => window.removeEventListener('tripdee-vehicles-updated', handleUpdate);
  }, [loadVehicles]);

  useEffect(() => {
    let active = true;
    const loadSponsors = () => {
      fetch('/api/sponsors' + window.location.search)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load sponsors');
          return res.json();
        })
        .then((data) => {
          if (active) setSponsors(Array.isArray(data.sponsors) ? data.sponsors : []);
        })
        .catch(() => {
          if (active) setSponsors([]);
        });
    };
    loadSponsors();
    window.addEventListener('tripdee-sponsors-updated', loadSponsors);
    return () => {
      active = false;
      window.removeEventListener('tripdee-sponsors-updated', loadSponsors);
    };
  }, []);

  useEffect(() => {
    const handlePlateFilter = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        if (customEvent.detail === 'yellow' || customEvent.detail === 'blue' || customEvent.detail === 'tax') {
          setPlateFilter(customEvent.detail);
        } else {
          setPlateFilter('all');
        }
      }
    };
    window.addEventListener('tripdee-filter-plate', handlePlateFilter);
    return () => window.removeEventListener('tripdee-filter-plate', handlePlateFilter);
  }, []);
  const [isDriverPortalOpen, setIsDriverPortalOpen] = useState<boolean>(false);
  const [driverAddVehicle, setDriverAddVehicle] = useState<boolean>(false);

  useEffect(() => {
    const handleDriverPortalEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ add?: boolean }>).detail;
      setDriverAddVehicle(Boolean(detail?.add));
      setIsDriverPortalOpen(true);
    };
    window.addEventListener('tripdee-open-driver-portal', handleDriverPortalEvent);
    return () => window.removeEventListener('tripdee-open-driver-portal', handleDriverPortalEvent);
  }, []);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleAdminPortalEvent = () => {
      setIsAdminPortalOpen(true);
    };
    window.addEventListener('tripdee-open-admin-portal', handleAdminPortalEvent);
    return () => window.removeEventListener('tripdee-open-admin-portal', handleAdminPortalEvent);
  }, []);

  const [selectedVehicleDetail, setSelectedVehicleDetail] = useState<Vehicle | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isPortalOpen, setIsPortalOpen] = useState<boolean>(false);

  const [driverFleetModal, setDriverFleetModal] = useState<{
    isOpen: boolean;
    driverPhone: string;
    driverName: string;
    fleetVehicles: Vehicle[];
  }>({
    isOpen: false,
    driverPhone: '',
    driverName: '',
    fleetVehicles: [],
  });
  const handleSelectDetail = useCallback((v: Vehicle) => {
    setSelectedVehicleDetail(v);
  }, []);

  const handleViewFleet = useCallback((driverPhone: string, driverName: string, fleetVehicles: Vehicle[]) => {
    setDriverFleetModal({
      isOpen: true,
      driverPhone,
      driverName,
      fleetVehicles,
    });
  }, []);

  const filteredVehicles = useMemo(() => {
    // In production mode (e.g. ?demo=0 or NEXT_PUBLIC_ENABLE_MOCK_DATA=false), strictly exclude mock vehicle IDs
    // Test sample leads (e.g. v-test-admin, v-drv-lead-01) are strictly excluded in ALL modes
    const baseList = (isDemo ? vehicles : vehicles.filter((v) => !isMockVehicleId(v.id))).filter(
      (v) => !isExcludedTestVehicle(v.id)
    );

    const filtered = baseList.filter((vehicle) => {
      const matchesTab =
        activeTab === 'van'
          ? (vehicle.type === 'van' && vehicle.rentalType !== 'self_drive')
          : activeTab === 'suv_driver'
          ? ((vehicle.type === 'suv' || vehicle.type === 'car') && vehicle.rentalType === 'with_driver')
          : (vehicle.rentalType === 'self_drive');
      
      const matchesRegion =
        (selectedZone === 'bkk' && (vehicle.region === 'central' || vehicle.location.includes('กรุงเทพ') || vehicle.location.includes('กทม'))) ||
        (selectedZone === 'north' && (vehicle.region === 'north' || vehicle.location.includes('เชียงใหม่'))) ||
        (selectedZone === 'east' && (vehicle.region === 'east' || vehicle.location.includes('พัทยา') || vehicle.location.includes('ชลบุรี'))) ||
        (selectedZone === 'south' && (vehicle.region === 'south' || vehicle.location.includes('ภูเก็ต') || vehicle.location.includes('กระบี่'))) ||
        (selectedZone === 'isan' && (vehicle.region === 'isan' || vehicle.location.includes('เขาใหญ่') || vehicle.location.includes('โคราช')));

      const matchesZone =
        selectedZone === 'all' ||
        matchesRegion ||
        (vehicle.popularRoutes ?? []).some((r) => r.includes(selectedZone)) ||
        vehicle.location.includes(selectedZone);
      const matchesSeats =
        selectedSeats === 'all'
          ? true
          : selectedSeats === '4-7'
          ? vehicle.seats >= 4 && vehicle.seats <= 7
          : selectedSeats === '4-5' || selectedSeats === '4'
          ? vehicle.seats <= 5
          : selectedSeats === '7'
          ? vehicle.seats === 7
          : selectedSeats === '9'
          ? vehicle.seats === 9
          : selectedSeats === '10'
          ? vehicle.seats === 10
          : selectedSeats === '11-14' || selectedSeats === '13'
          ? vehicle.seats >= 11 && vehicle.seats <= 14
          : selectedSeats === '20'
          ? vehicle.seats >= 16
          : vehicle.seats === Number(selectedSeats);

      const keyword = searchKeyword.trim().toLowerCase();
      const matchesKeyword =
        keyword === '' ||
        vehicle.title.toLowerCase().includes(keyword) ||
        vehicle.description.toLowerCase().includes(keyword) ||
        (vehicle.amenities ?? []).some((a) => a.toLowerCase().includes(keyword)) ||
        (vehicle.driverNickname && vehicle.driverNickname.toLowerCase().includes(keyword)) ||
        (vehicle.driverName && vehicle.driverName.toLowerCase().includes(keyword));

      const matchesPlate =
        plateFilter === 'all'
          ? true
          : plateFilter === 'yellow'
          ? vehicle.plateType === 'yellow'
          : plateFilter === 'blue'
          ? vehicle.plateType === 'blue'
          : plateFilter === 'tax'
          ? vehicle.canIssueTaxInvoice === true
          : true;

      return matchesTab && matchesZone && matchesSeats && matchesKeyword && matchesPlate;
    });

    // 1. รถที่จ่ายสปอนเซอร์ดันแนะนำ (⭐ รถแนะนำ / isVerified) จะได้ขึ้นอันดับแรกเสมอ
    // 2. ภายในกลุ่มเดียวกัน (ทั้งกลุ่มสปอนเซอร์และกลุ่มรถทั่วไป) จะสุ่มแสดงผล (Fair Random Rotation) หมุนเวียนกันอย่างเป็นธรรม
    return filtered.sort((a, b) => Number(Boolean(b.isVerified)) - Number(Boolean(a.isVerified)));
  }, [activeTab, selectedZone, selectedSeats, searchKeyword, plateFilter, vehicles, isDemo]);

  const totalVanCount = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          !isExcludedTestVehicle(v.id) &&
          (isDemo || !isMockVehicleId(v.id)) &&
          v.type === 'van' &&
          v.rentalType !== 'self_drive'
      ).length,
    [vehicles, isDemo]
  );
  const availableVanCount = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          !isExcludedTestVehicle(v.id) &&
          (isDemo || !isMockVehicleId(v.id)) &&
          v.type === 'van' &&
          v.rentalType !== 'self_drive' &&
          v.isAvailable !== false
      ).length,
    [vehicles, isDemo]
  );
  const totalSuvDriverCount = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          !isExcludedTestVehicle(v.id) &&
          (isDemo || !isMockVehicleId(v.id)) &&
          (v.type === 'suv' || v.type === 'car') &&
          v.rentalType === 'with_driver'
      ).length,
    [vehicles, isDemo]
  );
  const totalCarCount = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          !isExcludedTestVehicle(v.id) &&
          (isDemo || !isMockVehicleId(v.id)) &&
          v.rentalType === 'self_drive'
      ).length,
    [vehicles, isDemo]
  );

  const resetFilters = () => {
    setSelectedZone('all');
    setSelectedSeats('all');
    setSearchKeyword('');
    setPlateFilter('all');
  };

  const hasFilters = selectedZone !== 'all' || selectedSeats !== 'all' || searchKeyword !== '' || plateFilter !== 'all';

  const hotelStays = useMemo(
    () => sponsors.filter((s) => s.category === 'hotel').map((s) => getLocalizedSponsor(s, locale)),
    [sponsors, locale]
  );

  const navigateToSection = useCallback(
    (targetId: string, requiredTab?: string) => {
      const isMainPageSection = ['results', 'tripboard', 'routes'].includes(targetId);
      const targetTab =
        requiredTab ||
        (isMainPageSection
          ? ['van', 'suv_driver', 'car'].includes(activeTab)
            ? activeTab
            : 'van'
          : targetId === 'corporate'
          ? 'corporate'
          : undefined);

      if (targetTab && activeTab !== targetTab) {
        setActiveTab(targetTab);
      }

      if (targetId === 'corporate' && targetTab === 'corporate') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      let attempts = 0;
      const tryScroll = () => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (attempts < 15) {
          attempts++;
          setTimeout(tryScroll, 40);
        }
      };

      requestAnimationFrame(tryScroll);
    },
    [activeTab]
  );

  return (
    <div className="flex min-h-dvh flex-col bg-paper font-body text-ink">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenDriverEntry={() => {
          setDriverAddVehicle(false);
          setIsDriverPortalOpen(true);
        }}
        onOpenAddVehicle={() => {
          setDriverAddVehicle(true);
          setIsDriverPortalOpen(true);
        }}
        onOpenPortal={() => setIsPortalOpen(true)}
      />
      <div aria-hidden="true" className="h-16 shrink-0" />
      <LiveTickerRibbon availableVans={availableVanCount} />
      {authBanner && (
        <aside
          role="alert"
          aria-live="polite"
          className={`relative z-40 px-4 py-2.5 text-xs font-bold border-b transition-all flex items-center justify-between gap-3 ${
            authBanner.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">
                {authBanner.type === 'error' ? 'error' : 'check_circle'}
              </span>
              <span>{authBanner.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setAuthBanner(null)}
              className="p-1 hover:opacity-75 text-xs font-bold cursor-pointer"
              aria-label="ปิดการแจ้งเตือน"
            >
              ✕
            </button>
          </div>
        </aside>
      )}
      {isClient && !demoBannerDismissed && isDemo && isMockEnvEnabled() && (
        <aside
          role="status"
          aria-label={t('demo.mockAria')}
          suppressHydrationWarning
          className="relative z-30 bg-amber-500/10 dark:bg-amber-500/20 border-b border-amber-500/25 px-4 py-2 text-xs font-semibold text-amber-900 dark:text-amber-200 transition-all"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <p className="truncate text-[11px] sm:text-xs">
                <span className="font-extrabold sm:hidden">{t('demo.mockShort')}</span>
                <span className="font-extrabold hidden sm:inline">{t('demo.bannerMockTitle')}</span>{' '}
                <span className="hidden xs:inline">{t('demo.bannerMockDesc')}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="?demo=0"
                className="underline hover:text-amber-950 dark:hover:text-white transition-colors text-[11px]"
                title={t('demo.mockLinkTitle')}
              >
                {t('demo.bannerMockCta')}
              </a>
              <button
                type="button"
                onClick={() => setDemoBannerDismissed(true)}
                className="rounded p-0.5 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 text-xs px-1.5 cursor-pointer"
                aria-label={t('demo.closeAria')}
              >
                ✕
              </button>
            </div>
          </div>
        </aside>
      )}

      {(activeTab === 'van' || activeTab === 'suv_driver' || activeTab === 'car') && (
        <Hero
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
          selectedSeats={selectedSeats}
          setSelectedSeats={setSelectedSeats}
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
          resultCount={filteredVehicles.length}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          plateFilter={plateFilter}
          setPlateFilter={setPlateFilter}
          totalVanCount={totalVanCount}
          totalSuvDriverCount={totalSuvDriverCount}
          totalCarCount={totalCarCount}
        />
      )}
      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-margin lg:px-gutter pb-20 md:pb-8">
        {activeTab === 'hotel' ? (
          <div key="hotel" className="td-panel-enter pt-24 sm:pt-28 pb-16">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
                {t('home.hotelTitle')}
              </h1>
              <p className="td-fig mt-2 text-sm font-bold text-ink-2">
                {t('home.hotelCaption', { count: hotelStays.length })}
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-5">
              {hotelStays.map((sponsor) => (
                <SponsorBanner key={sponsor.id} sponsor={sponsor} />
              ))}
            </div>
          </div>
        ) : activeTab === 'corporate' ? (
          <div key="corporate" className="td-panel-enter pt-24 sm:pt-28 pb-24 sm:pb-20">
            <CorporateSection vehicles={vehicles} />
          </div>
        ) : (
          <div key={activeTab} className="td-panel-enter pb-4 sm:pb-8">
            {/* TripBoard section — full-bleed dark band per reference design */}
            <div className="w-[100vw] max-w-none relative left-1/2 -translate-x-1/2">
              <TripBoard />
            </div>

            {/* B2B Corporate Caravan Quotation Engine — full-bleed dark band per reference design */}
            <div className="w-[100vw] max-w-none relative left-1/2 -translate-x-1/2">
              <CorporateSection vehicles={vehicles} />
            </div>

            {/* Trusted Community Partners (4 Grid Hairline Cards) */}
            <TrustedPartnersSection />

            {/* Primary Vehicle Catalog & Filter Rail */}
            <section id="results" aria-label={t('home.resultsAria')} className="mt-2 sm:mt-4 scroll-mt-20 sm:scroll-mt-24">
              <SectionHead
                title={
                  activeTab === 'van'
                    ? t('home.vanTitle')
                    : activeTab === 'suv_driver'
                    ? t('home.suvDriverTitle')
                    : t('home.carTitle')
                }
                count={t('home.vehicleCount', { count: filteredVehicles.length })}
                caption={
                  activeTab === 'van'
                    ? t('home.resultsCaption')
                    : activeTab === 'suv_driver'
                    ? t('home.suvDriverCaption')
                    : t('home.carCaption')
                }
                action={
                  hasFilters ? (
                    <button
                      onClick={resetFilters}
                      className="td-btn shrink-0 rounded-pill border border-rule bg-card px-4 py-2 text-[13px] font-extrabold text-ink transition-transform duration-220 ease-out hover:-translate-y-0.5"
                    >
                      {t('home.clearFilters')}
                    </button>
                  ) : undefined
                }
              />

              {/* Quick Filter: Transport Category & Legal Type (Unified Minimalist Bar) */}
              <div className="mb-4 sm:mb-6 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-medium">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                  {activeTab === 'van'
                    ? t('home.plateGroupVan')
                    : activeTab === 'suv_driver'
                    ? t('home.plateGroupSuvDriver')
                    : t('home.plateGroupCar')}
                </span>
                <button
                  type="button"
                  onClick={() => setPlateFilter('all')}
                  className={`px-3 py-1.5 rounded-none text-xs font-bold transition-all cursor-pointer ${
                    plateFilter === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border border-slate-900 dark:border-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {t('home.plateAll', {
                    count:
                      activeTab === 'van'
                        ? totalVanCount
                        : activeTab === 'suv_driver'
                        ? totalSuvDriverCount
                        : totalCarCount,
                  })}
                </button>
                {activeTab === 'van' || activeTab === 'suv_driver' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setPlateFilter('yellow')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-bold transition-all cursor-pointer ${
                        plateFilter === 'yellow'
                          ? 'bg-amber-400 text-slate-950 border border-amber-500 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <span>🟡 {t('home.plateYellow')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlateFilter('blue')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-bold transition-all cursor-pointer ${
                        plateFilter === 'blue'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border border-slate-900 dark:border-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <span className="w-2 h-2 bg-blue-500 rounded-none ring-1 ring-blue-500" />
                      <span>{t('home.plateBlue')}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPlateFilter('blue')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-bold transition-all cursor-pointer ${
                      plateFilter === 'blue'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border border-slate-900 dark:border-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <span className="w-2 h-2 bg-blue-500 rounded-none ring-1 ring-blue-500" />
                    <span>{t('home.plateCarBlue')}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPlateFilter('tax')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-bold transition-all cursor-pointer ${
                    plateFilter === 'tax'
                      ? 'bg-emerald-700 text-white border border-emerald-800 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px] text-emerald-400">receipt_long</span>
                  <span>{t('home.plateTax')}</span>
                </button>
              </div>

              {/* Active Filter Chips */}
              {hasFilters && (
                <div className="mb-6 flex flex-wrap items-center gap-2 rounded-none bg-white dark:bg-slate-900 p-2.5 sm:p-3 border border-slate-300 dark:border-slate-700 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mr-1">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-slate-900 dark:text-slate-200" />
                    {t('home.activeFilters')}
                  </span>
                  {plateFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 rounded-none bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 px-2.5 py-0.5 text-xs font-semibold border border-slate-300 dark:border-slate-700">
                      <span>
                        {plateFilter === 'yellow' && t('home.chipYellow')}
                        {plateFilter === 'blue' && t('home.chipBlue')}
                        {plateFilter === 'tax' && t('home.chipTax')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPlateFilter('all')}
                        aria-label={t('home.rmPlateAria')}
                        className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {selectedZone !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 rounded-none bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 px-2.5 py-0.5 text-xs font-semibold border border-slate-300 dark:border-slate-700">
                      <span>{t('home.chipZone', { zone: selectedZone })}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedZone('all')}
                        aria-label={t('home.rmZoneAria')}
                        className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {selectedSeats !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 rounded-none bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 px-2.5 py-0.5 text-xs font-semibold border border-slate-300 dark:border-slate-700">
                      <span>{t('home.chipSeats', { n: selectedSeats })}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedSeats('all')}
                        aria-label={t('home.rmSeatsAria')}
                        className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {searchKeyword.trim() !== '' && (
                    <span className="inline-flex items-center gap-1.5 rounded-none bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 px-2.5 py-0.5 text-xs font-semibold border border-slate-300 dark:border-slate-700">
                      <span>&ldquo;{searchKeyword}&rdquo;</span>
                      <button
                        type="button"
                        onClick={() => setSearchKeyword('')}
                        aria-label={t('home.rmSearchAria')}
                        className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="ml-auto inline-flex items-center gap-1 rounded-none bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer border border-slate-300 dark:border-slate-700"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {t('home.clearFilters')}
                  </button>
                </div>
              )}

              {/* 3-Column Standardized Verified Fleet Grid (Bauhaus Style) */}
              {filteredVehicles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVehicles.map((vehicle, index) => {
                    const showInFeedAd = sponsors.length > 0 && (
                      (index === 2 && filteredVehicles.length >= 3) ||
                      ((index + 1) % 6 === 0 && index < filteredVehicles.length - 1)
                    );
                    const sponsorIndex = sponsors.length > 0
                      ? (index === 2 ? 0 : Math.floor(index / 6) + 1) % sponsors.length
                      : 0;

                    return (
                      <React.Fragment key={vehicle.id}>
                        <VehicleCard
                          vehicle={vehicle}
                          allVehicles={vehicles}
                          onSelectDetail={handleSelectDetail}
                          onViewFleet={handleViewFleet}
                        />
                        {showInFeedAd && (
                          <div className="col-span-1 md:col-span-2 lg:col-span-3 my-1">
                            <InFeedSponsorCard sponsors={sponsors} initialIndex={sponsorIndex} />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-none border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-12 text-center">
                  <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-none bg-amber-50 dark:bg-amber-950/40">
                    <SearchX className="h-7 w-7 text-slate-700 dark:text-slate-300" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-xl font-extrabold text-slate-900 dark:text-white">
                    {t('home.emptyTitle')}
                  </h3>
                  <p className="mx-auto mt-1 max-w-[48ch] text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                    {t('home.emptyDesc')}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={resetFilters}
                      className="inline-flex items-center rounded-none bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-xs cursor-pointer border border-amber-600"
                    >
                      {t('home.emptyCta')}
                    </button>
                    <a
                      href="#tripboard"
                      className="inline-flex items-center gap-1.5 rounded-none border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white hover:bg-white transition-all cursor-pointer"
                    >
                      <span>{t('home.emptyBoard')}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href={OFFICIAL_LINE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-none bg-[#06C755] text-white border border-emerald-600 px-4 py-2.5 text-xs font-bold hover:bg-[#05b04b] transition-all cursor-pointer"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>{t('home.emptyLine')}</span>
                    </a>
                  </div>

                  <div className="mt-8 mx-auto max-w-xl rounded-none border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 p-5 text-left shadow-xs transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 rounded-none bg-emerald-700 text-white px-2 py-0.5 text-[10px] font-extrabold uppercase mb-1.5">
                          <span>{t('home.emptyDriverBadge')}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                          {t('home.emptyDriverTitle')}
                        </h4>
                        <p className="mt-0.5 text-xs font-normal text-slate-600 dark:text-slate-300">
                          {t('home.emptyDriverDesc')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsRegisterModalOpen(true)}
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-none bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer border border-emerald-800"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>{t('home.emptyDriverCta')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Member perks — placed after fleet catalog per reference design flow */}
            <MemberPerksSection
              onSelectCorporate={() => navigateToSection('corporate', 'corporate')}
              onOpenTripBoardPost={() => {
                const trigger = document.getElementById('open-post-modal-btn');
                const el = document.getElementById('tripboard');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                if (trigger) trigger.click();
              }}
            />

            {/* Driver Partner Enrollment Banner */}
            <DriverEnrollmentBanner onOpenRegister={() => setIsRegisterModalOpen(true)} />
          </div>
        )}

        {/* Platform Showcase & House Features (100% Authentic, 0% Mock Brands) */}
        <PlatformShowcase
          onOpenRegister={() => setIsRegisterModalOpen(true)}
          onSelectCorporate={() => navigateToSection('corporate', 'corporate')}
          onScrollToSearch={() => navigateToSection('results', 'van')}
        />

      </main>

      <Footer
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onSelectZone={(zone) => {
          setSelectedZone(zone);
          navigateToSection('results', 'van');
        }}
        onSelectTab={(tab) => {
          if (tab === 'van' || tab === 'suv_driver' || tab === 'car') {
            navigateToSection('results', tab);
          } else {
            navigateToSection(tab, tab);
          }
        }}
      />

      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onNavigate={navigateToSection}
      />

      <VehicleDetailModal
        vehicle={selectedVehicleDetail}
        sponsors={sponsors}
        onClose={() => setSelectedVehicleDetail(null)}
        allVehicles={vehicles}
        onSelectVehicle={(v) => setSelectedVehicleDetail(v)}
      />
      <DriverFleetModal
        isOpen={driverFleetModal.isOpen}
        onClose={() => setDriverFleetModal((prev) => ({ ...prev, isOpen: false }))}
        driverPhone={driverFleetModal.driverPhone}
        driverName={driverFleetModal.driverName}
        fleetVehicles={driverFleetModal.fleetVehicles}
        onSelectVehicleDetail={handleSelectDetail}
        onFilterFleetOnHome={(keyword) => {
          setSearchKeyword(keyword);
          navigateToSection('results', 'van');
        }}
      />
      <DriverRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        vehicles={vehicles}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onOpenDriverEntry={() => {
          setDriverAddVehicle(false);
          setIsDriverPortalOpen(true);
        }}
      />

      {((user?.role === 'driver' && isPortalOpen) || isDriverPortalOpen) && (
        <DriverPortalModal
          isOpen={isPortalOpen || isDriverPortalOpen}
          initialAddVehicle={driverAddVehicle}
          onClose={() => {
            setIsPortalOpen(false);
            setIsDriverPortalOpen(false);
            setDriverAddVehicle(false);
          }}
          onOpenRegister={() => {
            setIsPortalOpen(false);
            setIsDriverPortalOpen(false);
            setDriverAddVehicle(false);
            setIsRegisterModalOpen(true);
          }}
        />
      )}
      {user?.role === 'customer' && (
        <CustomerPortalModal
          isOpen={isPortalOpen}
          onClose={() => setIsPortalOpen(false)}
          onOpenNewQuote={() => navigateToSection('corporate', 'corporate')}
        />
      )}
      {((user?.role === 'admin' && isPortalOpen) || isAdminPortalOpen) && (
        <AdminPortalModal
          isOpen={isPortalOpen || isAdminPortalOpen}
          onClose={() => {
            setIsPortalOpen(false);
            setIsAdminPortalOpen(false);
          }}
        />
      )}

      {/* Scroll & Layout Quality Monitor (Dev/Benchmark tool - only active with ?debug=perf) */}
      {typeof window !== 'undefined' && window.location?.search?.includes('debug=perf') && (
        <ScrollQualityMonitor />
      )}
    </div>
  );
}
