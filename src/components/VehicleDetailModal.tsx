'use client';

import React, { useEffect } from 'react';
import { Vehicle, ZONE_RATE_CARDS, STANDARD_TERMS, formatTHB } from '@/data/mockData';
import { X, ShieldCheck, Star, Phone, MessageCircle, MapPin, Check, Info, Users } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import type { DictKey } from '@/i18n/dictionaries';

interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({ vehicle, onClose }) => {
  const { t } = useLanguage();
  const { trackCall } = useAnalytics();
  useEffect(() => {
    if (!vehicle) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [vehicle, onClose]);

  if (!vehicle) return null;

  return (
    <div
      className="td-scrim-enter fixed inset-0 z-400 flex items-center justify-center overflow-y-auto bg-ink/60 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={vehicle.title}
        onClick={(e) => e.stopPropagation()}
        className="td-modal-enter relative my-8 grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-modal bg-card md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
      >
        <button
          onClick={onClose}
          aria-label={t('detail.close')}
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-card text-ink transition-transform duration-220 ease-spring"
        >
          <X className="h-5 w-5" aria-hidden="true" strokeWidth={2.5} />
        </button>

        <figure className="relative m-0 min-h-60 min-w-0 bg-paper-2 md:min-h-full">
          <img
            src={vehicle.images[0]}
            alt={vehicle.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-pill bg-sun px-3 py-1.5 text-xs font-extrabold text-sun-ink">
            <Users className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
            {t('detail.vipSeats', { n: vehicle.seats })}
          </span>
        </figure>

        <div className="max-h-[85vh] min-w-0 overflow-y-auto p-5 sm:p-7">
          <div className="flex items-center justify-between gap-2">
            {vehicle.isVerified ? (
              <p className="inline-flex items-center gap-1.5 rounded-pill bg-leaf-soft px-3 py-1.5 text-xs font-extrabold text-leaf">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
                {t('detail.verifiedBadge')}
              </p>
            ) : (
              <span />
            )}
            <span className="td-fig inline-flex items-center gap-1 rounded-pill bg-sun-soft px-2.5 py-1.5 text-xs font-extrabold text-ink">
              <Star className="h-3.5 w-3.5 fill-sun text-sun" aria-hidden="true" />
              {vehicle.rating}
              <span className="font-bold text-ink-2">{t('detail.reviews', { n: vehicle.reviewCount })}</span>
            </span>
          </div>

          <h2 className="mt-3 font-display text-2xl font-extrabold leading-snug tracking-tight text-ink">
            {vehicle.title}
          </h2>
          <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-bold text-ink-2">
            <MapPin className="h-4 w-4 text-accent-deep" aria-hidden="true" />
            {t('detail.basedAt')} {vehicle.location}
          </p>

          <p className="mt-4 max-w-[60ch] text-sm font-medium leading-relaxed text-ink-2">{vehicle.description}</p>

          <h3 className="mb-2 mt-6 text-xs font-extrabold uppercase tracking-[0.08em] text-ink-2">
            {t('detail.amenities')}
          </h3>
          <ul className="flex flex-wrap gap-1.5">
            {vehicle.amenities.map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5 rounded-pill bg-paper px-3 py-1.5 text-[13px] font-bold text-ink">
                <Check className="h-3.5 w-3.5 text-leaf" aria-hidden="true" strokeWidth={3} />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-card bg-paper p-4">
            <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-ink-2">
              {t('detail.ratesTitle')}
            </span>
            <dl className="mt-3 flex flex-col gap-2">
              {ZONE_RATE_CARDS.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-baseline justify-between gap-3 rounded-input bg-card px-3 py-2.5"
                >
                  <dt className="min-w-0">
                    <span className="block text-[13px] font-extrabold text-ink">
                      {t('detail.zoneLine', { no: zone.zoneNo, label: t(`zone.${zone.id}.label` as DictKey) })}
                    </span>
                    <span className="block text-[11px] font-medium text-ink-2">{t(`zone.${zone.id}.examples` as DictKey)}</span>
                  </dt>
                  <dd className="td-fig shrink-0 text-base font-extrabold text-ink">
                    {formatTHB(vehicle.zoneRates[zone.id])}
                  </dd>
                </div>
              ))}
            </dl>
            {vehicle.rateNote && (
              <p className="mt-3 flex items-start gap-1.5 text-xs font-medium leading-relaxed text-ink-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {vehicle.rateNote}
              </p>
            )}
          </div>

          <div className="mt-3 rounded-card border-2 border-dashed border-rule p-4">
            <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-ink-2">
              {t('detail.termsTitle')}
            </span>
            <ul className="mt-2 flex list-none flex-col gap-1.5 p-0 text-xs font-medium leading-relaxed text-ink-2">
              <li>
                {t('detail.termsHours', { h: STANDARD_TERMS.workHoursPerDay, start: STANDARD_TERMS.workStart, end: STANDARD_TERMS.workEnd, rate: formatTHB(STANDARD_TERMS.overtimeRatePerHour) })}
              </li>
              <li>
                {t('detail.termsStay', { rate: formatTHB(STANDARD_TERMS.overnightStayRate) })}
              </li>
              <li>{t('terms.fuelNote')}</li>
            </ul>
            <a
              href="#trip-board"
              onClick={onClose}
              className="td-btn mt-3 inline-flex items-center gap-1 text-[13px] font-extrabold text-accent-deep underline decoration-accent/40 decoration-2 underline-offset-4 hover:text-accent-deep"
            >
              {t('detail.boardLink')}
            </a>
          </div>

          <div className="mt-4 rounded-card bg-sun-soft p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-ink-2">{t('detail.contactTitle')}</p>
            <div className="mt-2 flex items-center gap-3">
              <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-card text-base font-extrabold text-grape">
                {vehicle.driverNickname.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-extrabold text-ink">
                  {vehicle.driverNickname} ({vehicle.driverName})
                </p>
                <p className="td-fig text-[13px] font-bold text-ink">{vehicle.driverPhone}</p>
              </div>
            </div>
            <p className="mt-2 text-xs font-bold text-ink-2">{t('detail.contactNote')}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={`tel:${vehicle.driverPhone}`}
                onClick={() => {
                  trackCall({
                    targetType: 'vehicle_detail',
                    targetId: vehicle.id,
                    targetTitle: vehicle.title,
                    phoneNumber: vehicle.driverPhone,
                    driverName: vehicle.driverNickname,
                  });
                }}
                data-analytics-call={vehicle.id}
                className="td-btn td-pop inline-flex items-center justify-center gap-1.5 rounded-pill bg-accent px-3 py-3 text-sm font-extrabold text-accent-ink"
              >
                <Phone className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
                {t('detail.callNow')}
              </a>
              <a
                href={vehicle.driverLine}
                target="_blank"
                rel="noopener noreferrer"
                className="td-btn td-pop inline-flex items-center justify-center gap-1.5 rounded-pill bg-card px-3 py-3 text-sm font-extrabold text-ink"
              >
                <MessageCircle className="h-4 w-4 text-leaf" aria-hidden="true" strokeWidth={2.5} />
                {t('detail.lineChat')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
