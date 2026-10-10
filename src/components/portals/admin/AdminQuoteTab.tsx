'use client';

import React, { useState } from 'react';
import { QuotationLead } from '@/lib/leadsStore';
import { Pencil, Trash2, PhoneCall, Search, Download, RefreshCw, Plus, Copy, Check, ChevronDown, Zap, FileText, Users } from 'lucide-react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useLanguage } from '@/context/LanguageContext';
import { AdminDeleteModal } from './AdminDeleteModal';
import { AdminAlert } from './AdminAlert';
import { adminFetch } from '@/lib/adminClient';
import type { LeadFeeStatus, OrgType, VehicleTier } from '@/lib/b2b';
import {
  LEAD_FEE_PER_CAR,
  LEAD_FEE_STATUS_META,
  LEAD_FEE_STATUS_OPTIONS,
  ORG_TYPE_META,
  ORG_TYPE_OPTIONS,
  VEHICLE_TIER_META,
  VEHICLE_TIER_OPTIONS,
  buildPartnerLineSummary,
  calcLeadFee,
  clampCarCount,
  copyTextToClipboard,
  formatBaht,
} from '@/lib/b2b';

interface AdminQuoteTabProps {
  quotes: QuotationLead[];
  onRefresh: () => void;
}

type StatusTab = 'all' | QuotationLead['status'];

const STATUS_TABS: { id: StatusTab; label: string; dot?: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'pending', label: 'รอติดต่อกลับ', dot: 'bg-amber-500' },
  { id: 'quoted', label: 'ส่งราคาแล้ว', dot: 'bg-blue-500' },
  { id: 'confirmed', label: 'ยืนยันการจองแล้ว' },
  { id: 'cancelled', label: 'ยกเลิก' },
];

const STATUS_PILL: Record<QuotationLead['status'], string> = {
  pending: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
  quoted: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  confirmed: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
  cancelled: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700',
};

const STATUS_LABEL: Record<QuotationLead['status'], string> = {
  pending: 'รอติดต่อกลับ',
  quoted: 'ส่งราคาแล้ว',
  confirmed: 'ยืนยันการจองแล้ว',
  cancelled: 'ยกเลิก',
};

const inputClass =
  'w-full p-2 rounded-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-slate-500 text-xs';

