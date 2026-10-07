'use client';

import React, { useRef } from 'react';
import { Vehicle } from '@/data/mockData';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { DriverBusinessCardView } from './DriverBusinessCardView';

export interface DriverSmartECardModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
}

export const DriverSmartECardModal: React.FC<DriverSmartECardModalProps> = ({
  vehicle,
  isOpen,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, { onClose, enabled: isOpen });

  if (!isOpen || !vehicle) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="นามบัตรดิจิทัลคนขับ (Digital Driver Business Card)"
      className="fixed inset-0 z-500 flex items-start justify-center overflow-y-auto bg-slate-950/80 backdrop-blur-md p-0 sm:p-3 lg:p-5 animate-fade-in"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[1280px]">
        <DriverBusinessCardView vehicle={vehicle} isModal={true} onClose={onClose} />
      </div>
    </div>
  );
};
