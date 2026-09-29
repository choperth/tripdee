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
    perkIcon: 'confirmation_number',
    perk: 'สมาชิก TripDee ลดเพิ่ม 10%',
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
    desc: 'สัมผัสความน่ารักของช้างอย่างมีจริยธรรม No Riding ไม่ขี่ ไม่ล่ามโซ่ ป้อนอาหาร ทำสมุนไพร และอาบน้ำช้างในลำธารธรรมชาติ',
    perkIcon: 'airport_shuttle',
    perk: 'มีจุดจอดรถตู้สะดวกสบาย',
    cta: 'ดูเว็บไซต์พันธมิตร',
    href: 'https://www.rantongelephantsanctuary.com/',
  },
  {
    id: 'vespa',
    category: 'vespa',
    logo: '/images/vespa.jpg',
    logoAlt: 'Vespa Adventures Chiang Mai',
    logoBg: '#ffffff',
    title: 'Vespa Adventures Chiang Mai',
    desc: 'นั่งเวสป้าคลาสสิกเที่ยวเชียงใหม่ 5 เส้นทาง City Highlights, Foodie (MICHELIN), วิถีชนบท และชมพระบิณฑบาตยามเช้า',
    perkIcon: 'handshake',
    perk: 'พาร์ทเนอร์ทางการ TripDee',
    cta: 'ดูเว็บไซต์พันธมิตร',
    href: 'https://vespaadventures.com/destination/thailand',
  },
  {
    id: 'cooking',
    category: 'cooking',
    logo: '/images/sukjai-cooking-school.jpg',
    logoAlt: 'Sukjai Cooking School',
    logoBg: '#2f6cb0',
    title: 'Sukjai Cooking School',
    desc: 'คอร์สเรียนทำอาหารไทยสไตล์โฮมเมด บรรยากาศอบอุ่นในสวนชนบท พร้อมพาเดินตลาดสดเลือกซื้อวัตถุดิบและบริการรถรับส่งฟรี',
    perkIcon: 'airport_shuttle',
    perk: 'รถรับส่งฟรีจากตัวเมือง',
    cta: 'ติดต่อจองกิจกรรม (Facebook)',
    href: 'https://www.facebook.com/profile.php?id=61558094176601',
  },
];

type PartnerText = Partial<Pick<Partner, 'title' | 'desc' | 'perk' | 'cta' | 'logoAlt'>>;

/** EN/ZH overrides for partner cards (Thai text lives in PARTNERS above). */
const PARTNER_TEXT: Record<string, Partial<Record<Locale, PartnerText>>> = {
  connect: {
    en: {
      desc: 'Modern loft-style rooms, quiet, near Chiang Mai airport and Central Airport with Coffee Connect cafe and easy parking',
      perk: 'TripDee members save an extra 10%',
      cta: 'View stay info (Facebook)',
    },
    zh: {
      desc: '现代 Loft 风格客房，安静舒适，近清迈机场与中央机场商圈，设 Coffee Connect 咖啡馆与便利停车位',
      perk: 'TripDee 会员额外 9 折优惠',
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
      desc: 'Ethical elephant care with No Riding & No Chains — feed them, prepare herbal medicine and bathe elephants in a natural mountain stream',
      perk: 'Convenient van parking on site',
      cta: 'View partner website',
    },
    zh: {
      desc: '公益大象保护体验：不骑乘、不锁链，喂食、制作草药并为大象溪流洗澡',
      perk: '设有大巴停车点',
      cta: '查看合作方网站',
    },
  },
  vespa: {
    en: {
      desc: 'Tour Chiang Mai by classic Vespa on 5 routes: City Highlights, Foodie (MICHELIN), countryside, and morning alms rounds',
      perk: 'Official TripDee partner',
      cta: 'View partner website',
    },
    zh: {
      desc: '乘坐经典伟士牌游览清迈 5 条路线：城市精华、美食（米其林）、乡村与清晨布施',
      perk: 'TripDee 官方合作伙伴',
      cta: '查看合作方网站',
    },
  },
  cooking: {
    en: {
      desc: 'Home-style Thai cooking class in a warm country garden, with a fresh market tour and free round-trip transfers',
      perk: 'Free city pickup & drop-off',
      cta: 'Book on Facebook',
    },
    zh: {
      desc: '乡村花园温馨家常泰料课程，含当地菜市场采买与免费往返接送',
      perk: '市区免费接送',
      cta: '通过 Facebook 预订',
    },
  },
};

export const TrustedPartnersSection: React.FC = () => {
  const { t, locale } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<PartnerCategory>('all');
  const baseList = activeCategory === 'all' ? PARTNERS : PARTNERS.filter((p) => p.category === activeCategory);
  const visible = baseList.map((p) => ({ ...p, ...PARTNER_TEXT[p.id]?.[locale] }));

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
              <a
                className="text-xs font-bold text-slate-900 dark:text-slate-200 hover:text-amber-600 flex items-center justify-between transition-colors"
                href={partner.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span>{partner.cta}</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
