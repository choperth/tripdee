'use client';

import React, { useState, useRef } from 'react';
import { X, Star, Check, CheckCircle2, User, Phone, Calendar, MapPin, MessageSquare, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { Vehicle } from '@/data/mockData';
import { vehicleTitle, vehicleLocation } from '@/data/vehicleI18n';
import { getPublicDriverName } from '@/lib/privacy';
import {
  Review,
  POPULAR_REVIEW_TAGS,
  submitVehicleReview,
  NewReviewInput,
} from '@/lib/reviewsStore';

interface WriteReviewModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted?: (newReview: Review) => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  onReviewSubmitted,
}) => {
  const { t, locale } = useLanguage();
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, { onClose, enabled: isOpen });

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [authorName, setAuthorName] = useState<string>('');
  const [authorPhone, setAuthorPhone] = useState<string>('');
  const [travelDate, setTravelDate] = useState<string>('');
  const [tripRoute, setTripRoute] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  // No tags pre-selected: let the reviewer choose what actually applied.
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const publicName = getPublicDriverName(vehicle.driverName, vehicle.driverNickname);

  const getRatingLabel = (score: number) => {
    switch (score) {
      case 5:
        return t('review.rate5');
      case 4:
        return t('review.rate4');
      case 3:
        return t('review.rate3');
      case 2:
        return t('review.rate2');
      case 1:
        return t('review.rate1');
      default:
        return '';
    }
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = authorName.trim();
    const cleanComment = comment.trim();

    if (!cleanName) {
      setErrorMessage(t('review.nameLabel') + t('review.required'));
      return;
    }

    if (!cleanComment || cleanComment.length < 10) {
      setErrorMessage(t('review.errMinLength'));
      return;
    }

    setIsSubmitting(true);

    const input: NewReviewInput = {
      vehicleId: vehicle.id,
      authorName: cleanName,
      authorPhone: authorPhone.trim() || undefined,
      rating,
      travelDate: travelDate.trim() || t('review.dSoon'),
      tripRoute: tripRoute.trim() || t('review.dGeneral'),
      comment: cleanComment,
      tags: selectedTags,
    };

    const result = await submitVehicleReview(input);
    setIsSubmitting(false);

    if (!result.success || !result.review) {
      setErrorMessage(result.error || t('review.errSave'));
      return;
    }

    setIsSubmitted(true);
    onReviewSubmitted?.(result.review);
  };

  return (
    <div
      className="fixed inset-0 z-500 flex items-center justify-center overflow-y-auto bg-navy-deep/80 backdrop-blur-sm p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('review.modalTitle')}
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl text-ink-primary dark:text-slate-100 p-space-md sm:p-space-lg"
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-4 pb-space-sm border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-200 font-label-badge text-label-badge font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('review.modalEyebrow')}</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-navy-deep dark:text-white">
              {t('review.modalTitle')}
            </h2>
            <p className="font-body-subtext text-body-subtext text-ink-muted dark:text-slate-400 mt-0.5">
              {t('review.modalSubtitle')}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('review.closeBtn')}
            className="w-8 h-8 rounded-none border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Driver Mini Pill */}
        <div className="my-space-sm p-space-xs px-space-sm rounded-none bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <div className="w-8 h-8 rounded-none bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
              {publicName.charAt(0)}
            </div>
            <div className="truncate">
              <span className="font-bold text-navy-deep dark:text-white text-xs block truncate">
                {publicName}
              </span>
              <span className="text-[11px] text-ink-muted dark:text-slate-400 truncate block">
                {vehicleTitle(vehicle, locale)} • {vehicleLocation(vehicle, locale)}
              </span>
            </div>
          </div>
          <span className="shrink-0 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-none border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>TripDee Verified</span>
          </span>
        </div>

        {isSubmitted ? (
          /* Success Screen */
          <div className="py-space-xl text-center space-y-space-md animate-fade-in">
            <div className="w-14 h-14 rounded-none bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-headline-lg text-headline-lg text-navy-deep dark:text-white">
                {t('review.successTitle')}
              </h3>
              <p className="font-body-base text-body-base text-ink-secondary dark:text-slate-300 max-w-md mx-auto">
                {t('review.successDesc')}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-space-xl py-2.5 rounded-none bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold uppercase text-xs tracking-wider shadow-md transition-all cursor-pointer"
              >
                {t('review.closeBtn')}
              </button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="space-y-space-md pt-space-xs">
            {/* 1. Star Rating Picker */}
            <div className="space-y-1.5 p-space-sm bg-slate-50 dark:bg-slate-800/50 rounded-none border border-slate-200 dark:border-slate-800 text-center">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {t('review.ratingLabel')}
              </label>

              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none focus:ring-1 focus:ring-slate-900 rounded-none cursor-pointer"
                      aria-label={`${star}★`}
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          isActive
                            ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                            : 'text-border-subtle dark:text-slate-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="h-5 flex items-center justify-center">
                <span className="font-body-subtext font-bold text-amber-600 dark:text-amber-300 animate-fade-in">
                  {getRatingLabel(hoverRating || rating)}
                </span>
              </div>
            </div>

            {/* 2. Author Name & Travel Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
              <div className="space-y-1">
                <label
                  htmlFor="review-author"
                  className="block text-body-subtext font-bold text-navy-deep dark:text-white"
                >
                  {t('review.nameLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="review-author"
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder={t('review.namePlaceholder')}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-white"
                  />
                </div>
              </div>

              {/* Phone is used server-side to check for a completed booking.
                  It is never rendered publicly and never leaves the server. */}
              <div className="space-y-1">
                <label
                  htmlFor="review-phone"
                  className="block text-body-subtext font-bold text-navy-deep dark:text-white"
                >
                  {t('review.phoneLabel')}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="review-phone"
                    type="tel"
                    inputMode="numeric"
                    value={authorPhone}
                    onChange={(e) =>
                      setAuthorPhone(e.target.value.replace(/[^0-9+\-\s]/g, '').slice(0, 20))
                    }
                    placeholder="08X-XXX-XXXX"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-white"
                  />
                </div>
                <p className="text-[11px] text-ink-muted dark:text-slate-400">
                  {t('review.phoneHint')}
                </p>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="review-date"
                  className="block text-body-subtext font-bold text-navy-deep dark:text-white"
                >
                  {t('review.dateLabel')}
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="review-date"
                    type="text"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    placeholder={t('review.datePlaceholder')}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-white"
                  />
                </div>
              </div>
            </div>

            {/* 3. Travel Route */}
            <div className="space-y-1">
              <label
                htmlFor="review-route"
                className="block text-body-subtext font-bold text-navy-deep dark:text-white"
              >
                {t('review.routeLabel')}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="review-route"
                  type="text"
                  value={tripRoute}
                  onChange={(e) => setTripRoute(e.target.value)}
                  placeholder={t('review.routePlaceholder')}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-white"
                />
              </div>
            </div>

            {/* 4. Highlight Tags Chips Selector */}
            <div className="space-y-1.5">
              <label className="block text-body-subtext font-bold text-navy-deep dark:text-white">
                {t('review.tagsLabel')}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_REVIEW_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`px-2.5 py-1 rounded-none text-xs font-bold transition-all flex items-center gap-1 cursor-pointer uppercase tracking-wider ${
                        isSelected
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border border-slate-900 dark:border-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:border-slate-900 dark:hover:border-slate-400'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Review Comment */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="review-comment"
                  className="block text-body-subtext font-bold text-navy-deep dark:text-white"
                >
                  {t('review.commentLabel')} <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-ink-muted dark:text-slate-400">
                  {comment.length} ตัวอักษร (ขั้นต่ำ 10)
                </span>
              </div>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
                <textarea
                  id="review-comment"
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('review.commentPlaceholder')}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-white leading-relaxed"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-none bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-space-md py-2.5 rounded-none text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t('review.cancelBtn')}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-space-lg py-2.5 rounded-none text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('review.submitting')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t('review.submitBtn')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
