'use client';

import React, { useState } from 'react';
import { Check, Send, Briefcase, PartyPopper, Loader2, FileCheck, Building2, ShieldCheck, PhoneCall, ArrowRight, Award } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import type { DictKey } from '@/i18n/dictionaries';

const inputCls =
  'w-full rounded-input border border-rule bg-paper px-3.5 py-2.5 text-sm font-semibold text-ink transition-colors placeholder:font-normal placeholder:text-ink-2/60 hover:border-accent/50 focus:border-accent focus:bg-card focus:outline-none';
const labelCls = 'mb-1 block text-xs font-bold uppercase tracking-wider text-ink-2';

const POINTS: { key: DictKey; icon: React.FC<{ className?: string }> }[] = [
  { key: 'corp.point1', icon: FileCheck },
  { key: 'corp.point2', icon: ShieldCheck },
  { key: 'corp.point3', icon: Building2 },
  { key: 'corp.point4', icon: PhoneCall },
];

export const CorporateSection: React.FC = () => {
  const { t } = useLanguage();
  const { addQuotation } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    phone: '',
    travelDate: '',
    passengers: '10-20',
    needsTaxInvoice: true,
    details: '',
  });

  const handleGoYellowPlate = () => {
    window.dispatchEvent(new CustomEvent('tripdee-filter-plate', { detail: 'yellow' }));
    const el = document.getElementById('results');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      addQuotation({
        companyName: formData.companyName,
        route: formData.details || 'โปรแกรมตามที่ลูกค้ากำหนด',
        totalDays: 1,
        passengers: `${formData.passengers} คน`,
        estimatedPrice: 3500,
        needsTaxInvoice: formData.needsTaxInvoice,
      });

      // Automatically post to Trip Board as corporate request
      await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'request',
          category: 'corporate',
          title: `[งานองค์กร] หารถตู้คาราวาน (${formData.passengers}) โดย ${formData.companyName}`,
          zoneId: 'city',
          date: formData.travelDate || 'เร็วๆ นี้',
          days: 1,
          seats: formData.passengers.includes('50') ? 50 : 20,
          price: 0,
          priceNote: formData.needsTaxInvoice ? 'ต้องการใบกำกับภาษี/หัก 3%' : 'ตามตกลง',
          authorName: formData.companyName,
          authorPhone: formData.phone,
          authorLine: '',
          detail: `${formData.details || 'โปรแกรมตามที่ลูกค้ากำหนด'} (${formData.needsTaxInvoice ? 'ต้องการรถป้ายเหลือง 30 / ออกใบกำกับภาษีได้' : 'ป้ายฟ้าหรือป้ายเหลืองก็ได้'})`,
          isVerified: false,
          pin: formData.phone.replace(/\D/g, '').slice(-4),
        }),
      });

      // Dispatch event to refresh community board in real-time
      window.dispatchEvent(new CustomEvent('tripdee-board-updated'));
    } catch (err) {
      console.error('Submit corporate board request error:', err);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  return (
    <section id="corporate-section" aria-label={t('corp.aria')} className="scroll-mt-28 overflow-hidden rounded-card bg-[#0F172A] text-white border border-slate-800 shadow-lift">
      <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-10 lg:p-10">
        {/* Left Column: B2B Procurement Pitch */}
        <div className="min-w-0 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-pill bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 text-xs font-bold">
              <Briefcase className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
              <span>{t('corp.badge')}</span>
            </div>

            <h2 className="mt-4 font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-white">
              {t('corp.titleA')}
              <br />
              <span className="text-blue-400">{t('corp.titleB')}</span>
            </h2>

            <p className="mt-3 text-sm sm:text-base font-normal leading-relaxed text-slate-300">
              {t('corp.desc')}
            </p>

            {/* Direct Yellow Plate CTA Button */}
            <div className="mt-5">
              <button
                type="button"
                onClick={handleGoYellowPlate}
                className="inline-flex items-center gap-2 rounded-input bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98]"
              >
                <Award className="h-4 w-4 text-slate-950 shrink-0" />
                <span>🟡 ดูรถตู้ป้ายเหลือง 30 & ออกใบกำกับภาษี (ดีลตรงทันที)</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </button>
            </div>

            {/* Corporate Value Props Checklist */}
            <ul className="mt-6 flex flex-col gap-2.5">
              {POINTS.map((point) => (
                <li key={point.key} className="flex items-center gap-3 rounded-input bg-slate-800/80 border border-slate-700/60 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-200">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-500/20 text-blue-400">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={3} />
                  </span>
                  <span>{t(point.key)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
            <span>✓ รองรับการเบิกจ่ายทุกองค์กรภาครัฐและเอกชน • ออกเอกสารโดยนิติบุคคลถูกต้อง</span>
          </div>
        </div>

        {/* Right Column: Clean Quotation Request Card */}
        <div className="min-w-0 rounded-input bg-card p-5 sm:p-6 text-ink border border-rule shadow-card">
          {submitted ? (
            <div className="py-10 text-center">
              <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-leaf-soft text-leaf">
                <PartyPopper className="h-7 w-7" aria-hidden="true" />
              </span>
              <h3 className="font-display text-xl font-extrabold text-ink">
                {t('corp.doneTitle')}
              </h3>
              <p className="mx-auto mt-2 max-w-[45ch] text-xs sm:text-sm font-medium leading-relaxed text-ink-2">
                {t('corp.doneDesc')}
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="td-btn mt-5 rounded-input bg-accent hover:bg-accent-deep text-white px-4 py-2 text-xs font-bold transition-colors"
              >
                {t('corp.doneMore')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div>
                <h3 className="font-display text-lg font-extrabold tracking-tight text-ink">
                  {t('corp.formTitle')}
                </h3>
                <p className="text-xs text-ink-2 mt-0.5">กรอกข้อมูลเบื้องต้นเพื่อรับใบเสนอราคาภายใน 15-30 นาที</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="td-co" className={labelCls}>
                    {t('corp.fCompany')}
                  </label>
                  <input
                    id="td-co"
                    type="text"
                    required
                    placeholder={t('corp.fCompanyPh')}
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="td-cophone" className={labelCls}>
                    {t('corp.fPhone')}
                  </label>
                  <input
                    id="td-cophone"
                    type="text"
                    required
                    placeholder={t('corp.fPhonePh')}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="td-codate" className={labelCls}>
                    {t('corp.fDate')}
                  </label>
                  <input
                    id="td-codate"
                    type="text"
                    placeholder={t('corp.fDatePh')}
                    value={formData.travelDate}
                    onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="td-copax" className={labelCls}>
                    {t('corp.fPax')}
                  </label>
                  <select
                    id="td-copax"
                    value={formData.passengers}
                    onChange={(e) => setFormData({ ...formData, passengers: e.target.value })}
                    className={inputCls}
                  >
                    <option value="1-9">{t('corp.pax1')}</option>
                    <option value="10-20">{t('corp.pax2')}</option>
                    <option value="21-50">{t('corp.pax3')}</option>
                    <option value="50+">{t('corp.pax4')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="td-codetail" className={labelCls}>
                  {t('corp.fDetail')}
                </label>
                <textarea
                  id="td-codetail"
                  rows={2}
                  placeholder={t('corp.fDetailPh')}
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  className={`${inputCls} min-h-20 resize-y`}
                />
              </div>

              <label htmlFor="td-cotax" className="flex cursor-pointer items-center gap-2.5 rounded-input bg-paper p-3 text-xs font-semibold text-ink border border-rule hover:border-accent/40 transition-colors">
                <input
                  id="td-cotax"
                  type="checkbox"
                  checked={formData.needsTaxInvoice}
                  onChange={(e) => setFormData({ ...formData, needsTaxInvoice: e.target.checked })}
                  className="h-4 w-4 shrink-0 rounded accent-accent"
                />
                <span>{t('corp.taxLabel')}</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="td-btn inline-flex w-full items-center justify-center gap-2 rounded-input bg-accent hover:bg-accent-deep disabled:opacity-60 px-4 py-3 text-sm font-bold text-white shadow-xs transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>กำลังส่งข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
                    <span>{t('corp.submit')}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
