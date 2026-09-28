'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Vehicle, VEHICLES } from '@/data/mockData';
import { isMockEnvEnabled } from '@/lib/mockConfig';
import { CheckCircle2, Loader2, Printer, ClipboardList } from 'lucide-react';
import { TravelDatePicker } from '@/components/TravelDatePicker';
import type { OrgType, VehicleTier } from '@/lib/b2b';
import {
  FUEL_PER_CAR_PER_DAY,
  MAX_CAR_COUNT,
  MIN_CAR_COUNT,
  ORG_TYPE_META,
  ORG_TYPE_OPTIONS,
  VEHICLE_TIER_META,
  VEHICLE_TIER_OPTIONS,
  clampCarCount,
  estimateBudget,
  formatBaht,
} from '@/lib/b2b';

interface CorporateSectionProps {
  vehicles?: Vehicle[];
}

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #td-budget-preview, #td-budget-preview * { visibility: visible !important; }
  #td-budget-preview {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    padding: 0 !important;
    background: #ffffff !important;
    display: block !important;
  }
  #td-budget-preview .no-print { display: none !important; }
}
`;

export const CorporateSection: React.FC<CorporateSectionProps> = ({ vehicles: propVehicles }) => {
  const { t } = useLanguage();
  const { addQuotation } = useAuth();
  const [fetchedVehicles, setFetchedVehicles] = useState<Vehicle[]>(() =>
    isMockEnvEnabled() ? VEHICLES : []
  );

  const vehicles = propVehicles && propVehicles.length > 0 ? propVehicles : fetchedVehicles;

  useEffect(() => {
    if (propVehicles && propVehicles.length > 0) return;
    let isMounted = true;
    fetch('/api/vehicles')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.vehicles && Array.isArray(data.vehicles) && data.vehicles.length > 0) {
          setFetchedVehicles(data.vehicles);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [propVehicles]);

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [docRef] = useState(() => `TDB-${Date.now().toString().slice(-6)}`);

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    route: 'กรุงเทพฯ - สัมมนาพัทยา',
    vehicleTier: 'standard_vip' as VehicleTier,
    carCount: 3,
    orgType: 'corporate' as OrgType,
    includeInsurance: true,
    travelDate: '',
    totalDays: 2,
    needsTaxInvoice: true,
    note: '',
  });

  const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);

  const budget = useMemo(
    () =>
      estimateBudget({
        tier: formData.vehicleTier,
        carCount: formData.carCount,
        days: formData.totalDays,
      }),
    [formData.vehicleTier, formData.carCount, formData.totalDays]
  );

  const tierMeta = VEHICLE_TIER_META[formData.vehicleTier];
  const sizeLabel = `${tierMeta.shortLabel} ${budget.carCount} คัน`;
  const passengerEstimate = `${budget.carCount * 9} คน (รถตู้ ${budget.carCount} คัน)`;

  const totalVehicles = vehicles.length;
  const yellowPlateCount = vehicles.filter((v) => v.plateType === 'yellow').length;
  const avgRating =
    totalVehicles > 0
      ? (vehicles.reduce((sum, v) => sum + (v.rating || 5.0), 0) / totalVehicles).toFixed(1)
      : '4.9';

  const setCarCount = (raw: string) => {
    const n = Number(raw.replace(/[^0-9]/g, ''));
    const carCount = Number.isFinite(n) && n > 0 ? Math.min(n, MAX_CAR_COUNT) : MIN_CAR_COUNT;
    setFormData({ ...formData, carCount });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const carCount = clampCarCount(formData.carCount);
    const passengers = passengerEstimate;
    const estimatedPrice = budget.rentalTotal;

    try {
      addQuotation({
        companyName: formData.companyName,
        route: formData.route,
        totalDays: formData.totalDays,
        passengers,
        estimatedPrice,
        needsTaxInvoice: formData.needsTaxInvoice,
      });

      // Save lead into B2B quotation pipeline (admin portal + partner matching)
      await fetch('/api/leads/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          contactName: formData.contactName.trim() || undefined,
          phone: formData.phone,
          travelDate: formData.travelDate || t('corp.dDateQuote'),
          route: formData.route,
          passengers,
          needsTaxInvoice: formData.needsTaxInvoice,
          estimatedPrice,
          carCount,
          vehicleTier: formData.vehicleTier,
          orgType: formData.orgType,
          includeInsurance: formData.includeInsurance,
        }),
      });
    } catch (err) {
      console.error('Failed to post quotation:', err);
    }

    try {
      // Post to TripBoard as corporate caravan request
      await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'request',
          category: 'corporate',
          title: t('corp.boardTitle', {
            size: sizeLabel,
            route: formData.route,
            company: formData.companyName,
          }),
          zoneId: 'city',
          date: formData.travelDate || t('corp.dDateQuote'),
          days: formData.totalDays,
          seats: carCount * 9,
          price: estimatedPrice,
          priceNote: formData.needsTaxInvoice ? t('corp.dTaxNote') : t('corp.dAgreed'),
          authorName: formData.contactName
            ? `${formData.companyName} (${formData.contactName})`
            : formData.companyName,
          authorPhone: formData.phone,
          authorLine: '',
          vehicleLabel: `${tierMeta.specLine} x ${carCount} คัน`,
          detail:
            `ขอใบเสนอราคาคาราวาน: ${formData.companyName} | เส้นทาง: ${formData.route} | ` +
            `ระดับรถ: ${tierMeta.label} (${tierMeta.tagline}) | จำนวนรถ: ${carCount} คัน | ` +
            `ประเภทองค์กร: ${ORG_TYPE_META[formData.orgType]} | จำนวนวัน: ${formData.totalDays} วัน | ` +
            `ประกันกลุ่ม: ${formData.includeInsurance ? 'คุ้มครอง 1,000,000 บาท/ท่าน' : 'ไม่เพิ่ม'} | ` +
            `ใบกำกับภาษี: ${formData.needsTaxInvoice ? 'ใช่' : 'ไม่'} | ` +
            `ผู้ติดต่อ: ${formData.contactName || '-'} โทร ${formData.phone}`,
        }),
      });
    } catch (err) {
      console.error('Failed to post board request:', err);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  const tierSelector = (
    <fieldset className="border-0 p-0 m-0">
      <legend className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
        ระดับมาตรฐานรถขบวน *
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {VEHICLE_TIER_OPTIONS.map((key) => {
          const meta = VEHICLE_TIER_META[key];
          const active = formData.vehicleTier === key;
          return (
            <label
              key={key}
              htmlFor={`tier-${key}`}
              className={`relative flex flex-col gap-1 p-3 border cursor-pointer transition-colors rounded-none ${
                active
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-400'
              }`}
            >
              <input
                id={`tier-${key}`}
                type="radio"
                name="vehicleTier"
                value={key}
                checked={active}
                onChange={() => setFormData({ ...formData, vehicleTier: key })}
                className="sr-only"
              />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className={`block text-xs font-black ${
                      active ? 'text-amber-700 dark:text-amber-300' : 'text-slate-800 dark:text-white'
                    }`}
                  >
                    {meta.label}
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    {meta.tagline}
                  </span>
                </div>
                <span
                  className={`mt-0.5 inline-block h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                    active
                      ? 'border-amber-500 bg-amber-500'
                      : 'border-slate-400 dark:border-slate-600 bg-transparent'
                  }`}
                  aria-hidden="true"
                />
              </div>
              <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-snug">
                {meta.highlights[0]}
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-amber-400">
                เรท {formatBaht(meta.rateMin)} - {formatBaht(meta.rateMax)} บ./วัน/คัน
              </span>
            </label>
          );
        })}
      </div>
      <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
        {tierMeta.highlights.slice(1).map((h) => (
          <li key={h} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0 text-emerald-500" />
            <span>{h}</span>
          </li>
        ))}
      </ul>
    </fieldset>
  );

  return (
    <section
      id="corporate"
      aria-label={t('nav.corpService')}
      className="w-full scroll-mt-20 sm:scroll-mt-24 py-10 sm:py-14 bg-[#0a192f] text-white border-t border-b border-slate-800 rounded-none transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Value Proposition */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 border border-amber-500/40 bg-amber-950/40 text-amber-300 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider mb-2 rounded-none">
                <span className="material-symbols-outlined text-[15px]">business_center</span>
                <span>B2B Corporate & Group Logistics</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight">
                {t('corp.titleA')}<br />
                <span className="text-amber-400">{t('corp.titleB')}</span>
              </h2>
              <p className="text-xs md:text-sm text-slate-300 mt-2 font-light leading-relaxed">
                จัดขบวนรถ 1-20 คัน สองระดับมาตรฐาน — Standard VIP (ป้ายฟ้า) สำหรับองค์กรทั่วไป ประหยัดงบ
                และ Strict Compliance ป้ายเหลือง 30 สำหรับราชการและงานที่ต้องถูกระเบียบ TOR 100%
                ออกใบกำกับภาษีเต็มรูป หัก ณ ที่จ่าย 3% ได้ถูกต้องตามระเบียบ
              </p>
            </div>

            {/* Features 4 Grid (Hairline borders) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-800/60 border border-slate-700 p-3.5 rounded-none">
                <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold mb-1">
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  <span>2 ระดับมาตรฐานรถ</span>
                </div>
                <p className="text-xs text-slate-300 font-light">
                  Standard VIP ป้ายฟ้า / Strict Compliance ป้ายเหลือง 30 GPS กรมขนส่งฯ เลือกตามระเบียบองค์กร
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700 p-3.5 rounded-none">
                <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold mb-1">
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  <span>ออกใบกำกับภาษีเต็มรูป</span>
                </div>
                <p className="text-xs text-slate-300 font-light">
                  เอกสารใบวางบิล ใบเสร็จรับเงิน ยื่นหัก ณ ที่จ่าย 3% สะดวก รวดเร็ว
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700 p-3.5 rounded-none">
                <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold mb-1">
                  <span className="material-symbols-outlined text-[16px]">radio</span>
                  <span>ขบวนคาราวานพร้อมวิทยุ</span>
                </div>
                <p className="text-xs text-slate-300 font-light">
                  คัดเลือกรถสีสุภาพ ขาว/บรอนซ์เงิน พร้อมทีมหัวขบวนวิ่งอย่างมีระเบียบ
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700 p-3.5 rounded-none">
                <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold mb-1">
                  <span className="material-symbols-outlined text-[16px]">savings</span>
                  <span>ตรงเจ้าของรถ ไร้ค่านายหน้า</span>
                </div>
                <p className="text-xs text-slate-300 font-light">
                  ราคาเป็นธรรม โปร่งใส ตรวจสอบต้นทุนต่อหัวได้ง่าย เหมาะกับฝ่ายจัดซื้อ
                </p>
              </div>
            </div>

            {/* Proof Metrics */}
            <div className="flex items-center gap-6 pt-1 font-mono">
              <div>
                <span className="text-2xl font-black text-white block">
                  {totalVehicles > 0 ? `${totalVehicles}+` : '500+'}
                </span>
                <span className="text-[11px] text-slate-400 font-sans">รถตู้พร้อมจัดคาราวาน</span>
              </div>
              <div className="h-8 w-px bg-slate-700"></div>
              <div>
                <span className="text-2xl font-black text-amber-400 block">{avgRating} ★</span>
                <span className="text-[11px] text-slate-400 font-sans">คะแนนจากฝ่ายบุคคล & องค์กร</span>
              </div>
              <div className="h-8 w-px bg-slate-700"></div>
              <div>
                <span className="text-2xl font-black text-emerald-400 block">
                  {yellowPlateCount > 0 ? `${yellowPlateCount} คัน` : '2'}
                </span>
                <span className="text-[11px] text-slate-400 font-sans">ระดับมาตรฐานให้เลือก</span>
              </div>
            </div>
          </div>

          {/* Right: Quotation Form Card (Sharp Clean Box) */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 p-5 sm:p-7 rounded-none shadow-sm">
            {/* Mobile Toggle Button */}
            <div
              onClick={() => setIsMobileFormOpen(!isMobileFormOpen)}
              className="lg:hidden flex items-center justify-between cursor-pointer py-1"
            >
              <div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">
                  คำนวณราคา & ขอใบเสนอราคา
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ประเมินงบประมาณเบื้องต้นทันที ไม่มีข้อผูกมัด
                </p>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1 shrink-0 rounded-none"
              >
                <span>{isMobileFormOpen ? 'ย่อฟอร์ม' : 'คำนวณราคา'}</span>
                <span className="material-symbols-outlined text-[16px]">
                  {isMobileFormOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>
            </div>

            <div className={`${isMobileFormOpen ? 'block mt-3 pt-3 border-t border-slate-200 dark:border-slate-800' : 'hidden'} lg:block`}>
              {submitted ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mx-auto flex items-center justify-center rounded-none border border-emerald-300">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                    {t('corp.successTitle')}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                    {t('corp.successDesc', { company: formData.companyName, phone: formData.phone })}
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(true)}
                      className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white font-bold text-xs rounded-none cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <ClipboardList className="w-4 h-4" />
                      <span>ดูใบประเมินงบประมาณ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-none cursor-pointer"
                    >
                      {t('corp.successMore')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="hidden lg:flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-950 dark:text-white">
                        คำนวณราคา & ขอใบเสนอราคา
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ประเมินงบประมาณเบื้องต้นทันที ไม่มีข้อผูกมัด
                      </p>
                    </div>
                    <span className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5 border border-emerald-300 dark:border-emerald-700 rounded-none">
                      ตอบกลับใน 15 นาที
                    </span>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Vehicle Tier Switcher */}
                    {tierSelector}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="corp-company-name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          ชื่อหน่วยงาน / บริษัท *
                        </label>
                        <input
                          id="corp-company-name"
                          type="text"
                          required
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          placeholder="เช่น บจก. สยามอินโนเวชั่น"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-slate-900 rounded-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="corp-phone" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          เบอร์โทรศัพท์ผู้ติดต่อ *
                        </label>
                        <input
                          id="corp-phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="08X-XXX-XXXX"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-slate-900 rounded-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="corp-contact-name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          ชื่อผู้ประสานงาน
                        </label>
                        <input
                          id="corp-contact-name"
                          type="text"
                          value={formData.contactName}
                          onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                          placeholder="เช่น คุณสมชาย (ฝ่ายบุคคล)"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-slate-900 rounded-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="corp-org-type" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          ประเภทองค์กร *
                        </label>
                        <select
                          id="corp-org-type"
                          value={formData.orgType}
                          onChange={(e) => setFormData({ ...formData, orgType: e.target.value as OrgType })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-slate-900 cursor-pointer rounded-none"
                        >
                          {ORG_TYPE_OPTIONS.map((key) => (
                            <option key={key} value={key}>
                              {ORG_TYPE_META[key]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="corp-route" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          เส้นทางเดินทาง *
                        </label>
                        <input
                          id="corp-route"
                          type="text"
                          required
                          value={formData.route}
                          onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                          placeholder="เช่น กรุงเทพฯ - สัมมนาพัทยา"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-slate-900 rounded-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="corp-car-count" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          จำนวนคันรถที่ต้องการ * ({MIN_CAR_COUNT} - {MAX_CAR_COUNT} คัน)
                        </label>
                        <div className="flex items-stretch">
                          <button
                            type="button"
                            aria-label="ลดจำนวนคันรถ"
                            onClick={() =>
                              setCarCount(String(Math.max(MIN_CAR_COUNT, formData.carCount - 1)))
                            }
                            className="px-3 border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-sm cursor-pointer rounded-none"
                          >
                            −
                          </button>
                          <input
                            id="corp-car-count"
                            type="number"
                            inputMode="numeric"
                            min={MIN_CAR_COUNT}
                            max={MAX_CAR_COUNT}
                            required
                            value={formData.carCount}
                            onChange={(e) => setCarCount(e.target.value)}
                            className="w-full text-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-slate-900 rounded-none"
                          />
                          <button
                            type="button"
                            aria-label="เพิ่มจำนวนคันรถ"
                            onClick={() =>
                              setCarCount(String(Math.min(MAX_CAR_COUNT, formData.carCount + 1)))
                            }
                            className="px-3 border border-l-0 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-sm cursor-pointer rounded-none"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="corp-total-days" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          ระยะเวลาเดินทาง
                        </label>
                        <select
                          id="corp-total-days"
                          value={formData.totalDays}
                          onChange={(e) => setFormData({ ...formData, totalDays: Number(e.target.value) })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-slate-900 cursor-pointer rounded-none"
                        >
                          <option value={1}>1 วัน (ไปเช้า-เย็นกลับ)</option>
                          <option value={2}>2 วัน 1 คืน</option>
                          <option value={3}>3 วัน 2 คืน</option>
                          <option value={4}>4 วัน 3 คืน</option>
                          <option value={5}>5 วัน 4 คืน</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="corp-travel-date" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          ช่วงวันที่เดินทาง
                        </label>
                        <TravelDatePicker
                          id="corp-travel-date"
                          value={formData.travelDate}
                          onChange={(dateStr) => setFormData({ ...formData, travelDate: dateStr })}
                          days={formData.totalDays}
                          onDaysChange={(newDays) => setFormData({ ...formData, totalDays: newDays })}
                          placeholder="เช่น 25-26 พ.ค. 2568"
                        />
                      </div>
                    </div>

                    {/* Tax Checkbox (Sharp rectangular) */}
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2.5 border border-slate-200 dark:border-slate-700 rounded-none">
                      <input
                        id="tax-receipt-needed"
                        type="checkbox"
                        checked={formData.needsTaxInvoice}
                        onChange={(e) => setFormData({ ...formData, needsTaxInvoice: e.target.checked })}
                        className="w-4 h-4 text-slate-950 border-slate-400 focus:ring-0 cursor-pointer rounded-none"
                      />
                      <label htmlFor="tax-receipt-needed" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer select-none">
                        ต้องการใบกำกับภาษีเต็มรูปแบบ / หัก ณ ที่จ่าย 3%
                      </label>
                    </div>

                    {/* Group Accident Insurance Checkbox */}
                    <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800 p-2.5 border border-slate-200 dark:border-slate-700 rounded-none">
                      <input
                        id="group-insurance-needed"
                        type="checkbox"
                        checked={formData.includeInsurance}
                        onChange={(e) => setFormData({ ...formData, includeInsurance: e.target.checked })}
                        className="w-4 h-4 mt-0.5 text-slate-950 border-slate-400 focus:ring-0 cursor-pointer rounded-none"
                      />
                      <label htmlFor="group-insurance-needed" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer select-none leading-relaxed">
                        เพิ่มประกันอุบัติเหตุการเดินทางกลุ่ม คุ้มครองผู้โดยสารรายบุคคล (1,000,000 บาท/ท่าน)
                      </label>
                    </div>

                    {/* Dynamic Estimated Total Box (Sharp Geometric) */}
                    <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 p-3.5 flex items-center justify-between gap-3 rounded-none">
                      <div>
                        <span className="text-[11px] text-amber-900 dark:text-amber-300 font-bold block">
                          ประมาณการค่าเช่ารถ ({formData.totalDays} วัน · {tierMeta.shortLabel} · {budget.carCount} คัน):
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          เรท {formatBaht(tierMeta.rateMin)}-{formatBaht(tierMeta.rateMax)} บ./วัน/คัน ตรงเจ้าของรถ ไม่ผ่านเอเจนซี่
                        </span>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <span className="text-lg sm:text-xl font-black text-slate-950 dark:text-amber-400">
                          ฿{formatBaht(budget.rentalLow)} - {formatBaht(budget.rentalHigh)}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">
                          *ยังไม่รวมค่าน้ำมันและทางด่วน
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(true)}
                      className="w-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs py-2.5 border border-slate-400 dark:border-slate-600 transition-colors flex items-center justify-center gap-1.5 rounded-none cursor-pointer"
                    >
                      <ClipboardList className="w-4 h-4" />
                      <span>ดูใบประเมินงบประมาณเบื้องต้น</span>
                    </button>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs py-3 border border-slate-950 transition-colors flex items-center justify-center gap-1.5 rounded-none cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>กำลังส่งข้อมูล...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[17px]">send</span>
                          <span>ส่งข้อมูลขอใบเสนอราคาอย่างเป็นทางการ</span>
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop for the budget preview modal */}
      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-[590] bg-black/50 print:hidden"
          onClick={() => setIsPreviewOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Instant Quotation Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[600] flex items-start justify-center overflow-y-auto p-3 sm:p-6 print:p-0 print:block print:overflow-visible">
          <style>{PRINT_CSS}</style>
          <div
            id="td-budget-preview"
            className="w-full max-w-2xl my-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-none shadow-2xl print:my-0 print:max-w-none print:border-0"
          >
            {/* Document header */}
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b-2 border-slate-900 dark:border-slate-200 print:border-black">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-[22px]">directions_bus</span>
                  <span className="text-xl font-black tracking-tight text-slate-950 dark:text-white print:text-black">
                    TripDee
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 print:text-amber-700">
                    B2B Mobility Desk
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  ใบประเมินงบประมาณเบื้องต้น / Preliminary Budget Estimate
                </p>
              </div>
              <div className="text-right text-[11px] text-slate-600 dark:text-slate-300 font-mono leading-relaxed">
                <div>เลขที่ {docRef}</div>
                <div>
                  วันที่{' '}
                  {new Date().toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4 text-xs">
              {/* Customer & trip details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                <div className="flex justify-between gap-2 border-b border-dotted border-slate-200 dark:border-slate-700 pb-1">
                  <span className="text-slate-500 dark:text-slate-400">หน่วยงาน / บริษัท</span>
                  <span className="font-bold text-right">{formData.companyName || '-'}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-dotted border-slate-200 dark:border-slate-700 pb-1">
                  <span className="text-slate-500 dark:text-slate-400">ผู้ติดต่อ</span>
                  <span className="font-bold text-right">
                    {formData.contactName || '-'} {formData.phone ? `(${formData.phone})` : ''}
                  </span>
                </div>
                <div className="flex justify-between gap-2 border-b border-dotted border-slate-200 dark:border-slate-700 pb-1">
                  <span className="text-slate-500 dark:text-slate-400">เส้นทาง</span>
                  <span className="font-bold text-right">{formData.route}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-dotted border-slate-200 dark:border-slate-700 pb-1">
                  <span className="text-slate-500 dark:text-slate-400">วันเดินทาง</span>
                  <span className="font-bold text-right">
                    {formData.travelDate || t('corp.dDateQuote')} ({formData.totalDays} วัน)
                  </span>
                </div>
                <div className="flex justify-between gap-2 border-b border-dotted border-slate-200 dark:border-slate-700 pb-1">
                  <span className="text-slate-500 dark:text-slate-400">จำนวนรถ</span>
                  <span className="font-bold text-right">{budget.carCount} คัน</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-dotted border-slate-200 dark:border-slate-700 pb-1">
                  <span className="text-slate-500 dark:text-slate-400">ประเภทรถ</span>
                  <span className="font-bold text-right">{tierMeta.specLine}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-dotted border-slate-200 dark:border-slate-700 pb-1">
                  <span className="text-slate-500 dark:text-slate-400">ประเภทองค์กร</span>
                  <span className="font-bold text-right">{ORG_TYPE_META[formData.orgType]}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-dotted border-slate-200 dark:border-slate-700 pb-1">
                  <span className="text-slate-500 dark:text-slate-400">ประกันอุบัติเหตุกลุ่ม</span>
                  <span className="font-bold text-right">
                    {formData.includeInsurance ? 'คุ้มครอง 1,000,000 บาท/ท่าน' : 'ไม่เพิ่ม'}
                  </span>
                </div>
              </div>

              {/* Cost breakdown */}
              <table className="w-full text-xs border border-slate-200 dark:border-slate-700 print:border-slate-400">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <th className="text-left font-bold px-3 py-2">รายการ</th>
                    <th className="text-right font-bold px-3 py-2 w-40">จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2">
                      <span className="font-bold">ค่าเช่ารถพร้อมคนขับ</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                        {tierMeta.label} เรท {formatBaht(tierMeta.rateMin)} - {formatBaht(tierMeta.rateMax)} บ./วัน
                         x {budget.carCount} คัน x {budget.days} วัน (ประเมินด้วยเรทสูงสุด)
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold">{formatBaht(budget.rentalTotal)}</td>
                  </tr>
                  <tr className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2">
                      <span className="font-bold">ประมาณการค่าน้ำมัน &amp; ทางด่วน</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                        เฉลี่ย {formatBaht(FUEL_PER_CAR_PER_DAY)} บ./คัน/วัน (จ่ายตามจริง)
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold">{formatBaht(budget.fuelTotal)}</td>
                  </tr>
                  <tr className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2">
                      <span className="font-bold">ประกันอุบัติเหตุการเดินทางกลุ่ม</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                        {formData.includeInsurance
                          ? 'คุ้มครองผู้โดยสารรายบุคคล 1,000,000 บาท/ท่าน (รวมในแพ็กเกจ)'
                          : 'ลูกค้าเลือกไม่เพิ่มความคุ้มครอง'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold">
                      {formData.includeInsurance ? 'รวมในเรท' : '-'}
                    </td>
                  </tr>
                  <tr className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    <td className="px-3 py-2 font-bold">รวมประมาณการก่อนภาษี</td>
                    <td className="px-3 py-2 text-right font-mono font-black">{formatBaht(budget.subtotal)}</td>
                  </tr>
                  <tr className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2 text-rose-600 dark:text-rose-400">
                      หัก ณ ที่จ่าย 3% (ภาษีเงินได้หัก ณ ที่จ่าย)
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      -{formatBaht(budget.withholdingTax)}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-slate-900 dark:border-slate-200 print:border-black">
                    <td className="px-3 py-2.5 font-black">ยอดสุทธิหลังหัก ณ ที่จ่าย</td>
                    <td className="px-3 py-2.5 text-right font-mono font-black text-base text-amber-600 dark:text-amber-400 print:text-black">
                      {formatBaht(budget.netAfterWithholding)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Terms */}
              <div className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 space-y-1">
                <p className="font-bold text-slate-700 dark:text-slate-300">เงื่อนไขและข้อควรทราบ</p>
                <p>
                  1. เอกสารฉบับนี้เป็นการประเมินงบประมาณเบื้องต้นเท่านั้น ยังไม่ถือเป็นข้อเสนอผูกมัด
                  อาจปรับเปลี่ยนตามเส้นทาง สภาพจราจร และวันหยุดนักขัตฤกษ์
                </p>
                <p>2. ราคาค่าเช่ารถไม่รวมค่าน้ำมัน ทางด่วน และค่าที่จอดรถ ซึ่งคิดตามจริงตามระยะทางที่ใช้งาน</p>
                <p>
                  3.{' '}
                  {formData.needsTaxInvoice
                    ? 'เมื่อยืนยันงาน TripDee ออกใบกำกับภาษีเต็มรูปแบบ และเอกสารหัก ณ ที่จ่าย 3% ให้ยื่นเป็นค่าใช้จ่ายขององค์กรได้'
                    : 'กรณีไม่ต้องการใบกำกับภาษี จะออกใบเสร็จรับเงินทั่วไป'}
                </p>
                <p>4. รถที่จัดสรรเป็นไปตามมาตรฐานที่เลือก และขึ้นอยู่กับความพร้อมของรถในช่วงวันเดินทาง</p>
              </div>
            </div>

            {/* Actions */}
            <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 dark:border-slate-700 print:hidden">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none cursor-pointer"
              >
                ปิด
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 text-xs font-black bg-slate-950 hover:bg-slate-800 text-white border border-slate-950 rounded-none cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์ / บันทึก PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
