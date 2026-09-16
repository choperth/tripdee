'use client';

import React, { useState } from 'react';
import { BoardPost, ZoneId } from '@/data/mockData';
import { Pencil, Trash2, ShieldCheck, Search } from 'lucide-react';
import { AdminDeleteModal } from './AdminDeleteModal';

interface AdminBoardTabProps {
  posts: BoardPost[];
  onRefresh: () => void;
}

export const AdminBoardTab: React.FC<AdminBoardTabProps> = ({ posts, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPost, setEditingPost] = useState<BoardPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<BoardPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = posts.filter((p) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.authorName.toLowerCase().includes(q) ||
      p.authorPhone.includes(q) ||
      p.detail.toLowerCase().includes(q)
    );
  });

  const handleToggleVerified = async (post: BoardPost) => {
    try {
      await fetch('/api/board', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, isVerified: !post.isVerified }),
      });
      onRefresh();
      window.dispatchEvent(new CustomEvent('tripdee-board-updated'));
    } catch (err) {
      console.error('Error toggling post verified:', err);
    }
  };

  const handleDelete = async () => {
    if (!deletingPost) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/board', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingPost.id }),
      });
      setDeletingPost(null);
      onRefresh();
      window.dispatchEvent(new CustomEvent('tripdee-board-updated'));
    } catch (err) {
      console.error('Error deleting board post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPost) return;
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const updates = {
      id: editingPost.id,
      title: formData.get('title') as string,
      type: formData.get('type') as 'request' | 'offer',
      zoneId: formData.get('zoneId') as ZoneId,
      date: formData.get('date') as string,
      days: Number(formData.get('days')) || 1,
      seats: Number(formData.get('seats')) || 1,
      price: Number(formData.get('price')) || 0,
      priceNote: (formData.get('priceNote') as string) || undefined,
      authorName: formData.get('authorName') as string,
      authorPhone: formData.get('authorPhone') as string,
      authorLine: formData.get('authorLine') as string,
      vehicleLabel: (formData.get('vehicleLabel') as string) || undefined,
      detail: formData.get('detail') as string,
      isVerified: formData.get('isVerified') === 'true',
    };

    try {
      await fetch('/api/board', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      setEditingPost(null);
      onRefresh();
      window.dispatchEvent(new CustomEvent('tripdee-board-updated'));
    } catch (err) {
      console.error('Error updating board post:', err);
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
            placeholder="ค้นหาโพสต์ในกระดาน ชื่อ เบอร์..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-card border border-rule text-xs focus:outline-accent"
          />
        </div>
        <span className="text-xs font-extrabold text-ink-2">
          กระทู้ทั้งหมด: {filtered.length} โพสต์
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-ink-2 italic p-6 text-center rounded-2xl bg-paper">
          ไม่มีโพสต์ในกระดาน
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <div key={post.id} className="rounded-2xl bg-paper p-4 border border-rule/80">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-pill px-2 py-0.5 text-[10px] font-extrabold ${
                      post.type === 'offer' ? 'bg-leaf-soft text-leaf' : 'bg-sun-soft text-sun-ink'
                    }`}>
                      {post.type === 'offer' ? 'คนขับหารถ/รับงาน' : 'หาคนหาร/หารถตู้'}
                    </span>
                    <h4 className="font-extrabold text-sm text-ink">{post.title}</h4>
                    {post.isVerified && (
                      <span className="flex items-center gap-0.5 rounded-pill bg-leaf-soft px-2 py-0.5 text-[10px] font-extrabold text-leaf">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-2 mt-0.5">
                    โดย: <span className="font-bold text-ink">{post.authorName}</span> • วันที่: {post.date} • {post.seats} ที่นั่ง
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleVerified(post)}
                    className={`rounded-pill px-2.5 py-1 text-[11px] font-extrabold transition-colors ${
                      post.isVerified ? 'bg-leaf/10 text-leaf hover:bg-leaf/20' : 'bg-rule text-ink-2 hover:bg-rule-2'
                    }`}
                  >
                    {post.isVerified ? '✓ ตรวจแล้ว' : '+ ยืนยันโพสต์'}
                  </button>
                  <button
                    onClick={() => setEditingPost(post)}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-card hover:bg-paper-2 text-ink border border-rule transition-transform active:scale-95"
                    title="แก้ไขโพสต์"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingPost(post)}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-berry-soft hover:bg-berry/20 text-berry transition-transform active:scale-95"
                    title="ลบโพสต์"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <p className="my-2 text-xs text-ink-2 line-clamp-2 bg-card p-2.5 rounded-xl border border-rule">
                {post.detail}
              </p>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-mono text-ink font-bold">
                  โทร: {post.authorPhone} {post.authorLine ? `(LINE: ${post.authorLine})` : ''}
                </span>
                <span className="font-mono font-extrabold text-accent">
                  ฿{post.price.toLocaleString()} {post.priceNote ? `(${post.priceNote})` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Board Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl border border-rule text-ink my-8">
            <h3 className="font-display font-extrabold text-lg mb-4 text-ink">
              ✏️ แก้ไขกระทู้ในกระดาน
            </h3>

            <form onSubmit={handleSavePost} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-ink block mb-1">หัวข้อประกาศ *</label>
                <input
                  name="title"
                  defaultValue={editingPost.title}
                  required
                  className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">ประเภทประกาศ *</label>
                  <select
                    name="type"
                    defaultValue={editingPost.type}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  >
                    <option value="request">หาคนหาร / หารถ (Request)</option>
                    <option value="offer">คนขับเสนอรถ / ว่างงาน (Offer)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">โซนท่องเที่ยว</label>
                  <select
                    name="zoneId"
                    defaultValue={editingPost.zoneId}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  >
                    <option value="city">ตัวเมือง & รอบนอก</option>
                    <option value="midHill">ดอยปานกลาง (ม่อนแจ่ม/แม่กำปอง)</option>
                    <option value="highHill">ดอยสูง (อินทนนท์/อ่างขาง)</option>
                    <option value="crossProvince">ข้ามจังหวัด (เชียงราย/ปาย)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">ชื่อผู้โพสต์ *</label>
                  <input
                    name="authorName"
                    defaultValue={editingPost.authorName}
                    required
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">เบอร์โทรศัพท์ *</label>
                  <input
                    name="authorPhone"
                    defaultValue={editingPost.authorPhone}
                    required
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">LINE ID</label>
                  <input
                    name="authorLine"
                    defaultValue={editingPost.authorLine}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">วันที่เดินทาง</label>
                  <input
                    name="date"
                    defaultValue={editingPost.date}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">จำนวนที่นั่ง</label>
                  <input
                    name="seats"
                    type="number"
                    defaultValue={editingPost.seats}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">ราคา (บาท)</label>
                  <input
                    name="price"
                    type="number"
                    defaultValue={editingPost.price}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">ตรา Verified</label>
                  <select
                    name="isVerified"
                    defaultValue={editingPost.isVerified ? 'true' : 'false'}
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  >
                    <option value="true">ยืนยันแล้ว (มีตรา Verified)</option>
                    <option value="false">ยังไม่ยืนยัน</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">หมายเหตุราคา</label>
                  <input
                    name="priceNote"
                    defaultValue={editingPost.priceNote || ''}
                    placeholder="เช่น ราคารวมน้ำมันแล้ว"
                    className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">รายละเอียดข้อความโพสต์</label>
                <textarea
                  name="detail"
                  rows={3}
                  defaultValue={editingPost.detail}
                  className="w-full p-2 rounded-xl bg-paper border border-rule text-ink"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
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
        isOpen={Boolean(deletingPost)}
        title="ยืนยันการลบโพสต์ในกระดาน"
        itemTitle={deletingPost?.title || ''}
        isDeleting={isSubmitting}
        onClose={() => setDeletingPost(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
