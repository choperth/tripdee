'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { initBurst } from '@/lib/burst';
import { VEHICLES, SPONSORS, POPULAR_ROUTES, Vehicle } from '@/data/mockData';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { VehicleCard } from '@/components/VehicleCard';
import { SponsorBanner } from '@/components/SponsorBanner';
import { SponsorSidebar } from '@/components/SponsorSidebar';
import { CorporateSection } from '@/components/CorporateSection';
import { VehicleDetailModal } from '@/components/VehicleDetailModal';
import { TripBoard } from '@/components/TripBoard';
import { DriverRegisterModal } from '@/components/DriverRegisterModal';
import { LoginModal } from '@/components/LoginModal';
import { DriverPortalModal } from '@/components/portals/DriverPortalModal';
import { CustomerPortalModal } from '@/components/portals/CustomerPortalModal';
import { AdminPortalModal } from '@/components/portals/AdminPortalModal';
import { useAuth } from '@/context/AuthContext';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import type { DictKey } from '@/i18n/dictionaries';
import { SearchX, ArrowRight } from 'lucide-react';

const SERVICE_LINKS: DictKey[] = [
  'home.service1',
  'home.service2',
  'home.service3',
  'home.service4',
  'home.service5',
];

const ROUTE_LINKS: { key: DictKey; value: string }[] = [
  { key: 'home.routeLink1', value: 'ม่อนแจ่ม' },
  { key: 'home.routeLink2', value: 'ดอยอินทนนท์' },
  { key: 'home.routeLink3', value: 'แม่กำปอง' },
  { key: 'home.routeLink4', value: 'เชียงใหม่' },
  { key: 'home.routeLink5', value: 'ปาย' },
];

const ROUTE_TINTS = [
  'bg-accent-soft',
  'bg-sky-soft',
  'bg-leaf-soft',
  'bg-berry-soft',
  'bg-grape-soft',
  'bg-sun-soft',
] as const;

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

  const [selectedVehicleDetail, setSelectedVehicleDetail] = useState<Vehicle | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isPortalOpen, setIsPortalOpen] = useState<boolean>(false);

  useEffect(() => {
    initBurst();
  }, []);

  const filteredVehicles = useMemo(() => {
    return VEHICLES.filter((vehicle) => {
      const matchesTab =
        activeTab === 'van' ? vehicle.type === 'van' : vehicle.type !== 'van';
      const matchesZone =
        selectedZone === 'all' ||
        vehicle.popularRoutes.some((r) => r.includes(selectedZone)) ||
        vehicle.location.includes(selectedZone);
      const matchesSeats =
        selectedSeats === 'all' || vehicle.seats === Number(selectedSeats);
      const keyword = searchKeyword.trim().toLowerCase();
      const matchesKeyword =
        keyword === '' ||
        vehicle.title.toLowerCase().includes(keyword) ||
        vehicle.description.toLowerCase().includes(keyword) ||
        vehicle.amenities.some((a) => a.toLowerCase().includes(keyword));
      return matchesTab && matchesZone && matchesSeats && matchesKeyword;
    });
  }, [activeTab, selectedZone, selectedSeats, searchKeyword]);

  const resetFilters = () => {
    setSelectedZone('all');
    setSelectedSeats('all');
    setSearchKeyword('');
  };

  const hasFilters = selectedZone !== 'all' || selectedSeats !== 'all' || searchKeyword !== '';

  const hotelStays = SPONSORS.filter((s) => s.category === 'hotel');

  return (
    <div className="flex min-h-dvh flex-col bg-paper font-body text-ink">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenPortal={() => setIsPortalOpen(true)}
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 lg:px-8">
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
            <div className="mt-8">
              <TripBoard />
            </div>

            {/* Vehicle rail */}
            <section id="results" aria-label={t('home.resultsAria')} className="mt-12 scroll-mt-28">
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

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                {/* Main Vehicle Grid */}
                <div className="min-w-0">
                  {filteredVehicles.length > 0 ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      {filteredVehicles.map((vehicle) => (
                        <VehicleCard
                          key={vehicle.id}
                          vehicle={vehicle}
                          onSelectDetail={(v) => setSelectedVehicleDetail(v)}
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
                      <button
                        onClick={resetFilters}
                        className="td-btn td-pop mt-5 inline-flex items-center rounded-pill bg-sun px-5 py-2.5 text-sm font-extrabold text-sun-ink"
                      >
                        {t('home.emptyCta')}
                      </button>
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

            {/* Sponsor feature */}
            <div className="mt-12">
              <SponsorBanner sponsor={SPONSORS[0]} variant="split" />
            </div>

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
                    <span className={`block p-4 ${ROUTE_TINTS[i % ROUTE_TINTS.length]}`}>
                      <span className="block font-display text-[15px] font-extrabold text-ink">{t(`route.${route.id}.name` as DictKey)}</span>
                      <span className="mt-0.5 block line-clamp-2 text-xs font-medium leading-relaxed text-ink/70">
                        {t(`route.${route.id}.highlight` as DictKey)}
                      </span>
                      <span className="mt-3 flex items-center justify-between border-t-2 border-dashed border-rule pt-3">
                        <span className="td-fig text-[13px] font-extrabold text-ink">
                          {t(`route.${route.id}.price` as DictKey)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-pill bg-ink px-3 py-1.5 text-xs font-extrabold text-paper">
                          {t('home.viewCars')} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <div className="mt-10">
              <SponsorBanner sponsor={SPONSORS[1]} variant="strip" />
            </div>

            {/* Corporate strip */}
            <div className="mt-12">
              <CorporateSection />
            </div>
          </div>
        )}

        {/* Index band */}
        <nav aria-label={t('home.indexAria')} className="td-elev-card mb-12 grid grid-cols-1 gap-6 rounded-card bg-paper-2 p-6 sm:grid-cols-2 sm:p-8">
          <div>
            <h2 className="mb-3 font-display text-base font-extrabold text-ink">
              {t('home.servicesTitle')}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {SERVICE_LINKS.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="td-footlink text-sm font-bold text-ink-2 transition-colors duration-220 ease-out hover:text-ink"
                  >
                    {t(link)}
                  </a>
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

      <Footer />

      <VehicleDetailModal vehicle={selectedVehicleDetail} onClose={() => setSelectedVehicleDetail(null)} />
      <DriverRegisterModal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} />
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
    </div>
  );
}
