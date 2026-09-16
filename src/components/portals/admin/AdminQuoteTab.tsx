'use client';

import React, { useState } from 'react';
import { QuotationLead } from '@/lib/leadsStore';
import { Pencil, Trash2, PhoneCall, Search } from 'lucide-react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { AdminDeleteModal } from './AdminDeleteModal';

interface AdminQuoteTabProps {
  quotes: QuotationLead[];
  onRefresh: () => void;
}

export const AdminQuoteTab: React.FC<AdminQuoteTabProps> = ({ quotes, onRefresh }) => {
  const { trackCall } = useAnalytics();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingQuote, setEditingQuote] = useState<QuotationLead | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<QuotationLead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = quotes.filter((q) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      q.companyName.toLowerCase().includes(term) ||
      (q.contactName && q.contactName.toLowerCase().includes(term)) ||
      q.phone.includes(term) ||
      q.route.toLowerCase().includes(term)
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

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-paper p-3 rounded-2xl border border-rule">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อบริษัท ผู้ติดต่อ เส้นทาง..."
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
          {filtered.map((q) => (
            <div key={q.id} className="rounded-2xl bg-paper p-4 border border-rule/80">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-ink">{q.companyName}</h4>
                    {statusBadge(q.status)}
                  </div>
                  <p className="text-xs text-ink-2 mt-0.5">
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
                <div className="flex justify-between">
                  <span className="text-ink-2">เส้นทางที่ต้องการ:</span>
                  <span className="font-bold text-ink">{q.route}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-2">จำนวนผู้โดยสาร / รถ:</span>
                  <span className="font-bold text-ink">{q.passengers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-2">ราคาประเมินเบื้องต้น:</span>
                  <span className="font-mono font-extrabold text-accent">฿{q.estimatedPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-2">ขอใบกำกับภาษี:</span>
                  <span className="font-bold text-ink">{q.needsTaxInvoice ? 'ต้องการ (หัก 3%)' : 'ไม่ต้องการ'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
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
            </div>
          ))}
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
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">ชื่อผู้ติดต่อ</label>
                  <input
                    name="contactName"
                    defaultValue={editingQuote.contactName || ''}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
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
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">วันที่เดินทาง</label>
                  <input
                    name="travelDate"
                    defaultValue={editingQuote.travelDate}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">เส้นทาง / แผนการเดินทาง</label>
                <input
                  name="route"
                  defaultValue={editingQuote.route}
                  className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">จำนวนผู้โดยสาร / คันรถ</label>
                  <input
                    name="passengers"
                    defaultValue={editingQuote.passengers}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">ราคาเสนอ (บาท)</label>
                  <input
                    name="estimatedPrice"
                    type="number"
                    defaultValue={editingQuote.estimatedPrice}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">ใบกำกับภาษี</label>
                  <select
                    name="needsTaxInvoice"
                    defaultValue={editingQuote.needsTaxInvoice ? 'true' : 'false'}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
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
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink font-bold"
                  >
                    <option value="pending">รอการติดต่อ (Pending)</option>
                    <option value="quoted">ส่งราคาแล้ว (Quoted)</option>
                    <option value="confirmed">คอนเฟิร์มแล้ว (Confirmed)</option>
                    <option value="cancelled">ลูกค้ายกเลิก (Cancelled)</option>
                  </select>
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
