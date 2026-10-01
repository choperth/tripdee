'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
import { isMockEnvEnabled, isMockDataEnabled } from '@/lib/mockConfig';
import { isMockPostId } from '@/lib/supabase/service';
import { isBoardPostExpired } from '@/lib/availabilityUtils';
import {
  X,
  CheckCircle2,
  Lock,
  Loader2,
  MessageCircle,
  UserCheck,
} from 'lucide-react';
import { useAuth, UserProfile } from '@/context/AuthContext';
import { TravelDatePicker } from '@/components/TravelDatePicker';
import { formatWhatsAppLink } from '@/lib/contactUtils';
import {
  saveMyBoardPost,
  getMyBoardPostToken,
  buildMagicLink,
} from '@/lib/boardStorage';

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
  authorWhatsApp: string;
  authorWeChat: string;
  authorKakaoTalk: string;
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
  authorWhatsApp: '',
  authorWeChat: '',
  authorKakaoTalk: '',
  vehicleLabel: '',
  detail: '',
  pin: '',
  isNegotiable: false,
};

export const TripBoard: React.FC = () => {

  const { trackCall } = useAnalytics();
  const { t } = useLanguage();
  const { user, loginWithOAuth } = useAuth();
  const [oauthLoading, setOauthLoading] = useState<'line' | 'google' | null>(null);
  const [autofilled, setAutofilled] = useState<boolean>(false);
  const isClient = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const renderPortal = useCallback(
    (content: React.ReactNode) => {
      if (!isClient || typeof document === 'undefined') return null;
      return createPortal(content, document.body);
    },
    [isClient]
  );
  const isDemo = isClient ? isMockDataEnabled() : isMockEnvEnabled();
  const [posts, setPosts] = useState<BoardPost[]>(() => (isMockEnvEnabled() ? BOARD_POSTS : []));
  // Board feed state
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
    driverWhatsApp: '',
    vehicleModel: '',
    price: '',
    priceNote: t('board.priceNoteIncluded'),
    message: '',
  });
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteSubmitError, setQuoteSubmitError] = useState('');
  const [quoteSubmitSuccess, setQuoteSubmitSuccess] = useState('');

  // Customer View Quotes Modal State
  // Customer View Quotes Modal State
  const [viewQuotesPost, setViewQuotesPost] = useState<BoardPost | null>(null);
  const [customerQuotesPin, setCustomerQuotesPin] = useState('');
  const [fetchedQuotes, setFetchedQuotes] = useState<BoardQuote[] | null>(null);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [quotesFetchError, setQuotesFetchError] = useState('');
  const [acceptingQuoteId, setAcceptingQuoteId] = useState<string | null>(null);
  const [acceptSuccessMessage, setAcceptSuccessMessage] = useState('');

  // Magic Link / Ownership States
  const [createdMagicLinkPost, setCreatedMagicLinkPost] = useState<{
    id: string;
    title: string;
    token: string;
    link: string;
  } | null>(null);
  const [copiedMagicLink, setCopiedMagicLink] = useState(false);
  const [customerQuotesToken, setCustomerQuotesToken] = useState('');
  const [isQuotesUnlockedWithToken, setIsQuotesUnlockedWithToken] = useState(false);

  // Board feed data loader

  const loadBoardPosts = React.useCallback(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const connector = search ? (search.includes('?') ? '&' : '?') : '?';
    fetch(`/api/board${search}${connector}includeClosed=true`)
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

  // Clean active posts respecting demo mode
  const activePosts = useMemo(() => {
    return isDemo ? posts : posts.filter((p) => !isMockPostId(p.id));
  }, [posts, isDemo]);

  const [filter, setFilter] = useState<'all' | 'request' | 'share' | 'corporate'>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [showClosedPosts, setShowClosedPosts] = useState<boolean>(false);
  const [postsExpanded, setPostsExpanded] = useState<boolean>(false);

  // Collapse the post grid back to the first 3 whenever the visible pool changes.
  // (Called inline from the filter/search/toggle handlers below — no effect needed.)
  const collapsePostsView = () => setPostsExpanded(false);

  // Open vs Closed/Expired posts
  const openPosts = useMemo(() => {
    return activePosts.filter((p) => !p.isClosed && !isBoardPostExpired(p));
  }, [activePosts]);

  const postMatchesQuery = React.useCallback((p: BoardPost) => {
    if (filter === 'request' && p.type !== 'request') return false;
    if (filter === 'share' && p.type !== 'share') return false;
    if (filter === 'corporate' && p.category !== 'corporate') return false;
    const q = searchKeyword.trim().toLowerCase();
    if (q === '') return true;
    const matchTitle = p.title.toLowerCase().includes(q);
    const matchDetail = p.detail ? p.detail.toLowerCase().includes(q) : false;
    const matchLocation = p.pickupLocation ? p.pickupLocation.toLowerCase().includes(q) : false;
    const matchDate = p.date ? p.date.toLowerCase().includes(q) : false;
    return matchTitle || matchDetail || matchLocation || matchDate;
  }, [filter, searchKeyword]);

  const closedCount = useMemo(() => {
    // นับเฉพาะประกาศที่จะแสดงจริงเมื่อกดปุ่ม: ตัด offer ที่ไม่เคยโชว์ และต้องผ่านฟิลเตอร์/คำค้นปัจจุบัน
    return activePosts.filter(
      (p) => p.type !== 'offer' && Boolean(p.isClosed || isBoardPostExpired(p)) && postMatchesQuery(p)
    ).length;
  }, [activePosts, postMatchesQuery]);

  const basePool = useMemo(() => {
    const pool = showClosedPosts ? activePosts : openPosts;
    // ตัวอย่างเด่นเป็น mock: แสดงเฉพาะโหมด demo กันข้อมูลตัวอย่างหลุดไป production
    const featuredSample = isDemo ? BOARD_POSTS.filter((p) => p.id === 'b-khaoyai' || p.id === 'b-inthanon') : [];
    const sampleIds = new Set(featuredSample.map((p) => p.id));
    const others = pool.filter((p) => !sampleIds.has(p.id));
    return [...featuredSample, ...others].filter((p) => p.type !== 'offer');
  }, [showClosedPosts, activePosts, openPosts, isDemo]);

  // Counts for tabs
  const { totalCount, requestCount, shareCount, corporateCount } = useMemo(() => ({
    totalCount: basePool.length,
    requestCount: basePool.filter((p) => p.type === 'request').length,
    shareCount: basePool.filter((p) => p.type === 'share').length,
    corporateCount: basePool.filter((p) => p.category === 'corporate').length,
  }), [basePool]);

  // Filtered displayed posts
  const displayedPosts = useMemo(() => {
    return basePool.filter(postMatchesQuery);
  }, [basePool, postMatchesQuery]);

  // Show only the first 3 posts until the user expands the section
  const visiblePosts = postsExpanded ? displayedPosts : displayedPosts.slice(0, 3);
  const set = (patch: Partial<PostFormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const applyAutofill = useCallback((profile: UserProfile) => {
    setForm((prev) => ({
      ...prev,
      authorName: profile.driverNickname || profile.name || prev.authorName,
      authorPhone:
        profile.emailOrPhone && !profile.emailOrPhone.includes('@')
          ? profile.emailOrPhone
          : prev.authorPhone,
      authorLine: profile.lineId || prev.authorLine,
      authorWhatsApp: profile.whatsapp || prev.authorWhatsApp,
      authorWeChat: profile.wechat || prev.authorWeChat,
      authorKakaoTalk: prev.authorKakaoTalk,
    }));
  }, []);

  const handleOAuthAutofill = async (provider: 'line' | 'google') => {
    try {
      setOauthLoading(provider);
      const res = await loginWithOAuth(provider, 'customer');
      if (res.success && res.user) {
        applyAutofill(res.user);
      }
    } catch (err) {
      console.warn('[TripBoard] OAuth autofill error:', err);
    } finally {
      setOauthLoading(null);
    }
  };

  const openNewPost = (type: BoardPostType, category: 'general' | 'corporate' = 'general') => {
    setForm({
      ...EMPTY_FORM,
      type,
      category,
      authorName: user ? (user.driverNickname || user.name) : '',
      authorPhone: user?.emailOrPhone && !user.emailOrPhone.includes('@') ? user.emailOrPhone : '',
      authorLine: user?.lineId || '',
      authorWhatsApp: user?.whatsapp || '',
      authorWeChat: user?.wechat || '',
    });
    setFormMountedAt(Date.now());
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const days = Math.max(1, Number(form.days) || 1);
    const seats = Math.max(1, Number(form.seats) || 1);
    // Negotiable pricing is demand-only (request); share posts always carry a fixed split amount
    const isNegotiable = form.type === 'request' && form.isNegotiable;
    const price = isNegotiable ? 0 : Math.max(0, Math.round(Number(form.price) || 0));
    if (!isNegotiable && price <= 0) return;

    const generatedToken = `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const post: BoardPost = {
      id: `b-${Date.now().toString().slice(-6)}`,
      type: form.type === 'share' ? 'share' : 'request',
      category: form.category,
      title: form.title.trim(),
      zoneId: form.zoneId,
      date: form.date.trim(),
      days,
      seats,
      price,
      priceNote: isNegotiable ? (form.priceNote.trim() || t('board.priceNoteAwaiting')) : (form.priceNote.trim() || undefined),
      authorName: form.authorName.trim(),
      authorPhone: form.authorPhone.trim(),
      authorLine: form.authorLine.trim(),
      authorWhatsApp: form.authorWhatsApp.trim() || undefined,
      authorWeChat: form.authorWeChat.trim() || undefined,
      authorKakaoTalk: form.authorKakaoTalk.trim() || undefined,
      vehicleLabel: form.type === 'offer' && form.vehicleLabel.trim() ? form.vehicleLabel.trim() : undefined,
      detail: (form.detail.trim() + (form.authorKakaoTalk.trim() ? ` [KakaoTalk: ${form.authorKakaoTalk.trim()}]` : '')).trim(),
      pin: form.pin.trim() || undefined,
      postedAt: t('board.postedJustNow'),
      isNegotiable,
      maxQuotes: 3,
      quoteCount: 0,
      viewToken: generatedToken,
    };
    setPosts((prev) => [post, ...prev]);
    setForm(EMPTY_FORM);
    setFormOpen(false);

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...post,
          viewToken: generatedToken,
          hp_website: hpWebsite,
          _hp_timestamp: formMountedAt,
        }),
      });
      const data = await res.json();
      const serverPost = data?.post || post;
      const finalToken = serverPost.viewToken || generatedToken;
      saveMyBoardPost(serverPost.id, finalToken, serverPost.pin, serverPost.title);
      setCreatedMagicLinkPost({
        id: serverPost.id,
        title: serverPost.title,
        token: finalToken,
        link: buildMagicLink(serverPost.id, finalToken),
      });
      window.dispatchEvent(new CustomEvent('tripdee-board-updated'));
    } catch (err) {
      console.debug('Failed to persist post to server/Supabase:', err);
      saveMyBoardPost(post.id, generatedToken, post.pin, post.title);
      setCreatedMagicLinkPost({
        id: post.id,
        title: post.title,
        token: generatedToken,
        link: buildMagicLink(post.id, generatedToken),
      });
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
        setCloseError(data.error || t('board.errPin'));
        return;
      }
      setCloseSuccess(t('board.closeSuccess'));
      setPosts((prev) => prev.filter((p) => p.id !== closingPost.id));
      window.dispatchEvent(new CustomEvent('tripdee-board-updated'));
      setTimeout(() => {
        setClosingPost(null);
        setClosePin('');
        setCloseSuccess('');
      }, 1200);
    } catch {
      setCloseError(t('board.errConnect'));
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
      driverWhatsApp: '',
      vehicleModel: '',
      price: '',
      priceNote: t('board.priceNoteIncluded'),
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
          driverWhatsApp: driverQuoteForm.driverWhatsApp.trim() || undefined,
          vehicleModel: driverQuoteForm.vehicleModel.trim(),
          price: Number(driverQuoteForm.price) || 0,
          priceNote: driverQuoteForm.priceNote.trim(),
          message: driverQuoteForm.message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setQuoteSubmitError(data.error || t('board.errQuoteSubmit'));
        return;
      }
      setQuoteSubmitSuccess(data.message || t('board.quoteSent'));
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
      setQuoteSubmitError(t('board.errConnect'));
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const fetchQuotesForPost = useCallback(
    async (postId: string, pin: string, token?: string) => {
      setIsLoadingQuotes(true);
      setQuotesFetchError('');
      try {
        const activeToken = token || customerQuotesToken;
        const tokenParam = activeToken ? `&token=${encodeURIComponent(activeToken)}` : '';
        const pinParam = pin ? `&pin=${encodeURIComponent(pin)}` : '';
        const res = await fetch(
          `/api/board?action=get_quotes&postId=${encodeURIComponent(postId)}${pinParam}${tokenParam}`
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          setQuotesFetchError(data.error || t('board.errPin'));
          return;
        }
        setFetchedQuotes(data.quotes || []);
        if (activeToken) {
          setIsQuotesUnlockedWithToken(true);
        }
      } catch {
        setQuotesFetchError(t('board.errQuotes'));
      } finally {
        setIsLoadingQuotes(false);
      }
    },
    [customerQuotesToken, t]
  );

  const handleOpenCustomerQuotes = useCallback(
    (post: BoardPost, directToken?: string) => {
      setViewQuotesPost(post);
      setCustomerQuotesPin('');
      setFetchedQuotes(null);
      setQuotesFetchError('');
      setAcceptSuccessMessage('');

      const token = directToken || getMyBoardPostToken(post.id) || post.viewToken || '';
      setCustomerQuotesToken(token);
      setIsQuotesUnlockedWithToken(Boolean(token));

      if (token) {
        fetchQuotesForPost(post.id, '', token);
      } else if (!post.pin) {
        fetchQuotesForPost(post.id, '');
      }
    },
    [fetchQuotesForPost]
  );

  // Auto-open quotes modal if URL has ?quotePost=<id>&token=<token>
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const quotePostId = params.get('quotePost');
    const token =
      params.get('token') || (quotePostId ? getMyBoardPostToken(quotePostId) : undefined);
    if (quotePostId && posts.length > 0) {
      const found = posts.find((p) => p.id === quotePostId);
      if (found) {
        const timer = setTimeout(() => {
          handleOpenCustomerQuotes(found, token || undefined);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [posts, handleOpenCustomerQuotes]);

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
          pin: customerQuotesPin || undefined,
          token: customerQuotesToken || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || t('board.errSelectOffer'));
        return;
      }
      setAcceptSuccessMessage(t('board.acceptedMsg', { name: quote.driverName }));
      setPosts((prev) => prev.filter((p) => p.id !== viewQuotesPost.id));
      window.dispatchEvent(new CustomEvent('tripdee-board-updated'));
    } catch {
      alert(t('board.errNetwork'));
    } finally {
      setAcceptingQuoteId(null);
    }
  };

  return (
    <section id="tripboard" aria-label={t('board.aria')} className="max-w-7xl mx-auto px-4 sm:px-6 mb-12 sm:mb-14 scroll-mt-20 sm:scroll-mt-24">
      <div className="bg-slate-900 text-white border border-slate-800 p-6 md:p-8 rounded-none">
        {/* Hero Header & Quick Action Triggers */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-800 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 border border-emerald-500/40 bg-emerald-950/60 text-emerald-400 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider mb-2 rounded-none">
              <span className="w-1.5 h-1.5 bg-emerald-400"></span>
              <span>TripBoard Real-time Activity</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {t('board.title')}
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl font-light">
              {t('board.caption')}
            </p>
          </div>

          {/* Call To Action Dual Triggers (Bauhaus Sharp) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              id="open-post-modal-btn"
              type="button"
              onClick={() => openNewPost('request')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 border border-amber-600 transition-all rounded-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">post_add</span>
              <span>{t('board.postFree')}</span>
            </button>
            <button
              type="button"
              onClick={() => openNewPost('share')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-all rounded-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px] text-amber-400">group_add</span>
              <span>{t('board.postShare')}</span>
            </button>
          </div>
        </div>

        {/* Filter Console (Image #1 Row 2 - Bauhaus Sharp & Clutter-Free) */}
        <div className="bg-slate-800/60 border border-slate-700/80 p-2 sm:p-2.5 mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 rounded-none">
          {/* Main Segment Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
            <button
              type="button"
              onClick={() => { setFilter('all'); collapsePostsView(); }}
              className={`px-3 py-1.5 text-xs font-bold transition-all rounded-none cursor-pointer whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-transparent text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              {t('board.filterAll')} ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => { setFilter('request'); collapsePostsView(); }}
              className={`px-3 py-1.5 text-xs font-bold transition-all rounded-none cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                filter === 'request'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-transparent text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <span>🙋‍♂️</span>
              <span>{t('board.filterRequest')} ({requestCount})</span>
            </button>
            <button
              type="button"
              onClick={() => { setFilter('share'); collapsePostsView(); }}
              className={`px-3 py-1.5 text-xs font-bold transition-all rounded-none cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                filter === 'share'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-transparent text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <span>🤝</span>
              <span>{t('board.filterShare')} ({shareCount})</span>
            </button>
            <button
              type="button"
              onClick={() => { setFilter('corporate'); collapsePostsView(); }}
              className={`px-3 py-1.5 text-xs font-bold transition-all rounded-none cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                filter === 'corporate'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-transparent text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <span>🏢</span>
              <span>{t('board.filterCorp')} ({corporateCount})</span>
            </button>
          </div>

          {/* Controls: Expired Toggle + Search Input */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {closedCount > 0 && (
              <button
                type="button"
                onClick={() => { setShowClosedPosts(!showClosedPosts); collapsePostsView(); }}
                className={`px-4 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 rounded-none border cursor-pointer whitespace-nowrap ${
                  showClosedPosts
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-600'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                <span>
                  {showClosedPosts
                    ? t('board.hideExpiredToggle')
                    : t('board.showExpiredToggle', { n: closedCount })}
                </span>
              </button>
            )}

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => { setSearchKeyword(e.target.value); collapsePostsView(); }}
                placeholder={t('board.searchPh')}
                className="w-full h-8.5 pl-8.5 pr-7 bg-slate-950 text-white text-xs placeholder:text-slate-500 border border-slate-700 focus:border-amber-500 focus:outline-none transition-colors rounded-none"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => { setSearchKeyword(''); collapsePostsView(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Minimalist Structured Cards (3-Column Grid matching Image 2 / Stitch Design) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {visiblePosts.map((post) => {
            const isRequest = post.type === 'request';
            const isShare = post.type === 'share';
            const zoneObj = ZONE_RATE_CARDS.find((z) => z.id === post.zoneId);
            const isExpired = isBoardPostExpired(post);
            const isPostClosed = Boolean(post.isClosed || isExpired);
            const isPostNegotiable = Boolean(post.isNegotiable || (isRequest && post.price <= 0));

            return (
              <div
                key={post.id}
                className={`border p-5 flex flex-col justify-between transition-all rounded-none ${
                  isPostClosed
                    ? 'bg-red-950/30 border-red-800/70 hover:border-red-700'
                    : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/80 text-[11px]">
                    {isRequest ? (
                      <span className={`font-bold flex items-center gap-1 ${isPostClosed ? 'text-red-400' : 'text-emerald-400'}`}>
                        <span className={`w-1.5 h-1.5 ${isPostClosed ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                        <span>{isPostClosed ? t('board.expiredBadge') : t('board.openBadge')}</span>
                      </span>
                    ) : isShare ? (
                      <span className={`font-bold flex items-center gap-1 ${isPostClosed ? 'text-red-400' : 'text-amber-400'}`}>
                        <span className="material-symbols-outlined text-[13px]">group</span>
                        <span>{isPostClosed ? t('board.expiredBadge') : t('board.needFriends', { n: post.seats || 2 })}</span>
                      </span>
                    ) : (
                      <span className="font-bold text-amber-300 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">business_center</span>
                        <span>{t('board.badgeCorp')}</span>
                      </span>
                    )}
                    <span className="text-slate-400 font-mono text-[11px]">
                      {post.postedAt || t('board.ago15')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-light line-clamp-2">
                    {post.detail || t('board.noDetail')}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-3 text-[11px] text-slate-300 font-mono">
                    <span className="bg-slate-900 border border-slate-700 px-2 py-0.5">
                      📅 {post.date}
                    </span>
                    <span className="bg-slate-900 border border-slate-700 px-2 py-0.5">
                      📍 {post.pickupLocation || zoneObj?.shortLabel || t('board.pickupTbd')}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      {isShare ? t('board.avgCost') : t('board.budgetOffer')}
                    </span>
                    <span className={`text-sm font-black font-mono ${isShare ? 'text-white' : 'text-amber-400'}`}>
                      {isPostNegotiable
                        ? t('board.negotiableShort')
                        : isShare
                        ? t('board.perPerson', { price: `฿${post.price.toLocaleString()}` })
                        : `฿${post.price.toLocaleString()} ${post.priceNote || t('board.fuelPlain')}`}
                    </span>
                  </div>

                  {isPostClosed ? (
                    <span className="text-xs text-slate-500 font-mono">{t('board.closedBadge')}</span>
                  ) : isRequest ? (
                    <div className="flex items-center gap-1.5">
                      {isPostNegotiable && (post.maxQuotes || 3) > (post.quoteCount || 0) && (
                        <button
                          type="button"
                          onClick={() => handleOpenDriverQuote(post)}
                          className="bg-transparent hover:bg-amber-500/15 text-amber-400 font-bold text-xs px-3 py-1.5 transition-colors cursor-pointer rounded-none inline-flex items-center gap-1 border border-amber-500/60"
                        >
                          <span className="material-symbols-outlined text-[15px]">rate_review</span>
                          <span>{t('board.submitQuote', { left: (post.maxQuotes || 3) - (post.quoteCount || 0) })}</span>
                        </button>
                      )}
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
                        className="bg-white hover:bg-amber-400 hover:text-slate-950 text-slate-950 font-bold text-xs px-3.5 py-1.5 transition-colors cursor-pointer rounded-none inline-flex items-center gap-1"
                      >
                        <span>{t('board.takeJob')}</span>
                      </a>
                    </div>
                  ) : (
                    <a
                      href={post.authorLine || `tel:${post.authorPhone}`}
                      target={post.authorLine ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-1.5 transition-colors cursor-pointer rounded-none inline-flex items-center gap-1"
                    >
                      <span>{t('board.joinTrip')}</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}

          {/* Callout card: only show if fewer than 3 posts */}
          {displayedPosts.length < 3 && (
            <div className="bg-slate-950/60 border border-dashed border-slate-700 p-5 flex flex-col items-center justify-center text-center rounded-none">
              <div className="w-10 h-10 border border-amber-400/40 bg-amber-400/10 text-amber-400 flex items-center justify-center mb-2 rounded-none">
                <span className="material-symbols-outlined text-[22px]">add_task</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{t('board.calloutTitle')}</h3>
              <p className="text-xs text-slate-400 max-w-xs mb-4 font-light leading-relaxed">
                {t('board.calloutDesc')}
              </p>
              <button
                type="button"
                onClick={() => openNewPost('request')}
                className="w-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs py-2 border border-white transition-colors cursor-pointer rounded-none"
              >
                {t('board.postFree')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expand/collapse: only show when more than 3 posts match */}
      {displayedPosts.length > 3 && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setPostsExpanded(!postsExpanded)}
            aria-expanded={postsExpanded}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold border transition-colors cursor-pointer rounded-none ${
              postsExpanded
                ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-600'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {postsExpanded ? 'expand_less' : 'expand_more'}
            </span>
            <span>
              {postsExpanded
                ? t('board.collapsePosts')
                : t('board.expandPosts', { n: displayedPosts.length - 3 })}
            </span>
          </button>
        </div>
      )}

      {/* 6. POST CREATION MODAL (Stitch Responsive Sheet/Dialog) */}
      {formOpen && renderPortal(
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-2 sm:p-4 bg-navy-deep/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-paper-elevated dark:bg-slate-900 rounded-none max-w-3xl w-full max-h-[92vh] sm:max-h-[90vh] shadow-2xl border border-border-subtle dark:border-slate-800 my-auto flex flex-col overflow-hidden">
            {/* Top Monolithic Accent Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-navy via-slate-800 to-amber-500 shrink-0" />

            {/* Modal Header */}
            <div className="p-4 sm:p-6 pb-3 sm:pb-4 flex items-start justify-between border-b border-border-subtle dark:border-slate-800 bg-surface-card dark:bg-slate-900 shrink-0">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-paper-surface-muted dark:bg-slate-800 border border-border-subtle dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-navy-deep dark:text-blue-400 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    post_add
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-headline-xl text-lg sm:text-xl font-extrabold text-navy-deep dark:text-white tracking-tight">
                      {form.type === 'share'
                        ? t('board.formTitleShare')
                        : form.type === 'request'
                        ? t('board.formTitleReq')
                        : t('board.formTitleOffer')}
                    </h3>
                    <span className="px-2 py-0.5 bg-amber-soft text-amber-deep text-xs font-bold uppercase tracking-wider border border-amber-soft/80">
                      {t('board.freeCommission')}
                    </span>
                  </div>
                  <p className="font-caption text-xs sm:text-sm text-ink-secondary dark:text-slate-400 mt-0.5">
                    {t('board.formSubCaption')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-paper-surface-muted dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Container (Flex Col with scrollable body & pinned action bar) */}
            <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {/* Scrollable Fields Body */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
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

              {/* Segmented Mode Switcher (Bauhaus Tab Grid) */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-paper-surface-muted dark:bg-slate-800 border border-border-subtle dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => set({ type: 'request' })}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 font-label-md text-xs sm:text-sm transition-all cursor-pointer ${
                    form.type === 'request'
                      ? 'bg-paper-elevated dark:bg-slate-900 text-blue-action dark:text-blue-400 font-bold shadow-xs border border-border-subtle dark:border-slate-700'
                      : 'text-ink-secondary dark:text-slate-400 hover:text-ink-primary border border-transparent'
                  }`}
                >
                  <span>🙋‍♂️</span>
                  <span>{t('board.tabReq')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => set({ type: 'share' })}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 font-label-md text-xs sm:text-sm transition-all cursor-pointer ${
                    form.type === 'share'
                      ? 'bg-paper-elevated dark:bg-slate-900 text-navy-deep dark:text-white font-bold shadow-xs border border-border-subtle dark:border-slate-700'
                      : 'text-ink-secondary dark:text-slate-400 hover:text-ink-primary border border-transparent'
                  }`}
                >
                  <span>🤝</span>
                  <span>{t('board.tabShare')}</span>
                </button>
              </div>

              {/* Autofill Profile Banner */}
              {user ? (
                <div className="p-3.5 bg-line-green-soft/70 dark:bg-emerald-950/40 border border-line-green/30 dark:border-emerald-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-line-green text-white flex items-center justify-center shrink-0">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-label-md text-xs sm:text-sm text-ink-primary dark:text-white font-bold">
                          {t('board.autofillLoggedIn')}
                        </span>
                        <span className="px-1.5 py-0.2 bg-white dark:bg-slate-800 text-line-green font-label-sm text-[10px] font-bold border border-line-green/30">
                          {t('auth.verifiedRole')}
                        </span>
                      </div>
                      <p className="font-caption text-[11px] sm:text-xs text-ink-secondary dark:text-slate-300 truncate">
                        {user.role === 'driver' ? t('auth.roleDriver') : t('auth.roleCustomer')} • {user.emailOrPhone}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      applyAutofill(user);
                      setAutofilled(true);
                      setTimeout(() => setAutofilled(false), 2500);
                    }}
                    className="inline-flex items-center justify-center px-3.5 py-1.5 font-label-sm text-xs font-bold bg-line-green text-white hover:bg-line-green-hover transition-all whitespace-nowrap shadow-xs cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm mr-1">bolt</span>
                    <span>{autofilled ? t('board.autofillButtonDone') : t('board.autofillButton')}</span>
                  </button>
                </div>
              ) : (
                <div className="p-3.5 bg-paper-surface-muted/80 dark:bg-slate-800/70 border border-border-subtle dark:border-slate-700/60 space-y-2.5">
                  <div className="text-xs font-extrabold text-ink-primary dark:text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-blue-action">bolt</span>
                    <span>{t('board.autofillBanner')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={!!oauthLoading}
                      onClick={() => handleOAuthAutofill('line')}
                      className="flex items-center justify-center gap-1.5 bg-[#06C755] py-2 px-2.5 text-xs font-extrabold text-white hover:bg-[#05b34c] transition-colors disabled:opacity-60 cursor-pointer shadow-2xs border border-transparent"
                    >
                      {oauthLoading === 'line' ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>{t('auth.connecting')}</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle className="h-3.5 w-3.5 fill-white" />
                          <span>{t('board.autofillLine')}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={!!oauthLoading}
                      onClick={() => handleOAuthAutofill('google')}
                      className="flex items-center justify-center gap-1.5 bg-card dark:bg-slate-900 border border-border-subtle dark:border-slate-700 py-2 px-2.5 text-xs font-extrabold text-ink-primary dark:text-white hover:bg-paper-2 dark:hover:bg-slate-800 transition-colors disabled:opacity-60 cursor-pointer shadow-2xs"
                    >
                      {oauthLoading === 'google' ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>{t('auth.connecting')}</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                            />
                          </svg>
                          <span>{t('board.autofillGoogle')}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-ink-muted dark:text-slate-400 text-center">
                    {t('board.autofillGuestHint')}
                  </p>
                </div>
              )}

              {/* Field 1: หัวข้อประกาศ */}
              <div className="space-y-1.5">
                <label htmlFor="post-title" className="flex items-center justify-between font-label-badge text-xs text-ink-secondary dark:text-slate-400 uppercase tracking-wider">
                  <span>{t('board.fTitle')}</span>
                  <span className="font-caption normal-case text-ink-muted dark:text-slate-500">
                    {form.type === 'share' ? t('board.fSeatsShare') : 'เช่น ประเภทรถ + เส้นทางหลัก'}
                  </span>
                </label>
                <input
                  id="post-title"
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => set({ title: e.target.value })}
                  placeholder={
                    form.type === 'share'
                      ? t('board.fTitlePhShare')
                      : form.type === 'request'
                      ? t('board.fTitlePhReq')
                      : t('board.fTitlePhOffer')
                  }
                  className="w-full h-11 px-3.5 bg-paper-surface-muted dark:bg-slate-800 text-ink-primary dark:text-white border border-border-subtle dark:border-slate-700 text-sm focus:outline-none focus:border-navy-deep dark:focus:border-blue-400 transition-all"
                />
              </div>

              {/* Field 2: วันที่เดินทาง */}
              <div className="space-y-1.5">
                <label htmlFor="post-date" className="block font-label-badge text-xs text-ink-secondary dark:text-slate-400 uppercase tracking-wider">
                  {t('board.fDate')}
                </label>
                <TravelDatePicker
                  id="post-date"
                  value={form.date}
                  onChange={(dateStr) => set({ date: dateStr })}
                  days={Number(form.days) || 1}
                  onDaysChange={(newDays) => set({ days: String(newDays) })}
                  placeholder={t('board.fDatePh')}
                  required
                />
              </div>

              {/* Field 3 & 4 (Grid 2 cols: โซนปลายทาง & จำนวนวัน) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="post-zone" className="block font-label-badge text-xs text-ink-secondary dark:text-slate-400 uppercase tracking-wider">
                    {t('board.fZone')}
                  </label>
                  <div className="relative">
                    <select
                      id="post-zone"
                      value={form.zoneId}
                      onChange={(e) => set({ zoneId: e.target.value as ZoneId })}
                      className="w-full h-11 px-3.5 bg-paper-surface-muted dark:bg-slate-800 text-ink-primary dark:text-white border border-border-subtle dark:border-slate-700 text-sm focus:outline-none focus:border-navy-deep dark:focus:border-blue-400 appearance-none cursor-pointer"
                    >
                      {ZONE_RATE_CARDS.map((z) => (
                        <option key={z.id} value={z.id}>
                          {t('board.zoneOption', { no: z.zoneNo, label: z.shortLabel })}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted">
                      <span className="material-symbols-outlined text-lg">unfold_more</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="post-days" className="block font-label-badge text-xs text-ink-secondary dark:text-slate-400 uppercase tracking-wider">
                    {t('board.fDays')}
                  </label>
                  <div className="relative flex items-center bg-paper-surface-muted dark:bg-slate-800 border border-border-subtle dark:border-slate-700 focus-within:border-navy-deep dark:focus-within:border-blue-400">
                    <input
                      id="post-days"
                      type="number"
                      min={1}
                      max={30}
                      required
                      value={form.days}
                      onChange={(e) => set({ days: e.target.value })}
                      className="w-full h-11 px-3.5 bg-transparent text-ink-primary dark:text-white text-sm focus:outline-none"
                    />
                    <span className="pr-3.5 font-label-md text-xs sm:text-sm text-ink-secondary dark:text-slate-400 pointer-events-none">
                      {t('board.unitDays')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Field 5 & 6 (Grid 2 cols: จำนวนผู้โดยสาร & งบประมาณ) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="post-seats" className="block font-label-badge text-xs text-ink-secondary dark:text-slate-400 uppercase tracking-wider">
                    {form.type === 'share'
                      ? t('board.fSeatsShare')
                      : form.type === 'request'
                      ? t('board.fSeatsReq')
                      : t('board.fSeatsOffer')}
                  </label>
                  <div className="relative flex items-center bg-paper-surface-muted dark:bg-slate-800 border border-border-subtle dark:border-slate-700 focus-within:border-navy-deep dark:focus-within:border-blue-400">
                    <input
                      id="post-seats"
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={form.seats}
                      onChange={(e) => set({ seats: e.target.value })}
                      placeholder="9"
                      className="w-full h-11 px-3.5 bg-transparent text-ink-primary dark:text-white text-sm focus:outline-none"
                    />
                    <span className="pr-3.5 font-label-md text-xs sm:text-sm text-ink-secondary dark:text-slate-400 pointer-events-none">
                      {t('board.unitSeats')}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="post-price" className="block font-label-badge text-xs text-ink-secondary dark:text-slate-400 uppercase tracking-wider">
                      {form.type === 'share'
                        ? t('board.fPriceShare')
                        : form.type === 'request'
                        ? t('board.fPriceReq')
                        : t('board.fPriceOffer')}
                    </label>
                    {form.type === 'request' && (
                      <label className="inline-flex items-center gap-1.5 text-xs text-blue-action dark:text-blue-400 font-semibold cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={form.isNegotiable}
                          onChange={(e) => set({ isNegotiable: e.target.checked, price: e.target.checked ? '' : form.price })}
                          className="rounded-none text-blue-action focus:ring-blue-action"
                        />
                        <span className="font-caption font-bold text-amber-deep">{t('board.negotiable')}</span>
                      </label>
                    )}
                  </div>
                  <div className="relative flex items-center bg-paper-surface-muted dark:bg-slate-800 border border-border-subtle dark:border-slate-700 focus-within:border-navy-deep dark:focus-within:border-blue-400">
                    <span className="pl-3.5 font-headline-md text-base text-ink-secondary dark:text-slate-400 pointer-events-none font-bold">฿</span>
                    <input
                      id="post-price"
                      type={form.isNegotiable ? 'text' : 'number'}
                      min={500}
                      step={100}
                      disabled={form.isNegotiable}
                      required={!form.isNegotiable}
                      value={form.isNegotiable ? t('board.negotiableShort') : form.price}
                      onChange={(e) => set({ price: e.target.value })}
                      placeholder={form.isNegotiable ? t('board.priceOpenPh') : '4500'}
                      className={`w-full h-11 pl-2 pr-3.5 bg-transparent font-headline-md text-base sm:text-lg font-extrabold focus:outline-none tabular-nums transition-all ${
                        form.isNegotiable
                          ? 'opacity-60 italic text-amber-deep cursor-not-allowed'
                          : 'text-ink-primary dark:text-white'
                      }`}
                    />
                    <span className="pr-3.5 font-caption text-xs text-ink-secondary dark:text-slate-400 uppercase">
                      {form.isNegotiable ? 'OPEN' : 'THB NET'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Fair Price Guide Banner */}
              <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-950 dark:text-blue-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
                  <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                  <span>{t('board.fairPrice')}</span>
                  <span className="font-extrabold">
                    {(() => {
                      const zc = ZONE_RATE_CARDS.find((z) => z.id === form.zoneId);
                      return t('board.zoneRate', {
                        zone: zc?.shortLabel || t('board.zoneAny'),
                        min: zc?.baseRateRange[0].toLocaleString() ?? '',
                        max: zc?.baseRateRange[1].toLocaleString() ?? '',
                      });
                    })()}
                  </span>
                </div>
                <div className="text-ink-secondary dark:text-slate-300 text-[11px] leading-relaxed flex items-start gap-1">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600 mt-0.5 shrink-0">verified_user</span>
                  <span>{t('board.privacyNote')}</span>
                </div>
              </div>

              {/* Field 7: หมายเหตุราคา */}
              <div className="space-y-1.5">
                <label htmlFor="post-price-note" className="flex items-center justify-between font-label-badge text-xs text-ink-secondary dark:text-slate-400 uppercase tracking-wider">
                  <span>{t('board.fPriceNote')}</span>
                  <span className="font-caption normal-case text-ink-muted dark:text-slate-500">
                    ความโปร่งใสช่วยให้คนขับรับงานไวขึ้น
                  </span>
                </label>
                <input
                  id="post-price-note"
                  type="text"
                  value={form.priceNote}
                  onChange={(e) => set({ priceNote: e.target.value })}
                  placeholder={t('board.fPriceNotePh')}
                  className="w-full h-11 px-3.5 bg-paper-surface-muted dark:bg-slate-800 text-ink-primary dark:text-white border border-border-subtle dark:border-slate-700 text-sm focus:outline-none focus:border-navy-deep dark:focus:border-blue-400 transition-all"
                />
              </div>

              {/* Field 8: รายละเอียดทริป */}
              <div className="space-y-1.5">
                <label htmlFor="post-detail" className="flex items-center justify-between font-label-badge text-xs text-ink-secondary dark:text-slate-400 uppercase tracking-wider">
                  <span>{t('board.fDetail')}</span>
                  <span className="font-caption normal-case text-ink-secondary dark:text-slate-400 font-medium">
                    แนะนำให้ระบุจุดรับ-ส่ง
                  </span>
                </label>
                <textarea
                  id="post-detail"
                  rows={3}
                  value={form.detail}
                  onChange={(e) => set({ detail: e.target.value })}
                  placeholder={t('board.fDetailPh')}
                  className="w-full p-3.5 bg-paper-surface-muted dark:bg-slate-800 text-ink-primary dark:text-white border border-border-subtle dark:border-slate-700 text-sm focus:outline-none focus:border-navy-deep dark:focus:border-blue-400 resize-none leading-relaxed transition-all"
                />
              </div>

              {/* Field 9 & 10: ข้อมูลผู้ติดต่อสำหรับคนขับ */}
              <div className="p-4 bg-paper-surface-muted/70 dark:bg-slate-800/60 border border-border-subtle dark:border-slate-700/60 space-y-3.5">
                <div className="flex items-center gap-2 pb-0.5">
                  <span className="material-symbols-outlined text-navy-deep dark:text-blue-400 text-xl">contact_phone</span>
                  <h4 className="font-title-lg text-sm sm:text-base text-navy-deep dark:text-white font-bold tracking-tight">
                    {t('board.fContactHeader')}
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="post-author-name" className="block font-label-badge text-xs text-ink-secondary dark:text-slate-400 uppercase tracking-wider">
                      {t('board.fName')}
                    </label>
                    <input
                       id="post-author-name"
                       type="text"
                       required
                       value={form.authorName}
                       onChange={(e) => set({ authorName: e.target.value })}
                       placeholder={t('board.fNamePh')}
                      className="w-full h-11 px-3.5 bg-paper-elevated dark:bg-slate-900 text-ink-primary dark:text-white border border-border-subtle dark:border-slate-700 text-sm focus:outline-none focus:border-navy-deep dark:focus:border-blue-400 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="post-author-phone" className="block font-label-badge text-xs text-ink-secondary dark:text-slate-400 uppercase tracking-wider">
                      {t('board.fPhone')}
                    </label>
                    <input
                      id="post-author-phone"
                      type="tel"
                      required
                      value={form.authorPhone}
                      onChange={(e) => set({ authorPhone: e.target.value })}
                      placeholder="08x-xxx-xxxx"
                      className="w-full h-11 px-3.5 bg-paper-elevated dark:bg-slate-900 text-ink-primary dark:text-white border border-border-subtle dark:border-slate-700 text-sm font-semibold focus:outline-none focus:border-navy-deep dark:focus:border-blue-400 tabular-nums transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Section: นักท่องเที่ยวต่างชาติ WhatsApp / WeChat / KakaoTalk Card */}
              <div className="p-4 bg-paper-surface-muted/40 dark:bg-slate-800/40 border border-border-subtle dark:border-slate-700/60 space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-700 flex items-center justify-center shrink-0 text-amber-deep">
                    <span className="material-symbols-outlined text-lg">public</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-label-md text-xs sm:text-sm text-navy-deep dark:text-white font-bold">
                        {t('board.intlCardTitle')}
                      </h4>
                      <span className="px-1.5 py-0.2 bg-line-green-soft text-line-green font-label-sm text-[10px] font-bold border border-line-green/30">
                        {t('board.recommended')}
                      </span>
                    </div>
                    <p className="font-caption text-xs text-ink-secondary dark:text-slate-400">
                      {t('board.intlContactDesc')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* WhatsApp */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-label-badge text-xs text-ink-secondary dark:text-slate-400 uppercase tracking-wider font-bold">
                        WHATSAPP
                      </span>
                      {form.authorPhone && form.authorWhatsApp !== form.authorPhone && (
                        <button
                          type="button"
                          onClick={() => {
                            const raw = form.authorPhone.replace(/[^0-9]/g, '');
                            const wa = raw.startsWith('0') ? `+66${raw.substring(1)}` : raw.startsWith('+') ? raw : `+66${raw}`;
                            set({ authorWhatsApp: wa });
                          }}
                          className="font-caption text-xs text-blue-action hover:underline font-bold"
                        >
                          {t('board.sameAsPhone')}
                        </button>
                      )}
                    </div>
                    <div className="relative flex items-center bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-700 focus-within:border-navy-deep dark:focus-within:border-blue-400">
                      <input
                        id="post-author-whatsapp"
                        type="tel"
                        value={form.authorWhatsApp}
                        onChange={(e) => set({ authorWhatsApp: e.target.value })}
                        placeholder={t('board.fWhatsAppPh')}
                        className="w-full h-11 px-3.5 bg-transparent text-ink-primary dark:text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* LINE ID */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-label-badge text-xs text-ink-secondary dark:text-slate-400 uppercase tracking-wider font-bold">
                        LINE ID
                      </span>
                      <span className="font-caption text-[11px] text-ink-muted dark:text-slate-500">ยอดนิยมในไทย</span>
                    </div>
                    <div className="relative bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-700 focus-within:border-navy-deep dark:focus-within:border-blue-400">
                      <input
                        id="post-author-line"
                        type="text"
                        value={form.authorLine}
                        onChange={(e) => set({ authorLine: e.target.value })}
                        placeholder={t('board.fLinePh')}
                        className="w-full h-11 px-3.5 bg-transparent text-ink-primary dark:text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* WeChat ID */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-label-badge text-xs text-ink-secondary dark:text-slate-400 uppercase tracking-wider font-bold">
                        WECHAT ID
                      </span>
                      <span className="font-caption text-[11px] text-ink-muted dark:text-slate-500">สำหรับนักท่องเที่ยวจีน</span>
                    </div>
                    <div className="relative bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-700 focus-within:border-navy-deep dark:focus-within:border-blue-400">
                      <input
                        id="post-author-wechat"
                        type="text"
                        value={form.authorWeChat}
                        onChange={(e) => set({ authorWeChat: e.target.value })}
                        placeholder={t('board.fWeChatPh')}
                        className="w-full h-11 px-3.5 bg-transparent text-ink-primary dark:text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* KakaoTalk ID */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-label-badge text-xs text-ink-secondary dark:text-slate-400 uppercase tracking-wider font-bold">
                        KAKAOTALK ID
                      </span>
                      <span className="font-caption text-[11px] text-ink-muted dark:text-slate-500">สำหรับนักท่องเที่ยวเกาหลี</span>
                    </div>
                    <div className="relative bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-700 focus-within:border-navy-deep dark:focus-within:border-blue-400">
                      <input
                        id="post-author-kakaotalk"
                        type="text"
                        value={form.authorKakaoTalk}
                        onChange={(e) => set({ authorKakaoTalk: e.target.value })}
                        placeholder={t('board.fKakaoTalkPh')}
                        className="w-full h-11 px-3.5 bg-transparent text-ink-primary dark:text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Field 11: PIN 4 Digits for Self-Service Cancellation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="post-pin" className="block font-label-badge text-xs text-ink-secondary dark:text-slate-400 uppercase tracking-wider">
                    {t('board.fPin')}
                  </label>
                  <input
                    id="post-pin"
                    type="password"
                    maxLength={4}
                    value={form.pin}
                    onChange={(e) => set({ pin: e.target.value })}
                    placeholder="1234"
                    className="w-full h-11 px-3.5 bg-paper-surface-muted dark:bg-slate-800 text-ink-primary dark:text-white border border-border-subtle dark:border-slate-700 text-sm focus:outline-none focus:border-navy-deep dark:focus:border-blue-400"
                  />
                </div>
                <div className="flex items-center text-xs text-ink-muted dark:text-slate-400 pt-1 sm:pt-6">
                  <span>* {t('board.closeDesc')}</span>
                </div>
              </div>

              {/* Dispatch Stats / Trust Proof Bar */}
              <div className="grid grid-cols-3 gap-2 py-3 px-4 bg-paper-surface-muted/60 dark:bg-slate-800/60 border border-border-subtle dark:border-slate-700 text-center">
                <div>
                  <div className="font-headline-md text-base sm:text-lg font-extrabold text-navy-deep dark:text-white tabular-nums">
                    {t('board.statAvgQuote')}
                  </div>
                  <div className="font-caption text-[11px] text-ink-secondary dark:text-slate-400">
                    {t('board.statAvgQuoteDesc')}
                  </div>
                </div>
                <div className="border-l border-r border-border-subtle dark:border-slate-700">
                  <div className="font-headline-md text-base sm:text-lg font-extrabold text-line-green tabular-nums">
                    {t('board.statZeroCut')}
                  </div>
                  <div className="font-caption text-[11px] text-ink-secondary dark:text-slate-400">
                    {t('board.statZeroCutDesc')}
                  </div>
                </div>
                <div>
                  <div className="font-headline-md text-base sm:text-lg font-extrabold text-navy-deep dark:text-white tabular-nums">
                    {t('board.statDriverCount')}
                  </div>
                  <div className="font-caption text-[11px] text-ink-secondary dark:text-slate-400">
                    {t('board.statDriverCountDesc')}
                  </div>
                </div>
              </div>
              </div>

              {/* Modal Bottom Actions & Compliance Strip (Pinned at Bottom) */}
              <div className="shrink-0 p-3.5 sm:p-4 border-t border-border-subtle dark:border-slate-800 bg-surface-card dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-ink-secondary dark:text-slate-400">
                  <span className="material-symbols-outlined text-lg text-line-green">verified_user</span>
                  <span className="font-caption text-xs">{t('board.pdpaSafe')}</span>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="w-full sm:w-auto px-6 py-2.5 font-label-md text-sm text-ink-secondary dark:text-slate-400 hover:text-ink-primary hover:bg-paper-surface-muted dark:hover:bg-slate-800 transition-colors border border-border-subtle dark:border-slate-700 cursor-pointer"
                  >
                    {t('board.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-2.5 font-label-md text-sm bg-navy-deep hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-all flex items-center justify-center gap-2 shadow-sm font-bold group cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t('board.submitting')}</span>
                      </>
                    ) : (
                      <>
                        <span>{t('board.submit')}</span>
                        <span className="px-1.5 py-0.5 bg-amber-soft text-amber-deep text-[11px] font-extrabold">
                          {t('board.freeTag')}
                        </span>
                        <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 7. PIN Close Post Dialog */}
      {closingPost && renderPortal(
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-navy-deep/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-paper-elevated dark:bg-slate-900 rounded-none max-w-sm w-full p-space-lg shadow-2xl border border-border-subtle dark:border-slate-800 space-y-space-sm text-center">
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
      {quoteDriverPost && renderPortal(
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-navy-deep/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-paper-elevated dark:bg-slate-900 rounded-none max-w-lg w-full max-h-[90vh] overflow-y-auto p-space-lg shadow-2xl border border-border-subtle dark:border-slate-800 space-y-space-md">
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

              <div className="grid grid-cols-2 gap-space-sm">
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

                <div>
                  <label className="block font-label-badge text-label-badge text-ink-muted dark:text-slate-400 uppercase tracking-wider mb-1">
                    {t('board.qWhatsApp')}
                  </label>
                  <input
                    type="tel"
                    value={driverQuoteForm.driverWhatsApp}
                    onChange={(e) => setDriverQuoteForm((prev) => ({ ...prev, driverWhatsApp: e.target.value }))}
                    placeholder={t('board.phonePh')}
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
      {viewQuotesPost && renderPortal(
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-navy-deep/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-paper-elevated dark:bg-slate-900 rounded-none max-w-2xl w-full max-h-[90vh] overflow-y-auto p-space-lg shadow-2xl border border-border-subtle dark:border-slate-800 space-y-space-md">
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
                {/* Magic Link / Ownership Banner */}
                {customerQuotesToken && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
                      <span className="material-symbols-outlined text-blue-600 text-[18px]">link</span>
                      <span>{t('board.magicBannerHint')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const link = buildMagicLink(viewQuotesPost.id, customerQuotesToken);
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(link);
                        }
                        setCopiedMagicLink(true);
                        setTimeout(() => setCopiedMagicLink(false), 2000);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-1 shrink-0 transition-all shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {copiedMagicLink ? 'check' : 'content_copy'}
                      </span>
                      <span>{copiedMagicLink ? t('board.copiedMagicLink') : t('board.copyMagicLink')}</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-ink-muted dark:text-slate-400 px-1">
                  <span>{t('board.quotesGot', { n: fetchedQuotes?.length || 0, m: 3 })}</span>
                  <div className="flex items-center gap-2">
                    {isQuotesUnlockedWithToken && (
                      <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">key</span>
                        {t('board.autoUnlockedTip')}
                      </span>
                    )}
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">shield</span>
                      {t('board.directOnly')}
                    </span>
                  </div>
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
                          {quote.driverWhatsApp && (
                            <a
                              href={formatWhatsAppLink(quote.driverWhatsApp, `Hello ${quote.driverName}, I saw your quote for my trip on TripDee.`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-lg text-xs font-body-medium flex items-center gap-1 transition-all"
                            >
                              <span className="material-symbols-outlined text-[14px]">forum</span>
                              <span>WhatsApp</span>
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

      {/* 8. POST CREATED / MAGIC LINK SUCCESS MODAL */}
      {createdMagicLinkPost && renderPortal(
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-navy-deep/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-paper-elevated dark:bg-slate-900 rounded-none max-w-md w-full p-6 shadow-2xl border border-border-subtle dark:border-slate-800 space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-navy-deep dark:text-white font-bold">
                {t('board.magicLinkTitle')}
              </h3>
              <p className="text-body-subtext text-ink-secondary dark:text-slate-300 mt-1">
                {t('board.magicLinkDesc')}
              </p>
            </div>

            <div className="p-3 bg-paper-surface-muted dark:bg-slate-800 rounded-xl border border-border-subtle dark:border-slate-700 flex items-center justify-between gap-2">
              <div className="text-left font-mono text-xs text-ink-primary dark:text-slate-200 truncate flex-1">
                {createdMagicLinkPost.link}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(createdMagicLinkPost.link);
                  }
                  setCopiedMagicLink(true);
                  setTimeout(() => setCopiedMagicLink(false), 2000);
                }}
                className="px-3 py-1.5 bg-blue-action hover:bg-blue-action-hover text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copiedMagicLink ? 'check' : 'content_copy'}
                </span>
                <span>{copiedMagicLink ? t('board.copiedMagicLink') : t('board.copyMagicLink')}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const foundPost = posts.find((p) => p.id === createdMagicLinkPost.id);
                  const token = createdMagicLinkPost.token;
                  setCreatedMagicLinkPost(null);
                  if (foundPost) {
                    handleOpenCustomerQuotes(foundPost, token);
                  }
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1 shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                <span>{t('board.viewMyQuotesBtn')}</span>
              </button>
              <button
                type="button"
                onClick={() => setCreatedMagicLinkPost(null)}
                className="px-4 py-2.5 bg-paper-surface hover:bg-paper-surface-muted text-ink-secondary dark:text-slate-300 rounded-xl font-medium text-sm border border-border-subtle dark:border-slate-700 transition-all"
              >
                {t('auth.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
