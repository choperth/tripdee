'use client';

import React, { useRef } from 'react';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { DriverPortalContent } from './driver/DriverPortalContent';

export interface DriverPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'perks' | 'jobs' | 'reviews';
  /** Opens the free vehicle registration flow from inside the sign-in gate. */
  onOpenRegister?: () => void;
  /** Lands directly in "add a new fleet vehicle" mode. */
  initialAddVehicle?: boolean;
}

export const DriverPortalModal: React.FC<DriverPortalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile',
  onOpenRegister,
  initialAddVehicle = false,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, { onClose, enabled: isOpen });

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="driver-dashboard-title"
      className="fixed inset-0 z-400 flex items-start justify-center overflow-y-auto bg-slate-950/75 backdrop-blur-sm p-2 sm:p-4 lg:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-7xl max-h-[96vh] overflow-y-auto rounded-none bg-[#F8FAFC] dark:bg-slate-950 border border-slate-300 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-slate-100"
      >
        <DriverPortalContent
          isModal={true}
          onClose={onClose}
          initialTab={initialTab}
          onOpenRegister={onOpenRegister}
          initialAddVehicle={initialAddVehicle}
        />
      </div>
    </div>
  );
};

export default DriverPortalModal;
