'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { OFFICIAL_LINE_URL } from '@/lib/constants';
import { useLanguage } from '@/context/LanguageContext';
import type { DictKey, Locale } from '@/i18n/dictionaries';

type PartnerCategory = 'all' | 'hotel' | 'elephant' | 'vespa' | 'cooking';

interface Partner {
  id: string;
  category: Exclude<PartnerCategory, 'all'>;
  logo: string;
  logoAlt: string;
  logoBg: string;
  title: string;
  desc: string;
  perkIcon: string;
  perk: string;
  cta: string;
  href: string;
}

const CATEGORY_LABEL_KEY: Record<PartnerCategory, DictKey> = {
  all: 'tp.catAll',
  hotel: 'tp.catHotel',
  elephant: 'tp.catElephant',
  vespa: 'tp.catVespa',
  cooking: 'tp.catCooking',
};

const CATEGORIES: { id: PartnerCategory; icon: string }[] = [
  { id: 'all', icon: 'apps' },
  { id: 'hotel', icon: 'hotel' },
  { id: 'elephant', icon: 'pets' },
  { id: 'vespa', icon: 'moped' },
  { id: 'cooking', icon: 'restaurant' },
];

const PARTNERS: Partner[] = [
  {
    id: 'connect',
    category: 'hotel',
    logo: '/images/connect.jpg',
    logoAlt: 'The Connect Chiang Mai',
    logoBg: '#ffffff',
    title: 'The Connect Chiang Mai',
    desc: 'ห้องพักสไตล์โมเดิร์นลอฟท์ เงียบสงบ ใกล้สนามบินเชียงใหม่และเซ็นทรัลแอร์พอร์ต พร้อมคาเฟ่ Coffee Connect และที่จอดรถสะดวกสบาย',
    perkIcon: 'local_cafe',
    perk: 'คาเฟ่ Coffee Connect ในที่พัก',
    cta: 'ดูข้อมูลที่พัก (Facebook)',
    href: 'https://www.facebook.com/Theconnectchiangmai',
  },
  {
    id: 'baan-thip',
    category: 'hotel',
    logo: '/images/baan-thip-villa.jpg',
    logoAlt: 'บ้านทิพย์ พูลวิลล่าริมน้ำ (Baan Thip Villa)',
    logoBg: '#ffffff',
    title: 'บ้านทิพย์ พูลวิลล่าริมน้ำ',
    desc: 'วิลล่าพักผ่อนริมน้ำ 4 ห้องนอน สระว่ายน้ำส่วนตัวและสวนสีเขียวขนาดใหญ่ ออกแบบโดยสถาปนิก เหมาะสำหรับครอบครัวและกลุ่มเพื่อน',
    perkIcon: 'pool',
    perk: 'สระว่ายน้ำส่วนตัวริมน้ำปิง',
    cta: 'ดูข้อมูลที่พัก (Airbnb)',
    href: 'https://th.airbnb.com/rooms/32648518',
  },
  {
    id: 'baan-sri-dha',
    category: 'hotel',
    logo: '/images/baan-sri-dha.jpg',
    logoAlt: 'บ้านศรีธา บ้านพักไม้ทรงเสน่ห์ (Baan Sri Dha)',
    logoBg: '#ffffff',
    title: 'บ้านศรีธา บ้านพักไม้ทรงเสน่ห์',
    desc: 'บ้านกึ่งไม้ทั้งหลัง 5 ห้องนอน รองรับ 9 คน ใกล้ประตูเชียงใหม่และถนนคนเดินวัวลาย พร้อมอาหารเช้าโฮมเมดและบริการรถรับส่งฟรี',
    perkIcon: 'free_breakfast',
    perk: 'ฟรีอาหารเช้า & รถรับส่งสนามบิน',
    cta: 'ดูข้อมูลที่พัก (Airbnb)',
    href: 'https://th.airbnb.com/rooms/9056914',
  },
  {
    id: 'lanna-apartment',
    category: 'hotel',
    logo: '/images/lanna-riverside-home.jpg',
    logoAlt: 'อพาร์ทเมนท์ล้านนา กว้างขวางในเมือง (Lanna Apartment)',
    logoBg: '#ffffff',
    title: 'อพาร์ทเมนท์ล้านนา กลางเมือง',
    desc: 'ชั้น 1 ของอาคารส่วนตัวทั้งชั้น ห้องนอน 5 ห้อง ห้องน้ำในตัวทุกห้อง เครื่องปรับอากาศทุกห้อง และลานกลางแจ้ง รองรับได้ถึง 10 คน',
    perkIcon: 'apartment',
    perk: 'ฟรีรถรับส่ง + Wi-Fi 287 Mbps',
    cta: 'ดูข้อมูลที่พัก (Airbnb)',
    href: 'https://th.airbnb.com/rooms/957661325183385971',
  },
  {
    id: 'baan-sri-dha-yoga',
    category: 'hotel',
    logo: '/images/baan-sri-dha-yoga.jpg',
    logoAlt: 'บ้านศรีธา ล้านนาและโยคะ (Baan Sri Dha Lanna & Yoga)',
    logoBg: '#ffffff',
    title: 'บ้านศรีธา ล้านนา & โยคะ',
    desc: 'บ้านเดี่ยวไม้สักสไตล์ล้านนา 3 ห้องนอน 3 ห้องน้ำ รองรับ 5 คน พื้นที่สีเขียวและลานโยคะส่วนตัว ใกล้ตลาดประตูเชียงใหม่ พร้อมอาหารเช้าโฮมเมด',
    perkIcon: 'spa',
    perk: 'ลานโยคะ & อาหารเช้าปรุงสด',
    cta: 'ดูข้อมูลที่พัก (Airbnb)',
    href: 'https://th.airbnb.com/rooms/17126437',
  },
  {
    id: 'elephant',
    category: 'elephant',
    logo: '/images/rantong-sanctuary.jpg',
    logoAlt: 'Ran-Tong Sanctuary',
    logoBg: '#1e3d2d',
    title: 'Ran-Tong Sanctuary',
    desc: 'สัมผัสความน่ารักของช้างอย่างมีจริยธรรม No Riding ไม่ขี่ ไม่ล่ามโซ่ ป้อนอาหาร ทำสมุนไพร และอาบน้ำช้างในลำธารธรรมชาติ มีรถตู้ของกิจกรรมบริการรับ-ส่งฟรีจากโรงแรมในเมืองเชียงใหม่',
    perkIcon: 'redeem',
    perk: 'สิทธิพิเศษ TripDee: รับส่วนลด 5–10% ทันที',
    cta: '🎁 รับส่วนลดพิเศษ 10% (มีรถรับส่งฟรี)',
    href: 'https://www.rantongelephantsanctuary.com/',
  },
  {
    id: 'vespa',
    category: 'vespa',
    logo: '/images/vespa.jpg',
    logoAlt: 'Vespa Adventures Chiang Mai',
    logoBg: '#ffffff',
    title: 'Vespa Adventures Chiang Mai',
    desc: 'นั่งเวสป้าคลาสสิกเที่ยวเชียงใหม่ 5 เส้นทาง City Highlights, Foodie (MICHELIN), วิถีชนบท และชมพระบิณฑบาตยามเช้า มีรถตู้ของกิจกรรมบริการรับ-ส่งฟรีจากโรงแรมในเมืองเชียงใหม่',
    perkIcon: 'redeem',
    perk: 'สิทธิพิเศษ TripDee: รับส่วนลด 5% ทันที',
    cta: '🎁 รับส่วนลดพิเศษ 5% (มีรถรับส่งฟรี)',
    href: 'https://vespaadventures.com/destination/thailand',
  },
  {
    id: 'cooking',
    category: 'cooking',
    logo: '/images/sukjai-cooking-school.jpg',
    logoAlt: 'Sukjai Cooking School',
    logoBg: '#2f6cb0',
    title: 'Sukjai Cooking School',
    desc: 'คอร์สเรียนทำอาหารไทยสไตล์โฮมเมด บรรยากาศอบอุ่นในสวนชนบท พร้อมพาเดินตลาดสดเลือกซื้อวัตถุดิบ มีรถตู้ของกิจกรรมบริการรับ-ส่งฟรีจากโรงแรมในเมืองเชียงใหม่',
    perkIcon: 'redeem',
    perk: 'สิทธิพิเศษ TripDee: รับส่วนลด 5–10% ทันที',
    cta: '🎁 รับส่วนลดพิเศษ 10% (มีรถรับส่งฟรี)',
    href: 'https://www.facebook.com/profile.php?id=61558094176601',
  },
];

