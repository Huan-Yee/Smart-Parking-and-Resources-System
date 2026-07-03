import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchStats } from '../lib/api';
import { PARKING_CONFIG, deriveStatus, OccupancyStatus } from '../lib/parking.config';

export interface ParkingStats {
  totalCapacity: number;
  currentOccupied: number;
  availableSlots: number;
  status: OccupancyStatus;
  lastUpdated: string; // ISO string
}

const POLL_INTERVAL_MS = 5_000; // poll backend every 5 seconds

export function useParkingStats() {
  const [stats, setStats] = useState<ParkingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAndSet = useCallback(async () => {
    try {
      const data = await fetchStats();

      const total = data.total ?? PARKING_CONFIG.TOTAL_LOTS;
      const occupied = Math.min(Math.max(0, data.occupied ?? 0), total);
      const available = Math.max(0, total - occupied);

      setStats({
        totalCapacity: total,
        currentOccupied: occupied,
        availableSlots: available,
        status: deriveStatus(available, total),
        // Use lastUpdated from backend if present, otherwise now
        lastUpdated: data.lastUpdated ?? new Date().toISOString(),
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndSet();
    intervalRef.current = setInterval(fetchAndSet, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAndSet]);

  // Expose refetch so other components (e.g. ManualCorrection) can trigger an
  // immediate refresh without waiting for the next poll cycle.
  return { stats, loading, error, refetch: fetchAndSet };
}
