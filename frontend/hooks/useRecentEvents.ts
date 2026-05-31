import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchEventHistory, ParkingEvent } from '../lib/api';

const POLL_INTERVAL_MS = 15_000; // 15 seconds

export function useRecentEvents(limit = 8) {
  const [events, setEvents] = useState<ParkingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await fetchEventHistory(limit);
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchEvents();
    intervalRef.current = setInterval(fetchEvents, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchEvents]);

  // Expose a manual refetch so ManualCorrection can trigger it after a set-count
  return { events, loading, error, refetch: fetchEvents };
}
