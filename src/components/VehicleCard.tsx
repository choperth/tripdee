'use client';

import React from 'react';
import { Vehicle, ZONE_RATE_CARDS, formatTHB } from '@/data/mockData';
import { ShieldCheck, Star, Users, Phone, MessageCircle, MapPin, ArrowRight, Award, FileCheck2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import type { DictKey } from '@/i18n/dictionaries';

interface VehicleCardProps {
  vehicle: Vehicle;
  onSelectDetail: (vehicle: Vehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onSelectDetail }) => {
  const { t } = useLanguage();
  const { trackCall } = useAnalytics();

  const handleCallClick = () => {
    trackCall({
      targetType: 'vehicle_card',
      targetId: vehicle.id,
      targetTitle: vehicle.title,
      phoneNumber: vehicle.driverPhone,
      driverName: vehicle.driverNickname,
    });
  };

  return (
    <article className="td-card-hover td-elev-card group flex flex-col overflow-hidden rounded-card bg-card border border-rule transition-all hover:border-accent/30 hover:shadow-lift">
      {/* Vehicle Photo with 16:10 ratio */}
      <button
        onClick={() => onSelectDetail(vehicle)}
        className="relative block aspect-[16/10] w-full overflow-hidden text-left active:opacity-95"
        aria-label={t('vehicle.detailAria', { title: vehicle.title })}
      >
        <img
          src={vehicle.images[0]}
          alt={vehicle.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
        />
        {/* Subtle gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="td-sticker inline-flex items-center gap-1 rounded-pill bg-card/95 backdrop-blur-xs px-2.5 py-1 text-xs font-extrabold text-ink shadow-sm">
            <Users className="h-3.5 w-3.5 text-accent" aria-hidden="true" strokeWidth={2.5} />
            {t('vehicle.seats', { n: vehicle.seats })}
          </span>
          <span className="td-sticker inline-flex items-center gap-1 rounded-pill bg-[#FEF08A] text-[#854D0E] px-2 py-0.5 text-[11px] font-extrabold shadow-sm">
            ป้ายเหลือง
          </span>
        </div>

        {vehicle.isVerified && (
          <span className="td-sticker absolute right-3 top-3 inline-flex items-center gap-1 rounded-pill bg-card/95 backdrop-blur-xs px-2.5 py-1 text-xs font-extrabold text-leaf shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-leaf" aria-hidden="true" strokeWidth={2.5} />
            Verified
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Driver & Rating Header */}
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-extrabold text-accent">
            {vehicle.driverNickname.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-ink">
              {vehicle.driverNickname}
            </p>
            <p className="flex items-center gap-1 text-xs font-medium text-ink-2">
              <MapPin className="h-3 w-3 shrink-0 text-accent" aria-hidden="true" />
              <span className="truncate">{vehicle.location}</span>
            </p>
          </div>
          <span className="td-fig ml-auto inline-flex shrink-0 items-center gap-1 rounded-pill bg-sun-soft px-2.5 py-1 text-xs font-extrabold text-sun-ink">
            <Star className="h-3.5 w-3.5 fill-sun text-sun" aria-hidden="true" />
            {vehicle.rating}
            <span className="font-bold text-ink-2">({vehicle.reviewCount})</span>
          </span>
        </div>

        {/* Vehicle Title */}
        <h3 className="mb-2 mt-3 line-clamp-2 font-display text-base font-extrabold leading-snug text-ink group-hover:text-accent transition-colors">
          {vehicle.title}
        </h3>

        {/* Trust Badges Bar (B2B & Traveler Peace of Mind) */}
        <div className="mb-3 flex flex-wrap gap-1.5 py-1">
          <span className="inline-flex items-center gap-1 rounded-pill bg-[#FEF9C3] text-[#713F12] px-2.5 py-0.5 text-[11px] font-extrabold">
            <Award className="h-3 w-3 text-[#A16207]" />
            ป้ายเหลืองถูกกฎหมาย
          </span>
          <span className="inline-flex items-center gap-1 rounded-pill bg-leaf-soft text-leaf px-2.5 py-0.5 text-[11px] font-extrabold">
            <ShieldCheck className="h-3 w-3" />
            ตรวจสภาพรถแล้ว
          </span>
          <span className="inline-flex items-center gap-1 rounded-pill bg-sky-soft text-sky px-2.5 py-0.5 text-[11px] font-extrabold">
            <FileCheck2 className="h-3 w-3" />
            มีประกันภัยคุ้มครอง
          </span>
        </div>

        {/* Amenities Pills */}
        {/* Amenities Pills - Clean & Elegant */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {vehicle.amenities.slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-pill bg-paper px-2.5 py-0.5 text-[11px] font-bold text-ink-2 border border-rule/60"
            >
              {item}
            </span>
          ))}
        </div>

        {/* Price & Booking Footer */}
        <div className="mt-auto border-t border-dashed border-rule pt-3.5">
          <div className="mb-2.5 flex items-end justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-2 block">
                ราคาเริ่มต้นในเมือง
              </span>
              <p className="td-fig text-2xl font-extrabold text-ink">
                {formatTHB(vehicle.zoneRates.city)}
                <span className="text-xs font-bold text-ink-2"> {t('vehicle.perDay')}</span>
              </p>
            </div>
            <p className="text-right text-[11px] font-bold text-ink-2 leading-tight">
              {t('vehicle.priceNote1')}<br />
              <span className="text-accent font-extrabold">{t('vehicle.priceNote2')}</span>
            </p>
          </div>

          {/* Transparent Mountain Rates Grid */}
          <div className="mb-3.5 grid grid-cols-2 gap-1.5">
            {ZONE_RATE_CARDS.map((zone) => (
              <span
                key={zone.id}
                className="td-fig inline-flex items-baseline justify-between gap-1 rounded-input bg-paper px-2.5 py-1.5 text-[11px] border border-rule/60"
              >
                <span className="font-bold text-ink-2 truncate">{t(`zone.${zone.id}.short` as DictKey)}</span>
                <span className="font-extrabold text-ink shrink-0">{formatTHB(vehicle.zoneRates[zone.id])}</span>
              </span>
            ))}
          </div>

          {/* Prominent Thumb-Friendly Dual CTAs */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${vehicle.driverPhone}`}
              onClick={handleCallClick}
              data-analytics-call={vehicle.id}
              className="td-btn td-pop inline-flex items-center justify-center gap-1.5 rounded-full bg-accent hover:bg-accent-deep px-3 py-3 text-sm font-extrabold text-accent-ink shadow-sm transition-all"
            >
              <Phone className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
              {t('vehicle.callNow')}
            </a>
            <a
              href={vehicle.driverLine}
              target="_blank"
              rel="noopener noreferrer"
              className="td-btn td-pop inline-flex items-center justify-center gap-1.5 rounded-full bg-[#06C755] hover:bg-[#05b34c] px-3 py-3 text-sm font-extrabold text-white shadow-sm transition-all"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
              {t('vehicle.lineChat')}
            </a>
          </div>

          <button
            onClick={() => onSelectDetail(vehicle)}
            className="td-btn mt-2 inline-flex w-full items-center justify-center gap-1 py-1.5 text-xs font-extrabold text-ink-2 hover:text-accent transition-colors"
          >
            {t('vehicle.detailsReviews')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
};
