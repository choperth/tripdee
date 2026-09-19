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
  priceRange: string;
}

const STITCH_ROUTES: StitchRoute[] = [
  {
    id: 'mon-jam',
    name: 'ม่อนแจ่ม - แม่ริม (เชียงใหม่)',
    filterKey: 'ม่อนแจ่ม',
    zoneTag: 'ภาคเหนือ / ธรรมชาติ',
    subtitle: 'ทุ่งดอกไม้ สวนส้ม ทะเลหมอก คาเฟ่วิวเขา',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    priceRange: '1,800 - 2,200 บ./วัน',
  },
  {
    id: 'bkk-pattaya',
    name: 'กรุงเทพฯ - พัทยา - สัตหีบ',
    filterKey: 'พัทยา',
    zoneTag: 'ภาคตะวันออก / ชายทะเล',
    subtitle: 'แหลมบาลีฮาย สวนนงนุช เกาะล้าน ท่องเที่ยวชายทะเล',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    priceRange: '2,000 - 2,500 บ./วัน',
  },
  {
    id: 'inthanon',
    name: 'ดอยอินทนนท์ - กิ่วแม่ปาน (เชียงใหม่)',
    filterKey: 'ดอยอินทนนท์',
    zoneTag: 'ภาคเหนือ / ขึ้นดอยสูง',
    subtitle: 'จุดสูงสุดแดนสยาม พระมหาธาตุฯ น้ำตกวชิรธาร เส้นทางศึกษาธรรมชาติ',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    priceRange: '2,200 - 2,500 บ./วัน',
  },
  {
    id: 'phuket-phangnga',
    name: 'ภูเก็ต - พังงา - เสม็ดนางชี',
    filterKey: 'ภูเก็ต',
    zoneTag: 'ภาคใต้ / ทะเลอันดามัน',
    subtitle: 'จุดชมวิวอ่าวพังงา หาดป่าตอง เมืองเก่าภูเก็ต แหลมพรหมเทพ',
    image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80',
    priceRange: '2,200 - 2,600 บ./วัน',
  },
  {
    id: 'khao-yai',
    name: 'กรุงเทพฯ - เขาใหญ่ - ปากช่อง',
    filterKey: 'เขาใหญ่',
    zoneTag: 'ภาคอีสาน / อากาศบริสุทธิ์',
    subtitle: 'อุทยานแห่งชาติเขาใหญ่ ไร่องุ่น คาเฟ่ธรรมชาติ สัมมนากลุ่ม',
    image: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=800&q=80',
    priceRange: '2,000 - 2,400 บ./วัน',
  },
  {
    id: 'huahin',
    name: 'กรุงเทพฯ - ชะอำ - หัวหิน',
    filterKey: 'หัวหิน',
    zoneTag: 'ภาคกลาง / พักผ่อนตากอากาศ',
    subtitle: 'ชายหาดหัวหิน ตลาดซิเคด้า พระราชนิเวศน์มฤคทายวัน',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
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
      className="w-full py-space-2xl bg-paper-canvas dark:bg-slate-950 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-margin lg:px-gutter">
        {/* Section Header (Stitch Redesign) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-sm mb-space-xl">
          <div>
            <div className="flex items-center gap-space-2xs">
              <h2 className="font-headline-xl text-headline-xl text-navy-deep dark:text-white tracking-tight">
                {t('home.routesTitle')}
              </h2>
              <span className="px-space-xs py-space-2xs rounded-full bg-blue-subtle text-blue-action font-bold text-label-badge">
                {t('home.routesCount', { count: STITCH_ROUTES.length })}
              </span>
            </div>
            <p className="font-body-base text-body-base text-ink-secondary dark:text-slate-300 mt-1">
              {t('home.routesCaption')}
            </p>
          </div>
        </div>

        {/* 6 Routes Grid (Stitch 3-Column Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
          {STITCH_ROUTES.map((route) => (
            <div
              key={route.id}
              className="bg-paper-elevated dark:bg-slate-900 rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-border-subtle dark:border-slate-800 transition-all group flex flex-col justify-between"
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
              <div className="p-space-md pt-0 flex items-center justify-between border-t border-border-subtle/60 dark:border-slate-800 mt-space-xs">
                <span className="font-bold text-headline-md text-navy-deep dark:text-white">
                  {t(`route.${route.id}.price` as DictKey) || route.priceRange}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelect(route.filterKey)}
                  className="px-space-sm py-space-xs bg-blue-action hover:bg-blue-action-hover text-on-primary rounded-xl font-body-medium text-body-medium transition-colors shadow-sm cursor-pointer"
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
