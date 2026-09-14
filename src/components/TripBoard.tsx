'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

type BoardFilter = 'all' | BoardPostType;

const FILTERS: { id: BoardFilter; key: DictKey; tint: string }[] = [
  { id: 'all', key: 'board.filterAll', tint: 'bg-ink text-paper' },
  { id: 'request', key: 'board.filterRequest', tint: 'bg-sky text-white' },
  { id: 'offer', key: 'board.filterOffer', tint: 'bg-accent text-accent-ink' },
];
const inputCls =
  'w-full rounded-input border border-rule bg-paper px-4 py-3 text-sm font-bold text-ink transition duration-220 ease-out placeholder:font-medium placeholder:text-ink-2/70 hover:border-ink-2/50 focus:border-accent';
const labelCls = 'mb-1.5 block text-xs font-extrabold uppercase tracking-[0.06em] text-ink-2';

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

  const visiblePosts = posts.filter((p) => filter === 'all' || p.type === filter);

  const set = (patch: Partial<PostFormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const days = Math.max(1, Number(form.days) || 1);
    const seats = Math.max(1, Number(form.seats) || 1);
    const price = Math.max(0, Math.round(Number(form.price) || 0));
    if (price <= 0) return;
    const post: BoardPost = {
      id: `user-${Date.now()}`,
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
  };

  return (
    <section id="trip-board" aria-label={t('board.aria')} className="scroll-mt-28 rounded-card bg-card p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-grape text-white">
            <ClipboardList className="h-5 w-5" aria-hidden="true" strokeWidth={2.5} />
          </span>
          <div>
            <h2 className="font-display text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
              {t('board.title')}
              <span className="td-fig ml-2 rounded-pill bg-paper-2 px-2.5 py-0.5 align-middle text-sm font-extrabold text-ink-2">
                {visiblePosts.length}
              </span>
            </h2>
            <p className="mt-1 max-w-[60ch] text-[13px] font-medium leading-relaxed text-ink-2">
              {t('board.caption')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setFormOpen((open) => !open)}
          aria-expanded={formOpen}
          className="td-btn td-pop inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-sun px-4 py-2.5 text-sm font-extrabold text-sun-ink"
        >
          {formOpen ? <X className="h-4 w-4" aria-hidden="true" strokeWidth={3} /> : <Plus className="h-4 w-4" aria-hidden="true" strokeWidth={3} />}
          {formOpen ? t('board.closeForm') : t('board.postFree')}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="td-panel-enter mb-6 rounded-card bg-paper p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => set({ type: 'request' })}
              aria-pressed={form.type === 'request'}
              className={`td-btn rounded-card border p-4 text-left transition duration-220 ease-spring ${
                form.type === 'request' ? 'border-transparent bg-sky-soft' : 'border-rule bg-card hover:border-ink-2/50'
              }`}
            >
              <span className="block text-sm font-extrabold text-ink">{t('board.typeRequestTitle')}</span>
              <span className="mt-0.5 block text-xs font-medium text-ink-2">{t('board.typeRequestDesc')}</span>
            </button>
            <button
              type="button"
              onClick={() => set({ type: 'offer' })}
              aria-pressed={form.type === 'offer'}
              className={`td-btn rounded-card border p-4 text-left transition duration-220 ease-spring ${
                form.type === 'offer' ? 'border-transparent bg-accent-soft' : 'border-rule bg-card hover:border-ink-2/50'
              }`}
            >
              <span className="block text-sm font-extrabold text-ink">{t('board.typeOfferTitle')}</span>
              <span className="mt-0.5 block text-xs font-medium text-ink-2">{t('board.typeOfferDesc')}</span>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                className={`${inputCls} bg-card`}
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
                className={`${inputCls} bg-card`}
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
                className={`${inputCls} bg-card`}
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
                className={`${inputCls} bg-card`}
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
                className={`${inputCls} bg-card`}
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
                className={`${inputCls} bg-card`}
              />
            </div>
            <div>
              <label htmlFor="td-bpricenote" className={labelCls}>
                {t('board.fPriceNote')}
              </label>
              <input
                id="td-bpricenote"
                type="text"
                placeholder={t('board.fPriceNotePh')}
                value={form.priceNote}
                onChange={(e) => set({ priceNote: e.target.value })}
                className={`${inputCls} bg-card`}
              />
            </div>
            {form.type === 'offer' && (
              <div className="sm:col-span-2">
                <label htmlFor="td-bvehicle" className={labelCls}>
                  {t('board.fVehicle')}
                </label>
                <input
                  id="td-bvehicle"
                  type="text"
                  placeholder={t('board.fVehiclePh')}
                  value={form.vehicleLabel}
                  onChange={(e) => set({ vehicleLabel: e.target.value })}
                  className={`${inputCls} bg-card`}
                />
              </div>
            )}
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
                className={`${inputCls} bg-card`}
              />
            </div>
            <div>
              <label htmlFor="td-bphone" className={labelCls}>
                {t('board.fPhone')}
              </label>
              <input
                id="td-bphone"
                type="tel"
                required
                placeholder="082-xxx-xxxx"
                value={form.authorPhone}
                onChange={(e) => set({ authorPhone: e.target.value })}
                className={`${inputCls} bg-card`}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="td-bline" className={labelCls}>
                {t('board.fLine')}
              </label>
              <input
                id="td-bline"
                type="url"
                placeholder="https://line.me/..."
                value={form.authorLine}
                onChange={(e) => set({ authorLine: e.target.value })}
                className={`${inputCls} bg-card`}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="td-bdetail" className={labelCls}>
                {t('board.fDetail')}
              </label>
              <textarea
                id="td-bdetail"
                rows={3}
                required
                placeholder={t('board.fDetailPh')}
                value={form.detail}
                onChange={(e) => set({ detail: e.target.value })}
                className={`${inputCls} min-h-24 resize-y bg-card`}
              />
            </div>
          </div>

          <button
            type="submit"
            className="td-btn td-pop mt-4 inline-flex w-full items-center justify-center gap-2 rounded-pill bg-leaf px-6 py-3 text-sm font-extrabold text-white sm:w-auto"
          >
            <Plus className="h-4 w-4" aria-hidden="true" strokeWidth={3} />
            {t('board.submit')}
          </button>
        </form>
      )}

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label={t('board.filterGroup')}>
        {FILTERS.map((f) => {
          const active = f.id === filter;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
              className={`td-btn rounded-pill border px-4 py-2 text-[13px] font-extrabold transition duration-220 ease-spring ${
                active
                  ? `${f.tint} border-transparent`
                  : 'border-rule bg-paper text-ink-2 hover:border-ink-2/50 hover:text-ink'
              }`}
            >
              {t(f.key)}
            </button>
          );
        })}
      </div>

      {visiblePosts.length === 0 ? (
        <div className="rounded-card border-2 border-dashed border-rule bg-paper px-6 py-14 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-grape-soft">
            <ClipboardList className="h-7 w-7 text-grape" aria-hidden="true" />
          </span>
          <h3 className="font-display text-xl font-extrabold text-ink">{t('board.emptyTitle')}</h3>
          <p className="mx-auto mt-1 max-w-[48ch] text-sm font-medium leading-relaxed text-ink-2">
            {t('board.emptyDesc')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visiblePosts.map((post) => {
            const zone = ZONE_RATE_CARDS.find((z) => z.id === post.zoneId) ?? ZONE_RATE_CARDS[0];
            const isRequest = post.type === 'request';
            return (
              <article
                key={post.id}
                className="flex flex-col gap-4 rounded-card border border-rule bg-paper p-4 transition-colors duration-220 ease-out hover:border-ink-2/50 sm:p-5 lg:flex-row lg:items-start lg:gap-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span
                      className={`rounded-pill px-3 py-1 text-[11px] font-extrabold ${
                        isRequest ? 'bg-sky text-white' : 'bg-accent text-accent-ink'
                      }`}
                    >
                      {isRequest ? t('board.badgeRequest') : t('board.badgeOffer')}
                    </span>
                    {post.isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-pill bg-leaf-soft px-2.5 py-1 text-[11px] font-extrabold text-leaf">
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
                        Verified
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 font-bold text-ink-2">
                      <Clock className="h-3 w-3.5" aria-hidden="true" />
                      {post.postedAt}
                    </span>
                  </div>

                  <h3 className="mt-2.5 font-display text-base font-extrabold leading-snug text-ink">
                    {post.title}
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-bold text-ink-2">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-accent-deep" aria-hidden="true" />
                      {t('board.metaZone', { no: zone.zoneNo, label: t(`zone.${zone.id}.label` as DictKey) })}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-sky" aria-hidden="true" />
                      {t('board.metaDate', { date: post.date, days: post.days })}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-grape" aria-hidden="true" />
                      {isRequest ? t('board.metaSeatsReq', { n: post.seats }) : t('board.metaSeatsOffer', { n: post.seats })}
                    </span>
                  </div>

                  <p className="mt-2 max-w-[70ch] text-[13px] font-medium leading-relaxed text-ink-2">{post.detail}</p>
                  <p className="mt-2 text-xs font-medium text-ink-2">
                    {t('board.author')} <span className="font-extrabold text-ink">{post.authorName}</span>
                    {post.vehicleLabel && <span> · {post.vehicleLabel}</span>}
                  </p>
                </div>

                <div className="shrink-0 rounded-card bg-sun-soft p-4 lg:w-56">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-ink-2">{isRequest ? t('board.priceReq') : t('board.priceOffer')}</p>
                  <p className="td-fig mt-0.5 text-[26px] font-extrabold leading-none text-ink">{formatTHB(post.price)}</p>
                  <p className="td-fig mt-1 text-[11px] font-bold text-ink-2">
                    {post.priceNote ?? (post.days > 1 ? t('board.avgPerDay', { price: formatTHB(Math.round(post.price / post.days)) }) : t('board.totalTrip'))}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
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
                      className="td-btn td-pop inline-flex items-center justify-center gap-1.5 rounded-pill bg-accent px-3 py-2.5 text-[13px] font-extrabold text-accent-ink"
                    >
                      <Phone className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
                      {isRequest ? t('board.acceptJob') : t('board.bookNow')}
                    </a>
                    {post.authorLine.startsWith('http') && (
                      <a
                        href={post.authorLine}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="td-btn td-pop inline-flex items-center justify-center gap-1.5 rounded-pill bg-card px-3 py-2.5 text-[13px] font-extrabold text-ink"
                      >
                        <MessageCircle className="h-4 w-4 text-leaf" aria-hidden="true" strokeWidth={2.5} />
                        {t('board.lineChat')}
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
