'use client';

import React, { useState } from 'react';
import { DriverLead } from '@/lib/leadsStore';
import { Check, CheckCircle2, Pencil, PhoneCall, Trash2, Search } from 'lucide-react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';
import { AdminDeleteModal } from './AdminDeleteModal';

interface AdminDriverTabProps {
  driverLeads: DriverLead[];
  onRefresh: () => void;
  onApprove: (id: string) => void;
}

export const AdminDriverTab: React.FC<AdminDriverTabProps> = ({
  driverLeads,
  onRefresh,
  onApprove,
}) => {
  const { trackCall } = useAnalytics();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDriver, setEditingDriver] = useState<DriverLead | null>(null);
  const [deletingDriver, setDeletingDriver] = useState<DriverLead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = driverLeads.filter((d) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      d.driverName.toLowerCase().includes(q) ||
      d.nickname.toLowerCase().includes(q) ||
      d.phone.includes(q) ||
      d.routes.toLowerCase().includes(q) ||
      d.vehicleModel.toLowerCase().includes(q)
    );
  });

  const handleDelete = async () => {
    if (!deletingDriver) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/leads/driver', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingDriver.id }),
      });
      setDeletingDriver(null);
      onRefresh();
    } catch (err) {
      console.error('Error deleting driver lead:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDriver = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDriver) return;
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const updates = {
      id: editingDriver.id,
      driverName: formData.get('driverName') as string,
      nickname: formData.get('nickname') as string,
      phone: formData.get('phone') as string,
      lineId: formData.get('lineId') as string,
      vehicleModel: formData.get('vehicleModel') as string,
      seats: formData.get('seats') as string,
      plateNumber: (formData.get('plateNumber') as string) || undefined,
      routes: formData.get('routes') as string,
      status: formData.get('status') as 'pending' | 'verified' | 'rejected',
    };

    try {
      await fetch('/api/leads/driver', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      setEditingDriver(null);
      onRefresh();
    } catch (err) {
      console.error('Error updating driver lead:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-paper p-3 rounded-2xl border border-rule">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-2" />
          <input
            type="text"
            placeholder={t('padm.driverSearchPh')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-card border border-rule text-xs focus:outline-accent"
          />
        </div>
        <span className="text-xs font-extrabold text-ink-2">
          {t('padm.driverTotal', { n: filtered.length })}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-ink-2 italic p-6 text-center rounded-2xl bg-paper">
          {t('padm.driverEmpty')}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((drv) => {
            const isApproved = drv.status === 'verified';
            return (
              <div key={drv.id} className="rounded-2xl bg-paper p-4 border border-rule/80">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-ink">{drv.driverName} ({drv.nickname})</h4>
                      <span className={`rounded-pill px-2.5 py-0.5 text-[10px] font-extrabold ${
                        isApproved ? 'bg-leaf-soft text-leaf' : 'bg-sun-soft text-sun-ink'
                      }`}>
                        {isApproved ? t('padm.driverApproved') : t('padm.driverPendingDoc')}
                      </span>
                    </div>
                    <p className="text-xs text-ink-2 mt-0.5">
                      {t('padm.driverMeta', { model: drv.vehicleModel, seats: drv.seats })}{' '}
                      {drv.plateNumber ? t('padm.driverPlate', { plate: drv.plateNumber }) : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingDriver(drv)}
                      className="grid h-7 w-7 place-items-center rounded-lg bg-card hover:bg-paper-2 text-ink border border-rule transition-transform active:scale-95"
                      title={t('padm.editDriverTitle')}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingDriver(drv)}
                      className="grid h-7 w-7 place-items-center rounded-lg bg-berry-soft hover:bg-berry/20 text-berry transition-transform active:scale-95"
                      title={t('padm.rejectDriverTitle')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="my-3 space-y-1.5 rounded-xl border border-rule bg-card p-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink-2">{t('padm.driverRoutes')}</span>
                    <span className="font-bold text-ink">{drv.routes || t('padm.driverDefaultRoutes')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-2">LINE ID:</span>
                    <span className="font-mono text-accent-deep">{drv.lineId || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-2">{t('padm.driverPhoneLabel')}</span>
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
                        targetTitle: t('padm.callInterviewTitle', { name: drv.nickname }),
                        phoneNumber: drv.phone,
                      });
                    }}
                    className="text-xs font-bold text-accent-deep hover:underline inline-flex items-center gap-1"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    {t('padm.callInterview')}
                  </a>

                  {isApproved ? (
                    <span className="flex items-center gap-1 text-xs font-extrabold text-leaf">
                      <CheckCircle2 className="h-4 w-4" />
                      {t('padm.approvedOnSite')}
                    </span>
                  ) : (
                    <button
                      onClick={() => onApprove(drv.id)}
                      className="inline-flex items-center gap-1.5 rounded-pill bg-leaf px-4 py-1.5 text-xs font-extrabold text-white shadow-sm hover:bg-leaf/90 transition-transform active:scale-95"
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                      <span>{t('padm.approveOnSite')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Driver Modal */}
      {editingDriver && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl border border-rule text-ink my-8">
            <h3 className="font-display font-extrabold text-lg mb-4 text-ink">
              {t('padm.editDriverForm')}
            </h3>

            <form onSubmit={handleSaveDriver} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fFullName')}</label>
                  <input
                    name="driverName"
                    defaultValue={editingDriver.driverName}
                    required
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fNickname')}</label>
                  <input
                    name="nickname"
                    defaultValue={editingDriver.nickname}
                    required
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fPhone')}</label>
                  <input
                    name="phone"
                    defaultValue={editingDriver.phone}
                    required
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">LINE ID</label>
                  <input
                    name="lineId"
                    defaultValue={editingDriver.lineId}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-bold text-ink block mb-1">{t('padm.fVehicleModel')}</label>
                  <input
                    name="vehicleModel"
                    defaultValue={editingDriver.vehicleModel}
                    required
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fSeats')}</label>
                  <input
                    name="seats"
                    defaultValue={editingDriver.seats}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fPlate')}</label>
                  <input
                    name="plateNumber"
                    defaultValue={editingDriver.plateNumber || ''}
                    placeholder={t('padm.fPlatePh')}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fStatus')}</label>
                  <select
                    name="status"
                    defaultValue={editingDriver.status}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  >
                    <option value="pending">{t('padm.stPending')}</option>
                    <option value="verified">{t('padm.stVerified')}</option>
                    <option value="rejected">{t('padm.stRejected')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">{t('padm.fRoutes')}</label>
                <input
                  name="routes"
                  defaultValue={editingDriver.routes}
                  className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setEditingDriver(null)}
                  className="rounded-pill px-4 py-2 text-xs font-bold text-ink-2 hover:bg-paper"
                >
                  {t('padm.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-pill bg-accent px-5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-accent-deep transition-transform active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? t('padm.saving') : t('padm.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AdminDeleteModal
        isOpen={Boolean(deletingDriver)}
        title={t('padm.delDriverTitle')}
        itemTitle={`${deletingDriver?.driverName} (${deletingDriver?.nickname})`}
        isDeleting={isSubmitting}
        onClose={() => setDeletingDriver(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
