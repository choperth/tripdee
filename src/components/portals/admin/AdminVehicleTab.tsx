'use client';

import React, { useState } from 'react';
import { Vehicle, ZoneId } from '@/data/mockData';
import { ALL_VEHICLE_MODELS } from '@/data/vehicleModels';
import { CarFront, Plus, Pencil, Trash2, Search, Star, Download, ChevronDown, ChevronLeft, ChevronRight, Phone, Check, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { AdminDeleteModal } from './AdminDeleteModal';
import { AdminAlert } from './AdminAlert';
import { adminFetch } from '@/lib/adminClient';
import { broadcastDataSync } from '@/lib/syncEvents';

interface AdminVehicleTabProps {
  vehicles: Vehicle[];
  onRefresh: () => void;
}

const PAGE_SIZE = 5;

type StatusFilter = 'all' | 'available' | 'busy' | 'pending';
type TypeFilter = 'all' | 'van' | 'suv' | 'car';

export const AdminVehicleTab: React.FC<AdminVehicleTabProps> = ({ vehicles, onRefresh }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [plateOnly, setPlateOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortMode, setSortMode] = useState<'latest' | 'featured'>('latest');
  const [page, setPage] = useState(1);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const availableCount = vehicles.filter((v) => v.isAvailable !== false).length;
  const pendingCount = vehicles.filter((v) => v.approvalStatus === 'pending').length;
  const rejectedCount = vehicles.filter((v) => v.approvalStatus === 'rejected').length;

  const filtered = vehicles.filter((v) => {
    const q = searchTerm.trim().toLowerCase();
    if (
      q &&
      !(
        v.title.toLowerCase().includes(q) ||
        v.driverName.toLowerCase().includes(q) ||
        v.driverPhone.includes(q) ||
        v.location.toLowerCase().includes(q) ||
        (v.plateNumber || '').toLowerCase().includes(q)
      )
    ) {
      return false;
    }
    if (statusFilter === 'available' && v.isAvailable === false) return false;
    if (statusFilter === 'busy' && v.isAvailable !== false) return false;
    if (typeFilter !== 'all' && v.type !== typeFilter) return false;
    if (regionFilter !== 'all' && v.region !== regionFilter) return false;
    if (plateOnly && v.plateType !== 'yellow') return false;
    if (featuredOnly && !v.isVerified) return false;
    if (statusFilter === 'pending' && v.approvalStatus !== 'pending') return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === 'featured') return Number(Boolean(b.isVerified)) - Number(Boolean(a.isVerified));
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeStart = sorted.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, sorted.length);

  const pageNumbers = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 3) return [1, 2, 3, '…', totalPages] as const;
    if (safePage >= totalPages - 2) return [1, '…', totalPages - 2, totalPages - 1, totalPages] as const;
    return [1, '…', safePage - 1, safePage, safePage + 1, '…', totalPages] as const;
  })();

  const handleExportCSV = () => {
    const header = ['id', 'title', 'type', 'seats', 'driverName', 'driverNickname', 'driverPhone', 'driverLine', 'location', 'region', 'plateType', 'plateNumber', 'rate_city', 'isAvailable', 'isVerified'];
    const esc = (val: unknown) => {
      const s = val === undefined || val === null ? '' : String(val);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = sorted.map((v) =>
      [v.id, v.title, v.type, v.seats, v.driverName, v.driverNickname, v.driverPhone, v.driverLine, v.location, v.region, v.plateType, v.plateNumber || '', v.zoneRates?.city ?? '', v.isAvailable !== false, Boolean(v.isVerified)].map(esc).join(',')
    );
    const csv = '﻿' + [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleet-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleToggleVerified = async (v: Vehicle) => {
    setActionError('');
    try {
      await adminFetch('/api/vehicles', {
        method: 'PUT',
        body: JSON.stringify({ id: v.id, isVerified: !v.isVerified }),
      });
      onRefresh();
      window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
      broadcastDataSync('vehicles');
    } catch (err) {
      setActionError((err as Error).message);
      console.error('Error toggling verified:', err);
    }
  };

  /**
   * Approve or reject a driver-submitted vehicle. Until a vehicle is approved
   * it is filtered out of every public listing.
   */
  const handleReview = async (v: Vehicle, decision: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    setActionError('');
    try {
      await adminFetch('/api/vehicles', {
        method: 'PUT',
        body: JSON.stringify({ id: v.id, approvalStatus: decision }),
      });
      onRefresh();
      window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
      broadcastDataSync('vehicles');
    } catch (err) {
      setActionError((err as Error).message);
      console.error('Error reviewing vehicle:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingVehicle) return;
    setIsSubmitting(true);
    setActionError('');
    try {
      await adminFetch('/api/vehicles', {
        method: 'DELETE',
        body: JSON.stringify({ id: deletingVehicle.id }),
      });
      setDeletingVehicle(null);
      onRefresh();
      window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
      broadcastDataSync('vehicles');
    } catch (err) {
      setDeletingVehicle(null);
      setActionError((err as Error).message);
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
      rating: Number(formData.get('rating')) || 0,
      isVerified: formData.get('isVerified') === 'true',
      zoneRates: {
        ...(Number(formData.get('rate_city')) > 0 ? { city: Number(formData.get('rate_city')) } : {}),
        ...(Number(formData.get('rate_midHill')) > 0
          ? { midHill: Number(formData.get('rate_midHill')) }
          : {}),
        ...(Number(formData.get('rate_highHill')) > 0
          ? { highHill: Number(formData.get('rate_highHill')) }
          : {}),
        ...(Number(formData.get('rate_cross')) > 0
          ? { crossProvince: Number(formData.get('rate_cross')) }
          : {}),
      } as Partial<Record<ZoneId, number>>,
      description: formData.get('description') as string,
    };

    try {
      const method = editingVehicle ? 'PUT' : 'POST';
      await adminFetch('/api/vehicles', {
        method,
        body: JSON.stringify(vehicleData),
      });

      setEditingVehicle(null);
      setIsNewModalOpen(false);
      onRefresh();
      window.dispatchEvent(new CustomEvent('tripdee-vehicles-updated'));
      broadcastDataSync('vehicles');
    } catch (err) {
      setActionError((err as Error).message);
      console.error('Error saving vehicle:', err);
      setIsSubmitting(false);
    }
  };

  const selectCls =
    'h-10 pl-3 pr-8 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none focus:outline-none focus:border-slate-500 cursor-pointer appearance-none';

  return (
    <div className="space-y-4">
      <AdminAlert message={actionError} onDismiss={() => setActionError('')} />
      {/* Breadcrumb + Title */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            Console <span className="mx-1">/</span> Fleet_Control <span className="mx-1">/</span>{' '}
            <span className="text-slate-700 dark:text-slate-200 font-bold">Inventory</span>
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              จัดการยานพาหนะ (Fleet Inventory & Verification)
            </h3>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 px-2 py-0.5">
              {vehicles.length} คัน ทั้งหมดในระบบ
            </span>
            {pendingCount > 0 && (
              <span className="text-[11px] font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 px-2 py-0.5">
                รออนุมัติ {pendingCount} คัน
              </span>
            )}
            {rejectedCount > 0 && (
              <span className="text-[11px] font-mono font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 px-2 py-0.5">
                ไม่ผ่าน {rejectedCount} คัน
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>ส่งออก CSV</span>
          </button>
          <button
            onClick={() => {
              setEditingVehicle(null);
              setIsNewModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-none bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-950 text-white text-xs font-bold border border-slate-950 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4 text-amber-500" strokeWidth={3} />
            <span>+ เพิ่มรถใหม่</span>
          </button>
        </div>
      </div>

      {/* Search + Dropdown Filters */}
      <div className="rounded-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <div className="relative md:col-span-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหารถ ชื่อคนขับ เบอร์โทร ทะเบียนรถ หรือจังหวัด..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
            />
          </div>
          <div className="relative md:col-span-2">
            <select
              aria-label="กรองตามสถานะ"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className={`${selectCls} w-full`}
            >
              <option value="all">สถานะ: ทั้งหมด ({vehicles.length})</option>
              <option value="available">พร้อมรับงาน ({availableCount})</option>
              <option value="busy">ติดงาน ({vehicles.length - availableCount})</option>
              <option value="pending">รออนุมัติ ({pendingCount})</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative md:col-span-2">
            <select
              aria-label="กรองตามประเภท"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className={`${selectCls} w-full`}
            >
              <option value="all">ประเภท: ทั้งหมด (VIP/SUV)</option>
              <option value="van">รถตู้ VIP</option>
              <option value="suv">SUV / MPV</option>
              <option value="car">รถเก๋ง / ขับเอง</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative md:col-span-2">
            <select
              aria-label="กรองตามโซน"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className={`${selectCls} w-full`}
            >
              <option value="all">โซน: ทุกพื้นที่</option>
              <option value="north">{t('padm.rgNorth')}</option>
              <option value="central">{t('padm.rgCentral')}</option>
              <option value="east">{t('padm.rgEast')}</option>
              <option value="south">{t('padm.rgSouth')}</option>
              <option value="isan">{t('padm.rgIsan')}</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Filter presets + sort */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Filter Presets:</span>
          <button
            type="button"
            onClick={() => setPlateOnly((v) => !v)}
            className={`px-2.5 py-1 text-[11px] font-bold border transition-colors cursor-pointer rounded-none ${
              plateOnly
                ? 'bg-amber-500 text-slate-950 border-amber-600'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-500'
            }`}
          >
            ป้ายเหลือง 30 รับจ้างสาธารณะ
          </button>
          <button
            type="button"
            onClick={() => setFeaturedOnly((v) => !v)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold border transition-colors cursor-pointer rounded-none ${
              featuredOnly
                ? 'bg-amber-500 text-slate-950 border-amber-600'
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:border-amber-500'
            }`}
          >
            <Star className="h-3 w-3" />
            <span>เฉพาะรถแนะนำ (Featured)</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter((s) => (s === 'available' ? 'all' : 'available'))}
            className={`px-2.5 py-1 text-[11px] font-bold border transition-colors cursor-pointer rounded-none ${
              statusFilter === 'available'
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:border-emerald-500'
            }`}
          >
            พร้อมรับงานทันที ({availableCount})
          </button>
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter((s) => (s === 'pending' ? 'all' : 'pending'))}
              className={`px-2.5 py-1 text-[11px] font-bold border transition-colors cursor-pointer rounded-none ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-slate-950 border-amber-600'
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/50'
              }`}
            >
              รออนุมัติ ({pendingCount})
            </button>
          )}
          <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="font-mono uppercase">เรียงลำดับ:</span>
            <div className="relative">
              <select
                aria-label="เรียงลำดับ"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as 'latest' | 'featured')}
                className="pl-2 pr-7 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-transparent border border-slate-300 dark:border-slate-700 rounded-none focus:outline-none cursor-pointer appearance-none"
              >
                <option value="latest">ล่าสุด</option>
                <option value="featured">รถแนะนำก่อน</option>
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle List */}
      {pageItems.length === 0 ? (
        <p className="text-xs text-slate-500 italic p-6 text-center rounded-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {t('padm.vehicleEmpty')}
        </p>
      ) : (
        <div className="space-y-3">
          {pageItems.map((v) => {
            const isAvailable = v.isAvailable !== false;
            const lineHref =
              v.driverLine && v.driverLine.startsWith('http') ? v.driverLine : undefined;
            return (
              <div
                key={v.id}
                className="rounded-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-2 p-3.5 sm:p-4">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <span className="grid h-9 w-9 place-items-center rounded-none bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold shrink-0 border border-slate-200 dark:border-slate-700">
                      <CarFront className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-950 dark:text-white">{v.title}</h4>
                        {v.approvalStatus === 'pending' && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-[11px] font-bold border border-amber-300 dark:border-amber-700">
                            <span className="material-symbols-outlined text-[13px]">hourglass_top</span>
                            รออนุมัติ
                          </span>
                        )}
                        {v.approvalStatus === 'rejected' && (
                          <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 px-2 py-0.5 text-[11px] font-bold border border-rose-300 dark:border-rose-800">
                            <span className="material-symbols-outlined text-[13px]">cancel</span>
                            ไม่ผ่านการอนุมัติ
                          </span>
                        )}
                        {v.approvalStatus === 'approved' && v.isVerified && (
                          <button
                            type="button"
                            onClick={() => handleToggleVerified(v)}
                            title={t('padm.featuredOff')}
                            className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-[11px] font-bold border border-amber-300 dark:border-amber-700 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/70 transition-colors rounded-none"
                          >
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            <span>Featured (รถแนะนำ)</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        คนขับ: {v.driverName}
                        {v.driverNickname ? ` (${v.driverNickname})` : ''} · {v.seats} ที่นั่ง · โซน:{' '}
                        {v.location}
                        {v.plateNumber && (
                          <span className="ml-1.5 font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-1.5 py-px">
                            ทะเบียน {v.plateNumber}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {v.approvalStatus === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReview(v, 'approved')}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                          อนุมัติ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReview(v, 'rejected')}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white border border-rose-700 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <X className="h-3 w-3" strokeWidth={3} />
                          ไม่อนุมัติ
                        </button>
                      </>
                    )}
                    {v.approvalStatus === 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleReview(v, 'approved')}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                        อนุมัติ
                      </button>
                    )}
                    {v.approvalStatus === 'approved' && !v.isVerified && (
                      <button
                        onClick={() => handleToggleVerified(v)}
                        title={t('padm.featuredOn')}
                        className="px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 border border-dashed border-slate-300 dark:border-slate-700 transition-colors cursor-pointer rounded-none"
                      >
                        + {t('padm.promote')}
                      </button>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold border rounded-none ${
                        isAvailable
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 ${isAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span>{isAvailable ? 'พร้อมรับงานทันที' : 'ติดงาน'}</span>
                    </span>
                    <button
                      onClick={() => setEditingVehicle(v)}
                      className="grid h-8 w-8 place-items-center rounded-none bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                      title={t('padm.editVehicleTitle')}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingVehicle(v)}
                      className="grid h-8 w-8 place-items-center rounded-none bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                      title={t('padm.deleteVehicleTitle')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info cells */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-3.5 sm:px-4 pb-3.5 sm:pb-4 text-xs">
                  <div className="border border-slate-200 dark:border-slate-800 p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block">เบอร์โทรศัพท์ติดต่อ</span>
                      <span className="font-mono font-bold text-slate-950 dark:text-white text-sm">{v.driverPhone}</span>
                    </div>
                    <a
                      href={`tel:${v.driverPhone}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white shrink-0"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>โทรด่วน</span>
                    </a>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">LINE Official / ID</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm truncate block">
                        {v.driverLine || '-'}
                      </span>
                    </div>
                    {lineHref ? (
                      <a
                        href={lineHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 shrink-0"
                      >
                        <span>เปิดลิงก์</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-300 dark:text-slate-600 shrink-0">ไม่มีลิงก์</span>
                    )}
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block">อัตราค่าบริการเริ่มต้น</span>
                      <span className="font-mono font-black text-slate-950 dark:text-white text-base">
                        {(v.zoneRates?.city ?? 0).toLocaleString()}
                        <span className="text-[11px] font-semibold text-slate-400"> บ./วัน</span>
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 shrink-0">
                      ดีลตรงคนขับ
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="rounded-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          แสดงรายการ <span className="font-black text-slate-900 dark:text-white font-mono">{rangeStart} - {rangeEnd}</span>{' '}
          จากทั้งหมด <span className="font-black text-slate-900 dark:text-white font-mono">{sorted.length}</span> คันในระบบ
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            aria-label="หน้าก่อนหน้า"
            className="grid h-8 w-8 place-items-center rounded-none border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {(pageNumbers as readonly (number | string)[]).map((p, i) =>
            typeof p === 'number' ? (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`h-8 min-w-8 px-2 rounded-none border text-xs font-bold font-mono transition-colors cursor-pointer ${
                  p === safePage
                    ? 'bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950 dark:border-white'
                    : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {p}
              </button>
            ) : (
              <span key={`gap-${i}`} className="px-1 text-xs text-slate-400">
                {p}
              </span>
            )
          )}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
            aria-label="หน้าถัดไป"
            className="grid h-8 w-8 place-items-center rounded-none border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Edit / New Vehicle Modal */}
      {(editingVehicle || isNewModalOpen) && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl rounded-none bg-card p-6 shadow-2xl border border-rule text-ink my-8 max-h-[90vh] overflow-y-auto">
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
                  className="w-full p-2 rounded-none bg-paper border border-rule text-ink focus:outline-accent"
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
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
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
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fRentalType')}</label>
                  <select
                    name="rentalType"
                    defaultValue={editingVehicle?.rentalType || (editingVehicle?.type === 'van' ? 'with_driver' : 'self_drive')}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
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
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
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
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fDriverNick')}</label>
                  <input
                    name="driverNickname"
                    defaultValue={editingVehicle?.driverNickname || ''}
                    required
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
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
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fLineId')}</label>
                  <input
                    name="driverLine"
                    defaultValue={editingVehicle?.driverLine || ''}
                    placeholder="https://line.me/..."
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fWhatsApp')}</label>
                  <input
                    name="driverWhatsapp"
                    defaultValue={editingVehicle?.driverWhatsapp || ''}
                    placeholder="https://wa.me/..."
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">WeChat ID</label>
                  <input
                    name="driverWechat"
                    defaultValue={editingVehicle?.driverWechat || ''}
                    placeholder={t('padm.fLinePh')}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">KakaoTalk ID</label>
                  <input
                    name="driverKakao"
                    defaultValue={editingVehicle?.driverKakao || ''}
                    placeholder={t('padm.fWhatsAppPh')}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fRegion')}</label>
                  <select
                    name="region"
                    defaultValue={editingVehicle?.region || 'north'}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
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
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                  />
                </div>
              </div>

              {/* License Plate & Corporate Tax Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-none bg-paper border border-rule">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fPlateType')}</label>
                  <select
                    name="plateType"
                    defaultValue={editingVehicle?.plateType || 'yellow'}
                    className="w-full p-2 rounded-none bg-card border border-rule text-ink text-xs font-bold"
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
                    className="w-full p-2 rounded-none bg-card border border-rule text-ink font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fTaxInvoice')}</label>
                  <select
                    name="canIssueTaxInvoice"
                    defaultValue={editingVehicle?.canIssueTaxInvoice ? 'true' : 'false'}
                    className="w-full p-2 rounded-none bg-card border border-rule text-ink text-xs font-bold"
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
                    className="w-full p-2 rounded-none bg-card border border-rule text-ink text-xs font-bold"
                  >
                    <option value="true">{t('padm.available')}</option>
                    <option value="false">{t('padm.busy')}</option>
                  </select>
                </div>
              </div>

              {/* Rates */}
              <div className="p-3 rounded-none bg-paper border border-rule space-y-1">
                <label className="font-bold text-ink block">{t('padm.fRateCity')}</label>
                <input
                  name="rate_city"
                  type="number"
                  min={500}
                  step={100}
                  defaultValue={editingVehicle?.zoneRates?.city ?? ''}
                  required
                  className="w-full p-2 rounded-none bg-card border border-rule text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fRating')}</label>
                  <input
                    name="rating"
                    type="number"
                    step="0.1"
                    defaultValue={editingVehicle?.rating ?? 0}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fFeatured')}</label>
                  <select
                    name="isVerified"
                    defaultValue={editingVehicle?.isVerified ? 'true' : 'false'}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
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
                  className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => {
                    setEditingVehicle(null);
                    setIsNewModalOpen(false);
                  }}
                  className="rounded-none px-4 py-2 text-xs font-bold text-ink-2 hover:bg-paper"
                >
                  {t('padm.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-none bg-slate-950 px-5 py-2 text-xs font-extrabold text-white hover:bg-slate-800 transition-colors active:scale-95 disabled:opacity-50"
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
