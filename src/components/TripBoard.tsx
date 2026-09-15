'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import type { DictKey } from '@/i18n/dictionaries';
import {
  BOARD_POSTS,
  ZONE_RATE_CARDS,
  formatTHB,
  BoardPost,
  BoardPostType,
  ZoneId,
} from '@/data/mockData';
import {
  ClipboardList,
  Plus,
  X,
  Phone,
  MessageCircle,
  MapPin,
  CalendarDays,
  Users,
  ShieldCheck,
  Clock,
  Send,
  CheckCircle2,
  Lock,
  Briefcase,
} from 'lucide-react';
import { DriverPushBell } from '@/components/notifications/DriverPushBell';

type BoardFilter = 'all' | BoardPostType | 'corporate';

const FILTERS: { id: BoardFilter; label?: string; key?: DictKey }[] = [
  { id: 'all', key: 'board.filterAll' },
  { id: 'request', key: 'board.filterRequest' },
  { id: 'offer', key: 'board.filterOffer' },
  { id: 'corporate', label: '🏢 งานองค์กร / คาราวาน' },
];

const inputCls =
  'w-full rounded-input border border-rule bg-card px-3.5 py-2.5 text-sm font-semibold text-ink transition-colors placeholder:font-normal placeholder:text-ink-2/60 hover:border-accent/40 focus:border-accent focus:outline-none';
const labelCls = 'mb-1 block text-xs font-bold uppercase tracking-wider text-ink-2';

interface PostFormState {
  type: BoardPostType;
  category: 'general' | 'corporate';
  title: string;
  zoneId: ZoneId;
  date: string;
  days: string;
  seats: string;
  price: string;
  priceNote: string;
  authorName: string;
  authorPhone: string;
  authorLine: string;
  vehicleLabel: string;
  detail: string;
  pin: string;
}

const EMPTY_FORM: PostFormState = {
  type: 'request',
  category: 'general',
  title: '',
  zoneId: 'city',
  date: '',
  days: '1',
  seats: '',
  price: '',
  priceNote: '',
  authorName: '',
  authorPhone: '',
  authorLine: '',
  vehicleLabel: '',
  detail: '',
  pin: '',
};

