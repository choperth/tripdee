'use client';

import React, { useState } from 'react';
import { Vehicle, ZoneId } from '@/data/mockData';
import { ALL_VEHICLE_MODELS } from '@/data/vehicleModels';
import { CarFront, Plus, Pencil, Trash2, Search, Star } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { AdminDeleteModal } from './AdminDeleteModal';

interface AdminVehicleTabProps {
  vehicles: Vehicle[];
  onRefresh: () => void;
}

export const AdminVehicleTab: React.FC<AdminVehicleTabProps> = ({ vehicles, onRefresh }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = vehicles.filter((v) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      v.title.toLowerCase().includes(q) ||
      v.driverName.toLowerCase().includes(q) ||
      v.driverPhone.includes(q) ||
      v.location.toLowerCase().includes(q)
    );
  });

  const handleToggleVerified = async (v: Vehicle) => {
    try {
      await fetch('/api/vehicles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: v.id, isVerified: !v.isVerified }),
      });
      onRefresh();
      window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
    } catch (err) {
      console.error('Error toggling verified:', err);
    }
  };

  const handleDelete = async () => {
    if (!deletingVehicle) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/vehicles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingVehicle.id }),
      });
      setDeletingVehicle(null);
      onRefresh();
      window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
    } catch (err) {
      console.error('Error deleting vehicle:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const vehicleData = {
      id: editingVehicle?.id,
      title: formData.get('title') as string,
      type: formData.get('type') as 'van' | 'suv' | 'car',
      seats: Number(formData.get('seats')) || 9,
      driverName: formData.get('driverName') as string,
      driverNickname: formData.get('driverNickname') as string,
      driverPhone: formData.get('driverPhone') as string,
      driverLine: formData.get('driverLine') as string,
      driverWhatsapp: (formData.get('driverWhatsapp') as string) || undefined,
      driverWechat: (formData.get('driverWechat') as string) || undefined,
      driverKakao: (formData.get('driverKakao') as string) || undefined,
      region: formData.get('region') as 'north' | 'central' | 'south' | 'east' | 'isan',
      location: formData.get('location') as string,
      plateType: (formData.get('plateType') as 'yellow' | 'blue') || 'yellow',
      plateNumber: (formData.get('plateNumber') as string) || undefined,
      canIssueTaxInvoice: formData.get('canIssueTaxInvoice') === 'true',
      isAvailable: formData.get('isAvailable') !== 'false',
      rentalType: (formData.get('rentalType') as 'with_driver' | 'self_drive') || (formData.get('type') === 'van' ? 'with_driver' : 'self_drive'),
      transmission: (formData.get('transmission') as 'auto' | 'manual') || 'auto',
      rating: Number(formData.get('rating')) || 5.0,
      isVerified: formData.get('isVerified') === 'true',
      zoneRates: {
        city: Number(formData.get('rate_city')) || 1900,
        midHill: Number(formData.get('rate_midHill')) || 2100,
        highHill: Number(formData.get('rate_highHill')) || 2300,
        crossProvince: Number(formData.get('rate_cross')) || 2700,
      } as Record<ZoneId, number>,
      description: formData.get('description') as string,
    };

    try {
      const method = editingVehicle ? 'PUT' : 'POST';
      await fetch('/api/vehicles', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleData),
      });

      setEditingVehicle(null);
      setIsNewModalOpen(false);
      onRefresh();
      window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
    } catch (err) {
      console.error('Error saving vehicle:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-paper p-3 rounded-2xl border border-rule">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-2" />
          <input
            type="text"
            placeholder={t('padm.vehicleSearchPh')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-card border border-rule text-xs focus:outline-accent"
          />
        </div>

        <button
          onClick={() => {
            setEditingVehicle(null);
            setIsNewModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-pill bg-accent px-4 py-1.5 text-xs font-extrabold text-white hover:bg-accent-deep transition-transform active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>{t('padm.addVehicle')}</span>
        </button>
      </div>

      {/* Vehicle List */}
      {filtered.length === 0 ? (
        <p className="text-xs text-ink-2 italic p-6 text-center rounded-2xl bg-paper">
          {t('padm.vehicleEmpty')}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => (
            <div
              key={v.id}
              className="rounded-2xl bg-paper p-4 border border-rule/80 hover:border-accent/40 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-accent/10 text-accent font-bold text-xs shrink-0">
                      <CarFront className="h-3.5 w-3.5" />
                    </span>
                    <h4 className="font-extrabold text-sm text-ink truncate">{v.title}</h4>
                    {v.isVerified && (
                      <span className="flex items-center gap-0.5 rounded-pill bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 text-[10px] font-extrabold border border-amber-300 shrink-0">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-2 mt-1">
                    {t('padm.vehicleMeta', { name: v.driverName, nick: v.driverNickname, seats: v.seats, loc: v.location })}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleVerified(v)}
                    title={v.isVerified ? t('padm.featuredOff') : t('padm.featuredOn')}
                    className={`rounded-pill px-2.5 py-1 text-[11px] font-extrabold transition-colors ${
                      v.isVerified ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/50 hover:bg-amber-500/30' : 'bg-rule text-ink-2 hover:bg-rule-2'
                    }`}
                  >
                    {v.isVerified ? t('padm.featuredBadge') : `+ ${t('padm.promote')}`}
                  </button>
                  <button
                    onClick={() => setEditingVehicle(v)}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-card hover:bg-paper-2 text-ink border border-rule transition-transform active:scale-95"
                    title={t('padm.editVehicleTitle')}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingVehicle(v)}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-berry-soft hover:bg-berry/20 text-berry transition-transform active:scale-95"
                    title={t('padm.deleteVehicleTitle')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-card p-2.5 border border-rule text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-ink-2 block">{t('padm.phoneColon')}</span>
                  <span className="font-mono font-bold text-ink">{v.driverPhone}</span>
                </div>
                <div>
                  <span className="text-ink-2 block">LINE:</span>
                  <span className="font-mono text-accent-deep truncate block">{v.driverLine || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-ink-2 block">{t('padm.rateStart')}</span>
                  <span className="font-bold text-accent">{(v.zoneRates?.city?.toLocaleString() || '-')} {t('padm.perDay')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / New Vehicle Modal */}
      {(editingVehicle || isNewModalOpen) && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-card p-6 shadow-2xl border border-rule text-ink my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-extrabold text-lg mb-4 text-ink">
              {editingVehicle ? t('padm.editVehicleForm') : t('padm.addVehicleForm')}
            </h3>

            <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-ink block mb-1">{t('padm.fVehicleTitle')}</label>
                <input
                  name="title"
                  defaultValue={editingVehicle?.title || ''}
                  required
                  list="admin-vehicle-models"
                  placeholder={t('padm.fVehicleTitlePh')}
                  className="w-full p-2 rounded-xl bg-paper border border-rule text-ink focus:outline-accent"
                />
                <datalist id="admin-vehicle-models">
                  {ALL_VEHICLE_MODELS.map((model) => (
                    <option key={model} value={model} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fVehicleType')}</label>
                  <select
                    name="type"
                    defaultValue={editingVehicle?.type || 'van'}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  >
                    <option value="van">{t('padm.vtVan')}</option>
                    <option value="suv">{t('padm.vtSuv')}</option>
                    <option value="car">{t('padm.vtCar')}</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fSeatsReq')}</label>
                  <input
                    name="seats"
                    type="number"
                    defaultValue={editingVehicle?.seats || 9}
                    required
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fRentalType')}</label>
                  <select
                    name="rentalType"
                    defaultValue={editingVehicle?.rentalType || (editingVehicle?.type === 'van' ? 'with_driver' : 'self_drive')}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  >
                    <option value="with_driver">{t('padm.rtWithDriver')}</option>
                    <option value="self_drive">{t('padm.rtSelfDrive')}</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fGear')}</label>
                  <select
                    name="transmission"
                    defaultValue={editingVehicle?.transmission || 'auto'}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  >
                    <option value="auto">{t('padm.gearAuto')}</option>
                    <option value="manual">{t('padm.gearManual')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fDriverName')}</label>
                  <input
                    name="driverName"
                    defaultValue={editingVehicle?.driverName || ''}
                    required
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fDriverNick')}</label>
                  <input
                    name="driverNickname"
                    defaultValue={editingVehicle?.driverNickname || ''}
                    required
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fPhone')}</label>
                  <input
                    name="driverPhone"
                    defaultValue={editingVehicle?.driverPhone || ''}
                    required
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fLineId')}</label>
                  <input
                    name="driverLine"
                    defaultValue={editingVehicle?.driverLine || ''}
                    placeholder="https://line.me/..."
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fWhatsApp')}</label>
                  <input
                    name="driverWhatsapp"
                    defaultValue={editingVehicle?.driverWhatsapp || ''}
                    placeholder="https://wa.me/..."
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">WeChat ID</label>
                  <input
                    name="driverWechat"
                    defaultValue={editingVehicle?.driverWechat || ''}
                    placeholder={t('padm.fLinePh')}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">KakaoTalk ID</label>
                  <input
                    name="driverKakao"
                    defaultValue={editingVehicle?.driverKakao || ''}
                    placeholder={t('padm.fWhatsAppPh')}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fRegion')}</label>
                  <select
                    name="region"
                    defaultValue={editingVehicle?.region || 'north'}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  >
                    <option value="north">{t('padm.rgNorth')}</option>
                    <option value="central">{t('padm.rgCentral')}</option>
                    <option value="south">{t('padm.rgSouth')}</option>
                    <option value="east">{t('padm.rgEast')}</option>
                    <option value="isan">{t('padm.rgIsan')}</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fServiceArea')}</label>
                  <input
                    name="location"
                    defaultValue={editingVehicle?.location || t('padm.fServiceAreaDefault')}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
              </div>

              {/* License Plate & Corporate Tax Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-paper border border-rule">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fPlateType')}</label>
                  <select
                    name="plateType"
                    defaultValue={editingVehicle?.plateType || 'yellow'}
                    className="w-full p-2 rounded-xl bg-card border border-rule text-ink text-xs font-bold"
                  >
                    <option value="yellow">{t('padm.ptYellow')}</option>
                    <option value="blue">{t('padm.ptBlue')}</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fPlateNumber')}</label>
                  <input
                    name="plateNumber"
                    defaultValue={editingVehicle?.plateNumber || ''}
                    placeholder={t('padm.fPlateNumberPh')}
                    className="w-full p-2 rounded-xl bg-card border border-rule text-ink font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fTaxInvoice')}</label>
                  <select
                    name="canIssueTaxInvoice"
                    defaultValue={editingVehicle?.canIssueTaxInvoice ? 'true' : 'false'}
                    className="w-full p-2 rounded-xl bg-card border border-rule text-ink text-xs font-bold"
                  >
                    <option value="true">{t('padm.taxYes')}</option>
                    <option value="false">{t('padm.taxNo')}</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fJobStatus')}</label>
                  <select
                    name="isAvailable"
                    defaultValue={editingVehicle?.isAvailable !== false ? 'true' : 'false'}
                    className="w-full p-2 rounded-xl bg-card border border-rule text-ink text-xs font-bold"
                  >
                    <option value="true">{t('padm.available')}</option>
                    <option value="false">{t('padm.busy')}</option>
                  </select>
                </div>
              </div>

              {/* Rates */}
              <div className="p-3 rounded-xl bg-paper border border-rule space-y-1">
                <label className="font-bold text-ink block">{t('padm.fRateCity')}</label>
                <input
                  name="rate_city"
                  type="number"
                  min={500}
                  step={100}
                  defaultValue={editingVehicle?.zoneRates?.city || 1900}
                  required
                  className="w-full p-2 rounded-xl bg-card border border-rule text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fRating')}</label>
                  <input
                    name="rating"
                    type="number"
                    step="0.1"
                    defaultValue={editingVehicle?.rating || 5.0}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fFeatured')}</label>
                  <select
                    name="isVerified"
                    defaultValue={editingVehicle?.isVerified ? 'true' : 'false'}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  >
                    <option value="true">{t('padm.featuredYes')}</option>
                    <option value="false">{t('padm.featuredNo')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">{t('padm.fDescription')}</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingVehicle?.description || ''}
                  className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => {
                    setEditingVehicle(null);
                    setIsNewModalOpen(false);
                  }}
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
        isOpen={Boolean(deletingVehicle)}
        title={t('padm.delVehicleTitle')}
        itemTitle={deletingVehicle?.title || ''}
        isDeleting={isSubmitting}
        onClose={() => setDeletingVehicle(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
