'use client';

import React from 'react';
import { Phone, MessageCircle, ShieldCheck, UserCheck, ChevronRight } from 'lucide-react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';
import type { Vehicle } from '@/data/mockData';
import { maskPhoneNumber, getPublicDriverName } from '@/lib/privacy';

interface MobileBottomBarProps {
  activeVehicle?: Vehicle | null;
  onOpenDetail?: (vehicle: Vehicle) => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  activeVehicle,
  onOpenDetail,
}) => {
  const { trackCall } = useAnalytics();
  const { t, locale } = useLanguage();

  const handleCall = () => {
    if (activeVehicle) {
      trackCall({
        targetType: 'vehicle_detail',
        targetId: activeVehicle.id,
        targetTitle: activeVehicle.title,
        phoneNumber: activeVehicle.driverPhone,
        driverName: activeVehicle.driverNickname,
      });
    } else {
      trackCall({
        targetType: 'admin_fleet',
        targetId: 'mobile_bottom_bar_coordinator',
        targetTitle: 'Mobile Coordinator Hotline',
        phoneNumber: '053-000-000',
      });
    }
  };

  const callTel = activeVehicle ? `tel:${activeVehicle.driverPhone}` : 'tel:053000000';
  const driverDisplayName = activeVehicle
    ? getPublicDriverName(activeVehicle.driverName, activeVehicle.driverNickname)
    : null;

  // Driver chat URLs
  const lineUrl = activeVehicle?.driverLine
    ? activeVehicle.driverLine
    : 'https://line.me/R/ti/p/@tripdee';

  const whatsappUrl = activeVehicle?.driverWhatsapp
    ? activeVehicle.driverWhatsapp
    : activeVehicle?.driverPhone
      ? `https://wa.me/66${activeVehicle.driverPhone.replace(/^0/, '').replace(/\D/g, '')}`
      : 'https://wa.me/6653000000';

  return (
    <aside
      aria-label="แถบติดต่อด่วนสำหรับมือถือ"
      className="fixed bottom-0 left-0 right-0 z-40 block md:hidden bg-card/95 backdrop-blur-md border-t border-rule px-3 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] shadow-lg transition-transform duration-200"
    >
      {/* Active Vehicle Contextual Banner (if active vehicle selected) */}
      {activeVehicle && (
        <div
          onClick={() => onOpenDetail?.(activeVehicle)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenDetail?.(activeVehicle);
            }
          }}
          className="mb-1.5 flex items-center justify-between rounded-lg bg-paper-2 px-2.5 py-1 text-[11px] font-bold text-ink cursor-pointer hover:bg-rule/50 transition-colors"
        >
          <div className="flex items-center gap-1.5 truncate">
            <UserCheck className="h-3.5 w-3.5 text-leaf shrink-0" />
            <span className="truncate">
              คนขับ: <strong className="text-accent">{driverDisplayName}</strong> ({activeVehicle.title})
            </span>
          </div>
          <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-accent shrink-0 ml-1">
            <span>ดูข้อมูลคันนี้</span>
            <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      )}

      <div className="mx-auto flex items-center justify-between gap-2 max-w-lg">
        {/* Dynamic Call Button */}
        <a
          href={callTel}
          onClick={handleCall}
          className="td-btn flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-input bg-accent hover:bg-accent-deep text-white py-2.5 px-3 text-xs font-bold shadow-xs active:scale-[0.98] transition-all"
        >
          <Phone className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          <span className="truncate">
            {activeVehicle
              ? `โทรหาคุณ${activeVehicle.driverNickname || 'คนขับ'}`
              : 'โทรปรึกษาทีมงาน'}
          </span>
        </a>

        {/* Dynamic Chat Button: WhatsApp for EN, LINE for TH/ZH */}
        {locale === 'en' ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="td-btn flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-input bg-[#047835] hover:bg-[#03602a] text-white py-2.5 px-3 text-xs font-bold shadow-xs active:scale-[0.98] transition-all"
          >
            <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            <span className="truncate">
              {activeVehicle ? 'WhatsApp Driver' : 'WhatsApp Support'}
            </span>
          </a>
        ) : (
          <a
            href={lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="td-btn flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-input bg-[#047835] hover:bg-[#03602a] text-white py-2.5 px-3 text-xs font-bold shadow-xs active:scale-[0.98] transition-all"
          >
            <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            <span className="truncate">
              {activeVehicle ? 'ทัก LINE คนขับ' : 'ทัก LINE แอดมิน'}
            </span>
          </a>
        )}
      </div>

      {/* Trust reassurance */}
      <div className="mt-1.5 flex items-center justify-center gap-1 text-[10px] font-semibold text-ink-2 text-center">
        <ShieldCheck className="h-3.5 w-3.5 text-leaf shrink-0" />
        <span>
          {activeVehicle
            ? `${t('vehicle.noMarkup')} • ตรวจใบขับขี่และประวัติคนขับแล้ว`
            : 'ทีมงานช่วยแนะนำรถตู้ VIP & คัดกรองคนขับตรง ไม่มีบวกเพิ่ม'}
        </span>
      </div>
    </aside>
  );
};
