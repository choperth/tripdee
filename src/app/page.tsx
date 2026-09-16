'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { VEHICLES, SPONSORS, POPULAR_ROUTES, Vehicle } from '@/data/mockData';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { VehicleCard } from '@/components/VehicleCard';
import { SponsorBanner } from '@/components/SponsorBanner';
import { OfficialPartnersMarquee } from '@/components/OfficialPartnersMarquee';
import { SponsorSidebar } from '@/components/SponsorSidebar';
import { CorporateSection } from '@/components/CorporateSection';
import { VehicleDetailModal } from '@/components/VehicleDetailModal';
import { TripBoard } from '@/components/TripBoard';
import { DriverRegisterModal } from '@/components/DriverRegisterModal';
import { LoginModal } from '@/components/LoginModal';
import { DriverPortalModal } from '@/components/portals/DriverPortalModal';
import { DriverSelfServiceModal } from '@/components/portals/DriverSelfServiceModal';
import { CustomerPortalModal } from '@/components/portals/CustomerPortalModal';
import { AdminPortalModal } from '@/components/portals/AdminPortalModal';
import { useAuth } from '@/context/AuthContext';
import { Footer } from '@/components/Footer';
import { MobileBottomBar } from '@/components/MobileBottomBar';
import { ScrollQualityMonitor } from '@/components/ScrollQualityMonitor';
import { useLanguage } from '@/context/LanguageContext';
import type { DictKey } from '@/i18n/dictionaries';
import { SearchX, ArrowRight, X, SlidersHorizontal, RotateCcw } from 'lucide-react';

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

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesTab =
        activeTab === 'van' ? vehicle.type === 'van' : vehicle.type !== 'van';
      
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
        />
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 md:pb-8 sm:px-6 lg:px-8">
        {activeTab === 'hotel' ? (
          <div key="hotel" className="td-panel-enter pb-16">
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
          <div key="corporate" className="td-panel-enter pb-16">
            <CorporateSection />
          </div>
        ) : (
          <div key={activeTab} className="td-panel-enter pb-16">
            {/* Primary Vehicle Catalog & Filter Rail */}
            <section id="results" aria-label={t('home.resultsAria')} className="mt-8 scroll-mt-28">
              <SectionHead
                title={t(activeTab === 'van' ? 'home.vanTitle' : 'home.carTitle')}
                count={t('home.vehicleCount', { count: filteredVehicles.length })}
                caption={t('home.resultsCaption')}
                action={
                  hasFilters ? (
                    <button
                      onClick={resetFilters}
                      className="td-btn shrink-0 rounded-pill border border-rule bg-card px-4 py-2 text-[13px] font-extrabold text-ink transition-transform duration-220 ease-spring hover:-translate-y-0.5"
                    >
                      {t('home.clearFilters')}
                    </button>
                  ) : undefined
                }
              />

              {/* Quick Filter: Transport Category & Legal Type */}
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-ink-2 mr-1">ประเภทรถ/เอกสาร:</span>
                <button
                  type="button"
                  onClick={() => setPlateFilter('all')}
                  className={`rounded-pill px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                    plateFilter === 'all'
                      ? 'bg-ink text-paper shadow-sm'
                      : 'bg-card text-ink-2 hover:text-ink border border-rule'
                  }`}
                >
                  ทั้งหมด ({vehicles.filter(v => activeTab === 'van' ? v.type === 'van' : v.type !== 'van').length})
                </button>
                <button
                  type="button"
                  onClick={() => setPlateFilter('yellow')}
                  className={`inline-flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                    plateFilter === 'yellow'
                      ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-500 shadow-sm'
                      : 'bg-card text-ink hover:bg-amber-50 border border-amber-300/80 text-amber-900'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-amber-500 ring-2 ring-amber-300"></span>
                  <span>🟡 ป้ายเหลือง 30 (รับงานองค์กร/ราชการ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlateFilter('blue')}
                  className={`inline-flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                    plateFilter === 'blue'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-card text-ink hover:bg-blue-50 border border-blue-200 text-blue-800'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-blue-500 ring-2 ring-blue-200"></span>
                  <span>🔵 ป้ายฟ้า (ท่องเที่ยวทั่วไป/ส่วนบุคคล)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlateFilter('tax')}
                  className={`inline-flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                    plateFilter === 'tax'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-card text-ink hover:bg-emerald-50 border border-emerald-300 text-emerald-800'
                  }`}
                >
                  <span>🏢 ออกใบกำกับภาษี/ใบเสร็จได้</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                {/* Main Vehicle Grid */}
                <div className="min-w-0">
                  {hasFilters && (
                    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-card bg-card p-3 border border-rule shadow-xs">
                      <span className="text-xs font-bold text-ink-2 flex items-center gap-1.5 mr-1">
                        <SlidersHorizontal className="h-3.5 w-3.5 text-accent" />
                        ตัวกรองที่เลือก:
                      </span>
                      {plateFilter !== 'all' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-paper text-ink px-3 py-1 text-xs font-extrabold border border-rule">
                          <span>
                            {plateFilter === 'yellow' && '🟡 ป้ายเหลือง 30'}
                            {plateFilter === 'blue' && '🔵 ป้ายฟ้า'}
                            {plateFilter === 'tax' && '🏢 ออกใบกำกับภาษีได้'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPlateFilter('all')}
                            aria-label="ลบตัวกรองป้ายทะเบียน"
                            className="rounded-full p-0.5 hover:bg-rule transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      )}
                      {selectedZone !== 'all' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft text-accent px-3 py-1 text-xs font-extrabold border border-accent/20">
                          <span>📍 โซน: {selectedZone}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedZone('all')}
                            aria-label="ลบตัวกรองโซน"
                            className="rounded-full p-0.5 hover:bg-accent hover:text-white transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      )}
                      {selectedSeats !== 'all' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-sun-soft text-sun-ink px-3 py-1 text-xs font-extrabold border border-sun/20">
                          <span>👥 {selectedSeats} ที่นั่ง</span>
                          <button
                            type="button"
                            onClick={() => setSelectedSeats('all')}
                            aria-label="ลบตัวกรองที่นั่ง"
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
                            aria-label="ลบคำค้นหา"
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
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      {filteredVehicles.map((vehicle) => (
                        <VehicleCard
                          key={vehicle.id}
                          vehicle={vehicle}
                          onSelectDetail={(v) => {
                            setFocusedVehicle(v);
                            setSelectedVehicleDetail(v);
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-card border-2 border-dashed border-rule bg-card px-6 py-14 text-center">
                      <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-sun-soft">
                        <SearchX className="h-7 w-7 text-ink-2" aria-hidden="true" />
                      </span>
                      <h3 className="font-display text-xl font-extrabold text-ink">
                        {t('home.emptyTitle')}
                      </h3>
                      <p className="mx-auto mt-1 max-w-[48ch] text-sm font-medium leading-relaxed text-ink-2">
                        {t('home.emptyDesc')}
                      </p>
                      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                        <button
                          onClick={resetFilters}
                          className="td-btn td-pop inline-flex items-center rounded-pill bg-sun px-5 py-2.5 text-sm font-extrabold text-sun-ink"
                        >
                          {t('home.emptyCta')}
                        </button>
                        <a
                          href="#tripboard"
                          className="td-btn inline-flex items-center gap-1.5 rounded-pill border border-rule bg-paper-2 px-4 py-2.5 text-xs font-extrabold text-ink hover:bg-card transition-all"
                        >
                          <span>โพสต์ประกาศหาคนขับบน TripBoard</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Sticky Sidebar Ad Placement (แถบโฆษณาด้านข้าง) */}
                <div className="hidden lg:block">
                  <div className="sticky top-28">
                    <SponsorSidebar />
                  </div>
                </div>
              </div>
            </section>

            {/* Secondary Matching / Community Fallback: TripBoard */}
            <section id="tripboard" aria-label="กระดานจับคู่ทริปและประกาศหาคนขับ" className="mt-16 pt-8 border-t border-rule scroll-mt-28">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-pill bg-accent-soft px-3 py-1 text-xs font-bold text-accent mb-2 border border-accent/20">
                    <span>💡 ไม่พบคันที่ถูกใจ? หรือต้องการเส้นทางเฉพาะ</span>
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
                    กระดานประกาศหาคนขับ & คิวรถว่าง (TripBoard)
                  </h2>
                  <p className="mt-1 text-[13px] font-medium text-ink-2">
                    โพสต์ประกาศให้คนขับติดต่อกลับโดยตรง หรือเลือกรับงานคิวรถว่างในเชียงใหม่และภาคเหนือ
                  </p>
                </div>
              </div>
              <TripBoard />
            </section>

            {/* Routes strip */}
            <section aria-label={t('home.routesAria')} className="mt-12">
              <SectionHead
                title={t('home.routesTitle')}
                count={t('home.routesCount', { count: POPULAR_ROUTES.length })}
                caption={t('home.routesCaption')}
              />
              <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
                {POPULAR_ROUTES.map((route, i) => (
                  <button
                    key={route.id}
                    onClick={() => setSelectedZone(route.filterKey)}
                    className="td-card-hover group w-72 shrink-0 snap-start overflow-hidden rounded-card bg-card text-left sm:w-80"
                  >
                    <span className="relative block aspect-[16/10] w-full overflow-hidden border-b border-rule">
                      <img
                        src={route.image}
                        alt={t(`route.${route.id}.name` as DictKey)}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                      />
                      <span className="td-sticker absolute left-3 top-3 rounded-pill bg-card px-2.5 py-1 text-[11px] font-extrabold text-ink">
                        {t(`route.${route.id}.zone` as DictKey)}
                      </span>
                    </span>
                    <span className="block p-4 bg-card border-t border-rule/60">
                      <span className="block font-display text-[15px] font-extrabold text-ink">{t(`route.${route.id}.name` as DictKey)}</span>
                      <span className="mt-0.5 block line-clamp-2 text-xs font-medium leading-relaxed text-ink/70">
                        {t(`route.${route.id}.highlight` as DictKey)}
                      </span>
                      <span className="mt-3 flex items-center justify-between border-t border-rule pt-3">
                        <span className="td-fig text-xs font-extrabold text-ink">
                          {t(`route.${route.id}.price` as DictKey)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-input bg-accent text-white px-2.5 py-1 text-xs font-bold shadow-2xs">
                          {t('home.viewCars')} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Corporate strip */}
            <div className="mt-12">
              <CorporateSection />
            </div>
          </div>
        )}

        {/* Official Partners Marquee (Clean, non-cluttering brand showcase) */}
        <OfficialPartnersMarquee />

        {/* Index band */}
        <nav aria-label={t('home.indexAria')} className="td-elev-card mb-12 grid grid-cols-1 gap-6 rounded-card bg-paper-2 p-6 sm:grid-cols-2 sm:p-8">
          <div>
            <h2 className="mb-3 font-display text-base font-extrabold text-ink">
              {t('home.servicesTitle')}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {SERVICE_ACTIONS.map((item) => (
                <li key={item.key}>
                  <button
                    onClick={() => {
                      setActiveTab(item.tab);
                      if (item.zone) setSelectedZone(item.zone);
                      if (item.seats) setSelectedSeats(item.seats);
                      if (item.tab === 'van') {
                        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="td-footlink text-left text-sm font-bold text-ink-2 transition-colors duration-220 ease-out hover:text-accent"
                  >
                    {t(item.key)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-3 font-display text-base font-extrabold text-ink">
              {t('home.routesRecTitle')}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {ROUTE_LINKS.map((link) => (
                <li key={link.key}>
                  <button
                    onClick={() => {
                      setActiveTab('van');
                      setSelectedZone(link.value);
                    }}
                    className="td-footlink text-sm font-bold text-ink-2 transition-colors duration-220 ease-out hover:text-ink"
                  >
                    {t(link.key)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </main>

      <Footer onOpenDriverSelfService={() => setIsDriverSelfServiceOpen(true)} />

      <VehicleDetailModal vehicle={selectedVehicleDetail} onClose={() => setSelectedVehicleDetail(null)} />
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