type PartnerText = Partial<Pick<Partner, 'title' | 'desc' | 'perk' | 'cta' | 'logoAlt'>>;

/** EN/ZH overrides for partner cards (Thai text lives in PARTNERS above). */
const PARTNER_TEXT: Record<string, Partial<Record<Locale, PartnerText>>> = {
  connect: {
    en: {
      desc: 'Modern loft-style rooms, quiet, near Chiang Mai airport and Central Airport with Coffee Connect cafe and easy parking',
      perk: 'On-site Coffee Connect cafe',
      cta: 'View stay info (Facebook)',
    },
    zh: {
      desc: '现代 Loft 风格客房，安静舒适，近清迈机场与中央机场商圈，设 Coffee Connect 咖啡馆与便利停车位',
      perk: '酒店内 Coffee Connect 咖啡馆',
      cta: '查看住宿信息（Facebook）',
    },
  },
  'baan-thip': {
    en: {
      logoAlt: 'Baan Thip Riverside Pool Villa (Baan Thip Villa)',
      title: 'Baan Thip Riverside Pool Villa',
      desc: 'Riverside retreat villa with 4 bedrooms, private pool and a large green garden designed by an architect — perfect for families and friends',
      perk: 'Private pool on the Ping riverside',
      cta: 'View stay info (Airbnb)',
    },
    zh: {
      logoAlt: '滨河泳池别墅（Baan Thip Villa）',
      title: '滨河泳池别墅（Baan Thip）',
      desc: '河畔度假别墅 4 卧，配私人泳池与大花园，建筑师设计，适合家庭与好友',
      perk: '湄滨河畔私人泳池',
      cta: '查看住宿信息（Airbnb）',
    },
  },
  'baan-sri-dha': {
    en: {
      logoAlt: 'Baan Sri Dha charming wooden house (Baan Sri Dha)',
      title: 'Baan Sri Dha - Charming Wooden House',
      desc: 'Whole half-wooden house with 5 bedrooms for 9 guests, near Chiang Mai Gate and Wualai walking street, with homemade breakfast and free shuttle',
      perk: 'Free breakfast & airport shuttle',
      cta: 'View stay info (Airbnb)',
    },
    zh: {
      logoAlt: '魅力木屋（Baan Sri Dha）',
      title: 'Baan Sri Dha - 魅力木屋',
      desc: '整栋半木结构 5 卧可住 9 人，近清迈门与瓦莱步行街，含手工早餐与免费接送',
      perk: '免费早餐 & 机场接送',
      cta: '查看住宿信息（Airbnb）',
    },
  },
  'lanna-apartment': {
    en: {
      logoAlt: 'Spacious Lanna apartment in the city (Lanna Apartment)',
      title: 'Lanna Apartment - Spacious City Centre Stay',
      desc: 'Entire private ground floor with 5 en-suite bedrooms, air-conditioning throughout, and an outdoor patio for up to 10 guests',
      perk: 'Free shuttle + 287 Mbps Wi-Fi',
      cta: 'View stay info (Airbnb)',
    },
    zh: {
      logoAlt: '市中心宽敞公寓（Lanna Apartment）',
      title: 'Lanna 公寓 - 市中心宽敞住宿',
      desc: '独享首层全层，5 间套房卧室、全屋空调与户外露台，可住 10 人',
      perk: '免费接送 + 287Mbps Wi-Fi',
      cta: '查看住宿信息（Airbnb）',
    },
  },
  'baan-sri-dha-yoga': {
    en: {
      logoAlt: 'Baan Sri Dha Lanna and Yoga house (Baan Sri Dha Lanna & Yoga)',
      title: 'Baan Sri Dha Lanna & Yoga',
      desc: 'Standalone Lanna-style teak house, 3 bedrooms / 3 bathrooms for 5 guests, with green space and a private yoga patio near Chiang Mai Gate, homemade breakfast',
      perk: 'Yoga deck & freshly cooked breakfast',
      cta: 'View stay info (Airbnb)',
    },
    zh: {
      logoAlt: '兰纳瑜伽屋（Baan Sri Dha Lanna & Yoga）',
      title: 'Baan Sri Dha 兰纳 & 瑜伽',
      desc: '独栋兰纳风格柚木屋 3 卧 3 卫可住 5 人，绿荫花园与私人瑜伽露台，近清迈门，含手工早餐',
      perk: '瑜伽露台 & 现做早餐',
      cta: '查看住宿信息（Airbnb）',
    },
  },
  elephant: {
    en: {
      desc: 'Ethical elephant care with No Riding & No Chains. Free round-trip hotel transfer by activity van included.',
      perk: 'TripDee Privilege: Get 5–10% Off instantly',
      cta: '🎁 Claim 10% Discount (Free Hotel Transfer)',
    },
    zh: {
      desc: '公益大象保护体验：不骑乘、不锁链。含清迈市区酒店专车免费往返接送。',
      perk: 'TripDee 特权：立享 5–10% 专属折扣',
      cta: '🎁 领取 10% 特惠折扣（含免费接送）',
    },
  },
  vespa: {
    en: {
      desc: 'Tour Chiang Mai by classic Vespa. Free round-trip hotel transfer by activity van included.',
      perk: 'TripDee Privilege: Get 5% Off instantly',
      cta: '🎁 Claim 5% Discount (Free Hotel Transfer)',
    },
    zh: {
      desc: '乘坐经典伟士牌游览清迈精华路线。含清迈市区酒店专车免费往返接送。',
      perk: 'TripDee 特权：立享 5% 专属折扣',
      cta: '🎁 领取 5% 特惠折扣（含免费接送）',
    },
  },
  cooking: {
    en: {
      desc: 'Home-style Thai cooking class in a country garden. Free round-trip hotel transfer by activity van included.',
      perk: 'TripDee Privilege: Get 5–10% Off instantly',
      cta: '🎁 Claim 10% Discount (Free Hotel Transfer)',
    },
    zh: {
      desc: '温馨乡村花园家常泰料课。含清迈市区酒店专车免费往返接送。',
      perk: 'TripDee 特权：立享 5–10% 专属折扣',
      cta: '🎁 领取 10% 特惠折扣（含免费接送）',
    },
  },
};

