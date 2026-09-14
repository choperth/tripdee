'use client';

import React from 'react';
import { SPONSORS } from '@/data/mockData';
import { Sparkles, MapPin, BadgePercent, ArrowUpRight, Megaphone, Phone, ExternalLink, ShieldCheck } from 'lucide-react';
import { useAnalytics } from '@/context/AnalyticsContext';

export const SponsorSidebar: React.FC = () => {
  const { trackSponsor, trackCall, getSponsorClickCount } = useAnalytics();

  const handleSponsorClick = (sponsor: typeof SPONSORS[0]) => {
    trackSponsor({
      sponsorId: sponsor.id,
      sponsorTitle: sponsor.title,
      category: sponsor.category,
      variant: 'sidebar',
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

  const primarySponsor = SPONSORS[0]; // หมอกฟ้า พูลวิลล่า & แกลมปิ้ง ม่อนแจ่ม
  const secondarySponsor = SPONSORS[1]; // ซีเอ็นเอ็กซ์ เซอร์วิสแอนด์ไทร์

  return (
    <aside aria-label="โฆษณาและสิทธิพิเศษพาร์ตเนอร์" className="space-y-4">
      {/* 1. Primary Featured Sponsor (Sticky Sidebar Card) */}
      {primarySponsor && (
        <div className="td-elev-card overflow-hidden rounded-card border-2 border-ink bg-card text-ink shadow-[0_4px_12px_rgba(51,35,26,0.08)]">
          {/* Top image with badge */}
          <div className="relative aspect-[16/10] w-full overflow-hidden border-b-2 border-ink bg-paper-2">
            <img
              src={primarySponsor.image}
              alt={primarySponsor.title}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
            <span className="td-sticker absolute left-3 top-3 inline-flex items-center gap-1 rounded-pill border border-ink/20 bg-berry px-2.5 py-1 text-[11px] font-black text-white shadow-sm">
              <Sparkles className="h-3 w-3" strokeWidth={2.5} />
              สปอนเซอร์แถบข้างแนะนำ
            </span>
            <span className="absolute bottom-2 right-2 rounded-md bg-ink/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              คลิก: {getSponsorClickCount(primarySponsor.id)} ครั้ง
            </span>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-1 text-xs font-bold text-ink-2">
              <MapPin className="h-3.5 w-3.5 text-accent" />
              <span>{primarySponsor.location}</span>
            </div>

            <h4 className="font-display mt-1 text-base font-black text-ink line-clamp-2">
              {primarySponsor.title}
            </h4>

            <p className="mt-1 text-xs text-ink-2 line-clamp-2 leading-relaxed">
              {primarySponsor.tagline}
            </p>

            {/* Discount Pill */}
            <div className="mt-3 rounded-xl border border-dashed border-berry/40 bg-berry-soft p-2.5 text-xs font-black text-berry flex items-center gap-1.5">
              <BadgePercent className="h-4 w-4 shrink-0 text-berry" />
              <span className="line-clamp-1">{primarySponsor.discountText}</span>
            </div>

            {/* CTA Button */}
            <a
              href={primarySponsor.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleSponsorClick(primarySponsor)}
              data-analytics-sponsor={primarySponsor.id}
              data-analytics-variant="sidebar"
              className="td-btn td-pop mt-3 flex w-full items-center justify-center gap-1.5 rounded-pill border-2 border-ink bg-berry py-2.5 text-xs font-black text-white shadow-[0_2px_0_0_var(--color-ink)]"
            >
              <span>ติดต่อรับสิทธิ์ / จองตรง</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </a>
          </div>
        </div>
      )}

      {/* 2. Secondary Service Partner (Compact Card) */}
      {secondarySponsor && (
        <div className="rounded-card border-2 border-ink bg-sun-soft p-4 text-ink">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-ink">
              <ShieldCheck className="h-4 w-4 text-leaf" />
              <span>บริการแนะนำสำหรับคนขับ & รถเช่า</span>
            </div>
            <span className="text-[10px] font-bold text-ink-2 bg-sun px-1.5 py-0.5 rounded">
              คลิก: {getSponsorClickCount(secondarySponsor.id)}
            </span>
          </div>

          <h5 className="font-display mt-1.5 text-sm font-black text-ink line-clamp-1">
            {secondarySponsor.title}
          </h5>

          <p className="mt-0.5 text-xs text-ink-2 font-medium line-clamp-2">
            {secondarySponsor.discountText}
          </p>

          <a
            href={secondarySponsor.link}
            onClick={() => handleSponsorClick(secondarySponsor)}
            data-analytics-sponsor={secondarySponsor.id}
            data-analytics-variant="sidebar"
            className="td-btn td-pop mt-2.5 inline-flex items-center gap-1 rounded-pill border-2 border-ink bg-card px-3 py-1.5 text-xs font-black text-ink hover:bg-paper-2"
          >
            {secondarySponsor.link.startsWith('tel:') ? (
              <>
                <Phone className="h-3.5 w-3.5 text-leaf" />
                <span>โทรด่วน</span>
              </>
            ) : (
              <>
                <ExternalLink className="h-3.5 w-3.5 text-accent" />
                <span>ดูรายละเอียด</span>
              </>
            )}
          </a>
        </div>
      )}

      {/* 3. "Ad Space Available" Pitch Box (ชักชวนธุรกิจในเชียงใหม่มาลงโฆษณาแถบข้าง) */}
      <div className="rounded-card border-2 border-dashed border-rule bg-paper p-4 text-ink">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-accent">
          <Megaphone className="h-4 w-4" />
          <span>พื้นที่โฆษณาแถบข้าง (ว่าง 1 จุด)</span>
        </div>

        <h5 className="font-display mt-1 text-sm font-black text-ink">
          สนใจโปรโมตรีสอร์ต / ธุรกิจของคุณ?
        </h5>

        <p className="mt-1 text-xs text-ink-2 leading-relaxed">
          แสดงผลเคียงข้างรถตู้ทุกคัน เข้าถึงนักท่องเที่ยวเชียงใหม่กว่า 5,000+ ครั้ง/เดือน พร้อมรายงานสถิติ คลิกจริง
        </p>

        <div className="mt-3 flex items-center justify-between border-t border-dashed border-rule pt-2.5">
          <span className="text-xs font-black text-leaf">เริ่มต้น ฿1,500/เดือน</span>
          <a
            href="https://line.me"
            target="_blank"
            rel="noopener noreferrer"
            className="td-btn rounded-pill border border-ink bg-card px-3 py-1 text-[11px] font-black text-ink hover:bg-paper-2"
          >
            ทักไลน์ @tripdee
          </a>
        </div>
      </div>
    </aside>
  );
};