export const TripBoard: React.FC = () => {
  const { t } = useLanguage();
  const { trackCall } = useAnalytics();
  const [posts, setPosts] = useState<BoardPost[]>(BOARD_POSTS);
  const [filter, setFilter] = useState<BoardFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<PostFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Self-Service Close Post Modal State
  const [closingPost, setClosingPost] = useState<BoardPost | null>(null);
  const [closePin, setClosePin] = useState('');
  const [closeError, setCloseError] = useState('');
  const [closeSuccess, setCloseSuccess] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const loadBoardPosts = React.useCallback(() => {
    fetch('/api/board')
      .then((res) => res.json())
      .then((data) => {
        if (data.posts && Array.isArray(data.posts)) {
          setPosts(data.posts);
        }
      })
      .catch((err) => console.debug('Failed to fetch board posts:', err));
  }, []);

  useEffect(() => {
    loadBoardPosts();
    const handleUpdate = () => loadBoardPosts();
    window.addEventListener('tripdee-board-updated', handleUpdate);
    return () => window.removeEventListener('tripdee-board-updated', handleUpdate);
  }, [loadBoardPosts]);

  const visiblePosts = posts.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'corporate') return p.category === 'corporate';
    return p.type === filter;
  });

  const set = (patch: Partial<PostFormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const days = Math.max(1, Number(form.days) || 1);
    const seats = Math.max(1, Number(form.seats) || 1);
    const price = Math.max(0, Math.round(Number(form.price) || 0));
    if (price <= 0) return;
    const post: BoardPost = {
      id: `b-${Date.now().toString().slice(-6)}`,
      type: form.type,
      category: form.category,
      title: form.title.trim(),
      zoneId: form.zoneId,
      date: form.date.trim(),
      days,
      seats,
      price,
      priceNote: form.priceNote.trim() || undefined,
      authorName: form.authorName.trim(),
      authorPhone: form.authorPhone.trim(),
      authorLine: form.authorLine.trim(),
      vehicleLabel: form.type === 'offer' && form.vehicleLabel.trim() ? form.vehicleLabel.trim() : undefined,
      detail: form.detail.trim(),
      pin: form.pin.trim() || undefined,
      postedAt: t('board.justNow'),
    };
    setPosts((prev) => [post, ...prev]);
    setForm(EMPTY_FORM);
    setFormOpen(false);

    setIsSubmitting(true);
    try {
      await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      });
      window.dispatchEvent(new CustomEvent('tripdee-board-updated'));
    } catch (err) {
      console.debug('Failed to persist post to server/Supabase:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClosePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingPost) return;
    setIsClosing(true);
    setCloseError('');
    try {
      const res = await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close',
          id: closingPost.id,
          pin: closePin.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setCloseError(data.error || 'รหัส PIN หรือเบอร์โทร 4 ตัวท้ายไม่ถูกต้อง');
        return;
      }
      setCloseSuccess('ปิดประกาศสำเร็จ ขอบคุณที่ใช้บริการ TripDee!');
      setPosts((prev) => prev.filter((p) => p.id !== closingPost.id));
      window.dispatchEvent(new CustomEvent('tripdee-board-updated'));
      setTimeout(() => {
        setClosingPost(null);
        setCloseSuccess('');
        setClosePin('');
      }, 1200);
    } catch (err) {
      setCloseError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <section id="trip-board" aria-label={t('board.aria')} className="scroll-mt-28 rounded-card bg-card border border-rule shadow-card p-5 sm:p-7">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-rule">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-input bg-accent-soft text-accent border border-accent/20">
            <ClipboardList className="h-5 w-5" aria-hidden="true" strokeWidth={2.5} />
          </span>
          <div>
            <h2 className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-ink flex items-center gap-2">
              <span>{t('board.title')}</span>
              <span className="td-fig rounded-pill bg-paper px-2 py-0.5 text-xs font-bold text-ink-2 border border-rule">
                {visiblePosts.length} รายการ
              </span>
            </h2>
            <p className="text-xs sm:text-sm font-medium text-ink-2">
              {t('board.caption')}
            </p>
          </div>
        </div>

        <button
          onClick={() => setFormOpen((open) => !open)}
          aria-expanded={formOpen}
          className="td-btn inline-flex shrink-0 items-center gap-1.5 rounded-input bg-accent hover:bg-accent-deep px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs transition-all active:scale-[0.98]"
        >
          {formOpen ? <X className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} /> : <Plus className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />}
          <span>{formOpen ? t('board.closeForm') : t('board.postFree')}</span>
        </button>
      </div>

      {/* Driver Web Push Notification Banner */}
      <DriverPushBell />

      {/* Post Form Drawer */}
      {formOpen && (
        <form onSubmit={handleSubmit} className="td-panel-enter mb-6 rounded-card bg-paper p-4 sm:p-6 border border-rule shadow-inner">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-ink mb-2">เลือกประเภทการประกาศ</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => set({ type: 'request' })}
                aria-pressed={form.type === 'request'}
                className={`rounded-input border p-3 text-left transition-all ${
                  form.type === 'request'
                    ? 'border-accent bg-accent-soft text-accent ring-1 ring-accent'
                    : 'border-rule bg-card hover:border-rule-2 text-ink'
                }`}
              >
                <span className="block text-xs font-bold">{t('board.typeRequestTitle')}</span>
                <span className="block text-[11px] font-normal text-ink-2 mt-0.5">{t('board.typeRequestDesc')}</span>
              </button>
              <button
                type="button"
                onClick={() => set({ type: 'offer' })}
                aria-pressed={form.type === 'offer'}
                className={`rounded-input border p-3 text-left transition-all ${
                  form.type === 'offer'
                    ? 'border-leaf bg-leaf-soft text-leaf ring-1 ring-leaf'
                    : 'border-rule bg-card hover:border-rule-2 text-ink'
                }`}
              >
                <span className="block text-xs font-bold">{t('board.typeOfferTitle')}</span>
                <span className="block text-[11px] font-normal text-ink-2 mt-0.5">{t('board.typeOfferDesc')}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="td-btitle" className={labelCls}>
                {t('board.fTitle')}
              </label>
              <input
                id="td-btitle"
                type="text"
                required
                placeholder={form.type === 'request' ? t('board.fTitlePhReq') : t('board.fTitlePhOffer')}
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="td-bzone" className={labelCls}>
                {t('board.fZone')}
              </label>
              <select
                id="td-bzone"
                value={form.zoneId}
                onChange={(e) => set({ zoneId: e.target.value as ZoneId })}
                className={inputCls}
              >
                {ZONE_RATE_CARDS.map((z) => (
                  <option key={z.id} value={z.id}>
                    {t('board.zoneOption', { no: z.zoneNo, label: t(`zone.${z.id}.label` as DictKey) })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="td-bdate" className={labelCls}>
                {t('board.fDate')}
              </label>
              <input
                id="td-bdate"
                type="text"
                required
                placeholder={t('board.fDatePh')}
                value={form.date}
                onChange={(e) => set({ date: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="td-bdays" className={labelCls}>
                {t('board.fDays')}
              </label>
              <input
                id="td-bdays"
                type="number"
                required
                min={1}
                max={30}
                value={form.days}
                onChange={(e) => set({ days: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="td-bseats" className={labelCls}>
                {form.type === 'request' ? t('board.fSeatsReq') : t('board.fSeatsOffer')}
              </label>
              <input
                id="td-bseats"
                type="number"
                required
                min={1}
                max={40}
                placeholder="8"
                value={form.seats}
                onChange={(e) => set({ seats: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="td-bprice" className={labelCls}>
                {form.type === 'request' ? t('board.fPriceReq') : t('board.fPriceOffer')}
              </label>
              <input
                id="td-bprice"
                type="number"
                required
                min={1}
                placeholder="4500"
                value={form.price}
                onChange={(e) => set({ price: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="td-bpricetag" className={labelCls}>
                {t('board.fPriceNote')}
              </label>
              <input
                id="td-bpricetag"
                type="text"
                placeholder={t('board.fPriceNotePh')}
                value={form.priceNote}
                onChange={(e) => set({ priceNote: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="td-bname" className={labelCls}>
                {t('board.fName')}
              </label>
              <input
                id="td-bname"
                type="text"
                required
                placeholder={t('board.fNamePh')}
                value={form.authorName}
                onChange={(e) => set({ authorName: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="td-bphone" className={labelCls}>
                {t('board.fPhone')}
              </label>
              <input
                id="td-bphone"
                type="text"
                required
                placeholder="081-234-5678"
                value={form.authorPhone}
                onChange={(e) => set({ authorPhone: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="td-bline" className={labelCls}>
                {t('board.fLine')}
              </label>
              <input
                id="td-bline"
                placeholder="https://line.me/ti/p/..."
                value={form.authorLine}
                onChange={(e) => set({ authorLine: e.target.value })}
                className={inputCls}
              />
            </div>

            {form.type === 'offer' && (
              <div>
                <label htmlFor="td-bveh" className={labelCls}>
                  {t('board.fVehicle')}
                </label>
                <input
                  id="td-bveh"
                  type="text"
                  placeholder={t('board.fVehiclePh')}
                  value={form.vehicleLabel}
                  onChange={(e) => set({ vehicleLabel: e.target.value })}
                  className={inputCls}
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <label htmlFor="td-bdetail" className={labelCls}>
                {t('board.fDetail')}
              </label>
              <textarea
                id="td-bdetail"
                rows={2}
                placeholder={t('board.fDetailPh')}
                value={form.detail}
                onChange={(e) => set({ detail: e.target.value })}
                className={`${inputCls} min-h-20 resize-y`}
              />
            </div>

              {/* Category & PIN for Self-Service */}
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-rule/60">
                <div>
                  <label className={labelCls}>ประเภทงาน / จุดประสงค์</label>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => set({ category: form.category === 'corporate' ? 'general' : 'corporate' })}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-input border text-xs font-bold transition-all ${
                        form.category === 'corporate'
                          ? 'border-amber-400 bg-amber-50 text-amber-900 ring-1 ring-amber-400'
                          : 'border-rule bg-card text-ink hover:bg-paper'
                      }`}
                    >
                      <Briefcase className="h-4 w-4 text-amber-600" />
                      <span>{form.category === 'corporate' ? '✓ สำหรับงานองค์กร / สัมมนา (ต้องการป้ายเหลือง/ใบกำกับภาษี)' : 'สำหรับบุคคลทั่วไป / ท่องเที่ยว'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="td-bpin" className={labelCls}>
                    รหัส PIN 4 หลัก (สำหรับปิดประกาศเองเมื่อได้รถแล้ว)
                  </label>
                  <div className="relative">
                    <input
                      id="td-bpin"
                      type="password"
                      maxLength={4}
                      placeholder="เช่น 1234 (หรือเว้นว่างเพื่อใช้เบอร์ 4 ตัวท้าย)"
                      value={form.pin}
                      onChange={(e) => set({ pin: e.target.value })}
                      className={`${inputCls} pl-9`}
                    />
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-ink-2/50" />
                  </div>
                </div>
              </div>
            </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-input border border-rule bg-card px-4 py-2 text-xs font-bold text-ink-2 hover:text-ink"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-input bg-accent hover:bg-accent-deep disabled:opacity-50 px-5 py-2 text-xs font-bold text-white shadow-xs"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'กำลังบันทึก...' : t('board.submit')}</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label={t('board.filterGroup')}>
        {FILTERS.map((f) => {
          const active = f.id === filter;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
              className={`rounded-pill px-3.5 py-1.5 text-xs font-bold transition-all border ${
                active
                  ? 'bg-accent text-white border-accent shadow-xs'
                  : 'border-rule bg-paper text-ink-2 hover:border-accent/40 hover:text-ink'
              }`}
            >
              {f.label ?? (f.key ? t(f.key) : f.id)}
            </button>
          );
        })}
      </div>

      {/* Posts List */}
      {visiblePosts.length === 0 ? (
        <div className="rounded-card border border-dashed border-rule bg-paper px-6 py-12 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-ink-2/60 mb-2" />
          <h3 className="font-display text-base font-bold text-ink">{t('board.emptyTitle')}</h3>
          <p className="mt-1 text-xs text-ink-2">{t('board.emptyDesc')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visiblePosts.map((post) => {
            const zone = ZONE_RATE_CARDS.find((z) => z.id === post.zoneId) ?? ZONE_RATE_CARDS[0];
            const isRequest = post.type === 'request';
            const isCorporate = post.category === 'corporate';
            return (
              <article
                key={post.id}
                className="flex flex-col gap-3 rounded-card border border-rule bg-paper p-4 transition-all hover:border-accent/30 hover:shadow-xs sm:p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`rounded-pill px-2.5 py-0.5 text-[11px] font-bold ${
                        isRequest ? 'bg-sky-soft text-sky border border-sky/20' : 'bg-leaf-soft text-leaf border border-leaf/20'
                      }`}
                    >
                      {isRequest ? t('board.badgeRequest') : t('board.badgeOffer')}
                    </span>
                    {isCorporate && (
                      <span className="inline-flex items-center gap-1 rounded-pill bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold shadow-2xs">
                        <Briefcase className="h-3 w-3 text-amber-700" />
                        <span>งานองค์กร / คาราวาน</span>
                      </span>
                    )}
                    {post.isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-pill bg-card px-2 py-0.5 text-[11px] font-bold text-leaf border border-rule shadow-2xs">
                        <ShieldCheck className="h-3 w-3" strokeWidth={2.5} />
                        <span>Verified</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] text-ink-2">
                      <Clock className="h-3 w-3" />
                      <span>{post.postedAt}</span>
                    </span>
                  </div>

                  <h3 className="mt-1.5 font-display text-base font-extrabold leading-snug text-ink">
                    {post.title}
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-ink-2">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-accent" />
                      <span>{t('board.metaZone', { no: zone.zoneNo, label: t(`zone.${zone.id}.label` as DictKey) })}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5 text-sky" />
                      <span>{t('board.metaDate', { date: post.date, days: post.days })}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-leaf" />
                      <span>{isRequest ? t('board.metaSeatsReq', { n: post.seats }) : t('board.metaSeatsOffer', { n: post.seats })}</span>
                    </span>
                  </div>

                  {post.detail && (
                    <p className="mt-2 text-xs font-normal leading-relaxed text-ink-2">{post.detail}</p>
                  )}

                  <p className="mt-2 text-xs text-ink-2">
                    {t('board.author')} <span className="font-bold text-ink">{post.authorName}</span>
                    {post.vehicleLabel && <span> • {post.vehicleLabel}</span>}
                  </p>
                </div>

                {/* Right side: Price & Action */}
                <div className="shrink-0 flex sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-rule/60">
                  <div className="text-left lg:text-right">
                    <span className="text-[11px] font-semibold text-ink-2 block">
                      {isRequest ? t('board.priceReq') : t('board.priceOffer')}
                    </span>
                    <p className="td-fig text-xl font-extrabold text-ink leading-tight">
                      {formatTHB(post.price)}
                    </p>
                    <span className="text-[11px] text-ink-2">
                      {post.priceNote ?? (post.days > 1 ? t('board.avgPerDay', { price: formatTHB(Math.round(post.price / post.days)) }) : t('board.totalTrip'))}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${post.authorPhone}`}
                      onClick={() => {
                        trackCall({
                          targetType: 'trip_board',
                          targetId: post.id,
                          targetTitle: post.title,
                          phoneNumber: post.authorPhone,
                          driverName: post.authorName,
                        });
                      }}
                      data-analytics-call={post.id}
                      className="td-btn inline-flex items-center gap-1 rounded-input bg-accent hover:bg-accent-deep px-3 py-2 text-xs font-bold text-white shadow-xs"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>{isRequest ? t('board.acceptJob') : t('board.bookNow')}</span>
                    </a>
                    {post.authorLine && post.authorLine.startsWith('http') && (
                      <a
                        href={post.authorLine}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="td-btn inline-flex items-center gap-1 rounded-input bg-[#06C755] hover:bg-[#05b34c] px-3 py-2 text-xs font-bold text-white shadow-xs"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>{t('board.lineChat')}</span>
                      </a>
                    )}
                    {/* Self-Service Close Post Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setClosingPost(post);
                        setClosePin('');
                        setCloseError('');
                        setCloseSuccess('');
                      }}
                      className="td-btn inline-flex items-center gap-1 rounded-input border border-rule bg-card hover:bg-leaf/10 hover:border-leaf/40 hover:text-leaf text-ink-2 px-2.5 py-2 text-xs font-bold transition-all"
                      title="ได้รถแล้ว / ปิดประกาศนี้"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-leaf" />
                      <span className="hidden sm:inline">ปิดงานแล้ว</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Self-service Close Post Modal */}
      {closingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border border-rule animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-rule">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-leaf-soft text-leaf">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display font-extrabold text-ink text-base">ได้รถแล้ว / ปิดประกาศ</h3>
                  <p className="text-xs text-ink-2">นำประกาศออกจากหน้ากระดานทันที</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setClosingPost(null)}
                className="rounded-full p-1.5 text-ink-2 hover:bg-paper"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleClosePost} className="mt-4 space-y-4">
              <div className="rounded-xl bg-paper p-3 border border-rule text-xs">
                <p className="font-bold text-ink line-clamp-1">{closingPost.title}</p>
                <p className="text-ink-2 mt-0.5">ผู้ลงประกาศ: {closingPost.authorName} ({closingPost.authorPhone.replace(/(\d{3})\d{4}(\d{3})/, '$1-XXXX-$2')})</p>
              </div>

              <div>
                <label htmlFor="modal-close-pin" className="block text-xs font-bold text-ink mb-1">
                  ใส่รหัส PIN หรือ เบอร์โทรศัพท์ 4 ตัวท้าย
                </label>
                <div className="relative">
                  <input
                    id="modal-close-pin"
                    type="password"
                    required
                    maxLength={4}
                    autoFocus
                    placeholder="เช่น 1234 หรือ 4 ตัวท้ายของเบอร์"
                    value={closePin}
                    onChange={(e) => setClosePin(e.target.value)}
                    className={`${inputCls} pl-9 font-mono tracking-widest text-center text-base`}
                  />
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-ink-2/50" />
                </div>
                <p className="text-[11px] text-ink-2 mt-1">
                  * เพื่อความปลอดภัย ระบบจะตรวจสอบว่าตรงกับ PIN หรือ 4 ตัวท้ายของเบอร์ที่ลงประกาศ
                </p>
              </div>

              {closeError && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 font-medium">
                  ⚠️ {closeError}
                </div>
              )}

              {closeSuccess && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-bold">
                  ✓ {closeSuccess}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClosingPost(null)}
                  className="flex-1 rounded-input border border-rule bg-card py-2.5 text-xs font-bold text-ink-2 hover:bg-paper"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isClosing || !closePin}
                  className="flex-1 rounded-input bg-leaf hover:bg-leaf-deep disabled:opacity-50 py-2.5 text-xs font-bold text-white shadow-xs"
                >
                  {isClosing ? 'กำลังตรวจสอบ...' : 'ยืนยันปิดประกาศ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
