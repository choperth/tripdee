'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, Loader2, X, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface DangerZoneProps {
  title?: string;
  description?: string;
  buttonLabel?: string;
  targetName?: string; // e.g. "รถ Toyota Commuter (30-1234)" or "บริษัท สยาม อินโนเวชั่น จำกัด"
  confirmWord?: string; // default "ลบข้อมูล"
  onDelete: () => Promise<void> | void;
  className?: string;
}

export const DangerZone: React.FC<DangerZoneProps> = ({
  title,
  description,
  buttonLabel,
  targetName,
  confirmWord,
  onDelete,
  className = '',
}) => {
  const { t, locale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmedCheck, setConfirmedCheck] = useState(false);
  const [typedWord, setTypedWord] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const requiredWord = confirmWord || (locale === 'th' ? 'ลบข้อมูล' : locale === 'zh' ? '删除数据' : 'DELETE');
  const isMatch = typedWord.trim().toLowerCase() === requiredWord.toLowerCase();
  const canProceed = confirmedCheck && isMatch;

  const handleOpen = () => {
    setConfirmedCheck(false);
    setTypedWord('');
    setErrorMsg('');
    setIsOpen(true);
  };

  const handleConfirm = async () => {
    if (!canProceed || isDeleting) return;
    setIsDeleting(true);
    setErrorMsg('');

    try {
      await onDelete();
      setIsOpen(false);
    } catch (err) {
      setErrorMsg((err as Error).message || t('danger.deleteErrorFallback'));
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Danger Zone Container */}
      <div
        className={`rounded-none border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 p-4 sm:p-5 text-left space-y-3 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-none border border-rose-300 dark:border-rose-800 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm sm:text-base text-rose-900 dark:text-rose-200 font-bold">
                {title || t('danger.title')}
              </h4>
              <span className="px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                PDPA / Privacy
              </span>
            </div>
            <p className="text-xs text-rose-700/90 dark:text-rose-300/80 leading-relaxed">
              {description || t('danger.defaultDesc')}
            </p>
          </div>
        </div>

        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={handleOpen}
            className="px-4 py-2 rounded-none bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{buttonLabel || t('danger.deleteBtn')}</span>
          </button>
        </div>
      </div>
      {/* Double Confirmation Modal (2-Step Verification) */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="danger-modal-title"
          className="fixed inset-0 z-500 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => !isDeleting && setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-6 sm:p-7 shadow-2xl space-y-5 text-left text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150"
          >
            {/* Close Button */}
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-none bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 id="danger-modal-title" className="font-headline-md text-headline-md text-rose-600 dark:text-rose-400 font-extrabold leading-snug">
                  {t('danger.modalTitle')}
                </h3>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {t('danger.modalSubtitle')}
                </span>
              </div>
            </div>

            {/* Target name if specified */}
            {targetName && (
              <div className="p-3 rounded-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-navy-deep dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-none bg-rose-500" />
                <span>{t('danger.targetLabel')} <strong className="text-rose-600 dark:text-rose-400">{targetName}</strong></span>
              </div>
            )}

            {/* Warning Callout */}
            <div className="p-3.5 rounded-none bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300 leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-900 dark:text-rose-200 uppercase tracking-wider text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{t('danger.warningHeader')}</span>
              </div>
              <p>{t('danger.warningBody')}</p>
            </div>

            {/* Step 1: Checkbox confirmation */}
            <label className="flex items-start gap-3 p-3 rounded-none border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 cursor-pointer hover:border-rose-400 transition-colors">
              <input
                type="checkbox"
                checked={confirmedCheck}
                disabled={isDeleting}
                onChange={(e) => setConfirmedCheck(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded-none text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                {t('danger.checkConfirm')}
              </span>
            </label>

            {/* Step 2: Typing verification */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('danger.typeToConfirm', { word: requiredWord })}
              </label>
              <input
                type="text"
                disabled={isDeleting}
                value={typedWord}
                onChange={(e) => setTypedWord(e.target.value)}
                placeholder={requiredWord}
                className="w-full h-11 px-3 bg-white dark:bg-slate-800 rounded-none border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-none bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsOpen(false)}
                className="px-4 py-2.5 rounded-none border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t('danger.cancelBtn')}
              </button>

              <button
                type="button"
                disabled={!canProceed || isDeleting}
                onClick={handleConfirm}
                className="px-5 py-2.5 rounded-none bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('danger.deleting')}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{t('danger.executeBtn')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
