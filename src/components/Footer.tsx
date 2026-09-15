'use client';

import React from 'react';
import { MapPin, MessageCircle, ShieldCheck, FileCheck2, CarFront, Phone } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface FooterProps {
  onOpenDriverSelfService?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenDriverSelfService }) => {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto bg-[#0F172A] text-slate-300 border-t border-slate-800">
      {/* Top Banner Strip */}
      <div className="border-b border-slate-800/80 bg-slate-950/60 py-3 text-xs font-semibold text-slate-400">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-leaf" />
            <span>ศูนย์รวมรถตู้ VIP และยานพาหนะพร้อมคนขับ จังหวัดเชียงใหม่</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
            <span>ติดต่อแอดมิน LINE: </span>
            <span className="text-white font-bold">@tripdee</span>
          </span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Main Footer Directory Columns */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 pb-8 border-b border-slate-800">
          {/* Col 1: Brand & Bio */}
          <div>
            <div className="flex items-center gap-2">
              <img
                src="/logo-white.png"
                alt="TripDee ทริปดี"
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="mt-2 text-xs font-medium text-slate-400 leading-relaxed">
              {t('footer.tagline')}
            </p>
            <div className="mt-4 flex flex-col gap-1.5 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="h-4 w-4 text-blue-400 shrink-0" />
                <span>บริการครอบคลุมทั่วประเทศไทย</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MessageCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>LINE Official: @tripdee</span>
              </div>
            </div>
          </div>

          {/* Col 2: Fleet Types */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              หมวดหมู่ยานพาหนะ
            </h3>
            <ul className="flex flex-col gap-2 text-xs text-slate-400 font-medium">
              <li className="hover:text-white transition-colors cursor-pointer">รถตู้ VIP 9-10 ที่นั่ง พร้อมคนขับ</li>
              <li className="hover:text-white transition-colors cursor-pointer">รถตู้พรีเมียมคอมมิวเตอร์ เบาะกว้าง</li>
              <li className="hover:text-white transition-colors cursor-pointer">รถเช่าขับเอง SUV / Sedan เชียงใหม่</li>
              <li className="hover:text-white transition-colors cursor-pointer">พูลวิลล่า & ที่พักเชียงใหม่พร้อมที่จอดรถตู้</li>
            </ul>
          </div>

          {/* Col 3: Popular Routes */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              เส้นทางท่องเที่ยวแนะนำ
            </h3>
            <ul className="flex flex-col gap-2 text-xs text-slate-400 font-medium">
              <li className="hover:text-white transition-colors cursor-pointer">ทริปม่อนแจ่ม - แม่ริม - สวนดอกไม้</li>
              <li className="hover:text-white transition-colors cursor-pointer">ทริปยอดดอยอินทนนท์ - กิ่วแม่ปาน</li>
              <li className="hover:text-white transition-colors cursor-pointer">ทริปแม่กำปอง - น้ำพุร้อนสันกำแพง</li>
              <li className="hover:text-white transition-colors cursor-pointer">ทริปข้ามจังหวัด เชียงใหม่ - เชียงราย / ปาย</li>
            </ul>
          </div>

          {/* Col 4: Corporate & Partner Services */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              สำหรับองค์กรและพาร์ทเนอร์
            </h3>
            <ul className="flex flex-col gap-2 text-xs text-slate-400 font-medium">
              <li className="hover:text-white transition-colors cursor-pointer">จัดขบวนรถสัมมนา 2-20+ คัน</li>
              <li className="hover:text-white transition-colors cursor-pointer">ออกใบกำกับภาษีและหัก ณ ที่จ่าย 3%</li>
              <li className="hover:text-white transition-colors cursor-pointer">ลงทะเบียนเป็นคนขับ / ผู้ประกอบการฟรี</li>
              {onOpenDriverSelfService && (
                <li
                  onClick={onOpenDriverSelfService}
                  className="text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer flex items-center gap-1.5 pt-1"
                >
                  <span>🚐 จัดการสถานะรถ & ราคา (สำหรับคนขับ)</span>
                </li>
              )}
              <li className="hover:text-white transition-colors cursor-pointer">ติดต่อลงโฆษณาที่พัก & สปอนเซอร์</li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} TripDee (ทริปดี) เชียงใหม่. สงวนลิขสิทธิ์ทุกประการ.</p>
          <p className="text-[11px] text-slate-400 max-w-xl text-center sm:text-right">
            TripDee เป็นพื้นที่เชื่อมต่อโดยตรงระหว่างผู้เดินทางและเจ้าของรถท้องถิ่น ไม่มีการเรียกเก็บค่านายหน้าเพิ่มเติม
          </p>
        </div>
      </div>
    </footer>
  );
};
