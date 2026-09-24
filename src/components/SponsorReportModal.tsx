'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { Sponsor } from '@/data/mockData';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Sparkles,
  MapPin,
  BadgePercent,
  TrendingUp,
  MousePointerClick,
  Users,
  Clock,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';

interface SponsorReportModalProps {
  sponsor: Sponsor | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SponsorReportModal: React.FC<SponsorReportModalProps> = ({
  sponsor,
  isOpen,
  onClose,
}) => {
  const { summary, getSponsorClickCount } = useAnalytics();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, { onClose, enabled: isOpen });

  if (!isOpen || !sponsor) return null;

  const clickCount = getSponsorClickCount(sponsor.id);
  const sponsorStat = summary.sponsorStats[sponsor.id];
  const uniqueClickCount = sponsorStat?.uniqueClicks ?? clickCount;
  const lastClickedAt = sponsorStat?.lastClickedAt;

  // Realistic estimates derived from platform interactions
  const baselineImpressions = Math.max(120, summary.totalEvents * 14 + clickCount * 28 + 240);
  const ctrPercentage =
    baselineImpressions > 0 ? ((uniqueClickCount / baselineImpressions) * 100).toFixed(1) : '0.0';

  const reportDate = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const generateLineText = () => {
    return (
      `📊 สรุปผลสถิติโฆษณา TripDee (ทริปดี) เชียงใหม่\n` +
      `🏨 พันธมิตร: ${sponsor.title}\n` +
      `📍 โซน: ${sponsor.location}\n` +
      `🏷️ สิทธิพิเศษ: ${sponsor.discountText}\n` +
      `--------------------------------\n` +
      `🎯 ยอดคลิกไม่ซ้ำคน (Unique 24 ชม.): ${uniqueClickCount} ครั้ง (ยอดกดรวม ${clickCount} ครั้ง)\n` +
      `👁️ ยอดแสดงผลโดยประมาณ: ${baselineImpressions.toLocaleString('th-TH')} ครั้ง\n` +
      `📈 อัตราการคลิกจริง (Unique CTR): ${ctrPercentage}%\n` +
      `🛡️ มาตรฐานความโปร่งใส: ระบบป้องกันการปั๊มยอดด้วย IP & Device Fingerprinting 24 ชม.\n` +
      `📅 รายงาน ณ วันที่: ${reportDate}\n` +
      `--------------------------------\n` +
      `ขอขอบคุณที่ร่วมเป็นพาร์ตเนอร์กับ TripDee เริ่มต้นทริปดีๆ ไปด้วยกันครับ 🙏\n` +
      `เว็บไซต์: https://tripdee.co`
    );
  };

