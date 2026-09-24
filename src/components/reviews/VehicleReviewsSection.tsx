'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  CheckCircle2,
  Calendar,
  MapPin,
  MessageSquarePlus,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  Filter,
  X,
} from 'lucide-react';
import { Vehicle } from '@/data/mockData';
import { useLanguage } from '@/context/LanguageContext';
import { getPublicDriverName } from '@/lib/privacy';
import {
  Review,
  getVehicleReviews,
  calculateReviewStats,
} from '@/lib/reviewsStore';
import { WriteReviewModal } from './WriteReviewModal';

interface VehicleReviewsSectionProps {
  vehicle: Vehicle;
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
  'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900',
  'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-900',
  'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export const VehicleReviewsSection: React.FC<VehicleReviewsSectionProps> = ({
  vehicle,
}) => {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>(() => getVehicleReviews(vehicle.id, vehicle));
  const [isWriteModalOpen, setIsWriteModalOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // Keep reviews synced when vehicle id changes
  const [prevVehicleId, setPrevVehicleId] = useState(vehicle.id);
  if (vehicle.id !== prevVehicleId) {
    setPrevVehicleId(vehicle.id);
    setReviews(getVehicleReviews(vehicle.id, vehicle));
  }

  useEffect(() => {
    // Listen to custom review added event
    const handleReviewAdded = (e: Event) => {
      const customEvent = e as CustomEvent<{ vehicleId: string; review: Review }>;
      if (customEvent.detail && customEvent.detail.vehicleId === vehicle.id) {
        setReviews((prev) => [customEvent.detail.review, ...prev.filter((r) => r.id !== customEvent.detail.review.id)]);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('td:review-added', handleReviewAdded);
      return () => {
        window.removeEventListener('td:review-added', handleReviewAdded);
      };
    }
  }, [vehicle.id, vehicle]);

  const publicName = getPublicDriverName(vehicle.driverName, vehicle.driverNickname);
  const driverInitial = publicName.charAt(0);

  const stats = useMemo(() => {
    return calculateReviewStats(reviews, vehicle.rating || 4.9, vehicle.reviewCount || 48);
  }, [reviews, vehicle.rating, vehicle.reviewCount]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (selectedStarFilter !== null && Math.round(r.rating) !== selectedStarFilter) {
        return false;
      }
      if (selectedTagFilter !== null && (!r.tags || !r.tags.includes(selectedTagFilter))) {
        return false;
      }
      return true;
    });
  }, [reviews, selectedStarFilter, selectedTagFilter]);

  // Displayed slice
  const displayedReviews = isExpanded ? filteredReviews : filteredReviews.slice(0, 3);
  const hasMore = filteredReviews.length > 3;

  return (
    <section
      id="vehicle-reviews"
      className="bg-paper-canvas dark:bg-slate-800/60 p-space-lg rounded-2xl border border-border-subtle dark:border-slate-700/70 space-y-space-md"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-xs border-b border-border-subtle/70 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            </span>
            <h2 className="font-headline-lg text-headline-lg text-navy-deep dark:text-white">
              {t('review.sectionTitle')}
            </h2>
          </div>
          <p className="font-body-subtext text-body-subtext text-ink-muted dark:text-slate-400 mt-1">
            {t('review.sectionSubtitle', { name: publicName })}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsWriteModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-space-md py-2.5 rounded-xl bg-blue-action hover:bg-blue-action-hover text-white font-title-card text-title-card shadow-sm transition-all active:scale-[0.98] cursor-pointer self-start sm:self-auto shrink-0"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>{t('review.writeBtn')}</span>
        </button>
      </div>

      {/* Ratings & High-Level Breakdown Bento Card */}
      <div className="p-space-md rounded-2xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-800 space-y-space-md">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-center">
          {/* Left: Big Score & Stars */}
          <div className="md:col-span-5 flex flex-col items-center sm:items-start text-center sm:text-left space-y-2 border-b md:border-b-0 md:border-r border-border-subtle/70 dark:border-slate-800 pb-space-sm md:pb-0 md:pr-space-md">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-navy-deep dark:text-white tracking-tight">
                {stats.averageRating.toFixed(1)}
              </span>
              <span className="text-sm font-medium text-ink-muted dark:text-slate-400">
                / 5.0
              </span>
            </div>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(stats.averageRating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-border-subtle dark:text-slate-700'
                  }`}
                />
              ))}
            </div>

            <p className="text-xs text-ink-secondary dark:text-slate-400">
              {t('review.totalReviews', { n: stats.totalReviews })}
            </p>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium text-xs border border-emerald-200/50">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('review.satisfaction', { pct: stats.percentage5 })}</span>
            </span>
          </div>

          {/* Right: Star Bar Breakdown */}
          <div className="md:col-span-7 space-y-1.5">
            {([5, 4, 3, 2, 1] as const).map((score) => {
              const count = stats.breakdown[score] || 0;
              const percent = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
              const isSelected = selectedStarFilter === score;

              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => setSelectedStarFilter(isSelected ? null : score)}
                  className={`w-full flex items-center gap-2 text-xs py-0.5 px-1.5 rounded-lg transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-slate-800 font-bold'
                      : 'hover:bg-paper-surface-muted dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="flex items-center gap-1 w-12 shrink-0 font-medium text-ink-secondary dark:text-slate-300">
                    <span>{score}</span>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </span>

                  <div className="flex-1 h-2 rounded-full bg-paper-surface-muted dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <span className="w-9 text-right font-mono text-ink-muted dark:text-slate-400 text-[11px] shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Highlight Tag Clouds */}
        {stats.topTags.length > 0 && (
          <div className="pt-space-xs border-t border-border-subtle/70 dark:border-slate-800">
            <span className="text-xs font-bold text-navy-deep dark:text-white block mb-2">
              {t('review.highlightTags')}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {stats.topTags.map(({ tag, count }) => {
                const isSelected = selectedTagFilter === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTagFilter(isSelected ? null : tag)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-action text-white shadow-xs font-bold'
                        : 'bg-paper-canvas dark:bg-slate-800 text-ink-secondary dark:text-slate-300 border border-border-subtle/80 dark:border-slate-700 hover:border-blue-action/50'
                    }`}
                  >
                    <span>{tag}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected
                          ? 'bg-white/25 text-white'
                          : 'bg-paper-surface-muted dark:bg-slate-700 text-ink-muted dark:text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Active Filter Bar (if any filter is selected) */}
      {(selectedStarFilter !== null || selectedTagFilter !== null) && (
        <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200/60 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-blue-action shrink-0" />
            <span className="text-ink-secondary dark:text-slate-300">{t('review.filterLabel')}</span>
            {selectedStarFilter !== null && (
              <span className="bg-blue-action text-white px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                <span>{selectedStarFilter} ดาว</span>
                <button
                  type="button"
                  onClick={() => setSelectedStarFilter(null)}
                  className="hover:opacity-80"
                  aria-label={t('review.clearStars')}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedTagFilter !== null && (
              <span className="bg-blue-action text-white px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                <span>{selectedTagFilter}</span>
                <button
                  type="button"
                  onClick={() => setSelectedTagFilter(null)}
                  className="hover:opacity-80"
                  aria-label={t('review.clearTags')}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <span className="text-ink-muted dark:text-slate-400">
              (พบ {filteredReviews.length} รีวิว)
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedStarFilter(null);
              setSelectedTagFilter(null);
            }}
            className="text-blue-action dark:text-blue-400 font-bold hover:underline shrink-0 cursor-pointer"
          >
            ล้างทั้งหมด
          </button>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-space-sm">
        {filteredReviews.length === 0 ? (
          <div className="p-space-xl rounded-2xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-800 text-center space-y-2">
            <p className="text-base font-bold text-navy-deep dark:text-white">
              {selectedStarFilter !== null || selectedTagFilter !== null
                ? t('review.noReviewsMatch')
                : t('review.emptyTitle')}
            </p>
            <p className="text-xs text-ink-muted dark:text-slate-400 max-w-sm mx-auto">
              {t('review.emptySubtitle')}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(true)}
                className="px-space-md py-2 rounded-xl bg-blue-action text-white font-medium text-xs hover:bg-blue-action-hover transition-colors cursor-pointer"
              >
                {t('review.writeBtn')}
              </button>
            </div>
          </div>
        ) : (
          displayedReviews.map((rev) => {
            const avatarColorClass = getAvatarColor(rev.authorName);
            const authorInitial = rev.authorName.replace(/^(คุณ|ดร\.|นาย|นาง|นางสาว|Dr\.)\s*/, '').charAt(0) || rev.authorName.charAt(0);

            return (
              <div
                key={rev.id}
                className="p-space-md rounded-2xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle/80 dark:border-slate-800 space-y-space-xs transition-all hover:shadow-sm"
              >
                {/* Author Info & Rating */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border shadow-2xs shrink-0 ${avatarColorClass}`}
                    >
                      {authorInitial}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-navy-deep dark:text-white">
                          {rev.authorName}
                        </span>
                        {rev.verifiedTrip && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/50">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{t('review.verifiedPassenger')}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-ink-muted dark:text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{rev.travelDate}</span>
                        </span>
                        {rev.tripRoute && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-ink-secondary dark:text-slate-300 truncate max-w-[240px] sm:max-w-[320px]">
                              <MapPin className="w-3 h-3 text-blue-action shrink-0" />
                              <span className="truncate">{rev.tripRoute}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-0.5 self-start sm:self-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(rev.rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-border-subtle dark:text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Highlight Tags (if any) */}
                {rev.tags && rev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rev.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-paper-canvas dark:bg-slate-800 text-[11px] font-medium text-ink-secondary dark:text-slate-300 border border-border-subtle/70 dark:border-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Comment Text */}
                <p className="font-body-base text-sm text-ink-primary dark:text-slate-200 leading-relaxed pt-1">
                  &ldquo;{rev.comment}&rdquo;
                </p>

                {/* Driver's Reply Box (if present) */}
                {rev.driverReply && (
                  <div className="mt-2 p-space-sm rounded-xl bg-blue-50/60 dark:bg-slate-800/80 border border-blue-200/60 dark:border-slate-700/80 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-navy-deep dark:text-white">
                        <CornerDownRight className="w-3.5 h-3.5 text-blue-action shrink-0" />
                        <div className="w-5 h-5 rounded-full bg-blue-action text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {driverInitial}
                        </div>
                        <span>
                          {t('review.driverReplyTitle')} ({publicName})
                        </span>
                      </div>
                      <span className="text-[11px] text-ink-muted dark:text-slate-400">
                        {rev.driverReply.date}
                      </span>
                    </div>
                    <p className="text-xs text-ink-secondary dark:text-slate-300 pl-5 leading-relaxed">
                      {rev.driverReply.comment}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Show More / Show Less Toggle Button */}
      {hasMore && (
        <div className="text-center pt-space-xs">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 px-space-lg py-2 rounded-xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-700 text-navy-deep dark:text-white font-body-medium text-xs hover:bg-surface-variant transition-colors cursor-pointer shadow-2xs"
          >
            {isExpanded ? (
              <>
                <span>{t('review.showLess')}</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>{t('review.showAll', { n: filteredReviews.length })}</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Write Review Modal */}
      <WriteReviewModal
        vehicle={vehicle}
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        onReviewSubmitted={(newRev) => {
          setReviews((prev) => [newRev, ...prev]);
          setIsExpanded(true);
        }}
      />
    </section>
  );
};
