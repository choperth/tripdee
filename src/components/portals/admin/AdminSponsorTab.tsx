'use client';

import React, { useState } from 'react';
import { Sponsor } from '@/data/mockData';
import { Plus, Pencil, Trash2, FileSpreadsheet, Search, Download, RefreshCw, Link2, MousePointerClick, LayoutGrid, BadgeCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { AdminDeleteModal } from './AdminDeleteModal';

interface AdminSponsorTabProps {
  sponsors: Sponsor[];
  onRefresh: () => void;
  getSponsorClickCount: (id: string) => number;
  onOpenReport: (sponsor: Sponsor) => void;
}

const CATEGORY_CODE: Record<Sponsor['category'], string> = {
  hotel: 'HOTEL',
  cooking: 'COOK',
  tour: 'TOUR',
  activity: 'ACT',
  restaurant: 'FOOD',
  auto_service: 'AUTO',
  fuel: 'FUEL',
  insurance: 'INS',
};

export const AdminSponsorTab: React.FC<AdminSponsorTabProps> = ({
  sponsors,
  onRefresh,
  getSponsorClickCount,
  onOpenReport,
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [preset, setPreset] = useState<'none' | 'clicked' | 'unclicked' | 'line'>('none');
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [deletingSponsor, setDeletingSponsor] = useState<Sponsor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clicksOf = (id: string) => getSponsorClickCount(id);
  const totalClicks = sponsors.reduce((sum, s) => sum + clicksOf(s.id), 0);
  const clickedCount = sponsors.filter((s) => clicksOf(s.id) > 0).length;
  const categories = Array.from(
    sponsors.reduce((map, s) => {
      if (!map.has(s.category)) map.set(s.category, s.categoryLabel || s.category);
      return map;
    }, new Map<string, string>()).entries()
  );

  const filtered = sponsors.filter((s) => {
    if (activeCategory !== 'all' && s.category !== activeCategory) return false;
    if (preset === 'clicked' && clicksOf(s.id) <= 0) return false;
    if (preset === 'unclicked' && clicksOf(s.id) > 0) return false;
    if (preset === 'line' && !s.link.includes('line')) return false;
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      s.title.toLowerCase().includes(q) ||
      s.location.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      (s.categoryLabel || '').toLowerCase().includes(q)
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

  const handleExportCSV = () => {
    const header = ['id', 'title', 'category', 'location', 'link', 'clicks'];
    const esc = (val: unknown) => {
      const s = val === undefined || val === null ? '' : String(val);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = filtered.map((s) =>
      [s.id, s.title, s.category, s.location, s.link, clicksOf(s.id)].map(esc).join(',')
    );
    const csv = '﻿' + [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sponsor-directory-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const stats = [
    { label: 'สปอนเซอร์ที่ใช้งาน', value: String(sponsors.length), unit: 'บริษัท', sub: 'สัญญาโฆษณาที่เปิดแสดงผล', icon: LayoutGrid, bar: 'bg-slate-950 dark:bg-white' },
    { label: 'คลิกรวมทั้งหมด', value: String(totalClicks), unit: 'Clicks', sub: `จาก ${clickedCount} พาร์ทเนอร์ที่มีคลิก`, icon: MousePointerClick, bar: 'bg-emerald-500' },
    { label: 'หมวดหมู่พันธมิตร', value: String(categories.length), unit: 'หมวด', sub: 'ครอบคลุมที่พัก/ทัวร์/กิจกรรม', icon: BadgeCheck, bar: 'bg-amber-500' },
    { label: 'มีคลิกแล้ว', value: String(clickedCount), unit: 'บริษัท', sub: 'พาร์ทเนอร์ที่เกิด Direct Click', icon: Link2, bar: 'bg-blue-500' },
  ];

  const presetBtn = (id: typeof preset, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setPreset((p) => (p === id ? 'none' : id))}
      className={`px-2.5 py-1 text-[11px] font-bold border rounded-none transition-colors cursor-pointer ${
        preset === id
          ? 'bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950 dark:border-white'
          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Breadcrumb + Title + Actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            สปอนเซอร์ & สัญญาพันธมิตร <span className="mx-1">/</span>{' '}
            <span className="text-slate-700 dark:text-slate-200 font-semibold">Sponsors & Commercial Directory</span>
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              สปอนเซอร์ & สัญญาพันธมิตร
            </h3>
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5">
              ทั้งหมด {sponsors.length} สปอนเซอร์ที่ใช้งาน (ACTIVE SPONSORS)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            ข้อมูลสัญญาพันธมิตรที่เปิดแสดงผลบนแพลตฟอร์ม อัปเดตยอดคลิกแบบ Real-time
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>รีเฟรชข้อมูล</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>ส่งออกภาพรวมสถิติ (CSV)</span>
          </button>
          <button
            onClick={() => {
              setEditingSponsor(null);
              setIsNewModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-none bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-950 text-white text-xs font-bold border border-slate-950 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-amber-500" strokeWidth={3} />
            <span>+ เพิ่มสปอนเซอร์ใหม่</span>
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((st) => (
          <div
            key={st.label}
            className="rounded-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{st.label}</p>
              <st.icon className="h-4 w-4 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="mt-1 text-2xl font-black tabular-nums text-slate-950 dark:text-white">
              {st.value}
              <span className="ml-1 text-[11px] font-bold text-slate-400">{st.unit}</span>
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">{st.sub}</p>
            <div className="mt-2 h-0.5 bg-slate-100 dark:bg-slate-800">
              <div className={`h-full w-full ${st.bar}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Search + presets + category tabs */}
      <div className="rounded-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อบริษัท/สถานที่, หมวดหมู่, จังหวัด..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mr-1">Presets:</span>
          {presetBtn('clicked', 'มีคลิกแล้ว')}
          {presetBtn('unclicked', 'ยังไม่มีคลิก')}
          {presetBtn('line', 'ลิงก์ LINE OA')}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 text-xs font-bold border rounded-none transition-colors cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950 dark:border-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
            }`}
          >
            ทั้งหมด <span className="font-mono text-[11px] opacity-70">{sponsors.length}</span>
          </button>
          {categories.map(([key, label]) => {
            const n = sponsors.filter((s) => s.category === key).length;
            const active = activeCategory === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveCategory(active ? 'all' : key)}
                className={`px-3 py-1.5 text-xs font-bold border rounded-none transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950 dark:border-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                {label} <span className="font-mono text-[11px] opacity-70">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sponsor rows */}
      {filtered.length === 0 ? (
        <p className="text-xs text-slate-500 italic p-6 text-center rounded-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {t('padm.sponsorEmpty')}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((sp) => {
            const clicks = clicksOf(sp.id);
            return (
              <div
                key={sp.id}
                className="rounded-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors p-3.5 sm:p-4 flex flex-col sm:flex-row gap-3.5"
              >
                {/* Logo box */}
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-none bg-slate-950 text-white text-[11px] font-black tracking-wider">
                  {CATEGORY_CODE[sp.category] || 'SPN'}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-slate-400">
                    {sp.categoryLabel} • {sp.location}
                  </p>
                  <h4 className="font-bold text-sm text-slate-950 dark:text-white leading-snug mt-0.5">{sp.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{sp.tagline}</p>
                  <a
                    href={sp.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-full"
                  >
                    <Link2 className="h-3 w-3 shrink-0" />
                    <span className="truncate">{sp.link}</span>
                  </a>
                  {sp.discountText && (
                    <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{sp.discountText}</p>
                  )}
                </div>

                {/* Stats + actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-none">
                    <MousePointerClick className="h-3 w-3" />
                    สถิติคลิกจริง: {clicks} Clicks
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenReport(sp)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-none bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                      title={t('padm.viewReport')}
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{t('padm.reportBtn')}</span>
                    </button>
                    <button
                      onClick={() => setEditingSponsor(sp)}
                      className="grid h-7 w-7 place-items-center rounded-none bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      title={t('padm.editSponsorTitle')}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingSponsor(sp)}
                      className="grid h-7 w-7 place-items-center rounded-none bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      title={t('padm.deleteSponsorTitle')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QA strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rounded-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <h4 className="text-xs font-black flex items-center gap-1.5">
            <BadgeCheck className="h-4 w-4 text-amber-600" />
            เกณฑ์มาตรฐานพันธมิตรสปอนเซอร์และการแสดงผล (Sponsorship & QA)
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
            ตรวจสอบลิงก์ปลายทางก่อนเผยแพร่ทุกครั้ง แสดงป้ายกำกับโฆษณาชัดเจน และนับยอดคลิกแบบเรียลไทม์
            พาร์ทเนอร์ที่ลิงก์เสียหรือหมดสัญญาจะถูกถอดออกจากการแสดงผลทันที
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            <div className="flex items-center gap-2 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-none bg-emerald-700 text-white text-xs font-black">P</span>
              <div>
                <p className="text-[11px] font-bold">Van Parking Guarantee</p>
                <p className="text-[10px] text-slate-400">จุดจอดรถตู้ตรวจสอบแล้วทุกแห่ง</p>
              </div>
            </div>
            <div className="flex items-center gap-2 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-none bg-slate-950 text-white">
                <Link2 className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-[11px] font-bold">Direct Verified Link</p>
                <p className="text-[10px] text-slate-400">ลิงก์ตรงผ่านการยืนยัน SSL 100%</p>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-none bg-slate-950 text-white p-4 border border-slate-950">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Telemetry Protocol</p>
            <span className="w-1.5 h-1.5 bg-emerald-500" />
          </div>
          <h4 className="text-sm font-black mt-1">VERIFICATION ENGINE ACTIVE</h4>
          <p className="text-[10px] font-mono text-slate-400">SPONSOR MONETIZATION MODULE ONLINE</p>
          <dl className="mt-3 space-y-1 text-[11px] font-mono">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Click Attribution:</dt>
              <dd className="text-emerald-400 font-bold">UID-v4 Real-time</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Audit Status:</dt>
              <dd className="text-emerald-400 font-bold">COMPLIANT</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Active Sponsors:</dt>
              <dd className="font-bold">{sponsors.length}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Edit / New Sponsor Modal */}
      {(editingSponsor || isNewModalOpen) && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-none bg-card p-6 shadow-2xl border border-rule text-ink my-8">
            <h3 className="font-display font-extrabold text-lg mb-4 text-ink">
              {editingSponsor ? t('padm.sponsorFormEdit') : t('padm.sponsorFormNew')}
            </h3>

            <form onSubmit={handleSaveSponsor} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-ink block mb-1">{t('padm.fBizName')}</label>
                <input
                  name="title"
                  defaultValue={editingSponsor?.title || ''}
                  required
                  placeholder={t('padm.fBizNamePh')}
                  className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fCategory')}</label>
                  <select
                    name="category"
                    defaultValue={editingSponsor?.category || 'hotel'}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                  >
                    <option value="hotel">{t('padm.catHotel')}</option>
                    <option value="cooking">{t('padm.catCooking')}</option>
                    <option value="restaurant">{t('padm.catRestaurant')}</option>
                    <option value="auto_service">{t('padm.catAuto')}</option>
                    <option value="activity">{t('padm.catActivity')}</option>
                    <option value="insurance">{t('padm.catInsurance')}</option>
                    <option value="fuel">{t('padm.catFuel')}</option>
                    <option value="tour">{t('padm.catTour')}</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fCategoryLabel')}</label>
                  <input
                    name="categoryLabel"
                    defaultValue={editingSponsor?.categoryLabel || t('padm.fCategoryLabelPh')}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">{t('padm.fTagline')}</label>
                <input
                  name="tagline"
                  defaultValue={editingSponsor?.tagline || ''}
                  placeholder={t('padm.fTaglinePh')}
                  className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fDiscountText')}</label>
                  <input
                    name="discountText"
                    defaultValue={editingSponsor?.discountText || t('padm.fDiscountTextPh')}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fBadgeText')}</label>
                  <input
                    name="badgeText"
                    defaultValue={editingSponsor?.badgeText || t('padm.fBadgeTextPh')}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fLocation')}</label>
                  <input
                    name="location"
                    defaultValue={editingSponsor?.location || t('padm.fLocationPh')}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink block mb-1">{t('padm.fLink')}</label>
                  <input
                    name="link"
                    defaultValue={editingSponsor?.link || 'https://line.me'}
                    className="w-full p-2 rounded-none bg-paper border border-rule text-ink font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-ink block mb-1">{t('padm.fImage')}</label>
                <input
                  name="image"
                  defaultValue={editingSponsor?.image || ''}
                  className="w-full p-2 rounded-none bg-paper border border-rule text-ink font-mono"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSponsor(null);
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
        isOpen={Boolean(deletingSponsor)}
        title={t('padm.delSponsorTitle')}
        itemTitle={deletingSponsor?.title || ''}
        isDeleting={isSubmitting}
        onClose={() => setDeletingSponsor(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
