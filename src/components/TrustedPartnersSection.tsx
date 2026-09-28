'use client';

import React from 'react';
import { OFFICIAL_LINE_URL } from '@/lib/constants';

export const TrustedPartnersSection: React.FC = () => {

  return (
    <section id="partners" aria-label="พันธมิตรการเดินทาง" className="max-w-7xl mx-auto px-4 sm:px-6 my-10 sm:my-14 scroll-mt-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-4 border-b border-slate-300 dark:border-slate-800 mb-6">
        <div>
          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">stars</span>
            <span>Trusted Community Partners</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
            พิกัดแนะนำ & พันธมิตรการเดินทาง
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            ที่พักคุณภาพ กิจกรรมเชิงจริยธรรม และจุดแวะพักรถที่คนขับ TripDee แนะนำ
          </p>
        </div>
        <div>
          <a
            className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 border border-emerald-300 dark:border-emerald-700 transition-colors rounded-none cursor-pointer"
            href={OFFICIAL_LINE_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="material-symbols-outlined text-[15px]">add_business</span>
            <span>สนใจร่วมเป็นพันธมิตรกับ TripDee</span>
          </a>
        </div>
      </div>

      {/* Partner Cards (4 Grid with clean hairline edges) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Partner 1: The Connect Chiang Mai */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-4 flex flex-col justify-between hover:border-slate-500 transition-colors rounded-none">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded-none">
                🏨 ที่พักใกล้สนามบิน
              </span>
              <span className="text-amber-600 text-xs font-bold font-mono">
                ★ 4.9
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-0.5">The Connect Chiang Mai</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">ต.แม่เหียะ อ.เมืองเชียงใหม่</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 font-light">
              ห้องพักสไตล์โมเดิร์นลอฟท์ เงียบสงบ ใกล้สนามบินเชียงใหม่และเซ็นทรัลแอร์พอร์ต พร้อมคาเฟ่ Coffee Connect และที่จอดรถสะดวกสบาย
            </p>
            <div className="mt-3 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-1 font-medium flex items-center gap-1 rounded-none">
              <span className="material-symbols-outlined text-[13px]">confirmation_number</span>
              <span>สมาชิก TripDee ลดเพิ่ม 10%</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <a
              className="text-xs font-bold text-slate-900 dark:text-slate-200 hover:text-amber-600 flex items-center justify-between"
              href="https://www.facebook.com/Theconnectchiangmai"
              rel="noopener noreferrer"
              target="_blank"
            >
              <span>ดูข้อมูลที่พัก</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </div>
        </div>

        {/* Partner 2: Ran-Tong Sanctuary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-4 flex flex-col justify-between hover:border-slate-500 transition-colors rounded-none">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded-none">
                🐘 ปางช้างเชิงจริยธรรม
              </span>
              <span className="text-amber-600 text-xs font-bold font-mono">
                ★ 5.0
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-0.5">Ran-Tong Sanctuary</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">แม่แตง จ.เชียงใหม่</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 font-light">
              สัมผัสความน่ารักของช้างอย่างมีจริยธรรม No Riding ไม่ขี่ ไม่ล่ามโซ่ ป้อนอาหาร ทำสมุนไพร และอาบน้ำช้างในลำธารธรรมชาติ
            </p>
            <div className="mt-3 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-1 font-medium flex items-center gap-1 rounded-none">
              <span className="material-symbols-outlined text-[13px]">airport_shuttle</span>
              <span>มีจุดจอดรถตู้สะดวกสบาย</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <a
              className="text-xs font-bold text-slate-900 dark:text-slate-200 hover:text-amber-600 flex items-center justify-between"
              href="https://www.rantongelephantsanctuary.com/"
              rel="noopener noreferrer"
              target="_blank"
            >
              <span>ดูเว็บไซต์พันธมิตร</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </div>
        </div>

        {/* Partner 3: Vespa Adventures */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-4 flex flex-col justify-between hover:border-slate-500 transition-colors rounded-none">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded-none">
                🛵 ทัวร์เวสป้าคลาสสิก
              </span>
              <span className="text-amber-600 text-xs font-bold font-mono">
                ★ 4.9
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-0.5">Vespa Adventures Chiang Mai</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">เชียงใหม่ / ภาคเหนือ</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 font-light">
              นั่งเวสป้าคลาสสิกเที่ยวเชียงใหม่ 5 เส้นทาง City Highlights, Foodie (MICHELIN), วิถีชนบท และชมพระบิณฑบาตยามเช้า
            </p>
            <div className="mt-3 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-1 font-medium flex items-center gap-1 rounded-none">
              <span className="material-symbols-outlined text-[13px]">handshake</span>
              <span>พาร์ทเนอร์ทางการ TripDee</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <a
              className="text-xs font-bold text-slate-900 dark:text-slate-200 hover:text-amber-600 flex items-center justify-between"
              href="https://vespaadventures.com/destination/thailand"
              rel="noopener noreferrer"
              target="_blank"
            >
              <span>ดูเว็บไซต์พันธมิตร</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </div>
        </div>

        {/* Partner 4: Sukjai Cooking School */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-4 flex flex-col justify-between hover:border-slate-500 transition-colors rounded-none">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded-none">
                🍳 คุกกิ้งคลาสโฮมเมด
              </span>
              <span className="text-amber-600 text-xs font-bold font-mono">
                ★ 4.8
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-0.5">Sukjai Cooking School</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">เชียงใหม่ (มีรถรับส่ง)</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 font-light">
              คอร์สเรียนทำอาหารไทยสไตล์โฮมเมด บรรยากาศอบอุ่นในสวนชนบท พร้อมพาเดินตลาดสดเลือกซื้อวัตถุดิบและบริการรถรับส่งฟรี
            </p>
            <div className="mt-3 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-1 font-medium flex items-center gap-1 rounded-none">
              <span className="material-symbols-outlined text-[13px]">airport_shuttle</span>
              <span>รถรับส่งฟรีจากตัวเมือง</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <a
              className="text-xs font-bold text-slate-900 dark:text-slate-200 hover:text-amber-600 flex items-center justify-between"
              href={OFFICIAL_LINE_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span>ติดต่อจองกิจกรรม</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
