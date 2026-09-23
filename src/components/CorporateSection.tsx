'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { TravelDatePicker } from '@/components/TravelDatePicker';

export const CorporateSection: React.FC = () => {
  const { t } = useLanguage();
  const { addQuotation } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    route: 'เชียงใหม่ - ม่อนแจ่ม / ดอยอินทนนท์',
    caravanSize: '2-3 คัน',
    travelDate: '',
    totalDays: 2,
    needsTaxInvoice: true,
    note: '',
  });

  const estimatedPricePerDay =
    formData.caravanSize === '1 คัน'
      ? 2200
      : formData.caravanSize === '2-3 คัน'
      ? 5500
      : formData.caravanSize === '4-6 คัน'
      ? 11000
      : 22000;

  const totalEstimate = estimatedPricePerDay * formData.totalDays;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      addQuotation({
        companyName: formData.companyName,
        route: formData.route,
        totalDays: formData.totalDays,
        passengers: `คาราวาน ${formData.caravanSize}`,
        estimatedPrice: totalEstimate,
        needsTaxInvoice: formData.needsTaxInvoice,
      });

      // Post to TripBoard as corporate caravan request
      await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'request',
          category: 'corporate',
          title: `[งานองค์กร/ราชการ] คาราวาน ${formData.caravanSize} ${formData.route} (${formData.companyName})`,
          zoneId: 'city',
          date: formData.travelDate || 'ตามระบุในใบเสนอราคา',
          days: formData.totalDays,
          seats: 20,
          price: totalEstimate,
          priceNote: formData.needsTaxInvoice ? 'ต้องการใบกำกับภาษี/หัก 3%' : 'ตามตกลง',
          authorName: formData.contactName ? `${formData.companyName} (${formData.contactName})` : formData.companyName,
          authorPhone: formData.phone,
          authorLine: '',
          detail: `เส้นทาง: ${formData.route} · จำนวน: ${formData.caravanSize} · ระยะเวลา: ${formData.totalDays} วัน · ${formData.note || 'ต้องการรถป้ายเหลือง 30 สะอาด สีสุภาพ พร้อมคนขับสุภาพ'}`,
          pin: formData.phone.replace(/\D/g, '').slice(-4) || '1234',
        }),
      });

      window.dispatchEvent(new CustomEvent('tripdee-board-updated'));
    } catch (err) {
      console.debug('Failed to post corporate quote request:', err);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  return (
    <section
      id="corporate"
      aria-label={t('nav.corpService')}
      className="w-full py-space-3xl bg-navy-deep text-surface rounded-3xl my-12 overflow-hidden relative shadow-2xl transition-colors"
    >
      {/* Subtle glow circles */}
      <div className="absolute -right-32 -top-32 w-96 h-96 bg-blue-action/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-10 -bottom-20 w-80 h-80 bg-amber-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-margin lg:px-gutter relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
          {/* Left: Value Proposition Details (7 of 12 cols) */}
          <div className="lg:col-span-7 space-y-space-md">
            <div className="inline-flex items-center gap-space-2xs px-space-sm py-space-2xs rounded-full bg-primary-container text-surface font-label-badge text-label-badge border border-white/10">
              <span className="material-symbols-outlined text-taxi-yellow-30 text-[16px]">
                corporate_fare
              </span>
              <span>{t('corp.badge')}</span>
            </div>

            <h2 className="font-display-hero text-display-hero text-surface tracking-tight">
              {t('corp.titleA')}
              <span className="text-taxi-yellow-30 block">{t('corp.titleB')}</span>
            </h2>

            <p className="font-body-large text-body-large text-surface-container-high opacity-90 leading-relaxed max-w-2xl">
              {t('corp.desc')}
            </p>

            {/* 4 Trust Pillars (2x2 Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-space-xs">
              {/* Pillar 1 */}
              <div className="p-space-md bg-white/5 rounded-2xl border border-white/10 flex items-start gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-amber-accent/20 text-amber-accent flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">verified_user</span>
                </div>
                <div>
                  <h3 className="font-title-card text-title-card text-surface">
                    {t('corp.p1Title')}
                  </h3>
                  <p className="font-body-subtext text-body-subtext text-surface-container-high mt-1 opacity-80">
                    {t('corp.p1Desc')}
                  </p>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="p-space-md bg-white/5 rounded-2xl border border-white/10 flex items-start gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-verified-emerald/20 text-verified-emerald flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                </div>
                <div>
                  <h3 className="font-title-card text-title-card text-surface">
                    {t('corp.p2Title')}
                  </h3>
                  <p className="font-body-subtext text-body-subtext text-surface-container-high mt-1 opacity-80">
                    {t('corp.p2Desc')}
                  </p>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="p-space-md bg-white/5 rounded-2xl border border-white/10 flex items-start gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-blue-action/20 text-blue-action flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">minor_crash</span>
                </div>
                <div>
                  <h3 className="font-title-card text-title-card text-surface">
                    {t('corp.p3Title')}
                  </h3>
                  <p className="font-body-subtext text-body-subtext text-surface-container-high mt-1 opacity-80">
                    {t('corp.p3Desc')}
                  </p>
                </div>
              </div>

              {/* Pillar 4 */}
              <div className="p-space-md bg-white/5 rounded-2xl border border-white/10 flex items-start gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-line-green/20 text-line-green flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">handshake</span>
                </div>
                <div>
                  <h3 className="font-title-card text-title-card text-surface">
                    {t('corp.p4Title')}
                  </h3>
                  <p className="font-body-subtext text-body-subtext text-surface-container-high mt-1 opacity-80">
                    {t('corp.p4Desc')}
                  </p>
                </div>
              </div>
            </div>

            {/* Metric Counters Strip */}
            <div className="pt-space-sm flex flex-wrap items-center gap-space-xl text-surface">
              <div>
                <div className="font-headline-xl text-headline-xl text-surface font-black">
                  580+
                </div>
                <div className="font-body-subtext text-body-subtext text-surface-container-high opacity-75">
                  {t('corp.statSuccess')}
                </div>
              </div>
              <div className="h-8 w-px bg-white/20 hidden sm:block" />
              <div>
                <div className="font-headline-xl text-headline-xl text-taxi-yellow-30 font-black">
                  4.97 ★
                </div>
                <div className="font-body-subtext text-body-subtext text-surface-container-high opacity-75">
                  {t('corp.statRating')}
                </div>
              </div>
              <div className="h-8 w-px bg-white/20 hidden sm:block" />
              <div>
                <div className="font-headline-xl text-headline-xl text-verified-emerald font-black">
                  100%
                </div>
                <div className="font-body-subtext text-body-subtext text-surface-container-high opacity-75">
                  {t('corp.statLegal')}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Instant RFQ Quotation Builder Card (5 of 12 cols) */}
          <div className="lg:col-span-5 bg-paper-elevated text-navy-deep dark:bg-slate-900 dark:text-white rounded-3xl p-space-md lg:p-space-lg shadow-2xl space-y-space-sm border border-border-subtle dark:border-slate-800">
            {submitted ? (
              <div className="py-space-xl text-center space-y-space-sm">
                <div className="w-16 h-16 rounded-full bg-verified-emerald-soft text-verified-emerald mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="font-headline-md text-headline-md text-navy-deep dark:text-white">
                  {t('corp.successTitle')}
                </h3>
                <p className="font-body-base text-body-base text-ink-secondary dark:text-slate-300">
                  {t('corp.successDesc', { company: formData.companyName, phone: formData.phone })}
                </p>
                <div className="pt-space-xs">
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="px-space-md py-space-xs bg-navy-deep text-surface rounded-xl font-body-medium text-body-medium hover:bg-navy-surface transition-colors cursor-pointer"
                  >
                    {t('corp.successMore')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-border-subtle dark:border-slate-800 pb-space-xs">
                  <div>
                    <h3 className="font-headline-md text-headline-md text-navy-deep dark:text-white">
                      {t('corp.rfqTitle')}
                    </h3>
                    <p className="font-body-subtext text-body-subtext text-ink-muted dark:text-slate-400">
                      {t('corp.rfqSubtitle')}
                    </p>
                  </div>
                  <span className="px-space-xs py-space-2xs rounded-full bg-verified-emerald-soft text-verified-emerald font-label-badge text-label-badge font-bold">
                    {t('corp.rfqBadge')}
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-space-sm">
                  {/* Company & Contact */}
                  <div className="grid grid-cols-2 gap-space-xs">
                    <div>
                      <label htmlFor="corp-company-name" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                        {t('corp.fCompany')}
                      </label>
                      <input
                        id="corp-company-name"
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder={t('corp.fCompanyPh')}
                        className="w-full h-10 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-subtext font-body-subtext focus:outline-none focus:ring-2 focus:ring-blue-action"
                      />
                    </div>
                    <div>
                      <label htmlFor="corp-contact-name" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                        {t('corp.fContact')}
                      </label>
                      <input
                        id="corp-contact-name"
                        type="text"
                        required
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        placeholder={t('corp.fContactPh')}
                        className="w-full h-10 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-subtext font-body-subtext focus:outline-none focus:ring-2 focus:ring-blue-action"
                      />
                    </div>
                  </div>

                  {/* Phone & Email */}
                  <div className="grid grid-cols-2 gap-space-xs">
                    <div>
                      <label htmlFor="corp-phone" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                        {t('corp.fPhone')}
                      </label>
                      <input
                        id="corp-phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="08x-xxx-xxxx"
                        className="w-full h-10 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-subtext font-body-subtext focus:outline-none focus:ring-2 focus:ring-blue-action"
                      />
                    </div>
                    <div>
                      <label htmlFor="corp-email" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                        {t('corp.fEmail')}
                      </label>
                      <input
                        id="corp-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="procurement@company.com"
                        className="w-full h-10 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-subtext font-body-subtext focus:outline-none focus:ring-2 focus:ring-blue-action"
                      />
                    </div>
                  </div>

                  {/* Route & Caravan Size */}
                  <div className="grid grid-cols-2 gap-space-xs">
                    <div>
                      <label htmlFor="corp-route" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                        {t('corp.fRoute')}
                      </label>
                      <input
                        id="corp-route"
                        type="text"
                        required
                        value={formData.route}
                        onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                        placeholder={t('corp.fRoutePh')}
                        className="w-full h-10 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-subtext font-body-subtext focus:outline-none focus:ring-2 focus:ring-blue-action"
                      />
                    </div>
                    <div>
                      <label htmlFor="corp-caravan-size" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                        {t('corp.fFleet')}
                      </label>
                      <select
                        id="corp-caravan-size"
                        value={formData.caravanSize}
                        onChange={(e) => setFormData({ ...formData, caravanSize: e.target.value })}
                        className="w-full h-10 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-subtext font-body-subtext focus:outline-none focus:ring-2 focus:ring-blue-action cursor-pointer"
                      >
                        <option value="1 คัน">{t('corp.fleet1')}</option>
                        <option value="2-3 คัน">{t('corp.fleet2')}</option>
                        <option value="4-6 คัน">{t('corp.fleet4')}</option>
                        <option value="7-10+ คัน">{t('corp.fleet7')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Dates & Days */}
                  <div className="space-y-space-xs">
                    <div>
                      <label htmlFor="corp-travel-date" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                        {t('corp.fDate')}
                      </label>
                      <TravelDatePicker
                        id="corp-travel-date"
                        value={formData.travelDate}
                        onChange={(dateStr) => setFormData({ ...formData, travelDate: dateStr })}
                        days={formData.totalDays}
                        onDaysChange={(newDays) => setFormData({ ...formData, totalDays: newDays })}
                        placeholder={t('corp.fDatePh')}
                      />
                    </div>
                    <div>
                      <label htmlFor="corp-total-days" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                        {t('corp.fDays')}
                      </label>
                      <select
                        id="corp-total-days"
                        value={formData.totalDays}
                        onChange={(e) => setFormData({ ...formData, totalDays: Number(e.target.value) })}
                        className="w-full h-10 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-subtext font-body-subtext focus:outline-none focus:ring-2 focus:ring-blue-action cursor-pointer"
                      >
                        <option value={1}>{t('corp.days1')}</option>
                        <option value={2}>{t('corp.days2')}</option>
                        <option value={3}>{t('corp.days3')}</option>
                        <option value={4}>{t('corp.days4')}</option>
                        <option value={5}>{t('corp.days5')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Tax Invoice Toggle */}
                  <div className="p-space-xs rounded-xl bg-paper-surface-muted dark:bg-slate-800 flex items-center justify-between">
                    <label htmlFor="corp-tax-invoice" className="flex items-center gap-2 cursor-pointer flex-1">
                      <span className="material-symbols-outlined text-[18px] text-verified-emerald">
                        description
                      </span>
                      <span className="font-body-subtext text-body-subtext text-navy-deep dark:text-white font-bold">
                        {t('corp.taxCheck')}
                      </span>
                    </label>
                    <input
                      id="corp-tax-invoice"
                      type="checkbox"
                      checked={formData.needsTaxInvoice}
                      onChange={(e) => setFormData({ ...formData, needsTaxInvoice: e.target.checked })}
                      className="w-4 h-4 text-blue-action rounded focus:ring-blue-action cursor-pointer"
                    />
                  </div>

                  {/* Estimated Price Bar */}
                  <div className="bg-blue-subtle dark:bg-blue-950/60 p-space-xs rounded-xl flex items-center justify-between">
                    <span className="font-body-subtext text-body-subtext text-ink-secondary dark:text-slate-300">
                      {t('corp.estPrefix', { days: formData.totalDays })}
                    </span>
                    <span className="font-price-headline text-price-headline text-blue-action">
                      ฿{totalEstimate.toLocaleString()}
                    </span>
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 bg-blue-action hover:bg-blue-action-hover text-on-primary font-title-card text-title-card rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{t('corp.submitting')}</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">description</span>
                        <span>{t('corp.btnRfq')}</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
