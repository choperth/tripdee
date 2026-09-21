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
      className="fixed inset-0 z-[400] flex items-center justify-center p-3 sm:p-4 bg-ink/65 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="td-elev-lift relative w-full max-w-4xl rounded-modal bg-card p-5 sm:p-7 text-ink my-6 max-h-[94vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label={t('padm.close')}
          className="absolute top-5 right-5 grid h-9 w-9 place-items-center rounded-full bg-paper-2 text-ink hover:bg-rule transition-transform active:scale-95"
        >
          <X className="h-4.5 w-4.5" strokeWidth={2.5} />
        </button>

        {/* Portal Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5 pr-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sun text-sun-ink font-extrabold shadow-sm">
              <Crown className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <div>
              <h2 id="admin-portal-title" className="font-display text-2xl font-extrabold text-ink">
                {t('padm.title')}
              </h2>
              <p className="text-xs font-bold text-ink-2">
                {t('padm.tagline')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-berry hover:underline"
          >
            <LogOut className="h-4 w-4" />
            <span>{t('padm.logout')}</span>
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="mb-6 flex gap-1.5 border-b-2 border-rule pb-2 overflow-x-auto scrollbar-none">
          {/* Tab 1: Vehicles */}
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-xs font-extrabold transition-colors whitespace-nowrap ${
              activeTab === 'vehicles' ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink hover:bg-paper'
            }`}
          >
            <CarFront className="h-3.5 w-3.5" />
            <span>{t('padm.tabVehicles', { n: vehicles.length })}</span>
          </button>

          {/* Tab 2: Driver Leads */}
          <button
            onClick={() => setActiveTab('verifications')}
            className={`flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-xs font-extrabold transition-colors whitespace-nowrap ${
              activeTab === 'verifications' ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink hover:bg-paper'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>{t('padm.tabDrivers', { n: pendingDriversCount })}</span>
            {pendingDriversCount > 0 && (
              <span className="h-2 w-2 rounded-full bg-sun animate-pulse" />
            )}
          </button>

          {/* Tab 3: Corporate Quotes */}
          <button
            onClick={() => setActiveTab('quotations')}
            className={`flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-xs font-extrabold transition-colors whitespace-nowrap ${
              activeTab === 'quotations' ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink hover:bg-paper'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{t('padm.tabQuotesLive', { n: quoteLeads.length })}</span>
            {pendingQuotesCount > 0 && (
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            )}
          </button>

          {/* Tab 4: Trip Board */}
          <button
            onClick={() => setActiveTab('board')}
            className={`flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-xs font-extrabold transition-colors whitespace-nowrap ${
              activeTab === 'board' ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink hover:bg-paper'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{t('padm.tabBoard', { n: boardPosts.length })}</span>
          </button>

          {/* Tab 5: Sponsors */}
          <button
            onClick={() => setActiveTab('sponsors')}
            className={`flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-xs font-extrabold transition-colors whitespace-nowrap ${
              activeTab === 'sponsors' ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink hover:bg-paper'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>{t('padm.tabSponsorsLive', { n: sponsors.length || SPONSORS.length })}</span>
          </button>

          {/* Tab 6: Analytics */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-xs font-extrabold transition-colors whitespace-nowrap ${
              activeTab === 'analytics' ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink hover:bg-paper'
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

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-paper p-4">
                <div className="flex items-center justify-between text-xs font-bold text-ink-2">
                  <span>{t('padm.statCalls')}</span>
                  <PhoneCall className="h-4 w-4 text-leaf" />
                </div>
                <p className="td-fig mt-2 text-2xl font-extrabold text-ink">
                  {summary.totalCallClicks}
                </p>
              </div>

              <div className="rounded-2xl bg-paper p-4">
                <div className="flex items-center justify-between text-xs font-bold text-ink-2">
                  <span>{t('padm.statSponsor')}</span>
                  <MousePointerClick className="h-4 w-4 text-berry" />
                </div>
                <p className="td-fig mt-2 text-2xl font-extrabold text-ink">
                  {summary.totalSponsorClicks}
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
                  const lastTime = summary.sponsorStats[s.id]?.lastClickedAt;
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
                        <span className="td-fig inline-block rounded-pill bg-berry-soft px-3 py-1 font-extrabold text-xs text-berry">
                          {t('padm.sponsorClicks', { n: count })}
                        </span>
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
                          {t('padm.sponsorClicks', { n: target.clicks })}
                        </span>
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

      {/* Sponsor Report 1-Page Modal */}
      <SponsorReportModal
        sponsor={reportSponsor}
        isOpen={!!reportSponsor}
        onClose={() => setReportSponsor(null)}
      />
    </div>
  );
};
