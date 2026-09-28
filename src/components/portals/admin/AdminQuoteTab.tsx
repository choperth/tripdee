'use client';

import React, { useState } from 'react';
import { QuotationLead } from '@/lib/leadsStore';
import { Pencil, Trash2, PhoneCall, Search, Copy, Check } from 'lucide-react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { AdminDeleteModal } from './AdminDeleteModal';
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

const inputClass =
  'w-full p-2 rounded-xl bg-paper border border-rule text-ink focus:outline-accent';

export const AdminQuoteTab: React.FC<AdminQuoteTabProps> = ({ quotes, onRefresh }) => {
  const { trackCall } = useAnalytics();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingQuote, setEditingQuote] = useState<QuotationLead | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<QuotationLead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyState, setCopyState] = useState<{ id: string; ok: boolean } | null>(null);

  const filtered = quotes.filter((q) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      q.companyName.toLowerCase().includes(term) ||
      (q.contactName && q.contactName.toLowerCase().includes(term)) ||
      q.phone.includes(term) ||
      q.route.toLowerCase().includes(term) ||
      (q.assignedPartner && q.assignedPartner.toLowerCase().includes(term)) ||
      VEHICLE_TIER_META[q.vehicleTier].label.toLowerCase().includes(term)
    );
  });

  const handleStatusChange = async (quote: QuotationLead, status: QuotationLead['status']) => {
    try {
      await fetch('/api/leads/quote', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: quote.id, status }),
      });
      onRefresh();
    } catch (err) {
      console.error('Error updating quote status:', err);
    }
  };

  const handleDelete = async () => {
    if (!deletingQuote) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/leads/quote', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingQuote.id }),
      });
      setDeletingQuote(null);
      onRefresh();
    } catch (err) {
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
      route: formData.get('route') as string,
      passengers: formData.get('passengers') as string,
      estimatedPrice: Number(formData.get('estimatedPrice')) || 0,
      needsTaxInvoice: formData.get('needsTaxInvoice') === 'true',
      status: formData.get('status') as QuotationLead['status'],
      // B2B Fleet Matching fields
      carCount,
      vehicleTier: formData.get('vehicleTier') as VehicleTier,
      orgType: formData.get('orgType') as OrgType,
      includeInsurance: formData.get('includeInsurance') === 'true',
      assignedPartner: ((formData.get('assignedPartner') as string) || '').trim() || null,
      leadFeeStatus: formData.get('leadFeeStatus') as LeadFeeStatus,
      leadFeeAmount: calcLeadFee(carCount),
    };

    try {
      await fetch('/api/leads/quote', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      setEditingQuote(null);
      onRefresh();
    } catch (err) {
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

  const statusBadge = (st: QuotationLead['status']) => {
    switch (st) {
      case 'confirmed':
        return <span className="rounded-pill bg-leaf-soft px-2.5 py-0.5 text-[10px] font-extrabold text-leaf">คอนเฟิร์มแล้ว</span>;
      case 'quoted':
        return <span className="rounded-pill bg-accent/10 px-2.5 py-0.5 text-[10px] font-extrabold text-accent">ส่งราคาแล้ว</span>;
      case 'cancelled':
        return <span className="rounded-pill bg-berry-soft px-2.5 py-0.5 text-[10px] font-extrabold text-berry">ลูกค้ายกเลิก</span>;
      default:
        return <span className="rounded-pill bg-sun-soft px-2.5 py-0.5 text-[10px] font-extrabold text-sun-ink">รอติดต่อกลับ</span>;
    }
  };

  const tierBadge = (tier: VehicleTier) =>
    tier === 'strict_compliance_30' ? (
      <span className="rounded-pill bg-sun-soft px-2.5 py-0.5 text-[10px] font-extrabold text-sun-ink border border-sun/40">
        Strict 30
      </span>
    ) : (
      <span className="rounded-pill bg-accent-soft px-2.5 py-0.5 text-[10px] font-extrabold text-accent-deep border border-accent/30">
        Standard VIP
      </span>
    );

  const leadFeeBadge = (q: QuotationLead) => {
    const amount = q.leadFeeAmount || calcLeadFee(q.carCount);
    const style =
      q.leadFeeStatus === 'collected'
        ? 'bg-leaf-soft text-leaf'
        : q.leadFeeStatus === 'waived'
        ? 'bg-paper-2 text-ink-3 border border-rule'
        : 'bg-sun-soft text-sun-ink';
    return (
      <span className={`rounded-pill px-2.5 py-0.5 text-[10px] font-extrabold ${style}`}>
        Lead Fee ฿{formatBaht(amount)} · {LEAD_FEE_STATUS_META[q.leadFeeStatus]}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-paper p-3 rounded-2xl border border-rule">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อบริษัท ผู้ติดต่อ เส้นทาง พาร์ตเนอร์..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-card border border-rule text-xs focus:outline-accent"
          />
        </div>
        <span className="text-xs font-extrabold text-ink-2">
          คำขอทั้งหมด: {filtered.length} รายการ
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-ink-2 italic p-6 text-center rounded-2xl bg-paper">
          ไม่มีรายการคำขอใบเสนอราคา
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => {
            const leadFee = q.leadFeeAmount || calcLeadFee(q.carCount);
            return (
            <div key={q.id} className="rounded-2xl bg-paper p-4 border border-rule/80">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-extrabold text-sm text-ink">{q.companyName}</h4>
                    {statusBadge(q.status)}
                  </div>
                  {/* B2B badges: tier / fleet size / org type / lead fee */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {tierBadge(q.vehicleTier)}
                    <span className="rounded-pill bg-card px-2.5 py-0.5 text-[10px] font-extrabold text-ink border border-rule">
                      {q.carCount} คัน
                    </span>
                    <span className="rounded-pill bg-paper-2 px-2.5 py-0.5 text-[10px] font-bold text-ink-2">
                      {ORG_TYPE_META[q.orgType]}
                    </span>
                    {leadFeeBadge(q)}
                  </div>
                  <p className="text-xs text-ink-2 mt-1.5">
                    ผู้ติดต่อ: <span className="font-bold text-ink">{q.contactName || 'ไม่ระบุชื่อ'}</span> • วันที่เดินทาง: {q.travelDate}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={q.status}
                    onChange={(e) => handleStatusChange(q, e.target.value as QuotationLead['status'])}
                    className="rounded-lg bg-card border border-rule px-2 py-1 text-[11px] font-bold text-ink"
                  >
                    <option value="pending">รอติดต่อ</option>
                    <option value="quoted">ส่งราคาแล้ว</option>
                    <option value="confirmed">คอนเฟิร์มแล้ว</option>
                    <option value="cancelled">ยกเลิก</option>
                  </select>
                  <button
                    onClick={() => setEditingQuote(q)}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-card hover:bg-paper-2 text-ink border border-rule transition-transform active:scale-95"
                    title="แก้ไขใบเสนอราคา"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingQuote(q)}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-berry-soft hover:bg-berry/20 text-berry transition-transform active:scale-95"
                    title="ลบคำขอนี้"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="my-3 space-y-1 rounded-xl border border-rule bg-card p-3 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-ink-2">เส้นทางที่ต้องการ:</span>
                  <span className="font-bold text-ink text-right">{q.route}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-ink-2">จำนวนผู้โดยสาร / รถ:</span>
                  <span className="font-bold text-ink text-right">{q.passengers}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-ink-2">ระดับมาตรฐานรถ:</span>
                  <span className="font-bold text-ink text-right">
                    {VEHICLE_TIER_META[q.vehicleTier].label} ({q.carCount} คัน)
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-ink-2">ประกันอุบัติเหตุกลุ่ม:</span>
                  <span className="font-bold text-ink">
                    {q.includeInsurance ? 'คุ้มครอง 1,000,000 บาท/ท่าน' : 'ไม่เพิ่ม'}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-ink-2">ราคาประเมินเบื้องต้น:</span>
                  <span className="font-mono font-extrabold text-accent">฿{formatBaht(q.estimatedPrice)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-ink-2">ขอใบกำกับภาษี:</span>
                  <span className="font-bold text-ink">{q.needsTaxInvoice ? 'ต้องการ (หัก 3%)' : 'ไม่ต้องการ'}</span>
                </div>
                <div className="flex justify-between gap-3 border-t border-rule pt-1.5 mt-1.5">
                  <span className="text-ink-2">
                    ค่าแนะนำพาร์ตเนอร์ ({q.carCount} คัน x ฿{LEAD_FEE_PER_CAR}):
                  </span>
                  <span className="font-mono font-extrabold text-sun-ink">฿{formatBaht(leadFee)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-ink-2">กองรถที่รับงาน:</span>
                  <span className="font-bold text-ink">
                    {q.assignedPartner ? q.assignedPartner : <span className="italic text-ink-3">ยังไม่มอบหมาย</span>}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={`tel:${q.phone}`}
                    onClick={() => {
                      trackCall({
                        targetType: 'corporate_quote',
                        targetId: q.id,
                        targetTitle: `โทรหาลูกค้าองค์กร: ${q.companyName}`,
                        phoneNumber: q.phone,
                      });
                    }}
                    className="text-xs font-bold text-accent-deep hover:underline inline-flex items-center gap-1 font-mono"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    โทร {q.phone}
                  </a>
                  <span className="text-[10px] text-ink-2">
                    ส่งเมื่อ: {new Date(q.submittedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyLineSummary(q)}
                  className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-extrabold transition-colors active:scale-95 ${
                    copyState?.id === q.id && copyState.ok
                      ? 'bg-leaf-soft border-leaf text-leaf'
                      : copyState?.id === q.id && !copyState.ok
                      ? 'bg-berry-soft border-berry/40 text-berry'
                      : 'bg-card border-rule text-ink hover:bg-paper-2'
                  }`}
                >
                  {copyState?.id === q.id && copyState.ok ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>คัดลอกข้อความ LINE แล้ว</span>
                    </>
                  ) : copyState?.id === q.id && !copyState.ok ? (
                    <span>คัดลอกไม่สำเร็จ กรุณาลองใหม่</span>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>คัดลอกสรุปงานส่ง LINE พาร์ตเนอร์</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Edit Quote Modal */}
      {editingQuote && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl border border-rule text-ink my-8">
            <h3 className="font-display font-extrabold text-lg mb-4 text-ink">
              ✏️ แก้ไขข้อมูลใบเสนอราคาองค์กร
            </h3>

            <form onSubmit={handleSaveQuote} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">ชื่อองค์กร / บริษัท *</label>
                  <input
                    name="companyName"
                    defaultValue={editingQuote.companyName}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">ชื่อผู้ติดต่อ</label>
                  <input
                    name="contactName"
                    defaultValue={editingQuote.contactName || ''}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">เบอร์โทรศัพท์ *</label>
                  <input
                    name="phone"
                    defaultValue={editingQuote.phone}
                    required
                    className={`${inputClass} font-mono`}
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">วันที่เดินทาง</label>
                  <input
                    name="travelDate"
                    defaultValue={editingQuote.travelDate}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">เส้นทาง / แผนการเดินทาง</label>
                <input
                  name="route"
                  defaultValue={editingQuote.route}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">จำนวนผู้โดยสาร / คันรถ</label>
                  <input
                    name="passengers"
                    defaultValue={editingQuote.passengers}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">ราคาเสนอ (บาท)</label>
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
                  <label className="font-bold text-ink block mb-1">ใบกำกับภาษี</label>
                  <select
                    name="needsTaxInvoice"
                    defaultValue={editingQuote.needsTaxInvoice ? 'true' : 'false'}
                    className={inputClass}
                  >
                    <option value="true">ต้องการใบกำกับภาษี</option>
                    <option value="false">ไม่ต้องการ</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">สถานะ</label>
                  <select
                    name="status"
                    defaultValue={editingQuote.status}
                    className={`${inputClass} font-bold`}
                  >
                    <option value="pending">รอการติดต่อ (Pending)</option>
                    <option value="quoted">ส่งราคาแล้ว (Quoted)</option>
                    <option value="confirmed">คอนเฟิร์มแล้ว (Confirmed)</option>
                    <option value="cancelled">ลูกค้ายกเลิก (Cancelled)</option>
                  </select>
                </div>
              </div>

              {/* B2B Fleet Matching & Lead Fee */}
              <div className="rounded-xl border border-rule bg-paper p-3 space-y-3 pt-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-ink">🚐 B2B Fleet Matching & Lead Fee</span>
                  <span className="text-[10px] font-bold text-ink-2">
                    ค่าแนะนำ = จำนวนคัน x ฿{LEAD_FEE_PER_CAR}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-ink block mb-1">จำนวนคันรถ</label>
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
                    <label className="font-bold text-ink block mb-1">ระดับมาตรฐานรถ</label>
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
                    <label className="font-bold text-ink block mb-1">ประเภทองค์กร</label>
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
                    <label className="font-bold text-ink block mb-1">ประกันอุบัติเหตุกลุ่ม</label>
                    <select
                      name="includeInsurance"
                      defaultValue={editingQuote.includeInsurance ? 'true' : 'false'}
                      className={inputClass}
                    >
                      <option value="true">คุ้มครอง 1,000,000 บาท/ท่าน</option>
                      <option value="false">ไม่เพิ่มประกัน</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-ink block mb-1">พาร์ตเนอร์กองรถที่รับงาน (assigned partner)</label>
                  <input
                    name="assignedPartner"
                    defaultValue={editingQuote.assignedPartner || ''}
                    placeholder="เช่น ล้านนาคาราวาน / Chiang Mai Fleet"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-ink block mb-1">สถานะค่าแนะนำ (Lead Fee)</label>
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
                    <label className="font-bold text-ink block mb-1">ยอดค่าแนะนำที่เรียกเก็บ</label>
                    <div className="p-2 rounded-xl bg-card border border-rule font-mono font-extrabold text-sun-ink">
                      ฿{formatBaht(calcLeadFee(editingQuote.carCount))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setEditingQuote(null)}
                  className="rounded-pill px-4 py-2 text-xs font-bold text-ink-2 hover:bg-paper"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-pill bg-accent px-5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-accent-deep transition-transform active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AdminDeleteModal
        isOpen={Boolean(deletingQuote)}
        title="ยืนยันการลบใบเสนอราคา"
        itemTitle={`${deletingQuote?.companyName} (${deletingQuote?.route})`}
        isDeleting={isSubmitting}
        onClose={() => setDeletingQuote(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
