'use client';

import React, { useState } from 'react';
import { Check, Send, Briefcase, PartyPopper, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import type { DictKey } from '@/i18n/dictionaries';

const inputCls =
  'w-full rounded-input border border-rule bg-paper px-4 py-3 text-sm font-bold text-ink transition duration-220 ease-out placeholder:font-medium placeholder:text-ink-2/70 hover:border-ink-2/50 focus:border-grape';
const labelCls = 'mb-1.5 block text-xs font-extrabold uppercase tracking-[0.06em] text-ink-2';

const POINTS: { key: DictKey; tint: string }[] = [
  { key: 'corp.point1', tint: 'bg-sky-soft' },
  { key: 'corp.point2', tint: 'bg-leaf-soft' },
  { key: 'corp.point3', tint: 'bg-sun-soft' },
  { key: 'corp.point4', tint: 'bg-berry-soft' },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Save to portal quotations archive
      addQuotation({
        companyName: formData.companyName,
        route: formData.details || 'โปรแกรมตามที่ลูกค้ากำหนด',
        totalDays: 1,
        passengers: `${formData.passengers} คน`,
        estimatedPrice: 3500,
        needsTaxInvoice: formData.needsTaxInvoice,
      });

      // 2. Dispatch to backend API / webhooks
      await fetch('/api/leads/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    } catch (err) {
      console.error('Submit quote lead error:', err);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  return (
    <section id="corporate-section" aria-label={t('corp.aria')} className="scroll-mt-28 overflow-hidden rounded-card bg-ink text-paper">
      <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-10 lg:p-10">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 rounded-pill bg-grape px-3.5 py-1.5 text-xs font-extrabold text-white">
            <Briefcase className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
            {t('corp.badge')}
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
            {t('corp.titleA')}
            <br />
            {t('corp.titleB')}
          </h2>
          <p className="mt-4 max-w-[48ch] text-[15px] font-medium leading-relaxed text-paper/75">
            {t('corp.desc')}
          </p>

          <ul className="mt-6 flex flex-col gap-2.5">
            {POINTS.map((point) => (
              <li key={point.key} className="flex items-center gap-3 rounded-input bg-paper/10 px-3.5 py-2.5 text-sm font-bold">
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${point.tint}`}>
                  <Check className="h-3.5 w-3.5 text-ink" aria-hidden="true" strokeWidth={3} />
                </span>
                {t(point.key)}
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 rounded-card bg-card p-5 text-ink sm:p-6">
          {submitted ? (
            <div className="py-10 text-center">
              <span className="td-wiggle-hover mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-leaf text-white">
                <PartyPopper className="h-8 w-8" aria-hidden="true" />
              </span>
              <h3 className="font-display text-2xl font-extrabold text-ink">
                {t('corp.doneTitle')}
              </h3>
              <p className="mx-auto mt-2 max-w-[45ch] text-sm font-medium leading-relaxed text-ink-2">
                {t('corp.doneDesc')}
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="td-btn mt-5 rounded-pill bg-paper px-4 py-2 text-[13px] font-extrabold text-ink transition-transform duration-220 ease-spring hover:-translate-y-0.5"
              >
                {t('corp.doneMore')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h3 className="font-display text-xl font-extrabold tracking-tight text-ink">
                {t('corp.formTitle')}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  className={`${inputCls} min-h-24 resize-y`}
                />
              </div>

              <label htmlFor="td-cotax" className="flex cursor-pointer items-center gap-2.5 rounded-input bg-grape-soft px-3.5 py-3 text-[13px] font-bold text-ink">
                <input
                  id="td-cotax"
                  type="checkbox"
                  checked={formData.needsTaxInvoice}
                  onChange={(e) => setFormData({ ...formData, needsTaxInvoice: e.target.checked })}
                  className="h-5 w-5 shrink-0 accent-grape"
                />
                {t('corp.taxLabel')}
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="td-btn td-pop inline-flex w-full items-center justify-center gap-2 rounded-pill bg-grape disabled:opacity-60 px-4 py-3.5 text-sm font-extrabold text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>กำลังส่งข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
                    {t('corp.submit')}
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
