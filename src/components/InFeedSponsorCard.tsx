'use client';

import React from 'react';
import Image from 'next/image';
import { Sponsor } from '@/data/mockData';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';
import { MapPin, Tag, ExternalLink, Phone } from 'lucide-react';

interface InFeedSponsorCardProps {
  sponsor: Sponsor;
}

export const InFeedSponsorCard: React.FC<InFeedSponsorCardProps> = ({ sponsor }) => {
  const { trackSponsor, trackCall } = useAnalytics();
  const { t } = useLanguage();

  const handleClick = () => {
    trackSponsor({
      sponsorId: sponsor.id,
      sponsorTitle: sponsor.title,
      category: sponsor.category,
      variant: 'card',
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

  const isPhone = sponsor.link.startsWith('tel:');

  return (
    <aside
      aria-label={t('spn.sponsorAria', { title: sponsor.title })}
      className="group relative rounded-2xl border border-amber-300/60 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/40 via-paper-elevated to-paper-canvas dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900/90 shadow-sm hover:shadow-md transition-all overflow-hidden"
    >
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-transparent border-b border-amber-200/50 dark:border-amber-900/40">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
          <span>{sponsor.badgeText || t('spn.partnerPerk')}</span>
          <span className="text-amber-600/60 dark:text-amber-400/60 font-normal">|</span>
          <span className="font-semibold text-ink-muted dark:text-slate-400">{sponsor.categoryLabel}</span>
        </div>
        <span className="text-[10px] font-bold text-ink-muted dark:text-slate-400 bg-paper-surface-muted dark:bg-slate-800 px-2 py-0.5 rounded-full">
          {t('spn.partnerAd')}
        </span>
      </div>

      <div className="p-4 sm:p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between">
        {/* Left: Thumbnail and Details */}
        <div className="flex flex-col sm:flex-row gap-4 min-w-0 flex-1">
          {/* Thumbnail */}
          <div className="relative h-40 sm:h-28 sm:w-44 rounded-xl overflow-hidden bg-navy-deep shrink-0">
            <Image
              src={sponsor.image}
              alt={sponsor.title}
              fill
              sizes="(max-width: 640px) 100vw, 180px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/60 via-transparent to-transparent pointer-events-none md:hidden" />
            <div className="absolute bottom-2 left-2 right-2 text-white text-[11px] font-bold truncate md:hidden">
              {sponsor.location}
            </div>
          </div>

          {/* Texts */}
          <div className="min-w-0 flex-1 flex flex-col justify-center space-y-1.5">
            <div className="hidden md:flex items-center gap-1 text-xs text-ink-muted dark:text-slate-400">
              <MapPin className="w-3 h-3 text-blue-action" />
              <span className="truncate">{sponsor.location}</span>
            </div>

            <h3 className="font-title-card text-base sm:text-lg font-bold text-navy-deep dark:text-white line-clamp-1 group-hover:text-blue-action transition-colors">
              {sponsor.title}
            </h3>

            <p className="text-xs sm:text-sm text-ink-secondary dark:text-slate-300 line-clamp-2">
              {sponsor.tagline}
            </p>

            {/* Discount Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-taxi-yellow-soft dark:bg-amber-950/60 border border-amber-300/50 text-amber-950 dark:text-amber-300 text-xs font-bold w-fit">
              <Tag className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
              <span className="truncate">{sponsor.discountText}</span>
            </div>
          </div>
        </div>

        {/* Right CTA Button */}
        <div className="shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border-subtle/60 dark:border-slate-800 flex items-center justify-end">
          <a
            href={sponsor.link}
            target={isPhone ? undefined : '_blank'}
            rel={isPhone ? undefined : 'noopener noreferrer'}
            onClick={handleClick}
            className="w-full md:w-auto h-10 px-5 rounded-xl bg-navy-deep hover:bg-navy-surface dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
          >
            {isPhone ? (
              <>
                <Phone className="w-4 h-4" />
                <span>{t('spn.callClaim')}</span>
              </>
            ) : (
              <>
                <span>{t('spn.claimDiscount')}</span>
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </a>
        </div>
      </div>
    </aside>
  );
};
