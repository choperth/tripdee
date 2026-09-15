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
} from 'lucide-react';

type BoardFilter = 'all' | BoardPostType;

const FILTERS: { id: BoardFilter; key: DictKey }[] = [
  { id: 'all', key: 'board.filterAll' },
  { id: 'request', key: 'board.filterRequest' },
  { id: 'offer', key: 'board.filterOffer' },
];

const inputCls =
  'w-full rounded-input border border-rule bg-card px-3.5 py-2.5 text-sm font-semibold text-ink transition-colors placeholder:font-normal placeholder:text-ink-2/60 hover:border-accent/40 focus:border-accent focus:outline-none';
const labelCls = 'mb-1 block text-xs font-bold uppercase tracking-wider text-ink-2';

interface PostFormState {
  type: BoardPostType;
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
}

const EMPTY_FORM: PostFormState = {
  type: 'request',
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
};

export const TripBoard: React.FC = () => {
  const { t } = useLanguage();
  const { trackCall } = useAnalytics();
  const [posts, setPosts] = useState<BoardPost[]>(BOARD_POSTS);
  const [filter, setFilter] = useState<BoardFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<PostFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const visiblePosts = posts.filter((p) => filter === 'all' || p.type === filter);

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
    } catch (err) {
      console.debug('Failed to persist post to server/Supabase:', err);
    } finally {
      setIsSubmitting(false);
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
              {t(f.key)}
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
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
