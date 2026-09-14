'use client';

import React from 'react';
import { Vehicle, ZONE_RATE_CARDS, formatTHB } from '@/data/mockData';
import { ShieldCheck, Star, Users, Phone, MessageCircle, MapPin, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import type { DictKey } from '@/i18n/dictionaries';

interface VehicleCardProps {
  vehicle: Vehicle;
  onSelectDetail: (vehicle: Vehicle) => void;
}

const AMENITY_TINTS = [
  'bg-sun-soft text-ink',
  'bg-sky-soft text-sky',
  'bg-leaf-soft text-leaf',
  'bg-berry-soft text-berry',
] as const;

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
    <article className="td-card-hover td-elev-card group flex flex-col overflow-hidden rounded-card bg-card">
      <button
        onClick={() => onSelectDetail(vehicle)}
        className="relative block aspect-[4/3] w-full overflow-hidden text-left active:opacity-90"
        aria-label={t('vehicle.detailAria', { title: vehicle.title })}
      >
        <img
          src={vehicle.images[0]}
          alt={vehicle.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 ease-out group-hover:scale-[1.02]"
        />
        <span className="td-sticker absolute left-3 top-3 inline-flex items-center gap-1 rounded-pill bg-sun px-2.5 py-1 text-xs font-extrabold text-sun-ink">
          <Users className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
          {t('vehicle.seats', { n: vehicle.seats })}
        </span>
        {vehicle.isVerified && (
          <span className="td-sticker absolute right-3 top-3 inline-flex items-center gap-1 rounded-pill bg-card px-2.5 py-1 text-xs font-extrabold text-leaf">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
            Verified
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-grape-soft text-sm font-extrabold text-grape">
            {vehicle.driverNickname.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-extrabold text-ink">
              {vehicle.driverNickname}
            </p>
            <p className="flex items-center gap-1 text-xs font-medium text-ink-2">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{vehicle.location}</span>
            </p>
          </div>
          <span className="td-fig ml-auto inline-flex shrink-0 items-center gap-1 rounded-pill bg-sun-soft px-2 py-1 text-xs font-extrabold text-ink">
            <Star className="h-3.5 w-3.5 fill-accent-deep text-accent-deep" aria-hidden="true" />
            {vehicle.rating}
            <span className="font-bold text-ink-2">({vehicle.reviewCount})</span>
          </span>
        </div>

        <h3 className="mb-2 mt-3 line-clamp-2 font-display text-[16px] font-extrabold leading-snug text-ink">
          {vehicle.title}
        </h3>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {vehicle.amenities.slice(0, 3).map((item, i) => (
            <span
              key={item}
              className={`rounded-pill px-2.5 py-1 text-[11px] font-extrabold ${AMENITY_TINTS[i % AMENITY_TINTS.length]}`}
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-auto border-t-2 border-dashed border-rule pt-3">
          <div className="mb-2 flex items-end justify-between gap-2">
            <p className="td-fig text-2xl font-extrabold text-ink">
              {formatTHB(vehicle.zoneRates.city)}
              <span className="text-xs font-bold text-ink-2"> {t('vehicle.perDay')}</span>
            </p>
            <p className="text-right text-[11px] font-bold text-ink-2">{t('vehicle.priceNote1')}<br />{t('vehicle.priceNote2')}</p>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-1.5">
            {ZONE_RATE_CARDS.map((zone) => (
              <span
                key={zone.id}
                className="td-fig inline-flex items-baseline justify-between gap-1 rounded-input bg-paper px-2.5 py-1.5 text-[11px]"
              >
                <span className="font-bold text-ink-2">{t(`zone.${zone.id}.short` as DictKey)}</span>
                <span className="font-extrabold text-ink">{formatTHB(vehicle.zoneRates[zone.id])}</span>
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${vehicle.driverPhone}`}
              onClick={handleCallClick}
              data-analytics-call={vehicle.id}
              className="td-btn td-pop inline-flex items-center justify-center gap-1.5 rounded-pill bg-accent px-3 py-2.5 text-sm font-extrabold text-accent-ink"
            >
              <Phone className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
              {t('vehicle.callNow')}
            </a>
            <a
              href={vehicle.driverLine}
              target="_blank"
              rel="noopener noreferrer"
              className="td-btn td-pop inline-flex items-center justify-center gap-1.5 rounded-pill bg-paper-2 px-3 py-2.5 text-sm font-extrabold text-ink"
            >
              <MessageCircle className="h-4 w-4 text-leaf" aria-hidden="true" strokeWidth={2.5} />
              {t('vehicle.lineChat')}
            </a>
          </div>

          <button
            onClick={() => onSelectDetail(vehicle)}
            className="td-btn mt-1.5 inline-flex w-full items-center justify-center gap-1 py-2 text-[13px] font-extrabold text-ink-2 transition duration-220 ease-out hover:text-ink"
          >
            {t('vehicle.detailsReviews')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
};
