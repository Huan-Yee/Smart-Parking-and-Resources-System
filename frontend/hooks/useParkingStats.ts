import { useEffect, useState } from 'react';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';

const UI_TOTAL_CAPACITY = 40; // Forced to 40 for the 2-Zone (20 slots each) PC Layout UX

export interface ParkingStats {
    totalCapacity: number;
    currentOccupied: number;
    availableSlots: number;
    lastUpdated: string;
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
                if (snapshot.exists()) {
                    const data = snapshot.data() as DocumentData;
                    const occupied = data.occupied || 0;

                    setStats({
                        totalCapacity: UI_TOTAL_CAPACITY,
                        currentOccupied: occupied,
                        // Overriding the backend's default 30-slot capacity so the Header matches the new 40-slot UI
                        availableSlots: Math.max(0, UI_TOTAL_CAPACITY - occupied),
                        lastUpdated: data.lastUpdated?.toDate?.()?.toISOString() || new Date().toISOString(),
                    });
                } else {
                    setStats({
                        totalCapacity: UI_TOTAL_CAPACITY,
                        currentOccupied: 0,
                        availableSlots: UI_TOTAL_CAPACITY,
                        lastUpdated: new Date().toISOString(),
                    });
                }
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
