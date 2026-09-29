'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import type { DictKey } from '@/i18n/dictionaries';

interface PopularRoutesSectionProps {
  onSelectRoute: (filterKey: string) => void;
}

interface StitchRoute {
  id: string;
  name: string;
  filterKey: string;
  zoneTag: string;
  subtitle: string;
  image: string;
  photoCredit: string;
  photoSource: string;
  priceRange: string;
}

const STITCH_ROUTES: StitchRoute[] = [
  {
    id: 'mon-jam',
    name: 'ม่อนแจ่ม - แม่ริม (เชียงใหม่)',
    filterKey: 'ม่อนแจ่ม',
    zoneTag: 'ภาคเหนือ / ธรรมชาติ',
    subtitle: 'จุดชมวิวสันเขา หมู่บ้านม้งหนองหอย และแปลงพืชเมืองหนาว',
    // Mae Rim flower fields, Chiang Mai - Photo by Putra Mahirudin on Unsplash.
    image: 'https://images.unsplash.com/photo-1770740098141-4db5fb079dd1?auto=format&fit=crop&w=800&q=80',
    photoCredit: 'Putra Mahirudin / Unsplash',
    photoSource: 'https://unsplash.com/photos/a-scenic-mountain-village-with-colorful-flower-fields-e8kXBEOAeck',
    priceRange: '1,800 - 2,200 บ./วัน',
  },
  {
    id: 'bkk-pattaya',
    name: 'กรุงเทพฯ - พัทยา - สัตหีบ',
    filterKey: 'พัทยา',
    zoneTag: 'ภาคตะวันออก / ชายทะเล',
    subtitle: 'เกาะล้าน ท่าเรือแหลมบาลีฮาย สวนนงนุช และชายฝั่งสัตหีบ',
    image: 'https://images.unsplash.com/photo-1620374710130-51526b5200f7?auto=format&fit=crop&w=800&q=80',
    photoCredit: 'Ashwani Verma / Unsplash',
    photoSource: 'https://unsplash.com/photos/people-on-beach-during-daytime-Hb6Gvz6Puew',
    priceRange: '2,000 - 2,500 บ./วัน',
  },
  {
    id: 'inthanon',
    name: 'ดอยอินทนนท์ - กิ่วแม่ปาน (เชียงใหม่)',
    filterKey: 'ดอยอินทนนท์',
    zoneTag: 'ภาคเหนือ / ขึ้นดอยสูง',
    subtitle: 'ยอดดอยสูงสุดของไทย พระมหาธาตุฯ น้ำตกวชิรธาร และกิ่วแม่ปาน',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Doi_inthanon_03.jpg/960px-Doi_inthanon_03.jpg',
    photoCredit: 'Peerawat.b / Wikimedia Commons',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Doi_inthanon_03.jpg',
    priceRange: '2,200 - 2,500 บ./วัน',
  },
  {
    id: 'phuket-phangnga',
    name: 'ภูเก็ต - พังงา - เสม็ดนางชี',
    filterKey: 'ภูเก็ต',
    zoneTag: 'ภาคใต้ / ทะเลอันดามัน',
    subtitle: 'เสม็ดนางชี อ่าวพังงา เกาะตาปู และเมืองเก่าภูเก็ต',
    image: 'https://images.unsplash.com/photo-1653409625515-629bed947ddc?auto=format&fit=crop&w=800&q=80',
    photoCredit: 'Dominic Trier / Unsplash',
    photoSource: 'https://unsplash.com/photos/an-aerial-view-of-a-mountain-range-with-a-body-of-water-in-the-distance-wRe_Hmx_uho',
    priceRange: '2,200 - 2,600 บ./วัน',
  },
  {
    id: 'khao-yai',
    name: 'กรุงเทพฯ - เขาใหญ่ - ปากช่อง',
    filterKey: 'เขาใหญ่',
    zoneTag: 'ภาคอีสาน / อากาศบริสุทธิ์',
    subtitle: 'อุทยานแห่งชาติเขาใหญ่ น้ำตกเหวสุวัต ผากล้วยไม้ และผืนป่าเขตร้อน',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Khao_Yai%2C_Thailand%2C_Tropical_grasslands.jpg/960px-Khao_Yai%2C_Thailand%2C_Tropical_grasslands.jpg',
    photoCredit: 'Vyacheslav Argenberg / Wikimedia Commons',
    photoSource: 'https://commons.wikimedia.org/wiki/File:Khao_Yai,_Thailand,_Tropical_grasslands.jpg',
    priceRange: '2,000 - 2,400 บ./วัน',
  },
  {
    id: 'bkk-huahin',
    name: 'กรุงเทพฯ - ชะอำ - หัวหิน',
    filterKey: 'หัวหิน',
    zoneTag: 'ภาคกลาง / พักผ่อนตากอากาศ',
    subtitle: 'หาดหัวหิน พระราชนิเวศน์มฤคทายวัน ตลาดซิเคด้า และชายหาดชะอำ',
    image: 'https://images.unsplash.com/photo-1677053694723-b13b41063f92?auto=format&fit=crop&w=800&q=80',
    photoCredit: 'Yannick Apollon / Unsplash',
    photoSource: 'https://unsplash.com/photos/an-aerial-view-of-a-beach-with-a-boat-in-the-water-48ZjXYF0T_U',
    priceRange: '2,200 - 2,600 บ./วัน',
  },
];

