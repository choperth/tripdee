'use client';

import React from 'react';
import { Phone, MessageCircle, ShieldCheck } from 'lucide-react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';

export const MobileBottomBar: React.FC = () => {
  const { trackCall } = useAnalytics();
  const { t, locale } = useLanguage();

  const handleQuickCall = () => {
    trackCall({
      targetType: 'vehicle_card',
      targetId: 'mobile_bottom_bar',
      targetTitle: 'Mobile Quick Call Direct Fleet',
      phoneNumber: '081-234-5678',
    });
  };

  return (
    <aside
      aria-label="แถบติดต่อด่วนสำหรับมือถือ"
      className="fixed bottom-0 left-0 right-0 z-40 block md:hidden bg-card/95 backdrop-blur-md border-t border-rule px-3 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] shadow-lg transition-transform duration-200"
    >
      <div className="mx-auto flex items-center justify-between gap-2 max-w-lg">
        {/* Quick Call Direct */}
        <a
          href="tel:0812345678"
          onClick={handleQuickCall}
          className="td-btn flex-1 inline-flex items-center justify-center gap-1.5 rounded-input bg-accent hover:bg-accent-deep text-white py-2.5 px-3 text-xs font-bold shadow-xs active:scale-[0.98] transition-all"
        >
          <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
          <span>{t('vehicle.callNow')}</span>
        </a>

        {/* Quick Chat: WhatsApp for EN, LINE for TH/ZH */}
        {locale === 'en' ? (
          <a
            href="https://wa.me/66812345678"
            target="_blank"
            rel="noopener noreferrer"
            className="td-btn flex-1 inline-flex items-center justify-center gap-1.5 rounded-input bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 px-3 text-xs font-bold shadow-xs active:scale-[0.98] transition-all"
          >
            <MessageCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
            <span>{t('vehicle.whatsapp')}</span>
          </a>
        ) : (
          <a
            href="https://line.me/R/ti/p/@tripdee"
            target="_blank"
            rel="noopener noreferrer"
            className="td-btn flex-1 inline-flex items-center justify-center gap-1.5 rounded-input bg-[#06C755] hover:bg-[#05b34c] text-white py-2.5 px-3 text-xs font-bold shadow-xs active:scale-[0.98] transition-all"
          >
            <MessageCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
            <span>{t('vehicle.lineChat')}</span>
          </a>
        )}
      </div>

      {/* Trust reassurance */}
      <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-semibold text-ink-2 text-center">
        <ShieldCheck className="h-3 w-3 text-leaf shrink-0" />
        <span>{t('vehicle.noMarkup')} • {t('hero.verifiedSticker')}</span>
      </div>
    </aside>
  );
};
