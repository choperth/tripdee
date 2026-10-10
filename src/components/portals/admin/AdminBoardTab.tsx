'use client';

import React, { useState } from 'react';
import { BoardPost, BoardPostType, ZoneId } from '@/data/mockData';
import { Pencil, Trash2, Search, Star, Download, RefreshCw, ChevronDown, Copy, Check, Phone, MessageCircle, Calendar, Users, Plus } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { AdminDeleteModal } from './AdminDeleteModal';
import { AdminAlert } from './AdminAlert';
import { adminFetch } from '@/lib/adminClient';
import { isBoardPostExpired } from '@/lib/availabilityUtils';
import { copyTextToClipboard } from '@/lib/b2b';

interface AdminBoardTabProps {
  posts: BoardPost[];
  onRefresh: () => void;
}

type BoardTab = 'all' | 'request' | 'share' | 'featured' | 'corporate' | 'closed';

const TYPE_PILL: Record<BoardPostType, string> = {
  request: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  share: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
  offer: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
};

const TYPE_LABEL: Record<BoardPostType, string> = {
  request: 'หางานหาร/หารถคู่',
  share: 'หาเพื่อนร่วมทริป (Share)',
  offer: 'คนขับประกาศว่าง',
};

export const AdminBoardTab: React.FC<AdminBoardTabProps> = ({ posts, onRefresh }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<BoardTab>('all');
  const [sortMode, setSortMode] = useState<'latest' | 'oldest'>('latest');
  const [editingPost, setEditingPost] = useState<BoardPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<BoardPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyState, setCopyState] = useState<{ id: string; ok: boolean } | null>(null);
  const [actionError, setActionError] = useState('');

  const countBy = (fn: (p: BoardPost) => boolean) => posts.filter(fn).length;

  const tabs: { id: BoardTab; label: string; count: number; dot?: string; star?: boolean }[] = [
    { id: 'all', label: 'ทั้งหมด', count: posts.length },
    { id: 'request', label: 'หางานหาร/หารถคู่', count: countBy((p) => p.type === 'request'), dot: 'bg-amber-500' },
    { id: 'share', label: 'หาเพื่อนร่วมทริป (Share)', count: countBy((p) => p.type === 'share'), dot: 'bg-blue-500' },
    { id: 'featured', label: 'เฉพาะงานแนะนำ (Featured)', count: countBy((p) => Boolean(p.isVerified)), star: true },
    { id: 'corporate', label: 'งานองค์กร & อบจ. (B2B)', count: countBy((p) => p.category === 'corporate') },
    { id: 'closed', label: 'ปิด/สิ้นสุดแล้ว', count: countBy((p) => Boolean(p.isClosed) || isBoardPostExpired(p)), dot: 'bg-red-500' },
  ];

  const filtered = posts.filter((p) => {
    if (activeTab === 'request' && p.type !== 'request') return false;
    if (activeTab === 'share' && p.type !== 'share') return false;
    if (activeTab === 'featured' && !p.isVerified) return false;
    if (activeTab === 'corporate' && p.category !== 'corporate') return false;
    if (activeTab === 'closed' && !(p.isClosed || isBoardPostExpired(p))) return false;
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.authorName.toLowerCase().includes(q) ||
      p.authorPhone.includes(q) ||
      (p.authorWhatsApp || '').includes(q) ||
      (p.authorWeChat || '').toLowerCase().includes(q) ||
      (p.detail || '').toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  const sorted = sortMode === 'oldest' ? [...filtered].reverse() : filtered;

  const handleToggleVerified = async (post: BoardPost) => {
    setActionError('');
    try {
      await adminFetch('/api/board', {
        method: 'PUT',
        body: JSON.stringify({ id: post.id, isVerified: !post.isVerified }),
      });
      onRefresh();
      window.dispatchEvent(new CustomEvent('tripdee-board-updated'));
    } catch (err) {
      setActionError((err as Error).message);
      console.error('Error toggling post verified:', err);
    }
  };

  const handleDelete = async () => {
    if (!deletingPost) return;
    setIsSubmitting(true);
    setActionError('');
    try {
      await adminFetch('/api/board', {
        method: 'DELETE',
        body: JSON.stringify({ id: deletingPost.id }),
      });
      setDeletingPost(null);
      onRefresh();
      window.dispatchEvent(new CustomEvent('tripdee-board-updated'));
    } catch (err) {
      // Close the modal so the failure banner is visible, and keep the post.
      setDeletingPost(null);
      setActionError((err as Error).message);
      console.error('Error deleting board post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPost) return;
    setIsSubmitting(true);
    setActionError('');
    const form = e.currentTarget;
    const formData = new FormData(form);

    const updates = {
      id: editingPost.id,
      title: formData.get('title') as string,
      type: formData.get('type') as BoardPostType,
      zoneId: formData.get('zoneId') as ZoneId,
      date: formData.get('date') as string,
      days: Number(formData.get('days')) || 1,
      seats: Number(formData.get('seats')) || 1,
      price: Number(formData.get('price')) || 0,
      priceNote: (formData.get('priceNote') as string) || undefined,
      authorName: formData.get('authorName') as string,
      authorPhone: formData.get('authorPhone') as string,
      authorLine: formData.get('authorLine') as string,
      authorWhatsApp: (formData.get('authorWhatsApp') as string) || undefined,
      authorWeChat: (formData.get('authorWeChat') as string) || undefined,
      vehicleLabel: (formData.get('vehicleLabel') as string) || undefined,
      detail: formData.get('detail') as string,
      isVerified: formData.get('isVerified') === 'true',
    };

    try {
      await adminFetch('/api/board', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setEditingPost(null);
      onRefresh();
      window.dispatchEvent(new CustomEvent('tripdee-board-updated'));
    } catch (err) {
      setActionError((err as Error).message);
      console.error('Error updating board post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyContact = async (post: BoardPost) => {
    const lines = [
      `TripBoard ${post.id}: ${post.title}`,
      `ผู้ประกาศ: ${post.authorName} โทร ${post.authorPhone}`,
      post.authorLine ? `LINE: ${post.authorLine}` : '',
      post.authorWhatsApp ? `WhatsApp: ${post.authorWhatsApp}` : '',
      `วันที่: ${post.date} (${post.days} วัน) · ${post.seats} ที่นั่ง`,
      post.price > 0 ? `งบ: ฿${post.price.toLocaleString()} ${post.priceNote || ''}` : 'งบ: ต่อรองได้',
    ].filter(Boolean);
    const ok = await copyTextToClipboard(lines.join('\n'));
    setCopyState({ id: post.id, ok });
    window.setTimeout(() => setCopyState(null), 2500);
  };

  const handleExportCSV = () => {
    const header = ['id', 'type', 'title', 'authorName', 'authorPhone', 'authorLine', 'date', 'days', 'seats', 'price', 'priceNote', 'isVerified', 'category'];
    const esc = (val: unknown) => {
      const s = val === undefined || val === null ? '' : String(val);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = filtered.map((p) =>
      [p.id, p.type, p.title, p.authorName, p.authorPhone, p.authorLine, p.date, p.days, p.seats, p.price, p.priceNote || '', Boolean(p.isVerified), p.category || ''].map(esc).join(',')
    );
    const csv = '﻿' + [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tripboard-dispatch-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <AdminAlert message={actionError} onDismiss={() => setActionError('')} />
      {/* Breadcrumb + Title + Actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            ระบบจัดการข้อมูลยานพาหนะ <span className="mx-1">/</span> TripBoard Community Dispatch <span className="mx-1">/</span>{' '}
            <span className="text-slate-700 dark:text-slate-200 font-semibold">แผนกดูแล & ตรวจสอบงาน</span>
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              กระดานงาน TripBoard
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500" />
              ทั้งหมด {posts.length} โพสต์ในกระดาน
            </span>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mt-1">
            Dispatch-Cluster: TH-North/Central
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>รีเฟรชกระดาน</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>ส่งออกงานสรุป (CSV)</span>
          </button>
        </div>
      </div>

      {/* Search + tabs + sort */}
      <div className="rounded-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาโพสต์ในกระดาน, ชื่อผู้โพสต์, เบอร์โทร, เส้นทาง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-20 rounded-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 cursor-pointer"
              >
                ล้างค่า
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-none border transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950 dark:border-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                {tab.star ? (
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                ) : tab.dot ? (
                  <span className={`w-1.5 h-1.5 ${tab.dot}`} />
                ) : null}
                <span>{tab.label}</span>
                <span className={`font-mono text-[11px] px-1 ${active ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>เรียงตาม:</span>
            <div className="relative">
              <select
                aria-label="เรียงตาม"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as 'latest' | 'oldest')}
                className="pl-2 pr-7 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-transparent border border-slate-300 dark:border-slate-700 rounded-none focus:outline-none cursor-pointer appearance-none"
              >
                <option value="latest">โพสต์ล่าสุด (Latest)</option>
                <option value="oldest">เก่าสุดก่อน</option>
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Post cards */}
      {sorted.length === 0 ? (
        <p className="text-xs text-slate-500 italic p-6 text-center rounded-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {t('padm.boardEmpty')}
        </p>
      ) : (
        <div className="space-y-3">
          {sorted.map((post) => {
            const expired = isBoardPostExpired(post);
            const closed = Boolean(post.isClosed || expired);
            const lineHref = post.authorLine && post.authorLine.startsWith('http') ? post.authorLine : undefined;
            return (
              <div
                key={post.id}
                className={`rounded-none bg-white dark:bg-slate-900 border transition-colors ${
                  closed
                    ? 'border-red-300 dark:border-red-900'
                    : post.isVerified
                    ? 'border-slate-200 dark:border-slate-800 border-t-2 border-t-amber-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Top meta row */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 sm:px-4 pt-3">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className={`px-2 py-0.5 font-bold border rounded-none ${TYPE_PILL[post.type]}`}>
                      {TYPE_LABEL[post.type]}
                    </span>
                    {post.category === 'corporate' && (
                      <span className="px-2 py-0.5 font-bold bg-slate-950 text-white dark:bg-white dark:text-slate-950 rounded-none">
                        B2B องค์กร/รัฐ
                      </span>
                    )}
                    {post.isVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-none">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        <span>Featured</span>
                      </span>
                    )}
                    <span className="font-mono text-slate-400">รหัสโพสต์: #{post.id} • {post.postedAt || 'เพิ่งโพสต์'}</span>
                    {closed && (
                      <span className="px-2 py-0.5 font-bold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 rounded-none">
                        🔒 สิ้นสุดแล้ว
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleVerified(post)}
                      title={post.isVerified ? t('padm.featuredOff') : t('padm.featuredOn')}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold border rounded-none transition-colors cursor-pointer ${
                        post.isVerified
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                      }`}
                    >
                      <Plus className="h-3 w-3" />
                      <span>{post.isVerified ? 'แนะนำแล้ว' : 'ดันแนะนำ'}</span>
                    </button>
                    <button
                      onClick={() => setEditingPost(post)}
                      className="grid h-7 w-7 place-items-center rounded-none bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      title={t('padm.editPostTitle')}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingPost(post)}
                      className="grid h-7 w-7 place-items-center rounded-none bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      title={t('padm.deletePostTitle')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title + meta */}
                <div className="px-3.5 sm:px-4 pt-1.5">
                  <h4 className="font-bold text-sm sm:text-base text-slate-950 dark:text-white leading-snug">{post.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>โดย: {post.authorName}</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>วันที่: <strong className="text-slate-700 dark:text-slate-200">{post.date}</strong></span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>ความจุ: <strong className="text-slate-700 dark:text-slate-200">{post.seats} ที่นั่ง</strong></span>
                    {post.vehicleLabel && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>{post.vehicleLabel}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Detail quote box */}
                <div className="mx-3.5 sm:mx-4 mt-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  <span className="font-black text-slate-300 dark:text-slate-600 mr-1.5">❝</span>
                  {post.detail || t('padm.noDetail')}
                </div>

                {/* Contact + price + actions */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 px-3.5 sm:px-4 py-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`tel:${post.authorPhone}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>{post.authorPhone}</span>
                      </a>
                      {post.authorLine ? (
                        lineHref ? (
                          <a
                            href={lineHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-emerald-50 dark:bg-emerald-950/40 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 transition-colors"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>LINE: {post.authorLine.length > 24 ? `${post.authorLine.slice(0, 24)}…` : post.authorLine}</span>
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-emerald-50 dark:bg-emerald-950/40 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>LINE: {post.authorLine}</span>
                          </span>
                        )
                      ) : null}
                      {(post.quoteCount || 0) > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-none bg-blue-50 dark:bg-blue-950/40 text-[11px] font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          มีข้อเสนอรับแล้ว {post.quoteCount} ข้อเสนอ
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-end gap-2">
                    <div className="mr-1 text-right">
                      <p className="text-[10px] text-slate-400">งบประมาณเสนอ: {post.priceNote || ''}</p>
                      <p className="font-mono font-black text-lg text-slate-950 dark:text-white leading-tight">
                        {post.price > 0 ? `฿${post.price.toLocaleString()}` : '฿0 '}
                        <span className="text-[11px] font-semibold text-slate-400">
                          {post.type === 'share' ? '(ต่อท่าน)' : post.price > 0 ? '' : '(รอคนขับเสนอราคา)'}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyContact(post)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-none bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      {copyState?.id === post.id && copyState.ok ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copyState?.id === post.id && copyState.ok ? 'คัดลอกแล้ว' : 'คัดลอกข้อมูลติดต่อ'}</span>
                    </button>
                    <a
                      href={`tel:${post.authorPhone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>โทรด่วน</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Moderation rules strip */}
      <div className="rounded-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-none bg-slate-100 dark:bg-slate-800 text-slate-500">
            <ShieldIcon />
          </span>
          <div className="min-w-0">
            <h4 className="text-xs font-black">กฎการใช้งานกระดาน TripBoard Community Moderation & Direct Deal Rules</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              ติดต่อตรงไม่ผ่านคนกลาง ดีลตรงคนขับ 100% ห้ามโอนมัดจำก่อนเห็นรถจริงและตรวจสอบบัตรประชาชน •
              ระบบตรวจจับข้อความสแปมและการปั่นราคา • โพสต์ที่สิ้นสุดวันเดินทางจะถูกปัดตกกระดานอัตโนมัติ
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
          MODERATION ENGINE v2.4 ONLINE
        </span>
      </div>

      {/* Edit Board Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-none bg-card p-6 shadow-2xl border border-rule text-ink my-8">
            <h3 className="font-display font-extrabold text-lg mb-4 text-ink">
              {t('padm.editPostForm')}
            </h3>

            <form onSubmit={handleSavePost} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-ink block mb-1">{t('padm.fPostTitle')}</label>
                <input
                  name="title"
                  defaultValue={editingPost.title}
                  required
                  className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fPostType')}</label>
                  <select
                    name="type"
                    defaultValue={editingPost.type}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                  >
                    <option value="request">{t('padm.bpRequestLong')}</option>
                    <option value="share">{t('padm.bpShareLong')}</option>
                    <option value="offer">{t('padm.bpOfferLong')}</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fZone')}</label>
                  <select
                    name="zoneId"
                    defaultValue={editingPost.zoneId}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                  >
                    <option value="city">{t('padm.zoneCity')}</option>
                    <option value="midHill">{t('padm.zoneMidHill')}</option>
                    <option value="highHill">{t('padm.zoneHighHill')}</option>
                    <option value="crossProvince">{t('padm.zoneCross')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fPosterName')}</label>
                  <input
                    name="authorName"
                    defaultValue={editingPost.authorName}
                    required
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fPhone')}</label>
                  <input
                    name="authorPhone"
                    defaultValue={editingPost.authorPhone}
                    required
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">LINE ID</label>
                  <input
                    name="authorLine"
                    defaultValue={editingPost.authorLine}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">WhatsApp</label>
                  <input
                    name="authorWhatsApp"
                    defaultValue={editingPost.authorWhatsApp || ''}
                    placeholder={t('padm.fWhatsAppPh2')}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">WeChat ID</label>
                  <input
                    name="authorWeChat"
                    defaultValue={editingPost.authorWeChat || ''}
                    placeholder={t('padm.fWeChatPh')}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fTravelDateShort')}</label>
                  <input
                    name="date"
                    defaultValue={editingPost.date}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fSeatsShort')}</label>
                  <input
                    name="seats"
                    type="number"
                    defaultValue={editingPost.seats}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fPriceBaht')}</label>
                  <input
                    name="price"
                    type="number"
                    defaultValue={editingPost.price}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fFeaturedPin')}</label>
                  <select
                    name="isVerified"
                    defaultValue={editingPost.isVerified ? 'true' : 'false'}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                  >
                    <option value="true">{t('padm.featuredPinYes')}</option>
                    <option value="false">{t('padm.featuredPinNo')}</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fPriceNote')}</label>
                  <input
                    name="priceNote"
                    defaultValue={editingPost.priceNote || ''}
                    placeholder={t('padm.fPriceNotePh')}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">{t('padm.fPostDetail')}</label>
                <textarea
                  name="detail"
                  rows={3}
                  defaultValue={editingPost.detail}
                  className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
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
        isOpen={Boolean(deletingPost)}
        title={t('padm.delBoardTitle')}
        itemTitle={deletingPost?.title || ''}
        isDeleting={isSubmitting}
        onClose={() => setDeletingPost(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

const ShieldIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
