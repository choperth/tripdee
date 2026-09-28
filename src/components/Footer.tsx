'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { OFFICIAL_LINE_URL } from '@/lib/constants';

interface FooterProps {
  onOpenDriverSelfService?: () => void;
  onOpenRegisterModal?: () => void;
  onSelectZone?: (zone: string) => void;
  onSelectTab?: (tab: 'van' | 'suv_driver' | 'car' | 'hotel' | 'corporate') => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenDriverSelfService,
  onOpenRegisterModal,
  onSelectZone,
  onSelectTab,
}) => {
  const { t } = useLanguage();

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectTab = (tab: 'van' | 'suv_driver' | 'car' | 'hotel' | 'corporate') => {
    if (onSelectTab) onSelectTab(tab);
    scrollTo('results');
  };

  return (
    <footer className="w-full bg-white dark:bg-slate-950 border-t border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-slate-200 dark:border-slate-800">
          {/* Col 1: Brand Info */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt={t('brand.logoAlt')}
                width={140}
                height={36}
                className="h-7 w-auto object-contain block dark:hidden"
              />
              <Image
                src="/logo-white.png"
                alt={t('brand.logoAlt')}
                width={140}
                height={36}
                className="h-7 w-auto object-contain hidden dark:block"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">
              แพลตฟอร์มเช่าเหมารถตู้ VIP และยานพาหนะพร้อมคนขับอันดับ 1 ของไทย คอนเนกต์ลูกค้าและเจ้าของรถโดยตรง โปร่งใส ไร้ค่าหัวคิว
            </p>
            <div className="flex items-center gap-2 pt-1 font-mono text-[10px]">
              <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 font-bold border border-emerald-300 dark:border-emerald-700 rounded-none">
                <span className="material-symbols-outlined text-[12px]">verified</span> ดีลตรง 100%
              </span>
              <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 font-bold border border-amber-300 dark:border-amber-700 rounded-none">
                <span className="material-symbols-outlined text-[12px]">security</span> พ.ร.บ. คุ้มครอง
              </span>
            </div>
          </div>

          {/* Col 2: Services */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider">
              {t('foot.vehTitle')}
            </h4>
            <ul className="flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => handleSelectTab('van')}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('foot.veh1')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleSelectTab('van')}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  Toyota Majesty / Alphard รับรอง VIP
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleSelectTab('car')}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  เช่ารถเก๋ง / SUV ขับเองทั่วไทย
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('tripboard')}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  TripBoard กระดานหารถ & แชร์ทริป
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleSelectTab('corporate')}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  บริการเหมารถคาราวานสัมมนา B2B
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Service Zones */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider">
              พื้นที่ให้บริการ
            </h4>
            <ul className="flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectZone) onSelectZone('north');
                    scrollTo('results');
                  }}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  เช่ารถตู้ เชียงใหม่ & ภาคเหนือ
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectZone) onSelectZone('bkk');
                    scrollTo('results');
                  }}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  เช่ารถตู้ กรุงเทพฯ & ปริมณฑล
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectZone) onSelectZone('east');
                    scrollTo('results');
                  }}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  เช่ารถตู้ พัทยา & ชลบุรี - สัตหีบ
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectZone) onSelectZone('south');
                    scrollTo('results');
                  }}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  เช่ารถตู้ ภูเก็ต & พังงา - กระบี่
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectZone) onSelectZone('isan');
                    scrollTo('results');
                  }}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  เช่ารถตู้ เขาใหญ่ - ปากช่อง - โคราช
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Socials */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider">
              ติดต่อและช่วยเหลือ
            </h4>
            <ul className="flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={onOpenRegisterModal}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left font-semibold text-emerald-700 dark:text-emerald-400"
                >
                  สมัครเข้าร่วมเป็นคนขับ (0% Fee)
                </button>
              </li>
              {onOpenDriverSelfService && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenDriverSelfService}
                    className="hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer text-left"
                  >
                    {t('nav.driverManage')}
                  </button>
                </li>
              )}
              <li>
                <a
                  className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                  href={OFFICIAL_LINE_URL}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="material-symbols-outlined text-[15px]">chat</span>
                  <span>LINE Official: @tripdee</span>
                </a>
              </li>
              <li>
                <a
                  className="inline-flex items-center gap-1.5 hover:text-slate-950 dark:hover:text-white transition-colors"
                  href="https://web.facebook.com/profile.php?id=61594476213767"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-blue-600 shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook: TripDee ทริปดี</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom DBD note */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <p>© 2025 TripDee Co., Ltd. สงวนลิขสิทธิ์ทุกประการ. ทะเบียนพาณิชย์อิเล็กทรอนิกส์ DBD Registered.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">นโยบายความเป็นส่วนตัว</span>
            <span>/</span>
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">ข้อกำหนดการให้บริการ</span>
            <span>/</span>
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">มาตรฐานความปลอดภัยคนขับ</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