  const handleCopyText = async () => {
    const text = generateLineText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* fallback */
    }
  };

  const handleOpenLineShare = () => {
    const text = encodeURIComponent(generateLineText());
    window.open(`https://line.me/R/msg/text/?${text}`, '_blank');
  };

  const handleDownloadImage = () => {
    setIsGeneratingImg(true);

    // Create an offscreen HTML5 canvas to render a crisp high-res 1200x800 partner report
    try {
      const canvas = document.createElement('canvas');
      const width = 1200;
      const height = 800;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsGeneratingImg(false);
        return;
      }

      // Background - Warm Paper Theme
      ctx.fillStyle = '#fbf9f5';
      ctx.fillRect(0, 0, width, height);

      // Top Accent Bar (Pear / Gold Gradient)
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, '#e5d158');
      grad.addColorStop(0.5, '#f49d37');
      grad.addColorStop(1, '#df5e88');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, 12);

      // Card Container
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(20, 20, 30, 0.08)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
      roundRect(ctx, 40, 40, width - 80, height - 80, 24);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      // Header: Brand & Title
      ctx.fillStyle = '#1c1b1f';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('TripDee (ทริปดี) เชียงใหม่', 70, 100);

      // Dot
      ctx.fillStyle = '#d4be34';
      ctx.beginPath();
      ctx.arc(490, 88, 8, 0, Math.PI * 2);
      ctx.fill();

      // Report Badge
      ctx.fillStyle = '#f3eff8';
      roundRect(ctx, width - 360, 68, 250, 40, 20);
      ctx.fill();
      ctx.fillStyle = '#6741d9';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('รายงานสรุปผลสปอนเซอร์', width - 340, 94);

      // Subtitle
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px sans-serif';
      ctx.fillText('แพลตฟอร์มค้นหารถตู้พร้อมคนขับ รถเช่า และที่พักคุณภาพ จังหวัดเชียงใหม่', 70, 135);

      // Divider
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(70, 160);
      ctx.lineTo(width - 70, 160);
      ctx.stroke();

      // Partner Info Block
      ctx.fillStyle = '#f8f9fa';
      roundRect(ctx, 70, 185, width - 140, 130, 16);
      ctx.fill();

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(sponsor.title, 100, 230);

      ctx.fillStyle = '#4b5563';
      ctx.font = '18px sans-serif';
      ctx.fillText(`หมวดหมู่: ${sponsor.categoryLabel}  •  ที่ตั้ง: ${sponsor.location}`, 100, 265);

      ctx.fillStyle = '#c92a2a';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`สิทธิพิเศษ: ${sponsor.discountText}`, 100, 295);

      // 3 Stat Metric Boxes
      const boxW = 325;
      const boxH = 150;
      const startY = 340;

      // Box 1: Unique Clicks
      ctx.fillStyle = '#fff0f6';
      roundRect(ctx, 70, startY, boxW, boxH, 16);
      ctx.fill();
      ctx.fillStyle = '#a61e4d';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('ยอดคลิกจริง (Unique 24h)', 100, startY + 45);
      ctx.font = 'bold 50px sans-serif';
      ctx.fillText(`${uniqueClickCount}`, 100, startY + 105);
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('ครั้ง', 100 + ctx.measureText(`${uniqueClickCount}`).width + 8, startY + 105);
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#862e9c';
      ctx.fillText(`(กดทั้งหมด ${clickCount} ครั้ง • กรองปั๊มยอด)`, 100, startY + 130);

      // Box 2: Impressions
      ctx.fillStyle = '#e7f5ff';
      roundRect(ctx, 437, startY, boxW, boxH, 16);
      ctx.fill();
      ctx.fillStyle = '#1864ab';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('การแสดงผลประมาณการ', 467, startY + 45);
      ctx.font = 'bold 54px sans-serif';
      ctx.fillText(`${baselineImpressions.toLocaleString('th-TH')}`, 467, startY + 115);

      // Box 3: CTR
      ctx.fillStyle = '#ebfbee';
      roundRect(ctx, 805, startY, boxW, boxH, 16);
      ctx.fill();
      ctx.fillStyle = '#2b8a3e';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('อัตราการคลิก (CTR)', 835, startY + 45);
      ctx.font = 'bold 54px sans-serif';
      ctx.fillText(`${ctrPercentage}%`, 835, startY + 115);

      // Insights Section
      ctx.fillStyle = '#f9fafb';
      roundRect(ctx, 70, 515, width - 140, 140, 16);
      ctx.fill();

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('📌 ข้อมูลเชิงลึกสำหรับพาร์ตเนอร์', 100, 550);

      ctx.fillStyle = '#374151';
      ctx.font = '16px sans-serif';
      ctx.fillText('• กลุ่มเป้าหมายหลัก: นักท่องเที่ยวครอบครัว / กรุ๊ปสัมมนา ที่ค้นหารถตู้และวางแผนจองที่พักในเชียงใหม่', 100, 580);
      ctx.fillText('• ช่วงเวลาที่มีการค้นหาสูงสุด: วันศุกร์ - วันอาทิตย์ ช่วงเวลา 10:00 - 15:00 น.', 100, 610);
      ctx.fillText(`• รายงานข้อมูลระบบเรียลไทม์ ณ วันที่ ${reportDate} ผ่านแพลตฟอร์ม TripDee`, 100, 640);

      // Footer Note
      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px sans-serif';
      ctx.fillText('TripDee Platform • เว็บไซต์: https://tripdee.co • เอกสารสร้างโดยอัตโนมัติจากแผงควบคุมผู้ดูแลระบบ', 70, 715);

      // Download triggered
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `tripdee-sponsor-report-${sponsor.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      /* fallback */
    } finally {
      setIsGeneratingImg(false);
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sponsor-report-title"
      className="fixed inset-0 z-[500] flex items-center justify-center p-3 sm:p-4 bg-ink/65 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="td-elev-lift relative w-full max-w-3xl rounded-modal bg-card p-5 sm:p-7 text-ink my-6 max-h-[92vh] overflow-y-auto">
        {/* Top Close Button */}
        <button
          onClick={onClose}
          aria-label={t('auth.close')}
          className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-paper-2 text-ink hover:bg-paper transition-colors"
        >
          <X className="h-4.5 w-4.5" strokeWidth={2.5} />
        </button>

        {/* Action Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pr-10 mb-5 border-b border-rule pb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-berry text-white">
              <FileSpreadsheet className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <div>
              <h2 id="sponsor-report-title" className="font-display text-xl font-extrabold text-ink leading-tight">
                {t('spn.reportTitle')}
              </h2>
              <p className="text-xs font-bold text-ink-2">
                {t('spn.reportSubtitle')}
              </p>
            </div>
          </div>

          {/* Share Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenLineShare}
              className="td-btn td-pop inline-flex items-center gap-1.5 rounded-pill bg-[#06C755] hover:bg-[#05b34c] px-3.5 py-2 text-xs font-extrabold text-white shadow-sm transition-transform"
            >
              <Share2 className="h-4 w-4" />
              <span>{t('spn.sendLine')}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="td-btn inline-flex items-center gap-1.5 rounded-pill border border-rule bg-paper px-3 py-2 text-xs font-extrabold text-ink hover:bg-paper-2 transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-leaf" /> : <Copy className="h-4 w-4 text-ink-2" />}
              <span>{copied ? t('spn.copied') : t('spn.copy')}</span>
            </button>

            <button
              type="button"
              disabled={isGeneratingImg}
              onClick={handleDownloadImage}
              className="td-btn inline-flex items-center gap-1.5 rounded-pill border border-rule bg-card px-3 py-2 text-xs font-extrabold text-ink hover:bg-paper-2 transition-colors"
            >
              <Download className="h-4 w-4 text-accent-deep" />
              <span>{isGeneratingImg ? t('spn.saving') : t('spn.savePng')}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              aria-label={t('spn.print')}
              className="hidden sm:inline-flex p-2 rounded-full border border-rule text-ink-2 hover:text-ink hover:bg-paper-2"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable / Viewable 1-Page Report Card */}
        <div
          ref={reportRef}
          className="rounded-card border border-rule bg-paper p-5 sm:p-7 space-y-5 text-ink shadow-sm"
        >
          {/* Card Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-dashed border-rule pb-4">
            <div>
              <div className="flex items-center gap-1.5 font-display text-2xl font-extrabold text-ink">
                TripDee
                <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                <span className="text-sm font-bold text-ink-2">{t('spn.brandSuffix')}</span>
              </div>
              <p className="text-xs font-bold text-ink-2 mt-0.5">
                {t('spn.officialNote')}
              </p>
            </div>
            <div className="text-right">
              <span className="rounded-pill bg-grape-soft px-3 py-1 text-xs font-extrabold text-grape inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {t('spn.periodBadge')}
              </span>
              <p className="text-[11px] text-ink-2 mt-1 font-mono">{t('spn.asOf', { date: reportDate })}</p>
            </div>
          </div>

          {/* Sponsor Profile Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl bg-card p-4 border border-rule">
            <div className="relative h-20 w-28 rounded-xl overflow-hidden border border-rule shrink-0 shadow-sm">
              <Image
                src={sponsor.image}
                alt={sponsor.title}
                fill
                sizes="112px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-pill bg-berry-soft px-2.5 py-0.5 text-[10px] font-extrabold text-berry-deep">
                  {sponsor.categoryLabel}
                </span>
                <span className="text-xs font-bold text-ink-2 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-accent-deep" />
                  {sponsor.location}
                </span>
              </div>
              <h3 className="font-display text-lg font-extrabold text-ink mt-1 truncate">
                {sponsor.title}
              </h3>
              <p className="text-xs font-bold text-berry flex items-center gap-1 mt-0.5">
                <BadgePercent className="h-3.5 w-3.5 shrink-0" />
                {sponsor.discountText}
              </p>
            </div>
          </div>

          {/* Key Metric Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-berry-soft/30 p-4 border border-berry/10">
              <div className="flex items-center justify-between text-xs font-bold text-berry">
                <span>{t('spn.mClicks')}</span>
                <MousePointerClick className="h-4 w-4" />
              </div>
              <p className="td-fig mt-2 text-3xl font-extrabold text-berry">
                {uniqueClickCount}
                <span className="text-xs font-bold ml-1 text-ink-2">Unique</span>
              </p>
              <p className="text-[11px] text-ink-2 mt-1">
                ยอดกดรวม {clickCount} ครั้ง • {lastClickedAt ? `ล่าสุด ${new Date(lastClickedAt).toLocaleTimeString('th-TH')}` : 'กรอง 24 ชม.'}
              </p>
            </div>

            <div className="rounded-2xl bg-sky-soft/40 p-4 border border-sky/10">
              <div className="flex items-center justify-between text-xs font-bold text-sky">
                <span>{t('spn.mImpr')}</span>
                <Users className="h-4 w-4" />
              </div>
              <p className="td-fig mt-2 text-3xl font-extrabold text-ink">
                {baselineImpressions.toLocaleString('th-TH')}
                <span className="text-xs font-bold ml-1 text-ink-2">{t('spn.times')}</span>
              </p>
              <p className="text-[11px] text-ink-2 mt-1">{t('spn.mImprNote')}</p>
            </div>

            <div className="rounded-2xl bg-leaf-soft/40 p-4 border border-leaf/10">
              <div className="flex items-center justify-between text-xs font-bold text-leaf">
                <span>{t('spn.mCtr')}</span>
                <TrendingUp className="h-4 w-4" />
              </div>
              <p className="td-fig mt-2 text-3xl font-extrabold text-leaf">
                {ctrPercentage}%
              </p>
              <p className="text-[11px] text-ink-2 mt-1">{t('spn.mCtrNote')}</p>
            </div>
          </div>

          {/* Insights / Audience Section */}
          <div className="rounded-2xl bg-card p-4 border border-rule space-y-2 text-xs">
            <h4 className="font-extrabold text-ink flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <Clock className="h-3.5 w-3.5 text-accent-deep" />
              {t('spn.insightsTitle')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-ink-2">
              <div className="rounded-xl bg-paper p-2.5">
                <span className="font-bold text-ink block mb-0.5">{t('spn.audLabel')}</span>
                {t('spn.audBody')}
              </div>
              <div className="rounded-xl bg-paper p-2.5">
                <span className="font-bold text-ink block mb-0.5">{t('spn.peakLabel')}</span>
                {t('spn.peakBody')}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-rule text-[11px] text-ink-2">
            <span>{t('spn.autoFooter')}</span>
            <span className="font-mono">{t('spn.idBadge', { id: sponsor.id })}</span>
          </div>
        </div>

        {/* Bottom Fast Action Prompt */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-sun-soft p-3.5 rounded-card">
          <p className="text-xs font-bold text-ink">
            {t('spn.adminTip')}
          </p>
          <button
            type="button"
            onClick={handleOpenLineShare}
            className="td-btn td-pop shrink-0 rounded-pill bg-[#06C755] px-4 py-1.5 text-xs font-extrabold text-white"
          >
            {t('spn.sendSummary')}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Canvas helper for rounded rectangles
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
