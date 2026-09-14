'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { X, Briefcase, Download, Printer, Plus, LogOut, Check } from 'lucide-react';

interface CustomerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewQuote: () => void;
}

export const CustomerPortalModal: React.FC<CustomerPortalModalProps> = ({
  isOpen,
  onClose,
  onOpenNewQuote,
}) => {
  const { user, quotations, updateCorporateProfile, logout } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'quotes' | 'taxProfile'>('quotes');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Tax Profile Form State
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [taxId, setTaxId] = useState(user?.taxId || '');
  const [address, setAddress] = useState(user?.companyAddress || '');
  const [branch, setBranch] = useState(user?.branch || t('pcus.branchHq'));

  if (!isOpen || !user) return null;

  const handleSaveTaxProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCorporateProfile({
      companyName,
      taxId,
      companyAddress: address,
      branch,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="td-elev-lift relative w-full max-w-2xl rounded-modal bg-card p-6 sm:p-8 text-ink my-6 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label={t('pcus.close')}
          className="absolute top-5 right-5 grid h-9 w-9 place-items-center rounded-full bg-paper-2 text-ink transition-transform"
        >
          <X className="h-4.5 w-4.5" strokeWidth={2.5} />
        </button>

        {/* Portal Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pr-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-grape text-white font-extrabold">
                <Briefcase className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <div>
                <h2 className="font-display text-2xl font-extrabold text-ink">
                  {t('pcus.title')}
                </h2>
                <p className="text-xs font-bold text-ink-2">
                  {user.companyName || user.name}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenNewQuote();
            }}
            className="td-btn td-pop inline-flex items-center gap-1.5 rounded-pill bg-sun px-3.5 py-1.5 text-xs font-extrabold text-sun-ink"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
            <span>{t('pcus.newQuote')}</span>
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="mb-6 flex gap-2 border-b-2 border-rule pb-2">
          <button
            onClick={() => setActiveTab('quotes')}
            className={`rounded-pill px-4 py-1.5 text-xs font-extrabold transition-colors ${
              activeTab === 'quotes' ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {t('pcus.tabQuotes', { n: quotations.length })}
          </button>
          <button
            onClick={() => setActiveTab('taxProfile')}
            className={`rounded-pill px-4 py-1.5 text-xs font-extrabold transition-colors ${
              activeTab === 'taxProfile' ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {t('pcus.tabTax')}
          </button>
        </div>

        {/* Tab 1: Quotation History */}
        {activeTab === 'quotes' && (
          <div className="space-y-3">
            {quotations.map((q) => (
              <div key={q.id} className="rounded-2xl bg-paper p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-ink-2 bg-paper-2 px-2 py-0.5 rounded border border-rule">
                      {q.id}
                    </span>
                    <span className="text-xs font-bold text-ink-2">{q.date}</span>
                  </div>

                  <span
                    className={`rounded-pill px-2.5 py-0.5 text-[11px] font-extrabold ${
                      q.status === 'confirmed'
                        ? 'bg-leaf-soft text-leaf'
                        : q.status === 'completed'
                        ? 'bg-sky-soft text-sky'
                        : 'bg-sun-soft text-ink'
                    }`}
                  >
                    {q.status === 'confirmed' && t('pcus.stConfirmed')}
                    {q.status === 'completed' && t('pcus.stCompleted')}
                    {q.status === 'pending' && t('pcus.stPending')}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-ink mb-1">{q.route}</h4>
                <p className="text-xs text-ink-2 mb-3">
                  {t('pcus.duration', { days: q.totalDays, pax: q.passengers })}
                  {q.needsTaxInvoice && ' | ' + t('pcus.taxNote')}
                </p>

                <div className="flex items-center justify-between pt-2.5 border-t border-rule">
                  <div>
                    <span className="text-[11px] text-ink-2">{t('pcus.total')}</span>
                    <p className="text-base font-extrabold text-accent-deep">฿{q.estimatedPrice.toLocaleString()}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => alert(t('pcus.printAlert', { id: q.id }))}
                      className="td-btn inline-flex items-center gap-1 rounded-pill bg-card px-3 py-1 text-xs font-extrabold text-ink hover:bg-paper-2"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>{t('pcus.print')}</span>
                    </button>
                    <button
                      onClick={() => alert(t('pcus.pdfAlert', { id: q.id }))}
                      className="td-btn inline-flex items-center gap-1 rounded-pill bg-sun px-3 py-1 text-xs font-extrabold text-sun-ink"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Corporate Tax Profile */}
        {activeTab === 'taxProfile' && (
          <form onSubmit={handleSaveTaxProfile} className="space-y-4">
            <p className="text-xs text-ink-2 font-medium">
              {t('pcus.taxIntro')}
            </p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-extrabold uppercase text-ink-2">
                  {t('pcus.fCompany')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('pcus.fCompanyPh')}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-input bg-paper px-3 py-2 text-sm font-bold text-ink focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-extrabold uppercase text-ink-2">
                    {t('pcus.fTaxId')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0105559088123"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full rounded-input bg-paper px-3 py-2 text-sm font-bold text-ink focus:border-accent"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-extrabold uppercase text-ink-2">
                    {t('pcus.fBranch')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('pcus.fBranchPh')}
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full rounded-input bg-paper px-3 py-2 text-sm font-bold text-ink focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-extrabold uppercase text-ink-2">
                  {t('pcus.fAddr')}
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder={t('pcus.fAddrPh')}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-input bg-paper px-3 py-2 text-sm font-bold text-ink focus:border-accent"
                />
              </div>
            </div>

            {saveSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-leaf-soft p-3 text-xs font-extrabold text-leaf">
                <Check className="h-4 w-4" strokeWidth={3} />
                <span>{t('pcus.savedTax')}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                className="td-btn td-pop rounded-pill bg-grape px-6 py-2.5 text-sm font-extrabold text-white"
              >
                {t('pcus.saveBtn')}
              </button>

              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-berry hover:underline"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('pcus.logout')}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
