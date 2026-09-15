'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import { SPONSORS, Sponsor } from '@/data/mockData';
import { DriverLead, QuotationLead } from '@/lib/leadsStore';
import { X, Crown, Check, LogOut, CheckCircle2, MousePointerClick, PhoneCall, BarChart3, Trash2, ArrowUpRight, FileSpreadsheet, Activity, Users, CarFront, LayoutDashboard } from 'lucide-react';
import { SponsorReportModal } from '@/components/SponsorReportModal';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({ isOpen, onClose }) => {
  const { user, quotations, approveDriverVerification, logout } = useAuth();
  const { t } = useLanguage();
  const { summary, getSponsorClickCount, trackCall, resetAnalytics } = useAnalytics();
  const [activeTab, setActiveTab] = useState<'verifications' | 'sponsors' | 'quotations' | 'analytics'>('verifications');
  const [approvedDrivers, setApprovedDrivers] = useState<string[]>([]);
  const [reportSponsor, setReportSponsor] = useState<Sponsor | null>(null);
  const [driverLeads, setDriverLeads] = useState<DriverLead[]>([]);
  const [quoteLeads, setQuoteLeads] = useState<QuotationLead[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/leads/quote')
      .then((res) => res.json())
      .then((data) => {
        if (data.quotations) setQuoteLeads(data.quotations);
      })
      .catch(() => {});

    fetch('/api/leads/driver')
      .then((res) => res.json())
      .then((data) => {
        if (data.drivers) setDriverLeads(data.drivers);
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleApprove = async (driverId: string) => {
    approveDriverVerification(driverId);
    setApprovedDrivers((prev) => [...prev, driverId]);
    setDriverLeads((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, status: 'verified' } : d))
    );
    try {
      await fetch('/api/leads/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', id: driverId }),
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
      }
    } catch (err) {
      console.error('Error approving driver:', err);
    }
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
          aria-label={t('padm.close')}
          className="absolute top-5 right-5 grid h-9 w-9 place-items-center rounded-full bg-paper-2 text-ink transition-transform"
        >
          <X className="h-4.5 w-4.5" strokeWidth={2.5} />
        </button>

        {/* Portal Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pr-8">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sun text-sun-ink font-extrabold">
              <Crown className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <div>
              <h2 className="font-display text-2xl font-extrabold text-ink">
                {t('padm.title')}
              </h2>
              <p className="text-xs font-bold text-ink-2">
                {t('padm.subtitle')}
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

        {/* Sub-tabs */}
        <div className="mb-6 flex gap-2 border-b-2 border-rule pb-2">
          <button
            onClick={() => setActiveTab('verifications')}
            className={`rounded-pill px-4 py-1.5 text-xs font-extrabold transition-colors ${
              activeTab === 'verifications' ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {t('padm.tabVerif')}
          </button>
          <button
            onClick={() => setActiveTab('sponsors')}
            className={`rounded-pill px-4 py-1.5 text-xs font-extrabold transition-colors ${
              activeTab === 'sponsors' ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {t('padm.tabSponsors', { n: SPONSORS.length })}
          </button>
          <button
            onClick={() => setActiveTab('quotations')}
            className={`rounded-pill px-4 py-1.5 text-xs font-extrabold transition-colors ${
              activeTab === 'quotations' ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {t('padm.tabQuotes', { n: quotations.length })}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`rounded-pill px-4 py-1.5 text-xs font-extrabold transition-colors flex items-center gap-1.5 ${
              activeTab === 'analytics' ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            {t('padm.tabAnalytics', { n: summary.totalEvents })}
          </button>
        </div>

        {/* Tab 1: Driver Verifications */}
        {activeTab === 'verifications' && (
          <div className="space-y-4">
            <p className="text-xs text-ink-2 font-medium">
              {t('padm.verifIntroA')}{' '}<strong>{t('padm.verifIntroB')}</strong>{t('padm.verifIntroC')}
            </p>

            {driverLeads.length === 0 ? (
              <p className="text-xs text-ink-2 italic p-4 text-center rounded-2xl bg-paper">
                ไม่มีข้อมูลคนขับที่รอตรวจสอบ
              </p>
            ) : (
              driverLeads.map((drv) => {
                const isApproved = drv.status === 'verified' || approvedDrivers.includes(drv.id);
                return (
                  <div key={drv.id} className="rounded-2xl bg-paper p-4 border border-rule/70">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-extrabold text-sm text-ink">{drv.driverName} ({drv.nickname})</h4>
                        <p className="text-xs text-ink-2">{drv.vehicleModel} {drv.seats} ที่นั่ง {drv.plateNumber ? `(${drv.plateNumber})` : ''}</p>
                      </div>
                      <span className={`rounded-pill px-2.5 py-0.5 text-xs font-extrabold ${isApproved ? 'bg-leaf-soft text-leaf' : 'bg-sun-soft text-sun-ink'}`}>
                        {isApproved ? 'อนุมัติตราแล้ว' : t('padm.pendingBadge')}
                      </span>
                    </div>

                    <div className="my-3 space-y-1.5 rounded-xl border border-rule bg-card p-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-ink-2">เส้นทางที่ชำนาญ:</span>
                        <span className="font-bold text-ink">{drv.routes || 'เชียงใหม่และใกล้เคียง'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-2">LINE ID:</span>
                        <span className="font-mono text-accent-deep">{drv.lineId || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-2">{t('padm.docPhone')}</span>
                        <span className="font-mono font-bold text-ink">{drv.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <a
                        href={`tel:${drv.phone}`}
                        onClick={() => {
                          trackCall({
                            targetType: 'admin_fleet',
                            targetId: drv.id,
                            targetTitle: `โทรหาคนขับสมัครใหม่: ${drv.nickname}`,
                            phoneNumber: drv.phone,
                          });
                        }}
                        className="text-xs font-bold text-accent-deep hover:underline inline-flex items-center gap-1"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        โทรสัมภาษณ์คนขับ
                      </a>
                      {isApproved ? (
                        <span className="flex items-center gap-1 text-xs font-extrabold text-leaf">
                          <CheckCircle2 className="h-4 w-4" />
                          {t('padm.approved')}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApprove(drv.id)}
                          className="td-btn td-pop inline-flex items-center gap-1.5 rounded-pill bg-leaf px-4 py-1.5 text-xs font-extrabold text-white"
                        >
                          <Check className="h-4 w-4" strokeWidth={3} />
                          <span>{t('padm.approve')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Sponsors */}
        {activeTab === 'sponsors' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase text-ink-2">{t('padm.sponsorsLive')}</span>
              <button
                onClick={() => alert(t('padm.addSponsorAlert'))}
                className="td-btn rounded-pill bg-sun px-3 py-1 text-xs font-extrabold text-sun-ink"
              >
                {t('padm.addSponsor')}
              </button>
            </div>

            {/* Ad Placement Positions Overview Card */}
            <div className="rounded-2xl border border-rule bg-card p-4">
              <h4 className="text-xs font-extrabold uppercase text-ink flex items-center gap-1.5 mb-2.5">
                <LayoutDashboard className="h-4 w-4 text-accent" />
                <span>ผังตำแหน่งพื้นที่โฆษณา TripDee (Ad Slots Inventory)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="rounded-xl border border-rule bg-paper p-2.5">
                  <div className="flex items-center justify-between font-extrabold text-ink mb-1">
                    <span>1. แถบด้านข้าง Sticky</span>
                    <span className="rounded bg-leaf-soft px-1.5 py-0.5 text-[10px] text-leaf font-black">แสดงผลอยู่</span>
                  </div>
                  <p className="text-[11px] text-ink-2">แสดงเคียงข้างการ์ดรถตู้ทุกคันบนจอคอมพิวเตอร์ ยอดเห็นสูงสุด</p>
                  <p className="mt-1 font-bold text-accent">เรต: ฿2,000/เดือน</p>
                </div>

                <div className="rounded-xl border border-rule bg-paper p-2.5">
                  <div className="flex items-center justify-between font-extrabold text-ink mb-1">
                    <span>2. หัวเว็บ (Hero Split)</span>
                    <span className="rounded bg-leaf-soft px-1.5 py-0.5 text-[10px] text-leaf font-black">แสดงผลอยู่</span>
                  </div>
                  <p className="text-[11px] text-ink-2">ป้ายแบนเนอร์ใหญ่ใต้แถบค้นหา เด่นชัดทุกสายตา</p>
                  <p className="mt-1 font-bold text-accent">เรต: ฿3,500/เดือน</p>
                </div>

                <div className="rounded-xl border border-rule bg-paper p-2.5">
                  <div className="flex items-center justify-between font-extrabold text-ink mb-1">
                    <span>3. แถบยาว (In-Feed)</span>
                    <span className="rounded bg-sun-soft px-1.5 py-0.5 text-[10px] text-ink font-black">เปิดรับจอง</span>
                  </div>
                  <p className="text-[11px] text-ink-2">แบนเนอร์คั่นกลางหน้าเว็บ เหมาะกับบริการซ่อมบำรุง/ของฝาก</p>
                  <p className="mt-1 font-bold text-accent">เรต: ฿1,500/เดือน</p>
                </div>
              </div>
            </div>

            {SPONSORS.map((s) => (
              <div key={s.id} className="rounded-2xl bg-paper p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={s.image} alt={s.title} className="h-12 w-16 rounded-xl border border-rule object-cover" />
                  <div>
                    <h5 className="font-extrabold text-xs text-ink">{s.title}</h5>
                    <p className="text-[11px] text-ink-2">{s.categoryLabel} • {s.location}</p>
                    <span className="text-[10px] font-bold text-accent-deep">{s.badgeText}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-pill bg-leaf-soft px-2.5 py-0.5 text-[11px] font-extrabold text-leaf">
                      {t('padm.live')}
                    </span>
                    <span className="rounded-pill bg-sun-soft px-2.5 py-0.5 text-[11px] font-extrabold text-ink flex items-center gap-1">
                      <MousePointerClick className="h-3 w-3 text-ink-2" />
                      {t('padm.sponsorClicks', { n: getSponsorClickCount(s.id) })}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReportSponsor(s)}
                    className="td-btn td-pop inline-flex items-center gap-1 rounded-pill bg-berry-soft px-3 py-1 text-[11px] font-extrabold text-berry hover:bg-berry hover:text-white transition-colors"
                  >
                    <FileSpreadsheet className="h-3 w-3" />
                    สร้างรายงาน 1 หน้า
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Quotations */}
        {activeTab === 'quotations' && (
          <div className="space-y-3">
            {quoteLeads.length === 0 ? (
              <p className="text-xs text-ink-2 italic p-4 text-center rounded-2xl bg-paper">
                ยังไม่มีคำขอใบเสนอราคาใหม่
              </p>
            ) : (
              quoteLeads.map((q) => (
                <div key={q.id} className="rounded-2xl bg-paper p-3.5 border border-rule/70">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-ink">{q.companyName}</span>
                    <span className="font-extrabold text-xs text-accent-deep">฿{q.estimatedPrice.toLocaleString('th-TH')}</span>
                  </div>
                  <p className="text-xs text-ink-2 mb-2">{q.route} ({q.passengers})</p>
                  <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-rule">
                    <span className="text-ink-2 font-mono">
                      {new Date(q.submittedAt).toLocaleDateString('th-TH')}
                    </span>
                    <a
                      href={`tel:${q.phone}`}
                      onClick={() => {
                        trackCall({
                          targetType: 'admin_fleet',
                          targetId: q.id,
                          targetTitle: `งานองค์กร: ${q.companyName}`,
                          phoneNumber: q.phone,
                        });
                      }}
                      className="font-bold text-accent-deep hover:underline inline-flex items-center gap-1"
                    >
                      <PhoneCall className="h-3 w-3" />
                      โทรประสานงาน ({q.phone})
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Analytics Click Counter */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-rule">
              <div>
                <h3 className="text-sm font-extrabold text-ink flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-accent-deep" />
                  {t('padm.analyticsTitle')}
                </h3>
                <p className="text-xs text-ink-2 mt-0.5">
                  {t('padm.analyticsSubtitle')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(t('padm.resetConfirm'))) {
                    resetAnalytics();
                  }
                }}
                className="td-btn inline-flex items-center gap-1 rounded-pill border border-rule bg-card px-3 py-1 text-xs font-extrabold text-berry hover:bg-berry-soft transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('padm.resetStats')}
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-paper p-4">
                <div className="flex items-center justify-between text-xs font-bold text-ink-2">
                  <span>{t('padm.statSponsorClicks')}</span>
                  <MousePointerClick className="h-4 w-4 text-berry" />
                </div>
                <p className="td-fig mt-2 text-2xl font-extrabold text-ink">
                  {summary.totalSponsorClicks}
                </p>
              </div>

              <div className="rounded-2xl bg-paper p-4">
                <div className="flex items-center justify-between text-xs font-bold text-ink-2">
                  <span>{t('padm.statCallClicks')}</span>
                  <PhoneCall className="h-4 w-4 text-leaf" />
                </div>
                <p className="td-fig mt-2 text-2xl font-extrabold text-ink">
                  {summary.totalCallClicks}
                </p>
              </div>

              <div className="rounded-2xl bg-paper p-4">
                <div className="flex items-center justify-between text-xs font-bold text-ink-2">
                  <span>{t('padm.statTotalEvents')}</span>
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
                {SPONSORS.map((s) => {
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
                          รายงาน 1 หน้า
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

            {/* Recent Activity Log */}
            <div className="rounded-2xl bg-paper p-4 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-ink-2">
                {t('padm.recentActivity')}
              </h4>
              {summary.recentEvents.length === 0 ? (
                <p className="text-xs text-ink-2 italic py-2 text-center">
                  {t('padm.noEvents')}
                </p>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {summary.recentEvents.slice(0, 15).map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between rounded-lg bg-card px-3 py-2 text-xs border border-rule"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {ev.type === 'sponsor_click' ? (
                          <span className="shrink-0 rounded-pill bg-berry-soft px-2 py-0.5 text-[10px] font-extrabold text-berry flex items-center gap-1">
                            <MousePointerClick className="h-2.5 w-2.5" />
                            Sponsor
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-pill bg-leaf-soft px-2 py-0.5 text-[10px] font-extrabold text-leaf flex items-center gap-1">
                            <PhoneCall className="h-2.5 w-2.5" />
                            Call
                          </span>
                        )}
                        <span className="font-bold text-ink truncate text-[11px]">
                          {ev.type === 'sponsor_click'
                            ? ev.sponsorTitle
                            : `${ev.targetTitle} (${ev.phoneNumber})`}
                        </span>
                      </div>
                      <span className="text-[10px] text-ink-2 shrink-0 ml-2 font-mono">
                        {new Date(ev.timestamp).toLocaleTimeString('th-TH')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Option B: GA4 Dual-Tracking Indicator */}
            <div className="rounded-2xl bg-paper p-4 border border-rule space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-ink flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-accent-deep" />
                  Google Analytics 4 (GA4) คู่ขนาน
                </span>
                <span className="rounded-pill bg-leaf-soft px-2.5 py-0.5 text-[11px] font-extrabold text-leaf">
                  พร้อมใช้งาน (Auto Event Sync)
                </span>
              </div>
              <p className="text-ink-2 text-[11px] leading-relaxed">
                ระบบเชื่อมต่อ Event อัตโนมัติ (<code>sponsor_click</code>, <code>call_click</code>) ส่งตรงเข้า Google Analytics 4 สำหรับวัดสถิติระดับสากล เช่น สัดส่วนผู้เข้าชมจาก กทม./ต่างจังหวัด และจำนวนผู้เข้าชมรายเดือน (Unique Visitors)
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
