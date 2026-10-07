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
  const { t, locale } = useLanguage();
  const numLocale = locale === 'th' ? 'th-TH' : locale === 'zh' ? 'zh-CN' : 'en-US';
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

  const reportDate = new Date().toLocaleDateString(numLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const generateLineText = () => {
    return t('srep.lineMessage', {
      title: sponsor.title,
      location: sponsor.location,
      discount: sponsor.discountText,
      unique: uniqueClickCount,
      total: clickCount,
      impressions: baselineImpressions.toLocaleString(numLocale),
      ctr: ctrPercentage,
      date: reportDate,
    });
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
      ctx.fillText(t('srep.imgTitle'), 70, 100);

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
      ctx.fillText(t('srep.imgBadge'), width - 340, 94);

      // Subtitle
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px sans-serif';
      ctx.fillText(t('srep.imgSubtitle'), 70, 135);

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
      ctx.fillText(t('srep.imgCatLoc', { cat: sponsor.categoryLabel, loc: sponsor.location }), 100, 265);

      ctx.fillStyle = '#c92a2a';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(t('srep.imgPerk', { discount: sponsor.discountText }), 100, 295);

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
      ctx.fillText(t('srep.imgClicks'), 100, startY + 45);
      ctx.font = 'bold 50px sans-serif';
      ctx.fillText(`${uniqueClickCount}`, 100, startY + 105);
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(t('srep.imgTimes'), 100 + ctx.measureText(`${uniqueClickCount}`).width + 8, startY + 105);
      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#862e9c';
      ctx.fillText(t('srep.imgClicksNote', { total: clickCount }), 100, startY + 130);

      // Box 2: Impressions
      ctx.fillStyle = '#e7f5ff';
      roundRect(ctx, 437, startY, boxW, boxH, 16);
      ctx.fill();
      ctx.fillStyle = '#1864ab';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(t('srep.imgImpr'), 467, startY + 45);
      ctx.font = 'bold 54px sans-serif';
      ctx.fillText(`${baselineImpressions.toLocaleString(numLocale)}`, 467, startY + 115);

      // Box 3: CTR
      ctx.fillStyle = '#ebfbee';
      roundRect(ctx, 805, startY, boxW, boxH, 16);
      ctx.fill();
      ctx.fillStyle = '#2b8a3e';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(t('srep.imgCtr'), 835, startY + 45);
      ctx.font = 'bold 54px sans-serif';
      ctx.fillText(`${ctrPercentage}%`, 835, startY + 115);

      // Insights Section
      ctx.fillStyle = '#f9fafb';
      roundRect(ctx, 70, 515, width - 140, 140, 16);
      ctx.fill();

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(t('srep.imgInsights'), 100, 550);

      ctx.fillStyle = '#374151';
      ctx.font = '16px sans-serif';
      ctx.fillText(t('srep.imgInsight1'), 100, 580);
      ctx.fillText(t('srep.imgInsight2'), 100, 610);
      ctx.fillText(t('srep.imgInsight3', { date: reportDate }), 100, 640);

      // Footer Note
      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px sans-serif';
      ctx.fillText(t('srep.imgFooter'), 70, 715);

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
      <div className="relative w-full max-w-3xl rounded-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-5 sm:p-7 text-ink my-6 max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Top Close Button */}
        <button
          onClick={onClose}
          aria-label={t('auth.close')}
          className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>

        {/* Action Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pr-10 mb-5 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-none bg-slate-900 text-white">
              <FileSpreadsheet className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <div>
              <h2 id="sponsor-report-title" className="font-display text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {t('spn.reportTitle')}
              </h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {t('spn.reportSubtitle')}
              </p>
            </div>
          </div>

          {/* Share Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenLineShare}
              className="inline-flex items-center gap-1.5 rounded-none bg-[#06C755] hover:bg-[#05b34c] px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              <span>{t('spn.sendLine')}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
              <span>{copied ? t('spn.copied') : t('spn.copy')}</span>
            </button>

            <button
              type="button"
              disabled={isGeneratingImg}
              onClick={handleDownloadImage}
              className="inline-flex items-center gap-1.5 rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              <span>{isGeneratingImg ? t('spn.saving') : t('spn.savePng')}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              aria-label={t('spn.print')}
              className="hidden sm:inline-flex p-2 rounded-none border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable / Viewable 1-Page Report Card */}
        <div
          ref={reportRef}
          className="rounded-none border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-5 sm:p-7 space-y-5 text-slate-900 dark:text-slate-100 shadow-2xs"
        >
          {/* Card Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-300 dark:border-slate-700 pb-4">
            <div>
              <div className="flex items-center gap-1.5 font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                TripDee
                <span className="inline-block h-2 w-2 rounded-none bg-slate-900 dark:bg-white" />
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{t('spn.brandSuffix')}</span>
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                {t('spn.officialNote')}
              </p>
            </div>
            <div className="text-right">
              <span className="rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {t('spn.periodBadge')}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">{t('spn.asOf', { date: reportDate })}</p>
            </div>
          </div>

          {/* Sponsor Profile Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-none bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800">
            <div className="relative h-20 w-28 rounded-none overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0 shadow-2xs">
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
                <span className="rounded-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {sponsor.categoryLabel}
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  {sponsor.location}
                </span>
              </div>
              <h3 className="font-display text-lg font-extrabold text-slate-900 dark:text-white mt-1 truncate">
                {sponsor.title}
              </h3>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                <BadgePercent className="h-3.5 w-3.5 shrink-0" />
                {sponsor.discountText}
              </p>
            </div>
          </div>

          {/* Key Metric Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-none bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <span>{t('spn.mClicks')}</span>
                <MousePointerClick className="h-4 w-4" />
              </div>
              <p className="td-fig mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                {uniqueClickCount}
                <span className="text-xs font-bold ml-1 text-slate-500">Unique</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {t('srep.totalClicks', { n: clickCount })} • {lastClickedAt ? t('srep.latestAt', { time: new Date(lastClickedAt).toLocaleTimeString(numLocale) }) : t('srep.filtered24')}
              </p>
            </div>

            <div className="rounded-none bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <span>{t('spn.mImpr')}</span>
                <Users className="h-4 w-4" />
              </div>
              <p className="td-fig mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                {baselineImpressions.toLocaleString(numLocale)}
                <span className="text-xs font-bold ml-1 text-slate-500">{t('spn.times')}</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{t('spn.mImprNote')}</p>
            </div>

            <div className="rounded-none bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                <span>{t('spn.mCtr')}</span>
                <TrendingUp className="h-4 w-4" />
              </div>
              <p className="td-fig mt-2 text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
                {ctrPercentage}%
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{t('spn.mCtrNote')}</p>
            </div>
          </div>

          {/* Insights / Audience Section */}
          <div className="rounded-none bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300" />
              {t('spn.insightsTitle')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-600 dark:text-slate-400">
              <div className="rounded-none bg-slate-50 dark:bg-slate-800 p-2.5 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block mb-0.5">{t('spn.audLabel')}</span>
                {t('spn.audBody')}
              </div>
              <div className="rounded-none bg-slate-50 dark:bg-slate-800 p-2.5 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block mb-0.5">{t('spn.peakLabel')}</span>
                {t('spn.peakBody')}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{t('spn.autoFooter')}</span>
            <span className="font-mono">{t('spn.idBadge', { id: sponsor.id })}</span>
          </div>
        </div>

        {/* Bottom Fast Action Prompt */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800 p-3.5 rounded-none border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-bold text-slate-900 dark:text-white">
            {t('spn.adminTip')}
          </p>
          <button
            type="button"
            onClick={handleOpenLineShare}
            className="shrink-0 rounded-none bg-[#06C755] hover:bg-[#05b34c] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition-colors cursor-pointer"
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
