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
  ORG_TYPE_OPTIONS,
  VEHICLE_TIER_OPTIONS,
  clampCarCount,
  estimateBudget,
  formatBaht,
  orgTypeLabel,
  tierMetaFor,
} from '@/lib/b2b';

interface CorporateSectionProps {
  vehicles?: Vehicle[];
}

const LOCALE_DATE_TAG: Record<string, string> = { th: 'th-TH', en: 'en-GB', zh: 'zh-CN' };

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
  const { t, locale } = useLanguage();
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
    route: t('corp.defaultRoute'),
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

  const tierMeta = tierMetaFor(formData.vehicleTier, locale);
  const sizeLabel = `${tierMeta.shortLabel} ${t('corp.carsSuffix', { n: budget.carCount })}`;
  const passengerEstimate = `${budget.carCount * 9} ${t('corp.paxUnit', { n: budget.carCount })}`;

  const totalVehicles = vehicles.length;
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
        vehicleTier: formData.vehicleTier,
        carCount,
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
          vehicleLabel: t('corp.dlVehicle', { spec: tierMeta.specLine, n: carCount }),
          detail:
            `${t('corp.dlIntro', { company: formData.companyName, route: formData.route })} | ` +
            `${t('corp.dlTier', { tier: tierMeta.label, tagline: tierMeta.tagline })} | ` +
            `${t('corp.dlCars', { n: carCount })} | ` +
            `${t('corp.dlOrg', { org: orgTypeLabel(formData.orgType, locale), days: formData.totalDays })} | ` +
            `${t('corp.dlIns', { ins: formData.includeInsurance ? t('corp.insCover') : t('corp.insNone') })} | ` +
            `${t('corp.dlTax', { tax: formData.needsTaxInvoice ? t('corp.yes') : t('corp.no') })} | ` +
            `${t('corp.dlContact', { name: formData.contactName || '-', phone: formData.phone })}`,
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
        {t('corp.tierPick')}
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {VEHICLE_TIER_OPTIONS.map((key) => {
          const meta = tierMetaFor(key, locale);
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
                {t('corp.rateFmt', { min: formatBaht(meta.rateMin), max: formatBaht(meta.rateMax) })}
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
      className="w-full scroll-mt-20 sm:scroll-mt-24 py-6 sm:py-8 bg-[#0a192f] text-white border-t border-b border-slate-800 rounded-none transition-colors"
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
                {t('corp.intro')}
              </p>
            </div>

            {/* Features 4 Grid: 2-Col on Mobile & Desktop */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="bg-slate-800/60 border border-slate-700 p-2.5 sm:p-3.5 rounded-none">
                <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold mb-1">
                  <span className="material-symbols-outlined text-[15px]">verified_user</span>
                  <span className="truncate">{t('corp.f1Title')}</span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300 font-light line-clamp-2">
                  {t('corp.f1Desc')}
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700 p-2.5 sm:p-3.5 rounded-none">
                <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold mb-1">
                  <span className="material-symbols-outlined text-[15px]">receipt_long</span>
                  <span className="truncate">{t('corp.f2Title')}</span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300 font-light line-clamp-2">
                  {t('corp.f2Desc')}
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700 p-2.5 sm:p-3.5 rounded-none">
                <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold mb-1">
                  <span className="material-symbols-outlined text-[15px]">radio</span>
                  <span className="truncate">{t('corp.f3Title')}</span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300 font-light line-clamp-2">
                  {t('corp.f3Desc')}
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700 p-2.5 sm:p-3.5 rounded-none">
                <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold mb-1">
                  <span className="material-symbols-outlined text-[15px]">savings</span>
                  <span className="truncate">{t('corp.f4Title')}</span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300 font-light line-clamp-2">
                  {t('corp.f4Desc')}
                </p>
              </div>
            </div>

            {/* Proof Metrics */}
            <div className="flex items-center gap-6 pt-1 font-mono">
              <div>
                <span className="text-2xl font-black text-white block">
                  {totalVehicles > 0 ? `${totalVehicles}+` : '500+'}
                </span>
                <span className="text-[11px] text-slate-400 font-sans">{t('corp.statFleet')}</span>
              </div>
              <div className="h-8 w-px bg-slate-700"></div>
              <div>
                <span className="text-2xl font-black text-amber-400 block">{avgRating} ★</span>
                <span className="text-[11px] text-slate-400 font-sans">{t('corp.statOrgRating')}</span>
              </div>
              <div className="h-8 w-px bg-slate-700"></div>
              <div>
                <span className="text-2xl font-black text-emerald-400 block">
                  0%
                </span>
                <span className="text-[11px] text-slate-400 font-sans">{t('corp.statFee')}</span>
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
                  {t('corp.calcTitle')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('corp.calcSub')}
                </p>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1 shrink-0 rounded-none"
              >
                <span>{isMobileFormOpen ? t('corp.collapseForm') : t('corp.calcBtn')}</span>
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
                      <span>{t('corp.viewEstimate')}</span>
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
                        {t('corp.calcTitle')}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('corp.calcSub')}
                      </p>
                    </div>
                    <span className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5 border border-emerald-300 dark:border-emerald-700 rounded-none">
                      {t('corp.reply15')}
                    </span>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Vehicle Tier Switcher */}
                    {tierSelector}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="corp-company-name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('corp.fCompanyLabel')}
                        </label>
                        <input
                          id="corp-company-name"
                          type="text"
                          required
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          placeholder={t('corp.fCompanyEx')}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-slate-900 rounded-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="corp-phone" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('corp.fPhoneLabel')}
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
                          {t('corp.fContactName')}
                        </label>
                        <input
                          id="corp-contact-name"
                          type="text"
                          value={formData.contactName}
                          onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                          placeholder={t('corp.fContactEx')}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-slate-900 rounded-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="corp-org-type" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('corp.fOrgType')}
                        </label>
                        <select
                          id="corp-org-type"
                          value={formData.orgType}
                          onChange={(e) => setFormData({ ...formData, orgType: e.target.value as OrgType })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-slate-900 cursor-pointer rounded-none"
                        >
                          {ORG_TYPE_OPTIONS.map((key) => (
                            <option key={key} value={key}>
                              {orgTypeLabel(key, locale)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="corp-route" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('corp.fRouteLabel')}
                        </label>
                        <input
                          id="corp-route"
                          type="text"
                          required
                          value={formData.route}
                          onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                          placeholder={t('corp.fRouteEx')}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-slate-900 rounded-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="corp-car-count" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('corp.fCarCount', { min: MIN_CAR_COUNT, max: MAX_CAR_COUNT })}
                        </label>
                        <div className="flex items-stretch">
                          <button
                            type="button"
                            aria-label={t('corp.decCar')}
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
                            aria-label={t('corp.incCar')}
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
                          {t('corp.fDuration')}
                        </label>
                        <select
                          id="corp-total-days"
                          value={formData.totalDays}
                          onChange={(e) => setFormData({ ...formData, totalDays: Number(e.target.value) })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-slate-900 cursor-pointer rounded-none"
                        >
                          <option value={1}>{t('corp.days1')}</option>
                          <option value={2}>{t('corp.days2')}</option>
                          <option value={3}>{t('corp.days3')}</option>
                          <option value={4}>{t('corp.days4')}</option>
                          <option value={5}>{t('corp.days5')}</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="corp-travel-date" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('corp.fDateRange')}
                        </label>
                        <TravelDatePicker
                          id="corp-travel-date"
                          value={formData.travelDate}
                          onChange={(dateStr) => setFormData({ ...formData, travelDate: dateStr })}
                          days={formData.totalDays}
                          onDaysChange={(newDays) => setFormData({ ...formData, totalDays: newDays })}
                          placeholder={t('corp.fDateEx')}
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
                        {t('corp.wantTax')}
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
                        {t('corp.addInsurance')}
                      </label>
                    </div>

                    {/* Dynamic Estimated Total Box (Sharp Geometric) */}
                    <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 p-3.5 flex items-center justify-between gap-3 rounded-none">
                      <div>
                        <span className="text-[11px] text-amber-900 dark:text-amber-300 font-bold block">
                          {t('corp.estRental', { days: formData.totalDays, tier: tierMeta.shortLabel, cars: budget.carCount })}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {t('corp.rateDirect', { min: formatBaht(tierMeta.rateMin), max: formatBaht(tierMeta.rateMax) })}
                        </span>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <span className="text-lg sm:text-xl font-black text-slate-950 dark:text-amber-400">
                          ฿{formatBaht(budget.rentalLow)} - {formatBaht(budget.rentalHigh)}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">
                          {t('corp.exclFuel')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(true)}
                      className="w-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs py-2.5 border border-slate-400 dark:border-slate-600 transition-colors flex items-center justify-center gap-1.5 rounded-none cursor-pointer"
                    >
                      <ClipboardList className="w-4 h-4" />
                      <span>{t('corp.viewEstBtn')}</span>
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
                          <span>{t('corp.sending')}</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[17px]">send</span>
                          <span>{t('corp.sendRfq')}</span>
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
                  {t('corp.docQuoteTitle')}
                </p>
              </div>
              <div className="text-right text-[11px] text-slate-600 dark:text-slate-300 font-mono leading-relaxed">
                <div>{t('corp.docNo', { ref: docRef })}</div>
                <div>
                  {t('corp.docDate')}{' '}
                  {new Date().toLocaleDateString(LOCALE_DATE_TAG[locale] ?? 'th-TH', {
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
                  <span className="text-slate-500 dark:text-slate-400">{t('corp.docCompany')}</span>
                  <span className="font-bold text-right">{formData.companyName || '-'}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-dotted border-slate-200 dark:border-slate-700 pb-1">
                  <span className="text-slate-500 dark:text-slate-400">{t('corp.docContact')}</span>
                  <span className="font-bold text-right">
                    {formData.contactName || '-'} {formData.phone ? `(${formData.phone})` : ''}
                  </span>
                </div>
                <div className="flex justify-between gap-2 border-b border-dotted border-slate-200 dark:border-slate-700 pb-1">
                  <span className="text-slate-500 dark:text-slate-400">{t('corp.docRoute')}</span>
                  <span className="font-bold text-right">{formData.route}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-dotted border-slate-200 dark:border-slate-700 pb-1">
                  <span className="text-slate-500 dark:text-slate-400">{t('corp.docTravelDate')}</span>
                  <span className="font-bold text-right">
                    {formData.travelDate || t('corp.dDateQuote')} ({t('corp.daysSuffix', { n: formData.totalDays })})
                  </span>
                </div>
                <div className="flex justify-between gap-2 border-b border-dotted border-slate-200 dark:border-slate-700 pb-1">
                  <span className="text-slate-500 dark:text-slate-400">{t('corp.docCars')}</span>
                  <span className="font-bold text-right">{t('corp.carsSuffix', { n: budget.carCount })}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-dotted border-slate-200 dark:border-slate-700 pb-1">
                  <span className="text-slate-500 dark:text-slate-400">{t('corp.docVehicleType')}</span>
                  <span className="font-bold text-right">{tierMeta.specLine}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-dotted border-slate-200 dark:border-slate-700 pb-1">
                  <span className="text-slate-500 dark:text-slate-400">{t('corp.docOrgType')}</span>
                  <span className="font-bold text-right">{orgTypeLabel(formData.orgType, locale)}</span>
                </div>
                <div className="flex justify-between gap-2 border-b border-dotted border-slate-200 dark:border-slate-700 pb-1">
                  <span className="text-slate-500 dark:text-slate-400">{t('corp.docInsurance')}</span>
                  <span className="font-bold text-right">
                    {formData.includeInsurance ? t('corp.insCover') : t('corp.insNone')}
                  </span>
                </div>
              </div>

              {/* Cost breakdown */}
              <table className="w-full text-xs border border-slate-200 dark:border-slate-700 print:border-slate-400">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <th className="text-left font-bold px-3 py-2">{t('corp.tblItem')}</th>
                    <th className="text-right font-bold px-3 py-2 w-40">{t('corp.tblAmount')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2">
                      <span className="font-bold">{t('corp.tblRental')}</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                        {t('corp.tblRentalDetail', {
                          tier: tierMeta.label,
                          min: formatBaht(tierMeta.rateMin),
                          max: formatBaht(tierMeta.rateMax),
                          cars: budget.carCount,
                          days: budget.days,
                        })}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold">{formatBaht(budget.rentalTotal)}</td>
                  </tr>
                  <tr className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2">
                      <span className="font-bold">{t('corp.tblFuel')}</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                        {t('corp.tblFuelDetail', { per: formatBaht(FUEL_PER_CAR_PER_DAY) })}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold">{formatBaht(budget.fuelTotal)}</td>
                  </tr>
                  <tr className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2">
                      <span className="font-bold">{t('corp.tblIns')}</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                        {formData.includeInsurance ? t('corp.tblInsCoverD') : t('corp.tblInsNoneD')}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold">
                      {formData.includeInsurance ? t('corp.tblInsIncluded') : '-'}
                    </td>
                  </tr>
                  <tr className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    <td className="px-3 py-2 font-bold">{t('corp.tblSubtotal')}</td>
                    <td className="px-3 py-2 text-right font-mono font-black">{formatBaht(budget.subtotal)}</td>
                  </tr>
                  <tr className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-3 py-2 text-rose-600 dark:text-rose-400">
                      {t('corp.tblWht')}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      -{formatBaht(budget.withholdingTax)}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-slate-900 dark:border-slate-200 print:border-black">
                    <td className="px-3 py-2.5 font-black">{t('corp.tblNet')}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-black text-base text-amber-600 dark:text-amber-400 print:text-black">
                      {formatBaht(budget.netAfterWithholding)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Terms */}
              <div className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 space-y-1">
                <p className="font-bold text-slate-700 dark:text-slate-300">{t('corp.termsTitle')}</p>
                <p>{t('corp.term1')}</p>
                <p>{t('corp.term2')}</p>
                <p>
                  {formData.needsTaxInvoice ? t('corp.term3Tax') : t('corp.term3NoTax')}
                </p>
                <p>{t('corp.term4')}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 dark:border-slate-700 print:hidden">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none cursor-pointer"
              >
                {t('corp.close')}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 text-xs font-black bg-slate-950 hover:bg-slate-800 text-white border border-slate-950 rounded-none cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>{t('corp.printSave')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
