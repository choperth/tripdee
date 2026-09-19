'use client';

import React, { useRef } from 'react';
import { useDialogFocus } from '@/hooks/useDialogFocus';
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
  useDialogFocus(dialogRef, { onClose, enabled: isOpen });

  if (!isOpen) return null;
  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-delete-title"
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-rule text-ink relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full bg-paper hover:bg-paper-2 text-ink-2"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 text-berry mb-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-berry/10 text-berry">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h3 id="admin-delete-title" className="font-display font-extrabold text-lg text-ink">{title}</h3>
            <p className="text-xs text-ink-2">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
          </div>
        </div>

        <div className="my-4 rounded-xl bg-paper p-3 border border-rule/70 text-xs">
          <span className="text-ink-2 block font-medium mb-1">รายการที่จะลบ:</span>
          <span className="font-extrabold text-ink text-sm break-words">{itemTitle}</span>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-pill px-4 py-2 text-xs font-bold text-ink-2 hover:bg-paper"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-pill bg-berry px-5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-berry/90 transition-transform active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>{isDeleting ? 'กำลังลบ...' : 'ยืนยันการลบ'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