const PARTNER_PROMO: Record<string, { percent: number; code: string }> = {
  vespa: { percent: 5, code: 'TRIPDEE5' },
};
const DEFAULT_PROMO = { percent: 10, code: 'TRIPDEE10' };

export const TrustedPartnersSection: React.FC = () => {
  const { t, locale } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<PartnerCategory>('all');
  const [selectedPromoPartner, setSelectedPromoPartner] = useState<Partner | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const promo = selectedPromoPartner
    ? PARTNER_PROMO[selectedPromoPartner.id] ?? DEFAULT_PROMO
    : DEFAULT_PROMO;

  const baseList = activeCategory === 'all' ? PARTNERS : PARTNERS.filter((p) => p.category === activeCategory);
  const visible = baseList.map((p) => ({ ...p, ...PARTNER_TEXT[p.id]?.[locale] }));

  const isActivityPartner = (id: string) => ['elephant', 'vespa', 'cooking'].includes(id);

  const handleCopyCode = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };
  return (
    <section id="partners" aria-label={t('tp.aria')} className="max-w-7xl mx-auto px-4 sm:px-6 my-5 sm:my-7 scroll-mt-20">
      {/* Header matching Stitch Redesign */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-3 border-b border-slate-300 dark:border-slate-800 mb-4 sm:mb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mr-1">
              <span className="material-symbols-outlined text-[15px]">stars</span>
              <span>Trusted Community Partners</span>
            </div>
            {/* Category filter pills inline */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs" role="tablist" aria-label={t('tp.filterAria')}>
              {CATEGORIES.map((cat) => {
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`inline-flex items-center gap-1 px-3 py-1 text-xs transition-colors rounded-none cursor-pointer border ${
                      active
                        ? 'bg-slate-950 text-white border-slate-950 font-bold dark:bg-white dark:text-slate-950 dark:border-white'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-500 font-medium'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>
                    <span>{t(CATEGORY_LABEL_KEY[cat.id])}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
            {t('tp.title')}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('tp.subtitle')}
          </p>
        </div>
        <div>
          <a
            className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 border border-emerald-300 dark:border-emerald-700 transition-colors rounded-none cursor-pointer whitespace-nowrap"
            href={OFFICIAL_LINE_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="material-symbols-outlined text-[15px]">add_business</span>
            <span>{t('tp.joinCta')}</span>
          </a>
        </div>
      </div>

      {/* Mobile Swipe Hint */}
      <div className="flex sm:hidden items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 px-0.5">
        <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
          {t('tp.recCount', { n: visible.length })}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
          <span className="material-symbols-outlined text-[14px]">swipe</span>
          <span>{t('tp.swipeHint')}</span>
        </span>
      </div>

      {/* Partner Cards: Horizontal Swipe Rail on Mobile / 4-Col Grid on Desktop */}
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 overflow-x-auto sm:overflow-visible pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory scrollbar-none items-stretch">
        {visible.map((partner) => (
          <div
            key={partner.title}
            className="w-[82vw] max-w-[290px] sm:w-auto shrink-0 sm:shrink snap-start bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-4 flex flex-col justify-between hover:border-slate-500 transition-colors rounded-none"
          >
            <div className="flex flex-col flex-1">
              {/* Brand Logo Container */}
              <div className="h-24 flex items-center justify-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                {partner.id === 'connect' ? (
                  <div className="h-20 w-28 flex items-center justify-center bg-white p-1">
                    <Image
                      src={partner.logo}
                      alt={partner.logoAlt}
                      width={112}
                      height={80}
                      className="h-20 w-28 object-contain"
                      priority
                    />
                  </div>
                ) : partner.id === 'vespa' ? (
                  <div className="h-20 w-20 flex items-center justify-center bg-white rounded-full p-0.5">
                    <Image
                      src={partner.logo}
                      alt={partner.logoAlt}
                      width={80}
                      height={80}
                      className="h-20 w-20 object-contain rounded-full"
                      priority
                    />
                  </div>
                ) : partner.id === 'elephant' || partner.id === 'cooking' ? (
                  <div className="h-20 w-20 flex items-center justify-center">
                    <Image
                      src={partner.logo}
                      alt={partner.logoAlt}
                      width={80}
                      height={80}
                      className="h-20 w-20 object-contain rounded-none shadow-sm"
                      priority
                    />
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <Image
                      src={partner.logo}
                      alt={partner.logoAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover rounded-none"
                    />
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-1.5">{partner.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-light line-clamp-3 mb-3">
                {partner.desc}
              </p>

              {/* Benefit / Perk Tag */}
              <div className="mt-auto text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-1 font-medium flex items-center gap-1.5 rounded-none">
                <span className="material-symbols-outlined text-[13px]">{partner.perkIcon}</span>
                <span>{partner.perk}</span>
              </div>
            </div>

            {/* Card CTA Footer */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              {isActivityPartner(partner.id) ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPromoPartner(partner);
                    setCopiedCode(false);
                  }}
                  className="w-full text-xs font-bold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 py-2 px-2.5 flex items-center justify-between transition-colors cursor-pointer text-left"
                >
                  <span className="line-clamp-1">{partner.cta}</span>
                  <span className="material-symbols-outlined text-[15px] shrink-0">redeem</span>
                </button>
              ) : (
                <a
                  className="text-xs font-bold text-slate-900 dark:text-slate-200 hover:text-amber-600 flex items-center justify-between transition-colors"
                  href={partner.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span>{partner.cta}</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Promotion Discount Code Modal */}
      {selectedPromoPartner && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedPromoPartner(null)}
          role="presentation"
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 w-full max-w-md p-5 sm:p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="promo-partner-title"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-400 text-slate-950 font-black">
                  <span className="material-symbols-outlined text-[18px]">redeem</span>
                </span>
                <h3 id="promo-partner-title" className="text-sm font-black text-slate-950 dark:text-white">
                  สิทธิพิเศษส่วนลด TripDee {promo.percent}%
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPromoPartner(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 cursor-pointer"
                aria-label="ปิด"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="py-4 space-y-3.5">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">พาร์ตเนอร์:</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{selectedPromoPartner.title}</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1">
                  🚐 บริการพิเศษ: มีรถตู้ของกิจกรรมบริการรับ-ส่งฟรีจากโรงแรมในตัวเมืองเชียงใหม่
                </p>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-center space-y-1.5">
                <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 block">
                  รหัสโค้ดส่วนลด {promo.percent}% สำหรับจองกับพาร์ตเนอร์
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono font-black text-xl tracking-wider text-slate-950 dark:text-amber-300 bg-white dark:bg-slate-900 px-3 py-1 border border-amber-400">
                    {promo.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(promo.code)}
                    className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copiedCode ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด'}
                  </button>
                </div>
                <p className="text-[10px] text-amber-800 dark:text-amber-300">
                  แจ้งโค้ดนี้เมื่อติดต่อจองเพื่อรับส่วนลดพิเศษ {promo.percent}% และรับสิทธิ์รถรับส่งฟรีถึงที่พัก
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <a
                href={selectedPromoPartner.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-slate-950 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-500 text-white dark:text-slate-950 font-black text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>ไปยังหน้าติดต่อพาร์ตเนอร์</span>
                <span className="material-symbols-outlined text-[15px]">open_in_new</span>
              </a>
              <button
                type="button"
                onClick={() => setSelectedPromoPartner(null)}
                className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