export const PopularRoutesSection: React.FC<PopularRoutesSectionProps> = ({ onSelectRoute }) => {
  const { t } = useLanguage();

  const handleSelect = (filterKey: string) => {
    onSelectRoute(filterKey);
    const el = document.getElementById('results');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="routes"
      aria-label={t('home.routesTitle')}
      className="w-full scroll-mt-20 sm:scroll-mt-24 py-6 sm:py-space-2xl bg-paper-canvas dark:bg-slate-950 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-margin lg:px-gutter">
        {/* Section Header (Stitch Redesign) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4 mb-4 sm:mb-6 border-b border-border-subtle/60 dark:border-slate-800 pb-3 sm:pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg sm:text-2xl font-extrabold tracking-tight text-navy-deep dark:text-white">
                {t('home.routesTitle')}
              </h2>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-ink-secondary dark:text-slate-300">
                {t('home.routesCount', { count: STITCH_ROUTES.length })}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-ink-secondary dark:text-slate-400 mt-1">
              {t('home.routesCaption')}
            </p>
          </div>
          <div className="md:hidden flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <span>{t('home.routesSwipe')}</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </div>
        </div>

        {/* 6 Routes Carousel on Mobile (< md), Grid on Desktop (md+) */}
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-space-lg overflow-x-auto md:overflow-x-visible snap-x snap-mandatory pb-3 -mx-margin px-margin md:mx-0 md:px-0 scrollbar-none items-stretch">
          {STITCH_ROUTES.map((route) => (
            <div
              key={route.id}
              className="w-[82vw] sm:w-[340px] md:w-auto shrink-0 md:shrink snap-start bg-paper-elevated dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xs hover:shadow-md border border-border-subtle dark:border-slate-800 transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                {/* Photo & Zone Tag */}
                <div className="relative h-44 w-full bg-navy-deep overflow-hidden">
                  <Image
                    src={route.image}
                    alt={t(`route.${route.id}.name` as DictKey) || route.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/80 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute top-3 left-3 px-space-xs py-space-2xs rounded bg-surface/90 text-navy-deep font-bold text-label-badge shadow-sm">
                    {t(`route.${route.id}.zone` as DictKey) || route.zoneTag}
                  </span>
                  <a
                    href={route.photoSource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 rounded bg-navy-deep/70 px-1.5 py-0.5 text-[9px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  >
                    {t('home.photoCredit', { credit: route.photoCredit })}
                  </a>
                </div>

                {/* Content */}
                <div className="p-space-md space-y-space-2xs">
                  <h3 className="font-title-card text-title-card text-navy-deep dark:text-white group-hover:text-blue-action transition-colors">
                    {t(`route.${route.id}.name` as DictKey) || route.name}
                  </h3>
                  <p className="font-body-subtext text-body-subtext text-ink-secondary dark:text-slate-300">
                    {t(`route.${route.id}.highlight` as DictKey) || route.subtitle}
                  </p>
                </div>
              </div>

              {/* Price and CTA */}
              <div className="p-4 pt-0 flex items-center justify-between border-t border-border-subtle/60 dark:border-slate-800 mt-2">
                <span className="font-bold text-sm sm:text-base text-navy-deep dark:text-white tabular-nums">
                  {t(`route.${route.id}.price` as DictKey) || route.priceRange}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelect(route.filterKey)}
                  className="px-3.5 py-1.5 bg-navy-deep hover:bg-navy-surface text-white dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  {t('home.viewCars')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