export const AdminQuoteTab: React.FC<AdminQuoteTabProps> = ({ quotes, onRefresh }) => {
  const { trackCall } = useAnalytics();
  const { t, locale } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [b2bOnly, setB2bOnly] = useState(false);
  const [caravanOnly, setCaravanOnly] = useState(false);
  const [editingQuote, setEditingQuote] = useState<QuotationLead | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<QuotationLead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyState, setCopyState] = useState<{ id: string; ok: boolean } | null>(null);
  const [actionError, setActionError] = useState('');

  const countBy = (st: QuotationLead['status']) => quotes.filter((q) => q.status === st).length;
  const actionableCount = countBy('pending') + countBy('quoted');

  const filtered = quotes.filter((q) => {
    if (statusTab !== 'all' && q.status !== statusTab) return false;
    if (urgentOnly && q.assignedPartner) return false;
    if (b2bOnly && !q.needsTaxInvoice) return false;
    if (caravanOnly && q.carCount < 2) return false;
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      q.companyName.toLowerCase().includes(term) ||
      (q.contactName && q.contactName.toLowerCase().includes(term)) ||
      q.phone.includes(term) ||
      q.route.toLowerCase().includes(term) ||
      q.id.toLowerCase().includes(term) ||
      (q.assignedPartner && q.assignedPartner.toLowerCase().includes(term)) ||
      VEHICLE_TIER_META[q.vehicleTier].label.toLowerCase().includes(term)
    );
  });

  const handleStatusChange = async (quote: QuotationLead, status: QuotationLead['status']) => {
    setActionError('');
    try {
      await adminFetch('/api/leads/quote', {
        method: 'PUT',
        body: JSON.stringify({ id: quote.id, status }),
      });
      onRefresh();
    } catch (err) {
      setActionError((err as Error).message);
      console.error('Error updating quote status:', err);
    }
  };

  const handleDelete = async () => {
    if (!deletingQuote) return;
    setIsSubmitting(true);
    setActionError('');
    try {
      await adminFetch('/api/leads/quote', {
        method: 'DELETE',
        body: JSON.stringify({ id: deletingQuote.id }),
      });
      setDeletingQuote(null);
      onRefresh();
    } catch (err) {
      setDeletingQuote(null);
      setActionError((err as Error).message);
      console.error('Error deleting quote:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveQuote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingQuote) return;
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const carCount = clampCarCount(String(formData.get('carCount') ?? ''));
    const updates = {
      id: editingQuote.id,
      companyName: formData.get('companyName') as string,
      contactName: (formData.get('contactName') as string) || undefined,
      phone: formData.get('phone') as string,
      travelDate: formData.get('travelDate') as string,
      totalDays: Number(formData.get('totalDays')) || editingQuote.totalDays || 1,
      route: formData.get('route') as string,
      passengers: formData.get('passengers') as string,
      estimatedPrice: Number(formData.get('estimatedPrice')) || 0,
      needsTaxInvoice: formData.get('needsTaxInvoice') === 'true',
      status: formData.get('status') as QuotationLead['status'],
      carCount,
      vehicleTier: formData.get('vehicleTier') as VehicleTier,
      orgType: formData.get('orgType') as OrgType,
      includeInsurance: formData.get('includeInsurance') === 'true',
      assignedPartner: ((formData.get('assignedPartner') as string) || '').trim() || null,
      leadFeeStatus: formData.get('leadFeeStatus') as LeadFeeStatus,
      leadFeeAmount: calcLeadFee(carCount),
    };

    try {
      await adminFetch('/api/leads/quote', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setEditingQuote(null);
      onRefresh();
    } catch (err) {
      setActionError((err as Error).message);
      console.error('Error updating quote:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLineSummary = async (quote: QuotationLead) => {
    const text = buildPartnerLineSummary(quote);
    const ok = await copyTextToClipboard(text);
    setCopyState({ id: quote.id, ok });
    window.setTimeout(() => setCopyState(null), 2500);
  };

  const handleExportCSV = () => {
    const header = ['id', 'companyName', 'contactName', 'phone', 'travelDate', 'route', 'passengers', 'carCount', 'vehicleTier', 'estimatedPrice', 'needsTaxInvoice', 'status', 'assignedPartner', 'leadFee'];
    const esc = (val: unknown) => {
      const s = val === undefined || val === null ? '' : String(val);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = filtered.map((q) =>
      [q.id, q.companyName, q.contactName || '', q.phone, q.travelDate, q.route, q.passengers, q.carCount, VEHICLE_TIER_META[q.vehicleTier].label, q.estimatedPrice, q.needsTaxInvoice, q.status, q.assignedPartner || '', q.leadFeeAmount || calcLeadFee(q.carCount)].map(esc).join(',')
    );
    const csv = '﻿' + [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const showUrgentQueue = () => {
    setSearchTerm('');
    setStatusTab('all');
    setB2bOnly(false);
    setCaravanOnly(false);
    setUrgentOnly(true);
  };

  return (
    <div className="space-y-4">
      <AdminAlert message={actionError} onDismiss={() => setActionError('')} />
      {/* Breadcrumb + Title + Actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            ระบบจัดการข้อมูลยานพาหนะ <span className="mx-1">/</span>{' '}
            <span className="text-slate-700 dark:text-slate-200 font-semibold">Booking & Order Verification</span>
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              การจอง & ตรวจสอบคำขอใช้บริการ
            </h3>
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5">
              ทั้งหมด {actionableCount} รายการรอดำเนินการ
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>ส่งออก CSV รายงานการจอง</span>
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>รีเฟรชข้อมูลคำขอ</span>
          </button>
          <button
            type="button"
            onClick={showUrgentQueue}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-none bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-950 text-white text-xs font-bold border border-slate-950 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-amber-500" strokeWidth={3} />
            <span>+ สร้างใบสั่งงานเร่งด่วน</span>
          </button>
        </div>
      </div>

      {/* Search + status tabs + quick filters */}
      <div className="rounded-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อบริษัท, ผู้ติดต่อ, เส้นทาง, รหัสการจอง หรือพาร์ทเนอร์คนขับ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
            />
          </div>
          <div className="flex items-center justify-center sm:justify-end px-3 h-10 rounded-none border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400 shrink-0">
            คำขอทั้งหมด: <span className="font-black text-slate-900 dark:text-white font-mono ml-1">{filtered.length} รายการ</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((tab) => {
            const n = tab.id === 'all' ? quotes.length : countBy(tab.id);
            const active = statusTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-none border transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950 dark:border-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                <span>{tab.label}</span>
                {tab.dot ? (
                  <span className="inline-flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                    <span className={`w-1.5 h-1.5 ${tab.dot}`} />
                    ({n})
                  </span>
                ) : (
                  <span className="font-mono text-[11px] opacity-70">({n})</span>
                )}
              </button>
            );
          })}
          <span className="text-[11px] text-slate-400 ml-1">ตัวกรองด่วน:</span>
          <button
            type="button"
            onClick={() => setUrgentOnly((v) => !v)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold border rounded-none transition-colors cursor-pointer ${
              urgentOnly
                ? 'bg-amber-500 text-slate-950 border-amber-600'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
            }`}
          >
            <Zap className="h-3 w-3" />
            <span>เฉพาะงานด่วน</span>
          </button>
          <button
            type="button"
            onClick={() => setB2bOnly((v) => !v)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold border rounded-none transition-colors cursor-pointer ${
              b2bOnly
                ? 'bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
            }`}
          >
            <FileText className="h-3 w-3" />
            <span>นิติบุคคล B2B (หัก 3%)</span>
          </button>
          <button
            type="button"
            onClick={() => setCaravanOnly((v) => !v)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold border rounded-none transition-colors cursor-pointer ${
              caravanOnly
                ? 'bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
            }`}
          >
            <Users className="h-3 w-3" />
            <span>คาราวานหลายคัน</span>
          </button>
        </div>
      </div>

      {/* Quote cards */}
      {filtered.length === 0 ? (
        <p className="text-xs text-slate-500 italic p-6 text-center rounded-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {t('padm.quoteEmpty')}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => {
            const leadFee = q.leadFeeAmount || calcLeadFee(q.carCount);
            const tierShort = q.vehicleTier === 'strict_compliance_30' ? 'Strict 30' : 'Standard VIP';
            return (
              <div
                key={q.id}
                className="rounded-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-2 p-3.5 sm:p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm sm:text-base text-slate-950 dark:text-white">{q.companyName}</h4>
                      <span className={`px-2 py-0.5 text-[11px] font-bold border rounded-none ${STATUS_PILL[q.status]}`}>
                        {STATUS_LABEL[q.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-none">
                        {tierShort}
                      </span>
                      <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-none">
                        {t('padm.carUnit', { n: q.carCount })}
                      </span>
                      <span className="px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-none">
                        {ORG_TYPE_META[q.orgType]}
                      </span>
                      <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-none">
                        Lead Fee ฿{formatBaht(leadFee)} · {LEAD_FEE_STATUS_META[q.leadFeeStatus]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>ผู้ติดต่อ: <strong className="text-slate-800 dark:text-slate-200">{q.contactName || '-'}</strong></span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>
                        วันที่เดินทาง: <strong className="text-slate-800 dark:text-slate-200">{q.travelDate}{q.totalDays ? ` (${q.totalDays} วัน)` : ''}</strong>
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="relative">
                      <select
                        value={q.status}
                        onChange={(e) => handleStatusChange(q, e.target.value as QuotationLead['status'])}
                        aria-label="เปลี่ยนสถานะ"
                        className="pl-2.5 pr-8 py-1.5 rounded-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-slate-500 cursor-pointer appearance-none"
                      >
                        <option value="pending">{t('padm.qsPending')}</option>
                        <option value="quoted">{t('padm.qsQuoted')}</option>
                        <option value="confirmed">{t('padm.qsConfirmed')}</option>
                        <option value="cancelled">{t('padm.qsCancelled')}</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    </div>
                    <button
                      onClick={() => setEditingQuote(q)}
                      className="grid h-8 w-8 place-items-center rounded-none bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                      title={t('padm.editQuoteTitle')}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingQuote(q)}
                      className="grid h-8 w-8 place-items-center rounded-none bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                      title={t('padm.deleteQuoteTitle')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Detail grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 px-3.5 sm:px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <dl className="divide-y divide-dashed divide-slate-200 dark:divide-slate-800">
                    <div className="flex justify-between gap-3 py-1.5">
                      <dt className="text-slate-400 shrink-0">เส้นทางที่ต้องการ:</dt>
                      <dd className="font-bold text-slate-900 dark:text-white text-right">{q.route}</dd>
                    </div>
                    <div className="flex justify-between gap-3 py-1.5">
                      <dt className="text-slate-400 shrink-0">ระดับมาตรฐานรถ:</dt>
                      <dd className="font-bold text-slate-900 dark:text-white text-right">
                        {VEHICLE_TIER_META[q.vehicleTier].label} ({q.carCount} คัน)
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 py-1.5">
                      <dt className="text-slate-400 shrink-0">ราคาประเมินเบื้องต้น:</dt>
                      <dd className="font-mono font-black text-base text-slate-950 dark:text-white">฿{formatBaht(q.estimatedPrice)}</dd>
                    </div>
                    <div className="flex justify-between gap-3 py-1.5">
                      <dt className="text-slate-400 shrink-0">ค่าแนะนำพาร์ทเนอร์ ({q.carCount} คัน x ฿{LEAD_FEE_PER_CAR}):</dt>
                      <dd className="font-mono font-black text-amber-700 dark:text-amber-400">฿{formatBaht(leadFee)}</dd>
                    </div>
                  </dl>
                  <dl className="divide-y divide-dashed divide-slate-200 dark:divide-slate-800">
                    <div className="flex justify-between gap-3 py-1.5">
                      <dt className="text-slate-400 shrink-0">จำนวนผู้โดยสาร / รถ:</dt>
                      <dd className="font-bold text-slate-900 dark:text-white text-right">{q.passengers}</dd>
                    </div>
                    <div className="flex justify-between gap-3 py-1.5">
                      <dt className="text-slate-400 shrink-0">ประกันอุบัติเหตุกลุ่ม:</dt>
                      <dd className={`font-bold text-right ${q.includeInsurance ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
                        {q.includeInsurance ? 'คุ้มครอง 1,000,000 บาท/ท่าน' : t('padm.qInsNone')}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 py-1.5">
                      <dt className="text-slate-400 shrink-0">ใบกำกับภาษี:</dt>
                      <dd className="font-bold text-slate-900 dark:text-white text-right">
                        {q.needsTaxInvoice ? 'ต้องการ (หัก 3%)' : t('padm.qTaxNo')}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 py-1.5">
                      <dt className="text-slate-400 shrink-0">กองรถที่รับงาน:</dt>
                      <dd className="font-bold text-right">
                        {q.assignedPartner ? (
                          <span className="text-slate-900 dark:text-white">{q.assignedPartner}</span>
                        ) : (
                          <span className="italic font-medium text-slate-400">ยังไม่มอบหมาย (เปิดจ่ายงานด่วน)</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Footer: contact + actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 sm:px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs">
                    <a
                      href={`tel:${q.phone}`}
                      onClick={() => {
                        trackCall({
                          targetType: 'corporate_quote',
                          targetId: q.id,
                          targetTitle: t('padm.callCorpTitle', { name: q.companyName }),
                          phoneNumber: q.phone,
                        });
                      }}
                      className="font-bold text-blue-700 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-mono"
                    >
                      <PhoneCall className="h-3.5 w-3.5" />
                      {t('padm.phonePrefix', { phone: q.phone })}
                    </a>
                    <span className="text-slate-300">|</span>
                    <span className="text-[11px] text-slate-400">
                      ส่งเมื่อ: {new Date(q.submittedAt).toLocaleDateString(locale === 'en' ? 'en-GB' : locale === 'zh' ? 'zh-CN' : 'th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyLineSummary(q)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-bold text-white transition-colors cursor-pointer ${
                        copyState?.id === q.id && copyState.ok
                          ? 'bg-emerald-500'
                          : 'bg-emerald-700 hover:bg-emerald-600'
                      }`}
                    >
                      {copyState?.id === q.id && copyState.ok ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>{t('padm.copiedLine')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>คัดลอกสรุปงานส่ง LINE พาร์ทเนอร์</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingQuote(q)}
                      className="px-3 py-1.5 rounded-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      มอบหมายรถ
                    </button>
                    {q.status === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(q, 'quoted')}
                        className="px-3 py-1.5 rounded-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        ออกใบเสนอราคา
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingQuote(q)}
                        className="px-3 py-1.5 rounded-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        ดูประวัติใบเสนอราคา
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Quote Modal */}
      {editingQuote && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-none bg-card p-6 shadow-2xl border border-rule text-ink my-8">
            <h3 className="font-display font-extrabold text-lg mb-4 text-ink">
              {t('padm.editQuoteForm')}
            </h3>

            <form onSubmit={handleSaveQuote} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fOrgName')}</label>
                  <input
                    name="companyName"
                    defaultValue={editingQuote.companyName}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fContactName')}</label>
                  <input
                    name="contactName"
                    defaultValue={editingQuote.contactName || ''}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fPhone')}</label>
                  <input
                    name="phone"
                    defaultValue={editingQuote.phone}
                    required
                    className={`${inputClass} font-mono`}
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fTravelDate')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      name="travelDate"
                      defaultValue={editingQuote.travelDate}
                      className={`${inputClass} col-span-2`}
                    />
                    <input
                      name="totalDays"
                      type="number"
                      min="1"
                      placeholder="จำนวนวัน"
                      defaultValue={editingQuote.totalDays || 1}
                      className={`${inputClass} text-center font-mono`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">{t('padm.fRoutePlan')}</label>
                <input
                  name="route"
                  defaultValue={editingQuote.route}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fPaxCar')}</label>
                  <input
                    name="passengers"
                    defaultValue={editingQuote.passengers}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fPriceOffer')}</label>
                  <input
                    name="estimatedPrice"
                    type="number"
                    defaultValue={editingQuote.estimatedPrice}
                    className={`${inputClass} font-mono font-bold`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fTaxInvoiceShort')}</label>
                  <select
                    name="needsTaxInvoice"
                    defaultValue={editingQuote.needsTaxInvoice ? 'true' : 'false'}
                    className={inputClass}
                  >
                    <option value="true">{t('padm.taxNeed')}</option>
                    <option value="false">{t('padm.taxNotNeed')}</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fStatus')}</label>
                  <select
                    name="status"
                    defaultValue={editingQuote.status}
                    className={`${inputClass} font-bold`}
                  >
                    <option value="pending">{t('padm.qsPendingLong')}</option>
                    <option value="quoted">{t('padm.qsQuotedLong')}</option>
                    <option value="confirmed">{t('padm.qsConfirmedLong')}</option>
                    <option value="cancelled">{t('padm.qsCancelledLong')}</option>
                  </select>
                </div>
              </div>

              {/* B2B Fleet Matching & Lead Fee */}
              <div className="rounded-none border border-rule bg-paper p-3 space-y-3 pt-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-ink">🚐 B2B Fleet Matching & Lead Fee</span>
                  <span className="text-[10px] font-bold text-ink-2">
                    {t('padm.leadFeeFormula', { per: LEAD_FEE_PER_CAR })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-ink block mb-1">{t('padm.fCarCount')}</label>
                    <input
                      name="carCount"
                      type="number"
                      min={1}
                      max={50}
                      defaultValue={editingQuote.carCount}
                      className={`${inputClass} font-mono font-bold`}
                    />
                  </div>
                  <div>
                    <label className="font-bold text-ink block mb-1">{t('padm.fTier')}</label>
                    <select
                      name="vehicleTier"
                      defaultValue={editingQuote.vehicleTier}
                      className={inputClass}
                    >
                      {VEHICLE_TIER_OPTIONS.map((tier) => (
                        <option key={tier} value={tier}>
                          {VEHICLE_TIER_META[tier].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-ink block mb-1">{t('padm.fOrgType')}</label>
                    <select
                      name="orgType"
                      defaultValue={editingQuote.orgType}
                      className={inputClass}
                    >
                      {ORG_TYPE_OPTIONS.map((org) => (
                        <option key={org} value={org}>
                          {ORG_TYPE_META[org]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-ink block mb-1">{t('padm.fInsuranceLabel')}</label>
                    <select
                      name="includeInsurance"
                      defaultValue={editingQuote.includeInsurance ? 'true' : 'false'}
                      className={inputClass}
                    >
                      <option value="true">{t('padm.insCoverOpt')}</option>
                      <option value="false">{t('padm.insNoneOpt')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fAssignedPartner')}</label>
                  <input
                    name="assignedPartner"
                    defaultValue={editingQuote.assignedPartner || ''}
                    placeholder={t('padm.fAssignedPartnerPh')}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-ink block mb-1">{t('padm.fLeadFeeStatus')}</label>
                    <select
                      name="leadFeeStatus"
                      defaultValue={editingQuote.leadFeeStatus}
                      className={`${inputClass} font-bold`}
                    >
                      {LEAD_FEE_STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {LEAD_FEE_STATUS_META[st]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-ink block mb-1">{t('padm.fLeadFeeAmount')}</label>
                    <div className="p-2 rounded-none bg-card border border-rule font-mono font-extrabold text-sun-ink">
                      ฿{formatBaht(calcLeadFee(editingQuote.carCount))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setEditingQuote(null)}
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
        isOpen={Boolean(deletingQuote)}
        title={t('padm.delQuoteTitle')}
        itemTitle={`${deletingQuote?.companyName} (${deletingQuote?.route})`}
        isDeleting={isSubmitting}
        onClose={() => setDeletingQuote(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
