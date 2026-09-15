'use client';

import React from 'react';
import { Vehicle, ZONE_RATE_CARDS, formatTHB } from '@/data/mockData';
import { ShieldCheck, Star, Users, Phone, MessageCircle, MapPin, ArrowRight, Award, FileCheck2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import type { DictKey } from '@/i18n/dictionaries';

interface VehicleCardProps {
  vehicle: Vehicle;
  onSelectDetail: (vehicle: Vehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onSelectDetail }) => {
  const { t, locale } = useLanguage();
  const { trackCall } = useAnalytics();
  const [copiedWechat, setCopiedWechat] = React.useState(false);

  const handleWechatClick = (e: React.MouseEvent) => {
    if (vehicle.driverWechat) {
      e.preventDefault();
      navigator.clipboard.writeText(vehicle.driverWechat);
      setCopiedWechat(true);
      setTimeout(() => setCopiedWechat(false), 2000);
    }
  };

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
    <article className="group flex flex-col overflow-hidden rounded-card bg-card border border-rule transition-all duration-200 hover:border-accent/40 hover:shadow-lift">
      {/* Vehicle Photo with 16:10 ratio */}
      <button
        onClick={() => onSelectDetail(vehicle)}
        className="relative block aspect-[16/10] w-full overflow-hidden text-left active:opacity-95 focus:outline-none"
        aria-label={t('vehicle.detailAria', { title: vehicle.title })}
      >
        <img
          src={vehicle.images[0]}
          alt={vehicle.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Subtle overlay vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Top Floating Badges */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 flex-wrap max-w-[80%]">
          <span className="inline-flex items-center gap-1 rounded-pill bg-black/70 backdrop-blur-xs px-2.5 py-1 text-xs font-bold text-white shadow-xs">
            <Users className="h-3 w-3 text-accent" aria-hidden="true" strokeWidth={2.5} />
            <span>{vehicle.seats} {t('vehicle.seats', { n: vehicle.seats }).replace(`${vehicle.seats} `, '')}</span>
          </span>
          {vehicle.plateNumber && (
            <span className="inline-flex items-center gap-1 rounded-pill bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[11px] font-mono font-semibold text-white/90 shadow-xs border border-white/20">
              {vehicle.plateNumber}
            </span>
          )}
          {vehicle.isAvailable === false && (
            <span className="inline-flex items-center gap-1 rounded-pill bg-rose-600/90 backdrop-blur-xs px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
              ⏸️ คิวเต็มชั่วคราว
            </span>
          )}
        </div>

        {vehicle.isVerified && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-pill bg-card/95 backdrop-blur-xs px-2.5 py-1 text-xs font-extrabold text-leaf shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
            <span>{t('hero.verifiedSticker')}</span>
          </span>
        )}

        {/* Bottom image overlay: Starting price sneak peek */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-baseline justify-between text-white drop-shadow-sm">
          <span className="text-xs font-semibold text-white/90">
            {vehicle.driverNickname} • {vehicle.location}
          </span>
          <span className="text-xs font-bold text-white/95 bg-black/40 px-2 py-0.5 rounded-pill backdrop-blur-xs">
            {t('vehicle.priceNote1')} {formatTHB(vehicle.zoneRates.city)}{t('vehicle.perDay')}
          </span>
        </div>
      </button>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Driver & Rating Row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-extrabold text-accent border border-accent/20">
              {vehicle.driverNickname.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-ink">
                {vehicle.driverNickname}
              </p>
              <p className="flex items-center gap-1 text-xs font-medium text-ink-2 truncate">
                <MapPin className="h-3 w-3 shrink-0 text-accent" aria-hidden="true" />
                <span>{vehicle.location}</span>
              </p>
            </div>
          </div>

          <span className="td-fig inline-flex shrink-0 items-center gap-1 rounded-pill bg-sun-soft px-2.5 py-1 text-xs font-bold text-sun-ink border border-sun/20">
            <Star className="h-3.5 w-3.5 fill-sun text-sun" aria-hidden="true" />
            <span>{vehicle.rating}</span>
            <span className="text-ink-2 font-normal">({vehicle.reviewCount})</span>
          </span>
        </div>

        {/* Vehicle Title */}
        <h3 className="mb-2 line-clamp-2 font-display text-base font-extrabold leading-snug text-ink group-hover:text-accent transition-colors">
          {vehicle.title}
        </h3>

        {/* Trust Badges Bar (Legal & Safety Verification + Language badges) */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {/* Plate Type Badge */}
          {vehicle.plateType === 'yellow' ? (
            <span
              className="inline-flex items-center gap-1 rounded-pill bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold"
              title="รถตู้ป้ายเหลือง 30 (ขนส่งสาธารณะ) เหมาะสำหรับหน่วยงานราชการ บริษัท สัมมนา และทั่วไป"
            >
              <Award className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              🟡 ป้ายเหลือง 30
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-pill bg-sky-500/15 text-sky-800 dark:text-sky-200 border border-sky-500/30 px-2.5 py-0.5 text-[11px] font-bold"
              title="รถตู้ป้ายฟ้า (ส่วนบุคคล) เหมาะสำหรับท่องเที่ยวทั่วไป ครอบครัว หรือองค์กรที่ไม่ติดเงื่อนไขใบประกอบการ"
            >
              <Award className="h-3 w-3 text-sky-600 dark:text-sky-400" />
              🔵 ป้ายฟ้า (ส่วนบุคคล)
            </span>
          )}

          {/* Tax Invoice Badge */}
          {vehicle.canIssueTaxInvoice && (
            <span
              className="inline-flex items-center gap-1 rounded-pill bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold"
              title="สามารถออกใบเสร็จรับเงิน / ใบกำกับภาษีเต็มรูปแบบ / หักภาษี ณ ที่จ่าย 3% ได้"
            >
              <FileCheck2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              🏢 ใบกำกับภาษี
            </span>
          )}

          <span className="inline-flex items-center gap-1 rounded-pill bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 text-[11px] font-medium border border-rule">
            <ShieldCheck className="h-3 w-3 text-leaf" />
            {t('vehicle.insured')}
          </span>

          {vehicle.languages && vehicle.languages.length > 1 && (
            <div className="flex items-center gap-1 ml-auto">
              {vehicle.languages.includes('en') && (
                <span className="rounded-pill bg-paper px-2 py-0.5 text-[10px] font-bold text-ink-2 border border-rule" title={t('vehicle.langEn')}>
                  🇬🇧 EN
                </span>
              )}
              {vehicle.languages.includes('zh') && (
                <span className="rounded-pill bg-paper px-2 py-0.5 text-[10px] font-bold text-ink-2 border border-rule" title={t('vehicle.langZh')}>
                  🇨🇳 中文
                </span>
              )}
              {vehicle.languages.includes('ko') && (
                <span className="rounded-pill bg-paper px-2 py-0.5 text-[10px] font-bold text-ink-2 border border-rule" title={t('vehicle.langKo')}>
                  🇰🇷 한국어
                </span>
              )}
            </div>
          )}
        </div>

        {/* Amenities Chips */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {vehicle.amenities.slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-pill bg-paper px-2.5 py-0.5 text-[11px] font-semibold text-ink-2 border border-rule"
            >
              {item}
            </span>
          ))}
        </div>

        {/* Transparent Rates Grid */}
        <div className="mt-auto border-t border-rule pt-3.5">
          <div className="mb-2.5 flex items-end justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-2 block">
                {t('vehicle.priceNote1')}
              </span>
              <p className="td-fig text-2xl font-extrabold text-ink leading-none mt-0.5">
                {formatTHB(vehicle.zoneRates.city)}
                <span className="text-xs font-semibold text-ink-2"> {t('vehicle.perDay')}</span>
              </p>
            </div>
            <p className="text-right text-[11px] font-medium text-ink-2 leading-tight">
              {t('vehicle.priceNote1')}<br />
              <span className="text-accent font-bold">{t('vehicle.priceNote2')}</span>
            </p>
          </div>

          {/* Mini Zone Rate Grid */}
          <div className="mb-3.5 grid grid-cols-2 gap-1.5">
            {ZONE_RATE_CARDS.map((zone) => (
              <span
                key={zone.id}
                className="td-fig inline-flex items-baseline justify-between gap-1 rounded-input bg-paper px-2.5 py-1 text-[11px] border border-rule/60"
              >
                <span className="font-semibold text-ink-2 truncate">{t(`zone.${zone.id}.short` as DictKey)}</span>
                <span className="font-extrabold text-ink shrink-0">{formatTHB(vehicle.zoneRates[zone.id])}</span>
              </span>
            ))}
          </div>

          {/* Direct Contact Dual Action Buttons (Smart Dynamic based on locale) */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${vehicle.driverPhone}`}
              onClick={handleCallClick}
              data-analytics-call={vehicle.id}
              className="td-btn inline-flex items-center justify-center gap-1.5 rounded-input bg-accent hover:bg-accent-deep px-3 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-xs transition-all active:scale-[0.98]"
            >
              <Phone className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
              <span>{t('vehicle.callNow')}</span>
            </a>

            {locale === 'zh' && vehicle.driverWechat ? (
              <button
                type="button"
                onClick={handleWechatClick}
                title={`WeChat ID: ${vehicle.driverWechat}`}
                className="td-btn inline-flex items-center justify-center gap-1.5 rounded-input bg-[#07C160] hover:bg-[#06ad56] px-2 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-xs transition-all active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
                <span className="truncate">{copiedWechat ? t('vehicle.wechatCopied') : t('vehicle.wechat')}</span>
              </button>
            ) : locale === 'en' && vehicle.driverWhatsapp ? (
              <a
                href={vehicle.driverWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="td-btn inline-flex items-center justify-center gap-1.5 rounded-input bg-[#25D366] hover:bg-[#20bd5a] px-2 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-xs transition-all active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
                <span className="truncate">{t('vehicle.whatsapp')}</span>
              </a>
            ) : (
              <a
                href={vehicle.driverLine}
                target="_blank"
                rel="noopener noreferrer"
                className="td-btn inline-flex items-center justify-center gap-1.5 rounded-input bg-[#06C755] hover:bg-[#05b34c] px-3 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-xs transition-all active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
                <span>{t('vehicle.lineChat')}</span>
              </a>
            )}
          </div>

          {/* Details & Reviews Link */}
          <button
            onClick={() => onSelectDetail(vehicle)}
            className="td-btn mt-2.5 inline-flex w-full items-center justify-center gap-1 py-1 text-xs font-bold text-ink-2 hover:text-accent transition-colors"
          >
            <span>{t('vehicle.detailsReviews')}</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
};
