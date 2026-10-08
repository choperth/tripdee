/**
 * TripDee Saved Favorites Store
 * Tracks which vehicles a customer has hearted/saved, on the client device.
 * Purely local (no account required) and guarded for SSR safety.
 */

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'tripdee_favorite_vehicles';
const MAX_FAVORITES = 60;

const FAVORITES_EVENT = 'tripdee-favorites-updated';

export function getFavoriteVehicleIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function isFavorite(vehicleId: string): boolean {
  return getFavoriteVehicleIds().includes(vehicleId);
}

/** Adds the vehicle if missing, removes it if present. Returns the new state. */
export function toggleFavorite(vehicleId: string): boolean {
  if (typeof window === 'undefined') return false;
  const current = getFavoriteVehicleIds();
  const exists = current.includes(vehicleId);
  const updated = exists
    ? current.filter((id) => id !== vehicleId)
    : [vehicleId, ...current].slice(0, MAX_FAVORITES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT));
  } catch {
    /* ignore storage access error */
  }
  return !exists;
}

export function removeFavorite(vehicleId: string): void {
  if (typeof window === 'undefined') return;
  const updated = getFavoriteVehicleIds().filter((id) => id !== vehicleId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT));
  } catch {
    /* ignore storage access error */
  }
}

function subscribeToFavorites(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(FAVORITES_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(FAVORITES_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

/**
 * Hydration-safe reactive read of a vehicle's favourite state.
 * Uses the server snapshot `false` so SSR and the first client paint agree,
 * then upgrades to the real value once subscribed on the client.
 */
export function useIsFavorite(vehicleId: string): boolean {
  return useSyncExternalStore(
    subscribeToFavorites,
    () => isFavorite(vehicleId),
    () => false
  );
}
