'use client';

import React, { useState, useRef } from 'react';
import { X, Star, Check, CheckCircle2, User, Calendar, MapPin, MessageSquare, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { Vehicle } from '@/data/mockData';
import { getPublicDriverName } from '@/lib/privacy';
import {
  Review,
  POPULAR_REVIEW_TAGS,
  addVehicleReview,
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
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, { onClose, enabled: isOpen });

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [authorName, setAuthorName] = useState<string>('');
  const [travelDate, setTravelDate] = useState<string>('');
  const [tripRoute, setTripRoute] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'ขับนิ่ม ปลอดภัย',
    'ตรงต่อเวลา',
    'รถสะอาด แอร์เย็น',
  ]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = authorName.trim();
    const cleanComment = comment.trim();

    if (!cleanName) {
      setErrorMessage(t('review.nameLabel') + ' (จำเป็นต้องระบุ)');
      return;
    }

    if (!cleanComment || cleanComment.length < 10) {
      setErrorMessage('กรุณาเขียนข้อความรีวิวอย่างน้อย 10 ตัวอักษร');
      return;
    }

    setIsSubmitting(true);

    try {
      const input: NewReviewInput = {
        vehicleId: vehicle.id,
        authorName: cleanName,
        rating,
        travelDate: travelDate.trim() || 'เร็วๆ นี้',
        tripRoute: tripRoute.trim() || vehicle.popularRoutes?.[0] || 'ท่องเที่ยวทั่วไป',
        comment: cleanComment,
        tags: selectedTags,
      };

      const created = addVehicleReview(input);
      setIsSubmitting(false);
      setIsSubmitted(true);

      if (onReviewSubmitted) {
        onReviewSubmitted(created);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setIsSubmitting(false);
      setErrorMessage('เกิดข้อผิดพลาดในการบันทึกรีวิว กรุณาลองใหม่อีกครั้ง');
    }
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
        className="relative flex flex-col w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-800 shadow-2xl text-ink-primary dark:text-slate-100 p-space-md sm:p-space-lg"
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-4 pb-space-sm border-b border-border-subtle dark:border-slate-800">
          <div>
            <div className="flex items-center gap-1.5 text-blue-action dark:text-blue-400 font-label-badge text-label-badge font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('review.verifiedPassenger')}</span>
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
            className="w-8 h-8 rounded-full bg-paper-surface-muted dark:bg-slate-800 flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:bg-surface-variant transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Driver Mini Pill */}
        <div className="my-space-sm p-space-xs px-space-sm rounded-xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200/60 dark:border-slate-700/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <div className="w-8 h-8 rounded-full bg-blue-action text-white font-bold flex items-center justify-center text-xs shrink-0">
              {publicName.charAt(0)}
            </div>
            <div className="truncate">
              <span className="font-bold text-navy-deep dark:text-white text-xs block truncate">
                {publicName}
              </span>
              <span className="text-[11px] text-ink-muted dark:text-slate-400 truncate block">
                {vehicle.title} • {vehicle.location}
              </span>
            </div>
          </div>
          <span className="shrink-0 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/50">
            <CheckCircle2 className="w-3 h-3" />
            <span>TripDee Verified</span>
          </span>
        </div>

        {isSubmitted ? (
          /* Success Screen */
          <div className="py-space-xl text-center space-y-space-md animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
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
                className="px-space-xl py-2.5 rounded-xl bg-navy-deep hover:bg-navy-surface text-white font-body-medium shadow-md transition-all cursor-pointer"
              >
                {t('review.closeBtn')}
              </button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="space-y-space-md pt-space-xs">
            {/* 1. Star Rating Picker */}
            <div className="space-y-1.5 p-space-sm bg-paper-canvas dark:bg-slate-800/50 rounded-2xl border border-border-subtle/70 dark:border-slate-800 text-center">
              <label className="block text-xs font-bold text-ink-secondary dark:text-slate-300 uppercase tracking-wider">
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
                      className="p-1 transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg cursor-pointer"
                      aria-label={`${star} ดาว`}
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
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border-subtle dark:border-slate-700 bg-paper-surface dark:bg-slate-800 text-ink-primary dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-action"
                  />
                </div>
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
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border-subtle dark:border-slate-700 bg-paper-surface dark:bg-slate-800 text-ink-primary dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-action"
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
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border-subtle dark:border-slate-700 bg-paper-surface dark:bg-slate-800 text-ink-primary dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-action"
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
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-action text-white shadow-xs'
                          : 'bg-paper-canvas dark:bg-slate-800 text-ink-secondary dark:text-slate-300 border border-border-subtle dark:border-slate-700 hover:border-blue-action/60'
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
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border-subtle dark:border-slate-700 bg-paper-surface dark:bg-slate-800 text-ink-primary dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-action leading-relaxed"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-space-md py-2 rounded-xl text-sm font-body-medium text-ink-secondary dark:text-slate-300 hover:bg-surface-variant transition-colors cursor-pointer"
              >
                {t('review.cancelBtn')}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-space-lg py-2 rounded-xl text-sm font-body-medium bg-blue-action hover:bg-blue-action-hover text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
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
