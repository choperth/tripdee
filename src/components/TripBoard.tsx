'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import {
  BOARD_POSTS,
  ZONE_RATE_CARDS,
  BoardPost,
  BoardPostType,
  ZoneId,
  BoardQuote,
} from '@/data/mockData';
import { maskPhoneNumber } from '@/lib/privacy';
import {
  Plus,
  X,
  CheckCircle2,
  Lock,
  Loader2,
} from 'lucide-react';
import { DriverPushBell } from '@/components/notifications/DriverPushBell';

type BoardFilter = 'all' | BoardPostType | 'corporate';

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
  isNegotiable: boolean;
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
  isNegotiable: false,
};

export const TripBoard: React.FC = () => {

  const { trackCall } = useAnalytics();
  const { t } = useLanguage();
  const [posts, setPosts] = useState<BoardPost[]>(BOARD_POSTS);
  const [filter, setFilter] = useState<BoardFilter>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [form, setForm] = useState<PostFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Honeypot anti-spam fields
  const [hpWebsite, setHpWebsite] = useState('');
  const [formMountedAt, setFormMountedAt] = useState<number>(() => Date.now());

  // Self-Service Close Post Modal State
  const [closingPost, setClosingPost] = useState<BoardPost | null>(null);
  const [closePin, setClosePin] = useState('');
  const [closeError, setCloseError] = useState('');
  const [closeSuccess, setCloseSuccess] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  // Driver Submit Quote Modal State
  const [quoteDriverPost, setQuoteDriverPost] = useState<BoardPost | null>(null);
  const [driverQuoteForm, setDriverQuoteForm] = useState({
    driverName: '',
    driverPhone: '',
    driverLine: '',
    vehicleModel: '',
    price: '',
    priceNote: 'รวมน้ำมันแล้ว',
    message: '',
  });
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteSubmitError, setQuoteSubmitError] = useState('');
  const [quoteSubmitSuccess, setQuoteSubmitSuccess] = useState('');

  // Customer View Quotes Modal State
  const [viewQuotesPost, setViewQuotesPost] = useState<BoardPost | null>(null);
  const [customerQuotesPin, setCustomerQuotesPin] = useState('');
  const [fetchedQuotes, setFetchedQuotes] = useState<BoardQuote[] | null>(null);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [quotesFetchError, setQuotesFetchError] = useState('');
  const [acceptingQuoteId, setAcceptingQuoteId] = useState<string | null>(null);
  const [acceptSuccessMessage, setAcceptSuccessMessage] = useState('');

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

  // Counts for tabs (memoized)
  const { requestCount, offerCount, corporateCount } = useMemo(() => ({
    requestCount: posts.filter((p) => p.type === 'request').length,
    offerCount: posts.filter((p) => p.type === 'offer').length,
    corporateCount: posts.filter((p) => p.category === 'corporate').length,
  }), [posts]);

  const visiblePosts = useMemo(() => {
    const query = searchKeyword.trim().toLowerCase();
    return posts.filter((p) => {
      if (filter === 'request' && p.type !== 'request') return false;
      if (filter === 'offer' && p.type !== 'offer') return false;
      if (filter === 'corporate' && p.category !== 'corporate') return false;

      if (query !== '') {
        const matchTitle = p.title.toLowerCase().includes(query);
        const matchDetail = p.detail ? p.detail.toLowerCase().includes(query) : false;
        const matchAuthor = p.authorName.toLowerCase().includes(query);
        const matchVehicle = p.vehicleLabel ? p.vehicleLabel.toLowerCase().includes(query) : false;
        const matchPriceNote = p.priceNote ? p.priceNote.toLowerCase().includes(query) : false;
        if (!matchTitle && !matchDetail && !matchAuthor && !matchVehicle && !matchPriceNote) {
          return false;
        }
      }
      return true;
    });
  }, [posts, filter, searchKeyword]);

  const set = (patch: Partial<PostFormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const openNewPost = (type: BoardPostType, category: 'general' | 'corporate' = 'general') => {
    setForm({
      ...EMPTY_FORM,
      type,
      category,
    });
    setFormMountedAt(Date.now());
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const days = Math.max(1, Number(form.days) || 1);
    const seats = Math.max(1, Number(form.seats) || 1);
    const isNegotiable = form.type === 'request' && form.isNegotiable;
    const price = isNegotiable ? 0 : Math.max(0, Math.round(Number(form.price) || 0));
    if (!isNegotiable && price <= 0) return;

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
      priceNote: isNegotiable ? (form.priceNote.trim() || 'รอคนขับเสนอราคา') : (form.priceNote.trim() || undefined),
      authorName: form.authorName.trim(),
      authorPhone: form.authorPhone.trim(),
      authorLine: form.authorLine.trim(),
      vehicleLabel: form.type === 'offer' && form.vehicleLabel.trim() ? form.vehicleLabel.trim() : undefined,
      detail: form.detail.trim(),
      pin: form.pin.trim() || undefined,
      postedAt: 'เมื่อสักครู่',
      isNegotiable,
      maxQuotes: 3,
      quoteCount: 0,
    };
    setPosts((prev) => [post, ...prev]);
    setForm(EMPTY_FORM);
    setFormOpen(false);

    setIsSubmitting(true);
    try {
      await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...post,
          hp_website: hpWebsite,
          _hp_timestamp: formMountedAt,
        }),
      });
      window.dispatchEvent(new CustomEvent('tripdee-board-updated'));
    } catch (err) {
      console.debug('Failed to persist post to server/Supabase:', err);
    } finally {
      setIsSubmitting(false);
      setHpWebsite('');
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
        setCloseError(data.error || 'PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        return;
      }
      setCloseSuccess('ปิดประกาศเรียบร้อยแล้ว');
      setPosts((prev) => prev.filter((p) => p.id !== closingPost.id));
      window.dispatchEvent(new CustomEvent('tripdee-board-updated'));
      setTimeout(() => {
        setClosingPost(null);
        setClosePin('');
        setCloseSuccess('');
      }, 1200);
    } catch {
      setCloseError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่');
    } finally {
      setIsClosing(false);
    }
  };

  const handleOpenDriverQuote = (post: BoardPost) => {
    setQuoteDriverPost(post);
    setQuoteSubmitError('');
    setQuoteSubmitSuccess('');
    setDriverQuoteForm({
      driverName: '',
      driverPhone: '',
      driverLine: '',
      vehicleModel: '',
      price: '',
      priceNote: 'รวมน้ำมันแล้ว',
      message: '',
    });
  };

  const handleSubmitDriverQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteDriverPost) return;
    setIsSubmittingQuote(true);
    setQuoteSubmitError('');
    setQuoteSubmitSuccess('');

    try {
      const res = await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_quote',
          postId: quoteDriverPost.id,
          driverName: driverQuoteForm.driverName.trim(),
          driverPhone: driverQuoteForm.driverPhone.trim(),
          driverLine: driverQuoteForm.driverLine.trim(),
          vehicleModel: driverQuoteForm.vehicleModel.trim(),
          price: Number(driverQuoteForm.price) || 0,
          priceNote: driverQuoteForm.priceNote.trim(),
          message: driverQuoteForm.message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setQuoteSubmitError(data.error || 'เกิดข้อผิดพลาดในการส่งใบเสนอราคา');
        return;
      }
      setQuoteSubmitSuccess(data.message || 'ส่งใบเสนอราคาเรียบร้อยแล้ว!');
      setPosts((prev) =>
        prev.map((p) =>
          p.id === quoteDriverPost.id
            ? { ...p, quoteCount: (p.quoteCount || 0) + 1 }
            : p
        )
      );
      window.dispatchEvent(new CustomEvent('tripdee-board-updated'));
      setTimeout(() => {
        setQuoteDriverPost(null);
        setQuoteSubmitSuccess('');
      }, 1500);
    } catch {
      setQuoteSubmitError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleOpenCustomerQuotes = (post: BoardPost) => {
    setViewQuotesPost(post);
    setCustomerQuotesPin('');
    setFetchedQuotes(null);
    setQuotesFetchError('');
    setAcceptSuccessMessage('');

    if (!post.pin) {
      fetchQuotesForPost(post.id, '');
    }
  };

  const fetchQuotesForPost = async (postId: string, pin: string) => {
    setIsLoadingQuotes(true);
    setQuotesFetchError('');
    try {
      const res = await fetch(
        `/api/board?action=get_quotes&postId=${encodeURIComponent(postId)}&pin=${encodeURIComponent(pin)}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setQuotesFetchError(data.error || 'รหัส PIN หรือเลขท้ายเบอร์ไม่ถูกต้อง');
        return;
      }
      setFetchedQuotes(data.quotes || []);
    } catch {
      setQuotesFetchError('ไม่สามารถดึงข้อมูลข้อเสนอได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  const handleAcceptQuote = async (quote: BoardQuote) => {
    if (!viewQuotesPost) return;
    setAcceptingQuoteId(quote.id);
    try {
      const res = await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept_quote',
          postId: viewQuotesPost.id,
          quoteId: quote.id,
          pin: customerQuotesPin,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'เกิดข้อผิดพลาดในการเลือกข้อเสนอ');
        return;
      }
      setAcceptSuccessMessage(`คุณได้เลือกข้อเสนอของ ${quote.driverName} เรียบร้อยแล้ว! ปิดรับงานในบอร์ดอัตโนมัติ`);
      setPosts((prev) => prev.filter((p) => p.id !== viewQuotesPost.id));
      window.dispatchEvent(new CustomEvent('tripdee-board-updated'));
    } catch {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setAcceptingQuoteId(null);
    }
  };

  return (
    <section id="tripboard" aria-label={t('board.aria')} className="w-full py-space-2xl bg-paper-surface-muted dark:bg-slate-950 transition-colors scroll-mt-24">
      {/* 1. Dynamic Notification Bar / Stats Strip (Stitch Top Bar) */}
      <div className="w-full bg-blue-subtle/70 dark:bg-blue-950/40 py-space-sm px-margin border-y border-border-subtle/60 dark:border-slate-800 mb-space-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-space-sm font-body-subtext text-body-subtext">
          <div className="flex items-center gap-space-xs text-ink-primary dark:text-slate-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-line-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-line-green" />
            </span>
            <span className="font-bold text-navy-deep dark:text-blue-300">TripBoard Real-time:</span>
            <span className="text-ink-secondary dark:text-slate-400">
              {t('board.liveStats', { done: 48, open: 19 })}
            </span>
          </div>
          <div className="flex items-center gap-space-md text-ink-muted dark:text-slate-400">
            <DriverPushBell />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-margin lg:px-gutter">
        {/* 2. Hero Header & Quick Action Triggers (Stitch Redesign) */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg mb-space-xl">
          <div className="space-y-space-2xs max-w-3xl">
            <div className="inline-flex items-center gap-space-2xs px-space-sm py-1 bg-amber-accent/15 dark:bg-amber-950/50 rounded-full text-amber-accent font-label-badge text-label-badge mb-space-xs">
              <span className="material-symbols-outlined text-[14px]">campaign</span>
              <span>DIRECT COMMUNITY MATCHING • 0% COMMISSION</span>
            </div>
            <h2 className="font-display-hero text-display-hero text-navy-deep dark:text-white tracking-tight">
              {t('board.title')} <span className="text-blue-action">(TripBoard)</span>
            </h2>
            <p className="font-body-large text-body-large text-ink-secondary dark:text-slate-300">
              {t('board.caption')}
            </p>
          </div>

          {/* Call To Action Dual Triggers */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-space-sm w-full lg:w-auto">
            <button
              id="open-post-modal-btn"
              type="button"
              onClick={() => openNewPost('request')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-space-xs bg-blue-action hover:bg-blue-action-hover text-on-primary font-body-medium text-body-medium px-space-lg py-space-md rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">post_add</span>
              <span>{t('board.postFree')}</span>
            </button>
            <button
              type="button"
              onClick={() => openNewPost('offer')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-space-xs bg-navy-deep hover:bg-navy-surface text-surface font-body-medium text-body-medium px-space-lg py-space-md rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px] text-amber-accent">
                airport_shuttle
              </span>
              <span>{t('board.postOffer')}</span>
            </button>
          </div>
        </div>

        {/* 3. Quick Category Metric Pills (4 Cards Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm mb-space-xl">
          <div className="bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-800 rounded-xl p-space-md flex items-center justify-between shadow-xs">
            <div>
              <div className="font-body-subtext text-body-subtext text-ink-muted dark:text-slate-400">
                {t('board.statOpen')}
              </div>
              <div className="font-price-headline text-price-headline text-navy-deep dark:text-white">
                {posts.length}{' '}
                <span className="text-body-subtext font-body-base text-ink-secondary dark:text-slate-400 font-normal">
                  {t('board.unitItems')}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-secondary text-[26px]">grid_view</span>
          </div>

          <div className="bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-800 rounded-xl p-space-md flex items-center justify-between shadow-xs">
            <div>
              <div className="font-body-subtext text-body-subtext text-ink-muted dark:text-slate-400">
                {t('board.statRequests')}
              </div>
              <div className="font-price-headline text-price-headline text-blue-action">
                {requestCount}{' '}
                <span className="text-body-subtext font-body-base text-ink-secondary dark:text-slate-400 font-normal">
                  {t('board.unitTrips')}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-blue-action text-[26px]">
              person_pin_circle
            </span>
          </div>

          <div className="bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-800 rounded-xl p-space-md flex items-center justify-between shadow-xs">
            <div>
              <div className="font-body-subtext text-body-subtext text-ink-muted dark:text-slate-400">
                {t('board.statOffers')}
              </div>
              <div className="font-price-headline text-price-headline text-line-green">
                {offerCount}{' '}
                <span className="text-body-subtext font-body-base text-ink-secondary dark:text-slate-400 font-normal">
                  {t('board.unitVans')}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-line-green text-[26px]">local_taxi</span>
          </div>

          <div className="bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-800 rounded-xl p-space-md flex items-center justify-between shadow-xs">
            <div>
              <div className="font-body-subtext text-body-subtext text-ink-muted dark:text-slate-400">
                {t('board.statCorp')}
              </div>
              <div className="font-price-headline text-price-headline text-amber-accent">
                {corporateCount}{' '}
                <span className="text-body-subtext font-body-base text-ink-secondary dark:text-slate-400 font-normal">
                  {t('board.unitGroups')}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-amber-accent text-[26px]">domain</span>
          </div>
        </div>

        {/* 4. Filter Console (Segment Tabs & Search) */}
        <div className="bg-paper-elevated dark:bg-slate-900 rounded-2xl p-space-md border border-border-subtle dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-md mb-space-lg">
          {/* Main Segment Tabs */}
          <div className="flex items-center gap-space-2xs overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`whitespace-nowrap px-space-md py-space-xs rounded-lg font-body-medium text-body-medium transition-all ${
                filter === 'all'
                  ? 'bg-navy-deep text-surface shadow-sm font-bold'
                  : 'bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:text-navy-deep'
              }`}
            >
              {t('board.filterAll')} ({posts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('request')}
              className={`whitespace-nowrap px-space-md py-space-xs rounded-lg font-body-medium text-body-medium transition-all ${
                filter === 'request'
                  ? 'bg-navy-deep text-surface shadow-sm font-bold'
                  : 'bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:text-navy-deep'
              }`}
            >
              🙋‍♂️ {t('board.filterRequest')} ({requestCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('offer')}
              className={`whitespace-nowrap px-space-md py-space-xs rounded-lg font-body-medium text-body-medium transition-all ${
                filter === 'offer'
                  ? 'bg-navy-deep text-surface shadow-sm font-bold'
                  : 'bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:text-navy-deep'
              }`}
            >
              🚐 {t('board.filterOffer')} ({offerCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('corporate')}
              className={`whitespace-nowrap px-space-md py-space-xs rounded-lg font-body-medium text-body-medium transition-all ${
                filter === 'corporate'
                  ? 'bg-navy-deep text-surface shadow-sm font-bold'
                  : 'bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300 hover:text-navy-deep'
              }`}
            >
              🏢 {t('board.filterCorp')} ({corporateCount})
            </button>
          </div>

          {/* Search Input Box */}
          <div className="relative md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder={t('board.searchPh')}
              className="w-full h-10 pl-9 pr-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-lg text-body-subtext font-body-subtext focus:outline-none focus:ring-2 focus:ring-blue-action border border-transparent focus:border-blue-action transition-all"
            />
          </div>
        </div>

        {/* 5. Request & Offer Cards Feed (Stitch Layout) */}
        <div className="space-y-space-md">
          {visiblePosts.length === 0 ? (
            <div className="bg-paper-elevated dark:bg-slate-900 rounded-2xl p-space-2xl text-center border border-border-subtle dark:border-slate-800 space-y-space-sm">
              <span className="material-symbols-outlined text-[48px] text-ink-muted">inbox</span>
              <h3 className="font-headline-md text-headline-md text-navy-deep dark:text-white">
                {t('board.emptyTitle')}
              </h3>
              <p className="font-body-base text-body-base text-ink-secondary dark:text-slate-400 max-w-md mx-auto">
                {t('board.emptyDesc')}
              </p>
              <button
                type="button"
                onClick={() => openNewPost('request')}
                className="inline-flex items-center gap-2 bg-blue-action hover:bg-blue-action-hover text-on-primary font-body-medium text-body-medium px-space-lg py-space-xs rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{t('board.submit')}</span>
              </button>
            </div>
          ) : (
            visiblePosts.map((post) => {
              const isRequest = post.type === 'request';
              const zoneObj = ZONE_RATE_CARDS.find((z) => z.id === post.zoneId);

              return (
                <div
                  key={post.id}
                  className="bg-paper-elevated dark:bg-slate-900 rounded-2xl p-space-md sm:p-space-lg shadow-sm hover:shadow-md border border-border-subtle dark:border-slate-800 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-space-md"
                >
                  {/* Left Content Area */}
                  <div className="space-y-space-xs max-w-3xl">
                    <div className="flex flex-wrap items-center gap-space-xs text-label-badge font-label-badge">
                      {isRequest ? (
                        <span className="px-space-xs py-space-2xs rounded bg-blue-subtle text-blue-action font-bold">
                          {t('board.badgeRequest')}
                        </span>
                      ) : (
                        <span className="px-space-xs py-space-2xs rounded bg-verified-emerald-soft text-verified-emerald font-bold">
                          {t('board.badgeOffer')}
                        </span>
                      )}

                      {post.category === 'corporate' && (
                        <span className="px-space-xs py-space-2xs rounded bg-amber-accent/20 text-amber-accent font-bold">
                          🏢 {t('board.badgeCorp')}
                        </span>
                      )}

                      <span className="text-ink-muted dark:text-slate-400 font-body-subtext">
                        {post.postedAt}
                      </span>

                      {zoneObj && (
                        <span className="px-space-xs py-space-2xs rounded bg-paper-surface-muted dark:bg-slate-800 text-ink-secondary dark:text-slate-300">
                          {t('board.metaZone', { no: zoneObj.zoneNo, label: zoneObj.shortLabel })}
                        </span>
                      )}

                      <span className="px-space-xs py-space-2xs rounded bg-surface-container dark:bg-slate-800 text-navy-deep dark:text-blue-300 font-bold">
                        {t('board.metaDate', { date: post.date, days: post.days })}
                      </span>

                      <span className="px-space-xs py-space-2xs rounded bg-surface-container dark:bg-slate-800 text-navy-deep dark:text-blue-300 font-bold">
                        {isRequest ? t('board.metaSeatsReq', { n: post.seats }) : t('board.metaSeatsOffer', { n: post.seats })}
                      </span>
                    </div>

                    <h3 className="font-title-card text-title-card text-navy-deep dark:text-white leading-snug">
                      {post.title}
                    </h3>

                    <p className="font-body-base text-body-base text-ink-secondary dark:text-slate-300 leading-relaxed">
                      {post.detail}
                    </p>

                    <div className="flex flex-wrap items-center gap-space-md text-body-subtext font-body-subtext text-ink-muted dark:text-slate-400 pt-0.5">
                      <div>
                        {t('board.author')}{' '}
                        <strong className="text-navy-deep dark:text-white">
                          {post.authorName}
                        </strong>
                        {post.vehicleLabel && ` • ${post.vehicleLabel}`}
                      </div>

                      {post.pin && (
                        <button
                          type="button"
                          onClick={() => {
                            setClosingPost(post);
                            setClosePin('');
                            setCloseError('');
                          }}
                          className="inline-flex items-center gap-1 text-ink-muted hover:text-rose-500 transition-colors"
                        >
                          <Lock className="w-3 h-3" />
                          <span>{t('board.closePost')}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Pricing & Direct Contact Area */}
                  {(() => {
                    const isPostNegotiable = Boolean(post.isNegotiable || (isRequest && post.price <= 0));
                    const maxQuotes = post.maxQuotes || 3;
                    const quoteCount = post.quoteCount || 0;
                    const isQuotaFull = quoteCount >= maxQuotes;

                    if (isPostNegotiable) {
                      return (
                        <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-space-sm min-w-[240px] pt-space-xs lg:pt-0 border-t sm:border-t-0 border-border-subtle/70 dark:border-slate-800">
                          <div className="lg:text-right">
                            <span className="text-body-subtext text-ink-muted dark:text-slate-400 block">
                              {t('board.priceStatus')}
                            </span>
                            <div className="font-price-headline text-lg sm:text-xl text-amber-600 dark:text-amber-400 font-bold flex items-center lg:justify-end gap-1">
                              <span className="material-symbols-outlined text-[18px]">request_quote</span>
                              <span>{t('board.priceNegotiable')}</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                              <span>{t('board.quoteCount', { q: quoteCount, m: maxQuotes })}</span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-xs w-full sm:w-auto">
                            {isQuotaFull ? (
                              <button
                                type="button"
                                disabled
                                className="px-space-md py-space-xs bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl font-body-medium text-body-medium flex items-center justify-center gap-1 cursor-not-allowed text-xs sm:text-sm whitespace-nowrap"
                              >
                                <span className="material-symbols-outlined text-[16px]">lock</span>
                                <span>{t('board.quotaFull', { m: post.maxQuotes || 3 })}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenDriverQuote(post)}
                                className="px-space-md py-space-xs bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-body-medium text-body-medium flex items-center justify-center gap-1 shadow-sm transition-all active:scale-[0.98] text-xs sm:text-sm whitespace-nowrap font-bold"
                              >
                                <span className="material-symbols-outlined text-[16px]">rate_review</span>
                                <span>{t('board.submitQuote', { left: maxQuotes - quoteCount })}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenCustomerQuotes(post)}
                              className="px-space-sm py-space-xs bg-paper-surface hover:bg-paper-surface-muted text-navy-deep dark:text-white border border-border-subtle dark:border-slate-700 rounded-xl font-body-medium text-body-medium flex items-center justify-center gap-1 shadow-xs transition-all text-xs whitespace-nowrap"
                              title={t('board.viewQuotesTip')}
                            >
                              <span className="material-symbols-outlined text-[15px] text-blue-action">visibility</span>
                              <span>{t('board.viewQuotes', { n: quoteCount })}</span>
                            </button>
                          </div>

                          <div className="text-[11px] text-ink-muted dark:text-slate-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-emerald-600">verified_user</span>
                            <span>{t('board.privacyShield')}</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-space-sm min-w-[220px] pt-space-xs lg:pt-0 border-t sm:border-t-0 border-border-subtle/70 dark:border-slate-800">
                        <div className="lg:text-right">
                          <span className="text-body-subtext text-ink-muted dark:text-slate-400 block">
                            {isRequest ? t('board.priceReq') : t('board.priceOffer')}
                          </span>
                          <div className="font-price-headline text-price-headline text-navy-deep dark:text-white">
                            ฿{post.price.toLocaleString()}
                          </div>
                          <span className="text-body-subtext text-emerald-700 dark:text-emerald-400 block font-bold">
                            {post.priceNote || (isRequest ? t('board.fuelIncl') : t('board.fuelExcl'))}
                          </span>
                        </div>

                        <div className="flex items-center gap-space-xs w-full sm:w-auto">
                          <a
                            href={`tel:${post.authorPhone}`}
                            onClick={() =>
                              trackCall({
                                targetType: 'trip_board',
                                targetId: post.id,
                                targetTitle: post.title,
                                phoneNumber: post.authorPhone,
                                driverName: post.authorName,
                              })
                            }
                            className="flex-1 sm:flex-initial px-space-md py-space-xs bg-navy-deep hover:bg-navy-surface text-on-primary rounded-xl font-body-medium text-body-medium flex items-center justify-center gap-1 shadow-sm transition-all active:scale-[0.98] whitespace-nowrap"
                          >
                            <span className="material-symbols-outlined text-[16px]">call</span>
                            <span>{isRequest ? t('board.acceptJob') : t('board.bookNow')} ({maskPhoneNumber(post.authorPhone)})</span>
                          </a>
                          <a
                            href={post.authorLine || 'https://line.me'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-space-md py-space-xs bg-line-green hover:bg-line-green-hover text-on-primary rounded-xl font-body-medium text-body-medium flex items-center justify-center gap-1 shadow-sm transition-all active:scale-[0.98]"
                          >
                            <span className="material-symbols-outlined text-[16px]">chat</span>
                            <span>{t('board.lineChat')}</span>
                          </a>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 6. POST CREATION MODAL (Stitch Responsive Sheet/Dialog) */}
      {formOpen && (
        <div className="fixed inset-0 z-400 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-paper-elevated dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-space-lg shadow-2xl border border-border-subtle dark:border-slate-800 space-y-space-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border-subtle dark:border-slate-800 pb-space-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-action text-[24px]">
                  post_add
                </span>
                <h3 className="font-headline-md text-headline-md text-navy-deep dark:text-white">
                  {form.type === 'request' ? t('board.formTitleReq') : t('board.formTitleOffer')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="p-1 rounded-full text-ink-muted hover:text-ink-primary hover:bg-paper-surface-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type selector toggle */}
            <div className="grid grid-cols-2 gap-space-xs bg-paper-surface-muted dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => set({ type: 'request' })}
                className={`py-2 rounded-lg font-body-medium text-body-medium transition-all ${
                  form.type === 'request'
                    ? 'bg-paper-elevated dark:bg-slate-900 text-blue-action font-bold shadow-xs'
                    : 'text-ink-secondary dark:text-slate-400'
                }`}
              >
                🙋‍♂️ {t('board.tabReq')}
              </button>
              <button
                type="button"
                onClick={() => set({ type: 'offer' })}
                className={`py-2 rounded-lg font-body-medium text-body-medium transition-all ${
                  form.type === 'offer'
                    ? 'bg-paper-elevated dark:bg-slate-900 text-navy-deep dark:text-white font-bold shadow-xs'
                    : 'text-ink-secondary dark:text-slate-400'
                }`}
              >
                🚐 {t('board.tabOffer')}
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-space-sm">
              {/* Honeypot hidden input */}
              <input
                type="text"
                name="website_url_hp"
                value={hpWebsite}
                onChange={(e) => setHpWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="sr-only"
                aria-hidden="true"
              />

              <div>
                <label htmlFor="post-title" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                  {t('board.fTitle')}
                </label>
                <input
                  id="post-title"
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => set({ title: e.target.value })}
                  placeholder={
                    form.type === 'request' ? t('board.fTitlePhReq') : t('board.fTitlePhOffer')
                  }
                  className="w-full h-11 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base focus:outline-none focus:ring-2 focus:ring-blue-action"
                />
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div>
                  <label htmlFor="post-zone" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                    {t('board.fZone')}
                  </label>
                  <select
                    id="post-zone"
                    value={form.zoneId}
                    onChange={(e) => set({ zoneId: e.target.value as ZoneId })}
                    className="w-full h-11 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base focus:outline-none focus:ring-2 focus:ring-blue-action cursor-pointer"
                  >
                    {ZONE_RATE_CARDS.map((z) => (
                      <option key={z.id} value={z.id}>
                        {t('board.zoneOption', { no: z.zoneNo, label: z.shortLabel })}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="post-date" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                    {t('board.fDate')}
                  </label>
                  <input
                    id="post-date"
                    type="text"
                    required
                    value={form.date}
                    onChange={(e) => set({ date: e.target.value })}
                    placeholder={t('board.fDatePh')}
                    className="w-full h-11 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base focus:outline-none focus:ring-2 focus:ring-blue-action"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-space-sm">
                <div>
                  <label htmlFor="post-days" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                    {t('board.fDays')}
                  </label>
                  <input
                    id="post-days"
                    type="number"
                    min={1}
                    required
                    value={form.days}
                    onChange={(e) => set({ days: e.target.value })}
                    className="w-full h-11 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base focus:outline-none focus:ring-2 focus:ring-blue-action"
                  />
                </div>

                <div>
                  <label htmlFor="post-seats" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                    {form.type === 'request' ? t('board.fSeatsReq') : t('board.fSeatsOffer')}
                  </label>
                  <input
                    id="post-seats"
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={form.seats}
                    onChange={(e) => set({ seats: e.target.value })}
                    placeholder="9"
                    className="w-full h-11 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base focus:outline-none focus:ring-2 focus:ring-blue-action"
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between mb-1 gap-1">
                    <label htmlFor="post-price" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider">
                      {form.type === 'request' ? t('board.fPriceReq') : t('board.fPriceOffer')}
                    </label>
                    {form.type === 'request' && (
                      <label className="inline-flex items-center gap-1.5 text-xs text-blue-action font-semibold cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={form.isNegotiable}
                          onChange={(e) => set({ isNegotiable: e.target.checked, price: e.target.checked ? '' : form.price })}
                          className="rounded text-blue-action focus:ring-blue-action"
                        />
                        <span>{t('board.negotiable')}</span>
                      </label>
                    )}
                  </div>
                  <input
                    id="post-price"
                    type="number"
                    min={500}
                    step={100}
                    disabled={form.isNegotiable}
                    required={!form.isNegotiable}
                    value={form.isNegotiable ? '' : form.price}
                    onChange={(e) => set({ price: e.target.value })}
                    placeholder={form.isNegotiable ? 'เปิดรับข้อเสนอ' : '4500'}
                    className={`w-full h-11 px-3 rounded-xl text-body-base font-body-base focus:outline-none focus:ring-2 focus:ring-blue-action transition-all ${
                      form.isNegotiable
                        ? 'bg-slate-100 dark:bg-slate-800/50 text-ink-muted cursor-not-allowed border border-dashed border-border-subtle'
                        : 'bg-paper-surface-muted dark:bg-slate-800 dark:text-white'
                    }`}
                  />
                </div>
              </div>

              {form.isNegotiable && (
                <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-950 dark:text-blue-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
                    <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                    <span>{t('board.fairPrice')}</span>
                    <span>
                      {(() => {
                        const zc = ZONE_RATE_CARDS.find((z) => z.id === form.zoneId);
                        return `โซน ${zc?.shortLabel || 'ทั่วไป'} เฉลี่ย ฿${zc?.baseRateRange[0].toLocaleString()} - ฿${zc?.baseRateRange[1].toLocaleString()} / วัน`;
                      })()}
                    </span>
                  </div>
                  <div className="text-ink-secondary dark:text-slate-300 text-[11px] leading-relaxed flex items-start gap-1">
                    <span className="material-symbols-outlined text-[14px] text-emerald-600 mt-0.5 shrink-0">verified_user</span>
                    <span>{t('board.privacyNote')}</span>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="post-price-note" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                  {t('board.fPriceNote')}
                </label>
                <input
                  id="post-price-note"
                  type="text"
                  value={form.priceNote}
                  onChange={(e) => set({ priceNote: e.target.value })}
                  placeholder={t('board.fPriceNotePh')}
                  className="w-full h-11 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base focus:outline-none focus:ring-2 focus:ring-blue-action"
                />
              </div>

              <div>
                <label htmlFor="post-detail" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                  {t('board.fDetail')}
                </label>
                <textarea
                  id="post-detail"
                  rows={3}
                  required
                  value={form.detail}
                  onChange={(e) => set({ detail: e.target.value })}
                  placeholder={t('board.fDetailPh')}
                  className="w-full p-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base focus:outline-none focus:ring-2 focus:ring-blue-action resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div>
                  <label htmlFor="post-author-name" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                    {t('board.fName')}
                  </label>
                  <input
                    id="post-author-name"
                    type="text"
                    required
                    value={form.authorName}
                    onChange={(e) => set({ authorName: e.target.value })}
                    placeholder={t('board.fNamePh')}
                    className="w-full h-11 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base focus:outline-none focus:ring-2 focus:ring-blue-action"
                  />
                </div>

                <div>
                  <label htmlFor="post-author-phone" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                    {t('board.fPhone')}
                  </label>
                  <input
                    id="post-author-phone"
                    type="tel"
                    required
                    value={form.authorPhone}
                    onChange={(e) => set({ authorPhone: e.target.value })}
                    placeholder="08x-xxx-xxxx"
                    className="w-full h-11 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base focus:outline-none focus:ring-2 focus:ring-blue-action"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div>
                  <label htmlFor="post-author-line" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                    {t('board.fLine')}
                  </label>
                  <input
                    id="post-author-line"
                    type="text"
                    value={form.authorLine}
                    onChange={(e) => set({ authorLine: e.target.value })}
                    placeholder={t('board.fLinePh')}
                    className="w-full h-11 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base focus:outline-none focus:ring-2 focus:ring-blue-action"
                  />
                </div>

                <div>
                  <label htmlFor="post-pin" className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                    {t('board.fPin')}
                  </label>
                  <input
                    id="post-pin"
                    type="password"
                    maxLength={4}
                    value={form.pin}
                    onChange={(e) => set({ pin: e.target.value })}
                    placeholder="1234"
                    className="w-full h-11 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base focus:outline-none focus:ring-2 focus:ring-blue-action"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-blue-action hover:bg-blue-action-hover text-on-primary font-title-card text-title-card rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-space-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('board.submitting')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{t('board.submitConfirm')}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. PIN Close Post Dialog */}
      {closingPost && (
        <div className="fixed inset-0 z-400 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-sm">
          <div className="bg-paper-elevated dark:bg-slate-900 rounded-2xl max-w-sm w-full p-space-lg shadow-2xl border border-border-subtle dark:border-slate-800 space-y-space-sm text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-500 mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="font-headline-md text-headline-md text-navy-deep dark:text-white">
              {t('board.closeTitle')}
            </h4>
            <p className="font-body-subtext text-body-subtext text-ink-secondary dark:text-slate-400">
              {t('board.closeDesc')}
            </p>

            <form onSubmit={handleClosePost} className="space-y-space-sm">
              <label htmlFor="close-post-pin" className="sr-only">
                {t('board.pinPh')}
              </label>
              <input
                id="close-post-pin"
                type="password"
                maxLength={4}
                required
                value={closePin}
                onChange={(e) => setClosePin(e.target.value)}
                placeholder={t('board.pinPh')}
                className="w-full h-11 text-center font-headline-md text-headline-md tracking-widest bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />

              {closeError && (
                <div className="text-xs text-rose-500 font-bold">{closeError}</div>
              )}
              {closeSuccess && (
                <div className="text-xs text-verified-emerald font-bold">{closeSuccess}</div>
              )}

              <div className="grid grid-cols-2 gap-space-xs pt-1">
                <button
                  type="button"
                  onClick={() => setClosingPost(null)}
                  className="h-10 border border-border-subtle rounded-xl text-ink-secondary font-body-medium hover:bg-paper-surface-muted"
                >
                  {t('board.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isClosing}
                  className="h-10 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-body-medium flex items-center justify-center gap-1 shadow-sm"
                >
                  {isClosing ? <Loader2 className="w-4 h-4 animate-spin" /> : t('board.confirmClose')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Driver Submit Quote Modal */}
      {quoteDriverPost && (
        <div className="fixed inset-0 z-400 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-paper-elevated dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-space-lg shadow-2xl border border-border-subtle dark:border-slate-800 space-y-space-md">
            <div className="flex items-start justify-between border-b border-border-subtle dark:border-slate-800 pb-space-sm">
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-1">
                  <span className="material-symbols-outlined text-[14px]">rate_review</span>
                  <span>{t('board.quoteTitle')}</span>
                </div>
                <h3 className="font-title-card text-title-card text-navy-deep dark:text-white">
                  {t('board.quoteFor')}
                </h3>
                <p className="font-body-subtext text-body-subtext text-ink-secondary dark:text-slate-400 line-clamp-1">
                  {quoteDriverPost.title} ({quoteDriverPost.date})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuoteDriverPost(null)}
                className="p-1.5 text-ink-muted hover:text-ink-primary dark:hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDriverQuote} className="space-y-space-sm">
              <div className="grid grid-cols-2 gap-space-sm">
                <div>
                  <label className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                    {t('board.qName')}
                  </label>
                  <input
                    type="text"
                    required
                    value={driverQuoteForm.driverName}
                    onChange={(e) => setDriverQuoteForm((prev) => ({ ...prev, driverName: e.target.value }))}
                    placeholder={t('board.qNamePh')}
                    className="w-full h-11 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                    {t('board.fPhone')}
                  </label>
                  <input
                    type="tel"
                    required
                    value={driverQuoteForm.driverPhone}
                    onChange={(e) => setDriverQuoteForm((prev) => ({ ...prev, driverPhone: e.target.value }))}
                    placeholder="08x-xxx-xxxx"
                    className="w-full h-11 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div>
                  <label className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                    {t('board.qVehicle')}
                  </label>
                  <input
                    type="text"
                    required
                    value={driverQuoteForm.vehicleModel}
                    onChange={(e) => setDriverQuoteForm((prev) => ({ ...prev, vehicleModel: e.target.value }))}
                    placeholder={t('board.qVehiclePh')}
                    className="w-full h-11 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                    {t('board.fLine')}
                  </label>
                  <input
                    type="text"
                    value={driverQuoteForm.driverLine}
                    onChange={(e) => setDriverQuoteForm((prev) => ({ ...prev, driverLine: e.target.value }))}
                    placeholder={t('board.fLinePh')}
                    className="w-full h-11 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div>
                  <label className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                    {t('board.qPrice')}
                  </label>
                  <input
                    type="number"
                    min={500}
                    step={100}
                    required
                    value={driverQuoteForm.price}
                    onChange={(e) => setDriverQuoteForm((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="4500"
                    className="w-full h-11 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                    {t('board.qFuel')}
                  </label>
                  <select
                    value={driverQuoteForm.priceNote}
                    onChange={(e) => setDriverQuoteForm((prev) => ({ ...prev, priceNote: e.target.value }))}
                    className="w-full h-11 px-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="รวมค่าน้ำมันแล้ว">{t('board.qFuel1')}</option>
                    <option value="ไม่รวมน้ำมัน (เติมคืนตามจริง)">{t('board.qFuel2')}</option>
                    <option value="รวมน้ำมันและทางด่วน">{t('board.qFuel3')}</option>
                    <option value="ราคาเหมาเบ็ดเสร็จทุกอย่าง">{t('board.qFuel4')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                  {t('board.qMsg')}
                </label>
                <textarea
                  rows={2}
                  value={driverQuoteForm.message}
                  onChange={(e) => setDriverQuoteForm((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder={t('board.qMsgPh')}
                  className="w-full p-3 bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl text-body-base font-body-base focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              {quoteSubmitError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-bold">
                  {quoteSubmitError}
                </div>
              )}

              {quoteSubmitSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{quoteSubmitSuccess}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingQuote}
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-title-card text-title-card rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSubmittingQuote ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t('board.quoteSending')}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">send</span>
                      <span>{t('board.quoteSend')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Customer View & Accept Quotes Modal */}
      {viewQuotesPost && (
        <div className="fixed inset-0 z-400 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-paper-elevated dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-space-lg shadow-2xl border border-border-subtle dark:border-slate-800 space-y-space-md">
            <div className="flex items-start justify-between border-b border-border-subtle dark:border-slate-800 pb-space-sm">
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-1">
                  <span className="material-symbols-outlined text-[14px]">compare_arrows</span>
                  <span>{t('board.compareTitle')}</span>
                </div>
                <h3 className="font-title-card text-title-card text-navy-deep dark:text-white">
                  {t('board.quotesFor', { title: viewQuotesPost.title })}
                </h3>
                <p className="font-body-subtext text-body-subtext text-ink-secondary dark:text-slate-400">
                  {t('board.compareDesc')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewQuotesPost(null)}
                className="p-1.5 text-ink-muted hover:text-ink-primary dark:hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {acceptSuccessMessage ? (
              <div className="p-space-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-space-sm">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-headline-md text-headline-md text-emerald-900 dark:text-emerald-200 font-bold">
                  {t('board.acceptedTitle')}
                </h4>
                <p className="text-body-base text-emerald-800 dark:text-emerald-300">
                  {acceptSuccessMessage}
                </p>
                <button
                  type="button"
                  onClick={() => setViewQuotesPost(null)}
                  className="mt-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-body-medium shadow-sm transition-all"
                >
                  {t('auth.close')}
                </button>
              </div>
            ) : fetchedQuotes === null && viewQuotesPost.pin ? (
              <div className="p-space-md border border-border-subtle dark:border-slate-800 rounded-2xl space-y-space-sm text-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 mx-auto flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="font-title-card text-title-card text-navy-deep dark:text-white">
                  {t('board.verifyTitle')}
                </h4>
                <p className="font-body-subtext text-body-subtext text-ink-secondary dark:text-slate-400 max-w-sm mx-auto">
                  {t('board.verifyDesc')}
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    fetchQuotesForPost(viewQuotesPost.id, customerQuotesPin);
                  }}
                  className="max-w-xs mx-auto space-y-space-xs"
                >
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={customerQuotesPin}
                    onChange={(e) => setCustomerQuotesPin(e.target.value)}
                    placeholder={t('board.pinPh')}
                    className="w-full h-11 text-center font-headline-md tracking-widest bg-paper-surface-muted dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-action"
                  />
                  {quotesFetchError && (
                    <div className="text-xs text-rose-500 font-bold">{quotesFetchError}</div>
                  )}
                  <button
                    type="submit"
                    disabled={isLoadingQuotes}
                    className="w-full h-10 bg-blue-action hover:bg-blue-action-hover text-white rounded-xl font-body-medium flex items-center justify-center gap-1 shadow-sm"
                  >
                    {isLoadingQuotes ? <Loader2 className="w-4 h-4 animate-spin" /> : t('board.unlock')}
                  </button>
                </form>
              </div>
            ) : isLoadingQuotes ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-ink-muted">
                <Loader2 className="w-8 h-8 animate-spin text-blue-action" />
                <span className="text-sm">{t('board.quotesLoading')}</span>
              </div>
            ) : fetchedQuotes && fetchedQuotes.length === 0 ? (
              <div className="py-10 text-center space-y-2 border border-dashed border-border-subtle dark:border-slate-800 rounded-2xl">
                <span className="material-symbols-outlined text-[36px] text-ink-muted">inbox</span>
                <p className="font-title-card text-title-card text-navy-deep dark:text-white">
                  {t('board.noQuotes')}
                </p>
                <p className="font-body-subtext text-body-subtext text-ink-secondary dark:text-slate-400 max-w-sm mx-auto">
                  {t('board.noQuotesDesc')}
                </p>
              </div>
            ) : (
              <div className="space-y-space-sm">
                <div className="flex items-center justify-between text-xs text-ink-muted dark:text-slate-400 px-1">
                  <span>{t('board.quotesGot', { n: fetchedQuotes?.length || 0, m: 3 })}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">shield</span>
                    {t('board.directOnly')}
                  </span>
                </div>

                <div className="space-y-3">
                  {fetchedQuotes?.map((quote, idx) => (
                    <div
                      key={quote.id}
                      className="p-4 rounded-2xl bg-paper-surface dark:bg-slate-800/80 border border-border-subtle dark:border-slate-700 hover:border-blue-action transition-all shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle/60 dark:border-slate-700/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-action text-white text-xs font-bold flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-navy-deep dark:text-white text-base">
                              {quote.driverName}
                            </div>
                            <div className="text-xs text-ink-secondary dark:text-slate-300">
                              {quote.vehicleModel}
                            </div>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <div className="font-bold text-xl text-blue-action dark:text-blue-400">
                            ฿{quote.price.toLocaleString()}
                          </div>
                          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                            {quote.priceNote || t('board.fuelIncl')}
                          </div>
                        </div>
                      </div>

                      {quote.message && (
                        <p className="text-xs text-ink-secondary dark:text-slate-300 bg-paper-surface-muted dark:bg-slate-900/60 p-2.5 rounded-xl italic">
                          &ldquo;{quote.message}&rdquo;
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${quote.driverPhone}`}
                            className="px-3 py-1.5 bg-navy-deep hover:bg-navy-surface text-white rounded-lg text-xs font-body-medium flex items-center gap-1 transition-all"
                          >
                            <span className="material-symbols-outlined text-[14px]">call</span>
                            <span>{t('board.callDriver', { phone: quote.driverPhone })}</span>
                          </a>
                          {quote.driverLine && (
                            <a
                              href={quote.driverLine.startsWith('http') ? quote.driverLine : `https://line.me/ti/p/~${quote.driverLine}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-line-green hover:bg-line-green-hover text-white rounded-lg text-xs font-body-medium flex items-center gap-1 transition-all"
                            >
                              <span className="material-symbols-outlined text-[14px]">chat</span>
                              <span>{t('board.lineChat')}</span>
                            </a>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAcceptQuote(quote)}
                          disabled={acceptingQuoteId !== null}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-[0.98]"
                        >
                          {acceptingQuoteId === quote.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>{t('board.chooseDriver')}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
