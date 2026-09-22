'use client';

import React from 'react';
import type { Vehicle } from '@/data/mockData';

interface MobileBottomBarProps {
  activeVehicle?: Vehicle | null;
  onOpenDetail?: (vehicle: Vehicle) => void;
}

/**
 * MobileBottomBar is disabled and hidden from mobile views.
 */
export const MobileBottomBar: React.FC<MobileBottomBarProps> = () => {
  return null;
};
