'use client';

import React from 'react';
import { OFFICIAL_PARTNERS, OfficialPartner } from '@/data/mockData';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import { useAnalytics } from '@/context/AnalyticsContext';

export const OfficialPartnersMarquee: React.FC = () => {
  const { trackSponsor } = useAnalytics();

  const handlePartnerClick = (partner: OfficialPartner) => {
    trackSponsor({
      sponsorId: partner.id,
      sponsorTitle: partner.name,
      category: 'auto_service',
      variant: 'strip',
      targetUrl: partner.link,
    });
  };

  // Duplicate list to achieve continuous infinite marquee loop
  const displayPartners = [...OFFICIAL_PARTNERS, ...OFFICIAL_PARTNERS];

  return (
    <section aria-label="พันธมิตรอย่างเป็นทางการ" className="relative my-10 overflow-hidden py-4">
      <style jsx>{`
        @keyframes marqueeScroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marqueeScroll 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Header */}
      <div className="mb-5 flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-pill bg-leaf-soft px-2.5 py-1 text-[11px] font-extrabold text-leaf border border-leaf/20">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>OFFICIAL PARTNERS · พันธมิตรอย่างเป็นทางการ</span>
          </div>
          <h2 className="mt-1.5 font-display text-lg sm:text-xl font-black text-ink">
            เครือข่ายพันธมิตรที่ร่วมสนับสนุนการเดินทาง
          </h2>
          <p className="text-xs font-semibold text-ink-2">
            สิทธิพิเศษน้ำมัน ที่พัก ประกันภัย และศูนย์บริการมาตรฐาน เพื่อการเดินทางที่ปลอดภัย 0% คอมมิชชัน
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-ink-2">
          <span>แตะที่ป้ายเพื่อดูสิทธิพิเศษ</span>
        </div>
      </div>

      {/* Marquee Track with gradient fade edges */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-rule/70 bg-paper-2/60 py-3 shadow-2xs">
        {/* Left Gradient Mask */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-paper-2 to-transparent" />
        {/* Right Gradient Mask */}
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-paper-2 to-transparent" />

        <div className="animate-marquee flex gap-3.5 px-4">
          {displayPartners.map((partner, index) => (
            <a
              key={`${partner.id}-${index}`}
              href={partner.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handlePartnerClick(partner)}
              className="group flex w-[280px] shrink-0 items-center gap-3 rounded-xl border border-rule/80 bg-card p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-xs"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-paper text-xl shadow-2xs border border-rule/50 group-hover:scale-105 transition-transform">
                <span>{partner.logoIcon}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                    {partner.badge}
                  </span>
                  <span className="truncate text-[10px] font-semibold text-ink-2">
                    {partner.category}
                  </span>
                </div>
                <h3 className="truncate text-xs font-black text-ink group-hover:text-accent transition-colors mt-0.5">
                  {partner.name}
                </h3>
                <p className="truncate text-[11px] font-medium text-ink-2 mt-0.5">
                  {partner.highlight}
                </p>
              </div>

              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-ink-2/50 group-hover:text-accent transition-colors" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
