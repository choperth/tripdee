'use client';

import React, { useRef } from 'react';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { AdminConsoleContent } from './admin/AdminConsoleContent';

export interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, { onClose, enabled: isOpen });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-portal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-200"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full h-full md:h-[94vh] max-w-[1500px] bg-[#f8fafc] dark:bg-slate-950 shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        <AdminConsoleContent isModal={true} onClose={onClose} />
      </div>
    </div>
  );
};

export default AdminPortalModal;
