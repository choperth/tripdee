'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { SPONSORS, Sponsor } from '@/data/mockData';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';
import { getLocalizedSponsor } from '@/lib/sponsorLocalization';
import {
  MapPin,
  Phone,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

interface MobileSponsorSectionProps {
  className?: string;
}

export const MobileSponsorSection: React.FC<MobileSponsorSectionProps> = ({ className = '' }) => {
  const { trackSponsor, trackCall } = useAnalytics();
  const { t, locale } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const localizedSponsors = useMemo(
    () => SPONSORS.map((s) => getLocalizedSponsor(s, locale)),
    [locale]
  );

  const categories = [
    { key: 'all', label: `${t('spn.catAll')} (${localizedSponsors.length})`, icon: '🌟' },
    { key: 'hotel', label: t('spn.catHotel') || 'ที่พัก', icon: '🏨' },
    { key: 'activity', label: t('spn.catActivity') || 'ปางช้าง/กิจกรรม', icon: '🐘' },
    { key: 'tour', label: t('spn.catTour') || 'ทัวร์', icon: '🛵' },
    { key: 'insurance', label: t('spn.catInsurance') || 'ประกันภัย', icon: '🛡️' },
    { key: 'fuel', label: t('spn.catFuel') || 'น้ำมัน & กาแฟ', icon: '⛽' },
    { key: 'auto_service', label: t('spn.catGarage') || 'บริการรถ', icon: '🔧' },
  ].filter((c) => c.key === 'all' || localizedSponsors.some((s) => s.category === c.key));

  const filteredSponsors =
    selectedCategory === 'all'
      ? localizedSponsors
      : localizedSponsors.filter((s) => s.category === selectedCategory);

  const handleSponsorClick = (sponsor: Sponsor) => {
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

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'hotel':
        return '🏨';
      case 'activity':
        return '🐘';
      case 'tour':
        return '🛵';
      case 'insurance':
        return '🛡️';
      case 'fuel':
        return '⛽';
      case 'auto_service':
        return '🔧';
      default:
        return '🌟';
    }
  };

  return (
    <section
      id="sponsors-mobile"
      aria-label={t('spn.partnerPerk')}
      className={`my-5 sm:my-8 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-amber-50/70 via-card to-paper dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 border border-amber-200/80 dark:border-amber-900/40 p-3 sm:p-5 shadow-xs ${className}`}
    >
      {/* 1. Header */}
      <div className="mb-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h2 className="text-base sm:text-lg font-extrabold text-navy-deep dark:text-white leading-tight">
            {t('spn.sectionTitle', { n: localizedSponsors.length })}
          </h2>
          <span className="text-[11px] font-semibold text-ink-muted dark:text-slate-400">
            {t('spn.sectionSubtitle')}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1 text-xs text-ink-muted dark:text-slate-400">
          <span>{t('spn.sectionDesc')}</span>
          <span className="md:hidden font-semibold text-blue-action dark:text-blue-400 flex items-center gap-0.5">
            <span>{t('spn.swipeHint')}</span>
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </span>
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-2.5 -mx-1 px-1 scrollbar-none text-xs">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold transition-all text-xs active:scale-95 ${
                isActive
                  ? 'bg-navy-deep text-white shadow-xs dark:bg-amber-500 dark:text-navy-deep'
                  : 'bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Horizontal Swipe Carousel on Mobile (< md), Grid on Desktop (md+) */}
      <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory pb-2 -mx-margin px-margin md:mx-0 md:px-0 scrollbar-none items-stretch">
        {filteredSponsors.map((sponsor) => {
          const isPhone = sponsor.link.startsWith('tel:');
          const emoji = getCategoryEmoji(sponsor.category);

          return (
            <div
              key={sponsor.id}
              className="w-[82vw] sm:w-[340px] md:w-auto shrink-0 md:shrink snap-start flex flex-row items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-paper-elevated dark:bg-slate-900 border border-amber-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all group"
            >
              {/* Left: Thumbnail (fixed compact size) */}
              <div className="relative w-22 h-22 sm:w-26 sm:h-26 rounded-xl overflow-hidden shrink-0 bg-navy-deep">
                <Image
                  src={sponsor.image}
                  alt={sponsor.title}
                  fill
                  sizes="120px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/75 via-transparent to-transparent pointer-events-none" />
                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-navy-deep/85 text-white font-extrabold text-[9px] shadow-xs">
                  {emoji} {sponsor.categoryLabel.split(' ')[0]}
                </span>
              </div>

              {/* Right: Info, Highlight, Direct Link */}
              <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                <div>
                  <div className="flex items-center gap-1 text-[10px] text-ink-muted dark:text-slate-400">
                    <MapPin className="w-3 h-3 text-blue-action shrink-0" />
                    <span className="truncate">{sponsor.location}</span>
                  </div>

                  <h3 className="font-extrabold text-xs sm:text-sm text-navy-deep dark:text-white truncate mt-0.5 group-hover:text-blue-action transition-colors">
                    {sponsor.title}
                  </h3>

                  <p className="text-[11px] text-ink-secondary dark:text-slate-300 line-clamp-1 mt-0.5">
                    {sponsor.tagline}
                  </p>
                </div>

                {/* Bottom Row: Feature pill & Direct Link Button */}
                <div className="flex items-center justify-between gap-1.5 mt-2">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-paper-surface-muted dark:bg-slate-800/80 border border-border-subtle/80 text-ink-secondary dark:text-slate-300 text-[10px] font-bold min-w-0 max-w-[58%] truncate">
                    <span className="truncate">{sponsor.discountText}</span>
                  </div>

                  <a
                    href={sponsor.link}
                    target={isPhone ? undefined : '_blank'}
                    rel={isPhone ? undefined : 'noopener noreferrer'}
                    onClick={() => handleSponsorClick(sponsor)}
                    className={`shrink-0 px-2.5 py-1 rounded-xl text-white font-extrabold text-[11px] flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer ${
                      isPhone
                        ? 'bg-verified-emerald hover:bg-emerald-600'
                        : 'bg-navy-deep hover:bg-navy-surface dark:bg-blue-600 dark:hover:bg-blue-500'
                    }`}
                  >
                    {isPhone ? (
                      <>
                        <Phone className="w-3 h-3" />
                        <span>{t('spn.callClaim')}</span>
                      </>
                    ) : (
                      <>
                        <span>{t('spn.viewWebsite')}</span>
                        <ExternalLink className="w-3 h-3" />
                      </>
                    )}
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Cooperation Banner (Join as Sponsor) */}
      <div className="mt-3 w-full overflow-hidden rounded-2xl p-3.5 sm:p-4 bg-gradient-to-br from-navy-deep via-[#0e3565] to-navy-surface text-white border border-blue-800/70 shadow-xs">
        <h3 className="font-extrabold text-xs sm:text-sm text-white leading-snug">
          {t('spn.joinBannerTitle')}
        </h3>

        <p className="text-[11px] sm:text-xs text-slate-200 mt-1 leading-relaxed">
          {t('spn.joinBannerDesc')}
        </p>

        <div className="mt-2.5">
          <a
            href="https://line.me/R/ti/p/@731ruvzj"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-10 px-4 rounded-xl bg-line-green hover:bg-line-green-hover text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>{t('spn.contactLine')}</span>
          </a>
        </div>
      </div>
    </section>
  );
};
