'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface AdminAlertProps {
  message: string;
  onDismiss?: () => void;
}

/** Inline, dismissible error banner shown at the top of admin tabs. */
export const AdminAlert: React.FC<AdminAlertProps> = ({ message, onDismiss }) => {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-none border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="ปิดข้อความแจ้งเตือน"
          className="p-0.5 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
