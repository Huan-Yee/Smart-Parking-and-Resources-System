/**
 * Backend API helpers.
 *
 * All calls use PARKING_CONFIG.BACKEND_URL so the URL is never scattered
 * across component files. Throws on non-OK HTTP responses.
 */
import { PARKING_CONFIG } from './parking.config';

export interface ParkingEvent {
  type: 'entry' | 'exit';
  licensePlate: string;
  timestamp: string; // ISO string from backend
  zoneId: string;
}

export interface SetCountResult {
  status: string;
  message: string;
  occupied: number;
  total: number;
  available: number;
}

/**
 * POST /events/set-count
 * Admin manual override for occupied count.
 * Backend validates 0 ≤ occupied ≤ TOTAL_LOTS.
 */
export async function setManualCount(occupied: number): Promise<SetCountResult> {
  const res = await fetch(`${PARKING_CONFIG.BACKEND_URL}/events/set-count`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ occupied }),
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  return res.json();
}

/**
 * GET /events/history?limit=N
 * Fetches N most recent entry/exit events, ordered by timestamp desc.
 */
export async function fetchEventHistory(limit = 8): Promise<ParkingEvent[]> {
  const res = await fetch(
    `${PARKING_CONFIG.BACKEND_URL}/events/history?limit=${limit}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch event history (${res.status})`);
  }

  const data = await res.json();
  // Backend returns an array directly or wrapped — handle both shapes
  return Array.isArray(data) ? data : data.events ?? [];
}
