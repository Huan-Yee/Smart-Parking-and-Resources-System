import { useEffect, useState } from 'react';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PARKING_CONFIG, deriveStatus, OccupancyStatus } from '../lib/parking.config';

export interface ParkingStats {
  totalCapacity: number;
  currentOccupied: number;
  availableSlots: number;
  status: OccupancyStatus;
  lastUpdated: string; // ISO string
}

export function useParkingStats() {
  const [stats, setStats] = useState<ParkingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const docRef = doc(db, 'live_counts', 'summary');

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        const data: DocumentData = snapshot.exists() ? snapshot.data() : {};

        // Prefer total from Firestore (backend writes it), fall back to config constant.
        const total: number = data.total ?? PARKING_CONFIG.TOTAL_LOTS;
        const occupied: number = Math.min(data.occupied ?? 0, total);
        const available: number = Math.max(0, total - occupied);

        setStats({
          totalCapacity: total,
          currentOccupied: occupied,
          availableSlots: available,
          status: deriveStatus(available, total),
          lastUpdated:
            data.lastUpdated?.toDate?.()?.toISOString() ??
            new Date().toISOString(),
        });
        setLoading(false);
      },
      (err) => {
        console.error('Firestore subscription error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { stats, loading, error };
}
