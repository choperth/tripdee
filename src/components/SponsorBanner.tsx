'use client';

import React from 'react';
import Image from 'next/image';
import { Sponsor } from '@/data/mockData';
import { MapPin, BadgePercent, ArrowUpRight, Wrench, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAnalytics } from '@/context/AnalyticsContext';
interface SponsorBannerProps {
  sponsor: Sponsor;
  variant?: 'split' | 'strip';
}

export const SponsorBanner: React.FC<SponsorBannerProps> = ({ sponsor, variant = 'split' }) => {
  const { t } = useLanguage();
  const { trackSponsor, trackCall, getSponsorClickCount } = useAnalytics();

  const handleSponsorClick = () => {
    trackSponsor({
      sponsorId: sponsor.id,
      sponsorTitle: sponsor.title,
      category: sponsor.category,
      variant,
      targetUrl: sponsor.link,
    });
    if (sponsor.link.startsWith('tel:')) {
      trackCall({
        targetType: 'sponsor',
        targetId: sponsor.id,
        targetTitle: sponsor.title,
        phoneNumber: sponsor.link.replace('tel:', ''),
      });
    }
  };

  if (variant === 'strip') {
    return (
      <aside
        aria-label={t('sponsor.partnerAria', { title: sponsor.title })}
        className="td-elev-card flex flex-col gap-4 rounded-card bg-sun-soft p-5 sm:flex-row sm:items-center sm:gap-5"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sun">
          <Wrench className="h-5 w-5 text-sun-ink" aria-hidden="true" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold text-ink">
            {sponsor.badgeText} <span className="font-bold text-ink-2">· {sponsor.categoryLabel}</span>
          </p>
          <h3 className="mt-0.5 truncate font-display text-base font-extrabold text-ink">
            {sponsor.title}
          </h3>
          <p className="mt-0.5 truncate text-[13px] font-bold text-ink-2">{sponsor.discountText}</p>
        </div>
        <a
          href={sponsor.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleSponsorClick}
          data-analytics-sponsor={sponsor.id}
          className="td-btn td-pop inline-flex shrink-0 items-center justify-center gap-1.5 rounded-pill bg-ink px-5 py-2.5 text-[13px] font-extrabold text-paper"
        >
          {t('sponsor.cta')}
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
        </a>
      </aside>
    );
  }
  return (
    <aside
      aria-label={t('sponsor.partnerAria', { title: sponsor.title })}
      className="td-elev-card grid grid-cols-1 gap-5 overflow-hidden rounded-card bg-card p-5 sm:p-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-center"
    >
      <figure className="relative m-0 aspect-[16/10] min-w-0 overflow-hidden rounded-card md:aspect-auto md:h-full md:min-h-44">
        <Image
          src={sponsor.image}
          alt={sponsor.title}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover"
        />
        <span className="td-sticker absolute left-3 top-3 inline-flex items-center gap-1 rounded-pill bg-berry px-2.5 py-1 text-[11px] font-extrabold text-white">
          <Sparkles className="h-3 w-3" aria-hidden="true" strokeWidth={2.5} />
          {sponsor.categoryLabel}
        </span>
      </figure>

      <div className="flex min-w-0 flex-col">
        <h3 className="font-display text-xl font-extrabold leading-snug tracking-tight text-ink sm:text-2xl">
          {sponsor.title}
        </h3>
        <p className="mt-1 text-sm font-medium leading-relaxed text-ink-2">{sponsor.tagline}</p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-ink-2">
          <MapPin className="h-3.5 w-3.5 text-accent-deep" aria-hidden="true" />
          {sponsor.location}
        </p>

        <div className="mt-4 flex flex-col gap-3 border-t-2 border-dashed border-rule pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-start gap-1.5 text-[13px] font-extrabold text-ink">
            <BadgePercent className="mt-0.5 h-4 w-4 shrink-0 text-berry" aria-hidden="true" />
            {sponsor.discountText}
          </p>
          <a
            href={sponsor.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleSponsorClick}
            data-analytics-sponsor={sponsor.id}
            className="td-btn td-pop inline-flex shrink-0 items-center justify-center gap-1.5 rounded-pill bg-ink hover:opacity-90 px-5 py-2.5 text-[13px] font-extrabold text-paper"
          >
            {t('sponsor.cta')}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
          </a>
        </div>
      </div>
    </aside>
  );
};
