'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import { Vehicle, BoardPost, Sponsor, SPONSORS } from '@/data/mockData';
import { DriverLead, QuotationLead } from '@/lib/leadsStore';
import {
  X,
  Crown,
  LogOut,
  CarFront,
  Users,
  FileText,
  MessageSquare,
  Building2,
  BarChart3,
  MousePointerClick,
  PhoneCall,
  Activity,
  FileSpreadsheet,
  ShieldCheck,
} from 'lucide-react';
import { SponsorReportModal } from '@/components/SponsorReportModal';
import { AdminVehicleTab } from './admin/AdminVehicleTab';
import { AdminDriverTab } from './admin/AdminDriverTab';
import { AdminQuoteTab } from './admin/AdminQuoteTab';
import { AdminBoardTab } from './admin/AdminBoardTab';
import { AdminSponsorTab } from './admin/AdminSponsorTab';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminTab = 'vehicles' | 'verifications' | 'quotations' | 'board' | 'sponsors' | 'analytics';

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({ isOpen, onClose }) => {
  const { user, approveDriverVerification, logout } = useAuth();
  const { t } = useLanguage();
  const { summary, getSponsorClickCount, resetAnalytics } = useAnalytics();

  const [activeTab, setActiveTab] = useState<AdminTab>('vehicles');
  const [reportSponsor, setReportSponsor] = useState<Sponsor | null>(null);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [driverLeads, setDriverLeads] = useState<DriverLead[]>([]);
  const [quoteLeads, setQuoteLeads] = useState<QuotationLead[]>([]);
  const [boardPosts, setBoardPosts] = useState<BoardPost[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, { onClose, enabled: isOpen });

  const refreshAll = useCallback(() => {
    fetch('/api/vehicles')
      .then((res) => res.json())
      .then((data) => {
        if (data.vehicles && Array.isArray(data.vehicles)) setVehicles(data.vehicles);
      })
      .catch(() => {});

    fetch('/api/leads/driver')
      .then((res) => res.json())
      .then((data) => {
        if (data.drivers && Array.isArray(data.drivers)) setDriverLeads(data.drivers);
      })
      .catch(() => {});

    fetch('/api/leads/quote')
      .then((res) => res.json())
      .then((data) => {
        if (data.quotations && Array.isArray(data.quotations)) setQuoteLeads(data.quotations);
      })
      .catch(() => {});

    fetch('/api/board')
      .then((res) => res.json())
      .then((data) => {
        if (data.posts && Array.isArray(data.posts)) setBoardPosts(data.posts);
      })
      .catch(() => {});

    fetch('/api/sponsors')
      .then((res) => res.json())
      .then((data) => {
        if (data.sponsors && Array.isArray(data.sponsors)) setSponsors(data.sponsors);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    refreshAll();
  }, [isOpen, refreshAll]);

  if (!isOpen || !user) return null;

  const handleApprove = async (driverId: string) => {
    approveDriverVerification(driverId);
    setDriverLeads((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, status: 'verified' } : d))
    );
    try {
      await fetch('/api/leads/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', id: driverId }),
      });
      refreshAll();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
      }
    } catch (err) {
      console.error('Error approving driver:', err);
    }
  };

  const pendingDriversCount = driverLeads.filter((d) => d.status === 'pending').length;
  const pendingQuotesCount = quoteLeads.filter((q) => q.status === 'pending').length;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-portal-title"
      className="fixed inset-0 z-400 flex items-center justify-center overflow-y-auto bg-navy-deep/75 backdrop-blur-md p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-5xl max-h-[94vh] overflow-y-auto rounded-3xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-800 shadow-2xl text-ink-primary dark:text-slate-100"
      >
        {/* Sticky Header Bar */}
        <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-5 sm:px-7 py-4 sm:py-5 bg-paper-elevated/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-border-subtle dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-400 shadow-xs">
              <Crown className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <h2 id="admin-portal-title" className="font-headline-md text-base sm:text-lg font-bold text-navy-deep dark:text-white leading-tight truncate">
                {t('padm.title')}
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {t('padm.tagline')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors cursor-pointer hover:underline"
            >
              <LogOut className="h-4 w-4" />
              <span>{t('padm.logout')}</span>
            </button>

            <button
              onClick={onClose}
              aria-label={t('padm.close')}
              className="w-9 h-9 rounded-full bg-paper-surface-muted hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 grid place-items-center transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-5 sm:p-7 space-y-6">
        {/* Sub-tabs Segmented Control */}
        <div className="flex p-1.5 rounded-2xl bg-paper-surface-muted dark:bg-slate-800/80 border border-border-subtle dark:border-slate-800 overflow-x-auto scrollbar-none gap-1">
          {/* Tab 1: Vehicles */}
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'vehicles'
                ? 'bg-white dark:bg-slate-900 text-navy-deep dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CarFront className="h-3.5 w-3.5" />
            <span>{t('padm.tabVehicles', { n: vehicles.length })}</span>
          </button>

          {/* Tab 2: Driver Leads */}
          <button
            onClick={() => setActiveTab('verifications')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'verifications'
                ? 'bg-white dark:bg-slate-900 text-navy-deep dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>{t('padm.tabDrivers', { n: pendingDriversCount })}</span>
            {pendingDriversCount > 0 && (
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          {/* Tab 3: Corporate Quotes */}
          <button
            onClick={() => setActiveTab('quotations')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'quotations'
                ? 'bg-white dark:bg-slate-900 text-navy-deep dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{t('padm.tabQuotesLive', { n: quoteLeads.length })}</span>
            {pendingQuotesCount > 0 && (
              <span className="h-2 w-2 rounded-full bg-blue-action animate-pulse" />
            )}
          </button>

          {/* Tab 4: Trip Board */}
          <button
            onClick={() => setActiveTab('board')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'board'
                ? 'bg-white dark:bg-slate-900 text-navy-deep dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{t('padm.tabBoard', { n: boardPosts.length })}</span>
          </button>

          {/* Tab 5: Sponsors */}
          <button
            onClick={() => setActiveTab('sponsors')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sponsors'
                ? 'bg-white dark:bg-slate-900 text-navy-deep dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>{t('padm.tabSponsorsLive', { n: sponsors.length || SPONSORS.length })}</span>
          </button>

          {/* Tab 6: Analytics */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-slate-900 text-navy-deep dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>{t('padm.tabStats')}</span>
          </button>
        </div>
        {/* ============================================================== */}
        {/* TAB CONTENTS */}
        {/* ============================================================== */}

        {/* Tab 1: Vehicles Management */}
        {activeTab === 'vehicles' && (
          <AdminVehicleTab vehicles={vehicles} onRefresh={refreshAll} />
        )}

        {/* Tab 2: Driver Leads */}
        {activeTab === 'verifications' && (
          <AdminDriverTab
            driverLeads={driverLeads}
            onRefresh={refreshAll}
            onApprove={handleApprove}
          />
        )}

        {/* Tab 3: Corporate Quotes */}
        {activeTab === 'quotations' && (
          <AdminQuoteTab quotes={quoteLeads} onRefresh={refreshAll} />
        )}

        {/* Tab 4: Board Posts */}
        {activeTab === 'board' && (
          <AdminBoardTab posts={boardPosts} onRefresh={refreshAll} />
        )}

        {/* Tab 5: Sponsors */}
        {activeTab === 'sponsors' && (
          <AdminSponsorTab
            sponsors={sponsors.length > 0 ? sponsors : SPONSORS}
            onRefresh={refreshAll}
            getSponsorClickCount={getSponsorClickCount}
            onOpenReport={setReportSponsor}
          />
        )}

        {/* Tab 6: Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display font-extrabold text-lg text-ink">
                  {t('padm.analyticsTitle')}
                </h3>
                <p className="text-xs text-ink-2">
                  {t('padm.analyticsSubtitle')}
                </p>
              </div>

              <button
                type="button"
                onClick={resetAnalytics}
                className="rounded-pill bg-berry-soft px-3 py-1.5 text-xs font-bold text-berry hover:bg-berry/20 transition-colors"
              >
                {t('padm.resetStats')}
              </button>
            </div>

            {/* Anti-Fraud Active Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-leaf-soft/40 border border-leaf/20 px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2 text-ink">
                <ShieldCheck className="h-4 w-4 text-leaf shrink-0" />
                <div>
                  <span className="font-extrabold text-leaf">{t('padm.antiFraudActive')}</span>
                  <span className="text-ink-2 ml-1.5 hidden sm:inline">• กรอง IP, Device Fingerprint & บอท 24 ชม.</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-ink-2">
                <span>{t('padm.statSpamBlocked')}:</span>
                <span className="td-fig rounded-pill bg-paper px-2 py-0.5 font-extrabold text-ink border border-rule">
                  {summary.spamBlockedClicks || 0} ครั้ง
                </span>
              </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-paper p-4">
                <div className="flex items-center justify-between text-xs font-bold text-ink-2">
                  <span>{t('padm.statCalls')}</span>
                  <PhoneCall className="h-4 w-4 text-leaf" />
                </div>
                <p className="td-fig mt-2 text-2xl font-extrabold text-ink">
                  {summary.uniqueCallClicks || summary.totalCallClicks}
                  <span className="ml-1 text-xs font-semibold text-leaf">Unique</span>
                </p>
                <p className="mt-1 text-[11px] text-ink-2">
                  {t('padm.statCallClicks')}: {summary.totalCallClicks}
                </p>
              </div>

              <div className="rounded-2xl bg-paper p-4">
                <div className="flex items-center justify-between text-xs font-bold text-ink-2">
                  <span>{t('padm.statSponsor')}</span>
                  <MousePointerClick className="h-4 w-4 text-berry" />
                </div>
                <p className="td-fig mt-2 text-2xl font-extrabold text-ink">
                  {summary.uniqueSponsorClicks || summary.totalSponsorClicks}
                  <span className="ml-1 text-xs font-semibold text-berry">Unique</span>
                </p>
                <p className="mt-1 text-[11px] text-ink-2">
                  {t('padm.statSponsorClicks')}: {summary.totalSponsorClicks}
                </p>
              </div>

              <div className="rounded-2xl bg-paper p-4">
                <div className="flex items-center justify-between text-xs font-bold text-ink-2">
                  <span>{t('padm.statEvents')}</span>
                  <BarChart3 className="h-4 w-4 text-accent-deep" />
                </div>
                <p className="td-fig mt-2 text-2xl font-extrabold text-ink">
                  {summary.totalEvents}
                </p>
                <p className="mt-1 text-[11px] text-ink-2">
                  {t('padm.statSpamBlocked')}: {summary.spamBlockedClicks || 0}
                </p>
              </div>
            </div>

            {/* Sponsor Breakdown */}
            <div className="rounded-2xl bg-paper p-4 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-ink-2">
                {t('padm.sponsorBreakdown')}
              </h4>
              <div className="space-y-2">
                {(sponsors.length > 0 ? sponsors : SPONSORS).map((s) => {
                  const count = getSponsorClickCount(s.id);
                  const sStat = summary.sponsorStats[s.id];
                  const uniqueCount = sStat?.uniqueClicks ?? count;
                  const lastTime = sStat?.lastClickedAt;
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-xl bg-card p-3 border border-rule text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-extrabold text-ink truncate">{s.title}</p>
                        <p className="text-[11px] text-ink-2">{s.categoryLabel} • {s.location}</p>
                        {lastTime && (
                          <p className="text-[10px] text-ink-2 mt-0.5">
                            {t('padm.lastClicked', {
                              time: new Date(lastTime).toLocaleTimeString('th-TH'),
                            })}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div className="text-right">
                          <span className="td-fig inline-block rounded-pill bg-berry-soft px-3 py-1 font-extrabold text-xs text-berry">
                            {t('padm.uniqueClicks', { n: uniqueCount })}
                          </span>
                          <p className="text-[10px] text-ink-2 mt-0.5">รวมกด {count} ครั้ง</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReportSponsor(s)}
                          className="td-btn td-pop inline-flex items-center gap-1 rounded-pill bg-berry px-3 py-1 text-xs font-extrabold text-white shadow-sm"
                        >
                          <FileSpreadsheet className="h-3 w-3" />
                          {t('padm.report1page')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Call Breakdown */}
            {Object.keys(summary.callStats.byTarget).length > 0 && (
              <div className="rounded-2xl bg-paper p-4 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wide text-ink-2">
                  {t('padm.callBreakdown')}
                </h4>
                <div className="space-y-2">
                  {Object.values(summary.callStats.byTarget).map((target) => (
                    <div
                      key={target.targetId}
                      className="flex items-center justify-between rounded-xl bg-card p-3 border border-rule text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-extrabold text-ink truncate">{target.targetTitle}</p>
                        <p className="text-[11px] text-ink-2 font-mono">
                          {target.phoneNumber} {target.driverName ? `(${target.driverName})` : ''}
                        </p>
                        {target.lastClickedAt && (
                          <p className="text-[10px] text-ink-2 mt-0.5">
                            {t('padm.lastClicked', {
                              time: new Date(target.lastClickedAt).toLocaleTimeString('th-TH'),
                            })}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="td-fig inline-block rounded-pill bg-leaf-soft px-3 py-1 font-extrabold text-xs text-leaf">
                          {t('padm.uniqueClicks', { n: target.uniqueClicks ?? target.clicks })}
                        </span>
                        <p className="text-[10px] text-ink-2 mt-0.5">รวมกด {target.clicks} ครั้ง</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Option B: GA4 Dual-Tracking Indicator */}
            <div className="rounded-2xl bg-paper p-4 border border-rule space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-ink flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-accent-deep" />
                  Google Analytics 4 (GA4) Dual-Tracking
                </span>
                <span className="rounded-pill bg-leaf-soft px-2.5 py-0.5 text-[11px] font-extrabold text-leaf">
                  {t('padm.gaReady')}
                </span>
              </div>
              <p className="text-ink-2 text-[11px] leading-relaxed">
                {t('padm.gaDesc')}
              </p>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Sponsor Report 1-Page Modal */}
      <SponsorReportModal
        sponsor={reportSponsor}
        isOpen={!!reportSponsor}
        onClose={() => setReportSponsor(null)}
      />
    </div>
  );
};
