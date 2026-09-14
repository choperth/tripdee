'use client';

import React from 'react';
import { Phone, MessageCircle, ShieldCheck } from 'lucide-react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';

export const MobileBottomBar: React.FC = () => {
  const { trackCall } = useAnalytics();
  const { t } = useLanguage();

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
      className="fixed bottom-0 left-0 right-0 z-40 block md:hidden bg-card/95 backdrop-blur-md border-t border-rule px-3 pt-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.6rem)] shadow-[0_-4px_24px_rgba(13,92,58,0.12)] transition-transform duration-300"
    >
      <div className="mx-auto flex items-center justify-between gap-2 max-w-lg">
        {/* Quick Call Direct */}
        <a
          href="tel:0812345678"
          onClick={handleQuickCall}
          className="td-btn td-pop flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-accent hover:bg-accent-deep text-white py-3 px-3.5 text-xs font-extrabold shadow-sm active:scale-95 transition-all"
        >
          <Phone className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          <span>โทรหาคนขับตรง</span>
        </a>

        {/* Quick LINE Contact */}
        <a
          href="https://line.me/R/ti/p/@tripdee"
          target="_blank"
          rel="noopener noreferrer"
          className="td-btn td-pop flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#06C755] hover:bg-[#05b34c] text-white py-3 px-3.5 text-xs font-extrabold shadow-sm active:scale-95 transition-all"
        >
          <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          <span>ทัก LINE คนขับ</span>
        </a>
      </div>

      {/* Tiny trust reminder */}
      <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-bold text-ink-2/80 text-center">
        <ShieldCheck className="h-3 w-3 text-leaf" />
        <span>ติดต่อตรงไม่บวกค่านายหน้า • คนขับตรวจสอบเอกสารแล้ว</span>
      </div>
    </aside>
  );
};
