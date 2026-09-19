'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { VEHICLES, SPONSORS, POPULAR_ROUTES, Vehicle } from '@/data/mockData';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { VehicleCard } from '@/components/VehicleCard';
import { SponsorBanner } from '@/components/SponsorBanner';
import { PlatformShowcase } from '@/components/PlatformShowcase';
import { SponsorSidebar } from '@/components/SponsorSidebar';
import { CorporateSection } from '@/components/CorporateSection';
import { PopularRoutesSection } from '@/components/PopularRoutesSection';
import { TripBoard } from '@/components/TripBoard';
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
const DriverSelfServiceModal = dynamic(
  () => import('@/components/portals/DriverSelfServiceModal').then((m) => m.DriverSelfServiceModal),
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
import { MobileBottomBar } from '@/components/MobileBottomBar';
import { ScrollQualityMonitor } from '@/components/ScrollQualityMonitor';
import { useLanguage } from '@/context/LanguageContext';
import type { DictKey } from '@/i18n/dictionaries';
import { SearchX, ArrowRight, X, SlidersHorizontal, RotateCcw, UserPlus, MessageCircle } from 'lucide-react';

const SERVICE_ACTIONS: { key: DictKey; tab: 'van' | 'car' | 'hotel' | 'corporate'; zone?: string; seats?: string }[] = [
  { key: 'home.service1', tab: 'van' },
  { key: 'home.service2', tab: 'van', seats: '9' },
  { key: 'home.service3', tab: 'car' },
  { key: 'home.service4', tab: 'van', seats: '7' },
  { key: 'home.service5', tab: 'corporate' },
];

const ROUTE_LINKS: { key: DictKey; value: string }[] = [
  { key: 'home.routeLink1', value: 'ม่อนแจ่ม' },
  { key: 'home.routeLink2', value: 'พัทยา' },
  { key: 'home.routeLink3', value: 'ภูเก็ต' },
  { key: 'home.routeLink4', value: 'เขาใหญ่' },
  { key: 'home.routeLink5', value: 'หัวหิน' },
];


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
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
          <h2 className="font-display text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
            {title}
            <span className="td-fig ml-2 rounded-pill bg-paper-2 px-2.5 py-0.5 align-middle text-sm font-extrabold text-ink-2">
              {count}
            </span>
          </h2>
          <p className="mt-1 text-[13px] font-medium text-ink-2">{caption}</p>
      </div>
      {action}
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('van');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedSeats, setSelectedSeats] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [vehicles, setVehicles] = useState<Vehicle[]>(VEHICLES);

  const loadVehicles = useCallback(() => {
    fetch('/api/vehicles')
      .then((res) => res.json())
      .then((data) => {
        if (data.vehicles && Array.isArray(data.vehicles) && data.vehicles.length > 0) {
          setVehicles(data.vehicles);
        }
      })
      .catch((err) => console.debug('Failed to fetch vehicles:', err));
  }, []);

  const [plateFilter, setPlateFilter] = useState<'all' | 'yellow' | 'blue' | 'tax'>('all');

  useEffect(() => {
    loadVehicles();
    const handleUpdate = () => loadVehicles();
    window.addEventListener('tripdee-vehicles-updated', handleUpdate);
    return () => window.removeEventListener('tripdee-vehicles-updated', handleUpdate);
  }, [loadVehicles]);

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

  const [selectedVehicleDetail, setSelectedVehicleDetail] = useState<Vehicle | null>(null);
  const [focusedVehicle, setFocusedVehicle] = useState<Vehicle | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isPortalOpen, setIsPortalOpen] = useState<boolean>(false);
  const [isDriverSelfServiceOpen, setIsDriverSelfServiceOpen] = useState<boolean>(false);

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
    setFocusedVehicle(v);
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
    return vehicles.filter((vehicle) => {
      const matchesTab =
        activeTab === 'van'
          ? (vehicle.type === 'van' && vehicle.rentalType !== 'self_drive')
          : (vehicle.type !== 'van' || vehicle.rentalType === 'self_drive');
      
      const matchesRegion =
        (selectedZone === 'bkk' && (vehicle.region === 'central' || vehicle.location.includes('กรุงเทพ') || vehicle.location.includes('กทม'))) ||
        (selectedZone === 'north' && (vehicle.region === 'north' || vehicle.location.includes('เชียงใหม่'))) ||
        (selectedZone === 'east' && (vehicle.region === 'east' || vehicle.location.includes('พัทยา') || vehicle.location.includes('ชลบุรี'))) ||
        (selectedZone === 'south' && (vehicle.region === 'south' || vehicle.location.includes('ภูเก็ต') || vehicle.location.includes('กระบี่'))) ||
        (selectedZone === 'isan' && (vehicle.region === 'isan' || vehicle.location.includes('เขาใหญ่') || vehicle.location.includes('โคราช')));

      const matchesZone =
        selectedZone === 'all' ||
        matchesRegion ||
        vehicle.popularRoutes.some((r) => r.includes(selectedZone)) ||
        vehicle.location.includes(selectedZone);
      const matchesSeats =
        selectedSeats === 'all'
          ? true
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
        vehicle.amenities.some((a) => a.toLowerCase().includes(keyword)) ||
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
  }, [activeTab, selectedZone, selectedSeats, searchKeyword, plateFilter, vehicles]);

  const resetFilters = () => {
    setSelectedZone('all');
    setSelectedSeats('all');
    setSearchKeyword('');
    setPlateFilter('all');
  };

  const hasFilters = selectedZone !== 'all' || selectedSeats !== 'all' || searchKeyword !== '' || plateFilter !== 'all';

  const hotelStays = SPONSORS.filter((s) => s.category === 'hotel');

  return (
    <div className="flex min-h-dvh flex-col bg-paper font-body text-ink">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenPortal={() => setIsPortalOpen(true)}
        onOpenDriverSelfService={() => setIsDriverSelfServiceOpen(true)}
      />
      <div aria-hidden="true" className="h-[var(--td-head-h)] shrink-0" />

      {(activeTab === 'van' || activeTab === 'car') && (
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
          totalVanCount={vehicles.filter((v) => v.type === 'van' && v.rentalType !== 'self_drive').length}
          totalCarCount={vehicles.filter((v) => v.type !== 'van' || v.rentalType === 'self_drive').length}
        />
      )}

      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-margin lg:px-gutter pb-36 md:pb-8">
        {activeTab === 'hotel' ? (
          <div key="hotel" className="td-panel-enter pt-24 sm:pt-28 pb-36 md:pb-16">
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
          <div key="corporate" className="td-panel-enter pt-24 sm:pt-28 pb-36 md:pb-16">
            <CorporateSection />
          </div>
        ) : (
          <div key={activeTab} className="td-panel-enter pb-16">
            {/* Primary Vehicle Catalog & Filter Rail */}
            <section id="results" aria-label={t('home.resultsAria')} className="mt-8 scroll-mt-28">
              <SectionHead
                title={t(activeTab === 'van' ? 'home.vanTitle' : 'home.carTitle')}
                count={t('home.vehicleCount', { count: filteredVehicles.length })}
                caption={
                  activeTab === 'van'
                    ? t('home.resultsCaption')
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

              {/* Quick Filter: Transport Category & Legal Type (Stitch Segment Badges) */}
              <div className="mb-6 flex flex-wrap items-center gap-space-xs text-body-subtext font-body-medium">
                <span className="text-ink-muted dark:text-slate-400 font-label-badge text-label-badge uppercase mr-1">
                  {activeTab === 'van' ? t('home.plateGroupVan') : t('home.plateGroupCar')}
                </span>
                <button
                  type="button"
                  onClick={() => setPlateFilter('all')}
                  className={`px-space-sm py-space-xs rounded-full font-bold shadow-sm transition-all ${
                    plateFilter === 'all'
                      ? 'bg-navy-deep text-on-primary'
                      : 'bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:text-navy-deep'
                  }`}
                >
                  {t('home.plateAll', {
                    count: vehicles.filter((v) =>
                      activeTab === 'van'
                        ? v.type === 'van' && v.rentalType !== 'self_drive'
                        : v.type !== 'van' || v.rentalType === 'self_drive'
                    ).length,
                  })}
                </button>
                {activeTab === 'van' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setPlateFilter('yellow')}
                      className={`inline-flex items-center gap-1 px-space-sm py-space-xs rounded-full font-bold transition-all ${
                        plateFilter === 'yellow'
                          ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-500 shadow-sm'
                          : 'bg-taxi-yellow-soft text-on-tertiary-container hover:bg-yellow-100 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/40'
                      }`}
                    >
                      <span>{t('home.plateYellow')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlateFilter('blue')}
                      className={`inline-flex items-center gap-1 px-space-sm py-space-xs rounded-full font-bold transition-all ${
                        plateFilter === 'blue'
                          ? 'bg-blue-action text-white shadow-sm'
                          : 'bg-blue-subtle text-blue-action hover:bg-blue-100 dark:bg-blue-950/70 dark:text-blue-300'
                      }`}
                    >
                      <span>{t('home.plateBlue')}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPlateFilter('blue')}
                    className={`inline-flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                      plateFilter === 'blue'
                        ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-plate-blue-bg text-plate-blue-text hover:brightness-95 border border-plate-blue-border'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-blue-500 ring-2 ring-blue-200"></span>
                    <span>{t('home.plateCarBlue')}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPlateFilter('tax')}
                  className={`inline-flex items-center gap-1 px-space-sm py-space-xs rounded-full font-bold transition-all ${
                    plateFilter === 'tax'
                      ? 'bg-verified-emerald text-white shadow-sm'
                      : 'bg-paper-surface-muted dark:bg-slate-800 text-ink-primary dark:text-slate-300 hover:bg-surface-variant'
                  }`}
                >
                  <span>{t('home.plateTax')}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
                {/* Main Vehicle Listings Column (8 of 12) */}
                <div className="lg:col-span-8 min-w-0">
                  {hasFilters && (
                    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-card bg-card p-3 border border-rule shadow-xs">
                      <span className="text-xs font-bold text-ink-2 flex items-center gap-1.5 mr-1">
                        <SlidersHorizontal className="h-3.5 w-3.5 text-accent" />
                        {t('home.activeFilters')}
                      </span>
                      {plateFilter !== 'all' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-paper text-ink px-3 py-1 text-xs font-extrabold border border-rule">
                          <span>
                            {plateFilter === 'yellow' && t('home.chipYellow')}
                            {plateFilter === 'blue' && t('home.chipBlue')}
                            {plateFilter === 'tax' && t('home.chipTax')}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPlateFilter('all')}
                            aria-label={t('home.rmPlateAria')}
                            className="rounded-full p-0.5 hover:bg-rule transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      )}
                      {selectedZone !== 'all' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft text-accent px-3 py-1 text-xs font-extrabold border border-accent/20">
                          <span>{t('home.chipZone', { zone: selectedZone })}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedZone('all')}
                            aria-label={t('home.rmZoneAria')}
                            className="rounded-full p-0.5 hover:bg-accent hover:text-white transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      )}
                      {selectedSeats !== 'all' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-sun-soft text-sun-ink px-3 py-1 text-xs font-extrabold border border-sun/20">
                          <span>{t('home.chipSeats', { n: selectedSeats })}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedSeats('all')}
                            aria-label={t('home.rmSeatsAria')}
                            className="rounded-full p-0.5 hover:bg-sun hover:text-white transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      )}
                      {searchKeyword.trim() !== '' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-paper text-ink px-3 py-1 text-xs font-extrabold border border-rule">
                          <span>🔍 &ldquo;{searchKeyword}&rdquo;</span>
                          <button
                            type="button"
                            onClick={() => setSearchKeyword('')}
                            aria-label={t('home.rmSearchAria')}
                            className="rounded-full p-0.5 hover:bg-rule transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="td-btn ml-auto inline-flex items-center gap-1 rounded-pill bg-paper px-3 py-1 text-xs font-extrabold text-berry hover:bg-berry-soft transition-colors border border-rule"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {t('home.clearFilters')}
                      </button>
                    </div>
                  )}

                  {filteredVehicles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
                      {filteredVehicles.map((vehicle) => (
                        <VehicleCard
                          key={vehicle.id}
                          vehicle={vehicle}
                          allVehicles={vehicles}
                          onSelectDetail={handleSelectDetail}
                          onViewFleet={handleViewFleet}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-card border-2 border-dashed border-rule bg-card px-6 py-12 text-center">
                      <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-sun-soft">
                        <SearchX className="h-7 w-7 text-ink-2" aria-hidden="true" />
                      </span>
                      <h3 className="font-display text-xl font-extrabold text-ink">
                        {t('home.emptyTitle')}
                      </h3>
                      <p className="mx-auto mt-1 max-w-[48ch] text-sm font-medium leading-relaxed text-ink-2">
                        {t('home.emptyDesc')}
                      </p>

                      {/* Action buttons for traveler */}
                      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                        <button
                          onClick={resetFilters}
                          className="td-btn td-pop inline-flex items-center rounded-pill bg-sun px-5 py-2.5 text-sm font-extrabold text-sun-ink shadow-xs"
                        >
                          {t('home.emptyCta')}
                        </button>
                        <a
                          href="#tripboard"
                          className="td-btn inline-flex items-center gap-1.5 rounded-pill border border-rule bg-paper-2 px-4 py-2.5 text-xs font-extrabold text-ink hover:bg-card transition-all"
                        >
                          <span>{t('home.emptyBoard')}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                        <a
                          href="https://line.me"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="td-btn inline-flex items-center gap-1.5 rounded-pill bg-line-green/10 text-line-green border border-line-green/30 px-4 py-2.5 text-xs font-extrabold hover:bg-line-green hover:text-white transition-all"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>{t('home.emptyLine')}</span>
                        </a>
                      </div>

                      {/* Driver Acquisition / Lead Generation Card */}
                      <div className="mt-8 mx-auto max-w-xl rounded-card border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 via-card to-paper p-5 text-left shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="inline-flex items-center gap-1.5 rounded-pill bg-emerald-600/10 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700 mb-1.5">
                              <span>{t('home.emptyDriverBadge')}</span>
                            </div>
                            <h4 className="text-sm font-extrabold text-ink">
                              {t('home.emptyDriverTitle')}
                            </h4>
                            <p className="mt-0.5 text-xs font-medium text-ink-2">
                              {t('home.emptyDriverDesc')}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsRegisterModalOpen(true)}
                            className="td-btn inline-flex shrink-0 items-center justify-center gap-1.5 rounded-pill bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-emerald-700 transition-all"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>{t('home.emptyDriverCta')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Sticky Sidebar Ad Placement (4 of 12) */}
                <div className="hidden lg:block lg:col-span-4">
                  <div className="sticky top-28">
                    <SponsorSidebar />
                  </div>
                </div>
              </div>
            </section>

            {/* Secondary Matching / Community Fallback: TripBoard (Stitch Section 3) */}
            <div className="mt-16">
              <TripBoard />
            </div>

            {/* Routes strip: Popular Routes Carousel (Google Stitch Redesign) */}
            <PopularRoutesSection
              onSelectRoute={(filterKey) => {
                setSelectedZone(filterKey);
                document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Corporate strip */}
            <div className="mt-12">
              <CorporateSection />
            </div>
          </div>
        )}

        {/* Platform Showcase & House Features (100% Authentic, 0% Mock Brands) */}
        <PlatformShowcase
          onOpenRegister={() => setIsRegisterModalOpen(true)}
          onSelectCorporate={() => {
            setActiveTab('corporate');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onScrollToSearch={() => {
            document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

      </main>

      <Footer
        onOpenDriverSelfService={() => setIsDriverSelfServiceOpen(true)}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onSelectZone={(zone) => {
          setSelectedZone(zone);
          document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'van' || tab === 'car') {
            document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />

      <VehicleDetailModal
        vehicle={selectedVehicleDetail}
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
          document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />
      <DriverRegisterModal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} />
      <DriverSelfServiceModal
        isOpen={isDriverSelfServiceOpen}
        onClose={() => setIsDriverSelfServiceOpen(false)}
        onOpenRegisterModal={() => {
          setIsDriverSelfServiceOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      {user?.role === 'driver' && (
        <DriverPortalModal isOpen={isPortalOpen} onClose={() => setIsPortalOpen(false)} />
      )}
      {user?.role === 'customer' && (
        <CustomerPortalModal
          isOpen={isPortalOpen}
          onClose={() => setIsPortalOpen(false)}
          onOpenNewQuote={() => setActiveTab('corporate')}
        />
      )}
      {user?.role === 'admin' && (
        <AdminPortalModal isOpen={isPortalOpen} onClose={() => setIsPortalOpen(false)} />
      )}

      {/* Scroll & Layout Quality Monitor (Dev/Benchmark tool - only active with ?debug=perf) */}
      {typeof window !== 'undefined' && window.location?.search?.includes('debug=perf') && (
        <ScrollQualityMonitor />
      )}

      {/* Floating Mobile Quick Call/LINE bar */}
      <MobileBottomBar
        activeVehicle={selectedVehicleDetail || focusedVehicle}
        onOpenDetail={(v) => setSelectedVehicleDetail(v)}
      />
    </div>
  );
}
