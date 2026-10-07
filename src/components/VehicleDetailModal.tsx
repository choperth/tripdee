'use client';

import React, { useRef } from 'react';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { Vehicle, Sponsor } from '@/data/mockData';
import { vehicleTitle } from '@/data/vehicleI18n';
import { useLanguage } from '@/context/LanguageContext';
import { VehicleDetailView } from '@/components/vehicle/VehicleDetailView';

export interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  allVehicles?: Vehicle[];
  sponsors?: Sponsor[];
  onSelectVehicle?: (vehicle: Vehicle) => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  onClose,
  allVehicles,
  sponsors = [],
  onSelectVehicle,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, { onClose, enabled: !!vehicle });
  const { locale } = useLanguage();

  if (!vehicle) return null;

  const title = vehicleTitle(vehicle, locale);

  return (
    <div
      className="fixed inset-0 z-400 flex items-center justify-center overflow-y-auto bg-navy-deep/75 backdrop-blur-sm p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl bg-paper-elevated dark:bg-slate-900 border border-border-subtle dark:border-slate-800 shadow-2xl text-ink-primary dark:text-slate-100"
      >
        <VehicleDetailView
          vehicle={vehicle}
          allVehicles={allVehicles}
          sponsors={sponsors}
          isModal={true}
          onClose={onClose}
          onSelectVehicle={(v) => {
            if (onSelectVehicle) onSelectVehicle(v);
            dialogRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    </div>
  );
};

export default VehicleDetailModal;
