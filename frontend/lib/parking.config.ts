/**
 * Frontend Prototype Configuration
 *
 * Single source of truth for prototype constants.
 * Mirrors backend PARKING_CONFIG.TOTAL_LOTS = 4.
 * Update BACKEND_URL via .env.local:
 *   NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
 */
export const PARKING_CONFIG = {
  TOTAL_LOTS: 4,
  ZONE: 'gate-main',
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001',
} as const;

export type OccupancyStatus = 'available' | 'filling' | 'almost-full' | 'full';

/**
 * Derive a human-readable status label and colour key from the current occupancy.
 * Thresholds: >50% available → "Available", >10% → "Filling Up", >0 → "Almost Full", 0 → "Full"
 */
export function deriveStatus(available: number, total: number): OccupancyStatus {
  if (total === 0) return 'full';
  const ratio = available / total;
  if (ratio > 0.5) return 'available';
  if (ratio > 0.1) return 'filling';
  if (ratio > 0) return 'almost-full';
  return 'full';
}

export const STATUS_LABELS: Record<OccupancyStatus, string> = {
  available: 'Available',
  filling: 'Filling Up',
  'almost-full': 'Almost Full',
  full: 'Full',
};
