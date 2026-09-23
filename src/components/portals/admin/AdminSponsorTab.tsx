'use client';

import React, { useState } from 'react';
import { Sponsor } from '@/data/mockData';
import { Building2, Plus, Pencil, Trash2, FileSpreadsheet, Search } from 'lucide-react';
import { AdminDeleteModal } from './AdminDeleteModal';

interface AdminSponsorTabProps {
  sponsors: Sponsor[];
  onRefresh: () => void;
  getSponsorClickCount: (id: string) => number;
  onOpenReport: (sponsor: Sponsor) => void;
}

export const AdminSponsorTab: React.FC<AdminSponsorTabProps> = ({
  sponsors,
  onRefresh,
  getSponsorClickCount,
  onOpenReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [deletingSponsor, setDeletingSponsor] = useState<Sponsor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = sponsors.filter((s) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      s.title.toLowerCase().includes(q) ||
      s.location.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  });

  const handleDelete = async () => {
    if (!deletingSponsor) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/sponsors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingSponsor.id }),
      });
      setDeletingSponsor(null);
      onRefresh();
    } catch (err) {
      console.error('Error deleting sponsor:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSponsor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const sponsorData = {
      id: editingSponsor?.id,
      title: formData.get('title') as string,
      category: formData.get('category') as Sponsor['category'],
      categoryLabel: formData.get('categoryLabel') as string,
      tagline: formData.get('tagline') as string,
      badgeText: formData.get('badgeText') as string,
      discountText: formData.get('discountText') as string,
      image: formData.get('image') as string,
      link: formData.get('link') as string,
      location: formData.get('location') as string,
    };

    try {
      const method = editingSponsor ? 'PUT' : 'POST';
      await fetch('/api/sponsors', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sponsorData),
      });
      setEditingSponsor(null);
      setIsNewModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Error saving sponsor:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-paper p-3 rounded-2xl border border-rule">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อโรงแรม/ร้านค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-card border border-rule text-xs focus:outline-accent"
          />
        </div>

        <button
          onClick={() => {
            setEditingSponsor(null);
            setIsNewModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-pill bg-accent px-4 py-1.5 text-xs font-extrabold text-white hover:bg-accent-deep transition-transform active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>เพิ่มสปอนเซอร์ใหม่</span>
        </button>
      </div>

      {/* Sponsors List */}
      {filtered.length === 0 ? (
        <p className="text-xs text-ink-2 italic p-6 text-center rounded-2xl bg-paper">
          ไม่พบข้อมูลสปอนเซอร์
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((sp) => {
            const clicks = getSponsorClickCount(sp.id);
            return (
              <div key={sp.id} className="rounded-2xl bg-paper p-4 border border-rule/80">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-md bg-berry-soft text-berry font-bold text-xs shrink-0">
                        <Building2 className="h-3.5 w-3.5" />
                      </span>
                      <h4 className="font-extrabold text-sm text-ink">{sp.title}</h4>
                      <span className="rounded-pill bg-paper-2 px-2 py-0.5 text-[10px] font-bold text-ink-2">
                        {sp.categoryLabel}
                      </span>
                    </div>
                    <p className="text-xs text-ink-2 mt-0.5">
                      {sp.location} • <span className="text-accent font-bold">{sp.discountText}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenReport(sp)}
                      className="flex items-center gap-1 rounded-pill bg-card hover:bg-paper-2 text-ink border border-rule px-2.5 py-1 text-[11px] font-bold transition-transform active:scale-95"
                      title="ดูรายงานสถิติคลิก"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-leaf" />
                      <span>รายงาน</span>
                    </button>
                    <button
                      onClick={() => setEditingSponsor(sp)}
                      className="grid h-7 w-7 place-items-center rounded-lg bg-card hover:bg-paper-2 text-ink border border-rule transition-transform active:scale-95"
                      title="แก้ไขสปอนเซอร์"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingSponsor(sp)}
                      className="grid h-7 w-7 place-items-center rounded-lg bg-berry-soft hover:bg-berry/20 text-berry transition-transform active:scale-95"
                      title="ลบสปอนเซอร์"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-xl bg-card p-2.5 border border-rule text-xs">
                  <div className="text-[11px] text-ink-2 truncate max-w-[280px]">
                    ลิงก์: <span className="font-mono text-accent-deep">{sp.link}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-ink-2">สถิติคลิกจริง:</span>
                    <span className="rounded-pill bg-leaf-soft px-2.5 py-0.5 text-xs font-mono font-extrabold text-leaf">
                      {clicks} Clicks
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / New Sponsor Modal */}
      {(editingSponsor || isNewModalOpen) && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl border border-rule text-ink my-8">
            <h3 className="font-display font-extrabold text-lg mb-4 text-ink">
              {editingSponsor ? '✏️ แก้ไขข้อมูลสปอนเซอร์ / โฆษณา' : '➕ เพิ่มสปอนเซอร์ใหม่'}
            </h3>

            <form onSubmit={handleSaveSponsor} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-ink block mb-1">ชื่อธุรกิจ / โรงแรม / ร้านค้า *</label>
                <input
                  name="title"
                  defaultValue={editingSponsor?.title || ''}
                  required
                  placeholder="เช่น ม่อนฟ้า พูลวิลล่า & แกลมปิ้ง ม่อนแจ่ม"
                  className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">หมวดหมู่ *</label>
                  <select
                    name="category"
                    defaultValue={editingSponsor?.category || 'hotel'}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  >
                    <option value="hotel">ที่พัก & โรงแรม (Hotel)</option>
                    <option value="restaurant">ร้านอาหาร & คาเฟ่</option>
                    <option value="auto_service">อู่ & ยาง & บริการรถ</option>
                    <option value="activity">กิจกรรม & ปางช้าง</option>
                    <option value="insurance">ประกันภัย</option>
                    <option value="fuel">น้ำมัน & พลังงาน</option>
                    <option value="tour">ทัวร์ & กิจกรรมท่องเที่ยว</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">ป้ายกำกับหมวดหมู่</label>
                  <input
                    name="categoryLabel"
                    defaultValue={editingSponsor?.categoryLabel || 'ที่พักแนะนำพันธมิตร'}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">คำโฆษณา / สโลแกน (Tagline)</label>
                <input
                  name="tagline"
                  defaultValue={editingSponsor?.tagline || ''}
                  placeholder="เช่น สัมผัสทะเลหมอกหน้าห้องพัก สระว่ายน้ำส่วนตัว"
                  className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">ข้อความส่วนลด</label>
                  <input
                    name="discountText"
                    defaultValue={editingSponsor?.discountText || 'ลดทันที 15% เมื่อแสดงใบยืนยัน TripDee'}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">ป้าย Badge</label>
                  <input
                    name="badgeText"
                    defaultValue={editingSponsor?.badgeText || 'ส่วนลดพิเศษลูกค้า TripDee'}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">ที่ตั้ง / พิกัด</label>
                  <input
                    name="location"
                    defaultValue={editingSponsor?.location || 'ม่อนแจ่ม, เชียงใหม่'}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">ลิงก์ปลายทาง (URL หรือ LINE)</label>
                  <input
                    name="link"
                    defaultValue={editingSponsor?.link || 'https://line.me'}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">รูปภาพแบนเนอร์ (Image URL)</label>
                <input
                  name="image"
                  defaultValue={editingSponsor?.image || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'}
                  className="w-full p-2 rounded-xl bg-paper border border-rule text-ink font-mono"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSponsor(null);
                    setIsNewModalOpen(false);
                  }}
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
        isOpen={Boolean(deletingSponsor)}
        title="ยืนยันการลบสปอนเซอร์"
        itemTitle={deletingSponsor?.title || ''}
        isDeleting={isSubmitting}
        onClose={() => setDeletingSponsor(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
