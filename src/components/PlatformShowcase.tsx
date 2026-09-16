'use client';

import React from 'react';
import { CarFront, Briefcase, ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react';

interface PlatformShowcaseProps {
  onOpenRegister?: () => void;
  onSelectCorporate?: () => void;
  onScrollToSearch?: () => void;
}

export const PlatformShowcase: React.FC<PlatformShowcaseProps> = ({
  onOpenRegister,
  onSelectCorporate,
  onScrollToSearch,
}) => {
  return (
    <section aria-label="บริการหลักของแพลตฟอร์ม TripDee" className="my-14">
      {/* Section Heading */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-pill bg-accent-soft px-3 py-1 text-xs font-bold text-accent mb-2 border border-accent/20">
          <span>🚀 OPEN MOBILITY PLATFORM</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
          ร่วมขับเคลื่อนการเดินทางกับ TripDee
        </h2>
        <p className="mt-2 text-xs sm:text-sm font-medium text-ink-2">
          ศูนย์รวมรถตู้ VIP และรถเช่าคุณภาพสูง ดีลตรงระหว่างผู้เดินทางและคนขับ 0% ค่าคอมมิชชั่น
        </p>
      </div>

      {/* 3 Real Feature Cards (House Ads) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: For Drivers */}
        <div className="td-elev-card flex flex-col justify-between rounded-card bg-card border border-rule p-6 hover:border-accent/50 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-white shadow-xs">
                <CarFront className="h-5 w-5" />
              </span>
              <span className="rounded-pill bg-leaf-soft px-2.5 py-0.5 text-[11px] font-bold text-leaf border border-leaf/20">
                0% คอมมิชชั่น
              </span>
            </div>

            <h3 className="font-display text-base font-extrabold text-ink mb-2">
              มีรถตู้ VIP หรือรถเช่า? ร่วมรับงานตรงกับเรา
            </h3>
            <p className="text-xs font-medium text-ink-2 leading-relaxed">
              เปิดรับสมัครคนขับและผู้ประกอบการรถเช่าทั่วไทย ลงทะเบียนฟรี ไม่มีหักค่าหัวคิว มีระบบจัดการสถานะรถว่างด้วยตนเอง 24 ชม.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-rule/60">
            <button
              type="button"
              onClick={onOpenRegister}
              className="td-btn w-full inline-flex items-center justify-center gap-1.5 rounded-pill bg-accent hover:bg-accent-deep text-white px-4 py-2.5 text-xs font-extrabold shadow-xs transition-all"
            >
              <span>ลงทะเบียนพาร์ทเนอร์ฟรี</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: For Corporate Clients */}
        <div className="td-elev-card flex flex-col justify-between rounded-card bg-card border border-rule p-6 hover:border-accent/50 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-xs">
                <Briefcase className="h-5 w-5" />
              </span>
              <span className="rounded-pill bg-blue-50 text-blue-700 px-2.5 py-0.5 text-[11px] font-bold border border-blue-200">
                ใบกำกับภาษี & หัก 3%
              </span>
            </div>

            <h3 className="font-display text-base font-extrabold text-ink mb-2">
              จัดคาราวานรถตู้สัมมนา & เดินทางดูงานองค์กร
            </h3>
            <p className="text-xs font-medium text-ink-2 leading-relaxed">
              รวมรถตู้ VIP ป้ายเหลือง 30 ถูกต้องตามกฎหมาย มีประกันภัยผู้โดยสาร ออกใบเสร็จรับเงิน/ใบกำกับภาษีเต็มรูปแบบ ดีลตรงกับเจ้าของรถ
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-rule/60">
            <button
              type="button"
              onClick={onSelectCorporate}
              className="td-btn w-full inline-flex items-center justify-center gap-1.5 rounded-pill bg-paper-2 hover:bg-card border border-rule text-ink px-4 py-2.5 text-xs font-extrabold shadow-2xs transition-all"
            >
              <span>ดูข้อมูลรถองค์กร B2B</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: For Travelers / Peace of Mind */}
        <div className="td-elev-card flex flex-col justify-between rounded-card bg-card border border-rule p-6 hover:border-accent/50 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-leaf text-white shadow-xs">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span className="rounded-pill bg-leaf-soft px-2.5 py-0.5 text-[11px] font-bold text-leaf border border-leaf/20">
                ตรวจเอกสารแล้ว
              </span>
            </div>

            <h3 className="font-display text-base font-extrabold text-ink mb-2">
              ดีลตรง มั่นใจ ปลอดภัยและโปร่งใส 100%
            </h3>
            <p className="text-xs font-medium text-ink-2 leading-relaxed">
              ตรวจสอบใบขับขี่และข้อมูลรถก่อนขึ้นระบบ พร้อมระบบเซ็นเซอร์ข้อมูลส่วนตัวเพื่อความปลอดภัย ตกลงราคาเหมาตรงกับคนขับตามระยะทางจริง
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-rule/60">
            <button
              type="button"
              onClick={onScrollToSearch}
              className="td-btn w-full inline-flex items-center justify-center gap-1.5 rounded-pill bg-paper-2 hover:bg-card border border-rule text-ink px-4 py-2.5 text-xs font-extrabold shadow-2xs transition-all"
            >
              <span>ค้นหารถตู้ & รถเช่า</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Genuine Business Collaboration Banner */}
      <div className="mt-8 rounded-card border border-rule/80 bg-paper-2 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card border border-rule text-xl">
            🤝
          </span>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-ink">
              สนใจร่วมเป็นพันธมิตรธุรกิจ หรือมอบสิทธิพิเศษให้นักท่องเที่ยว?
            </h4>
            <p className="text-xs font-medium text-ink-2 mt-0.5">
              เจ้าของโรงแรม รีสอร์ต หรือบริการท่องเที่ยว ติดต่อทีมงาน TripDee เพื่อร่วมงานกันได้โดยตรง
            </p>
          </div>
        </div>

        <a
          href="https://line.me/R/ti/p/@tripdee"
          target="_blank"
          rel="noopener noreferrer"
          className="td-btn shrink-0 inline-flex items-center gap-1.5 rounded-pill bg-[#06C755] hover:bg-[#05b34c] text-white px-4 py-2 text-xs font-bold shadow-xs transition-all"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>ติดต่อร่วมงาน (LINE @tripdee)</span>
        </a>
      </div>
    </section>
  );
};
