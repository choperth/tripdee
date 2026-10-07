'use client';

import React, { useRef } from 'react';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { useLanguage } from '@/context/LanguageContext';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface AdminDeleteModalProps {
  isOpen: boolean;
  title: string;
  itemTitle: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  isDeleting?: boolean;
}

export const AdminDeleteModal: React.FC<AdminDeleteModalProps> = ({
  isOpen,
  title,
  itemTitle,
  onConfirm,
  onClose,
  isDeleting,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  useDialogFocus(dialogRef, { onClose, enabled: isOpen });

  if (!isOpen) return null;
  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-delete-title"
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-none bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-4">
          <span className="grid h-10 w-10 place-items-center rounded-none bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h3 id="admin-delete-title" className="font-display font-extrabold text-lg text-slate-900 dark:text-white">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('padm.warnIrreversible')}</p>
          </div>
        </div>

        <div className="my-4 rounded-none bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-200 dark:border-slate-700 text-xs">
          <span className="text-slate-500 dark:text-slate-400 block font-bold mb-1 uppercase tracking-wider text-[10px]">{t('padm.itemToDelete')}</span>
          <span className="font-extrabold text-slate-900 dark:text-white text-sm break-words">{itemTitle}</span>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-none border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {t('padm.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-none bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>{isDeleting ? t('padm.deleting') : t('padm.confirmDelete')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
