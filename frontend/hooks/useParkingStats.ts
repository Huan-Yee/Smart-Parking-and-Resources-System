import { useEffect, useState } from 'react';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ParkingStats {
    totalCapacity: number;
    currentOccupied: number;
    availableSlots: number;
    lastUpdated: string;
}

/**
 * Custom Hook: useParkingStats
 * 
 * Subscribes to real-time updates from Firestore's live_counts/summary document.
 * Returns the current parking statistics and loading state.
 */
export function useParkingStats() {
    const [stats, setStats] = useState<ParkingStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Reference to the live_counts/summary document
        const docRef = doc(db, 'live_counts', 'summary');

        // Subscribe to real-time updates
        const unsubscribe = onSnapshot(
            docRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data() as DocumentData;
                    setStats({
                        totalCapacity: data.totalCapacity || 100,
                        currentOccupied: data.currentOccupied || 0,
                        availableSlots: data.availableSlots || data.totalCapacity || 100,
                        lastUpdated: data.lastUpdated?.toDate?.()?.toISOString() || new Date().toISOString(),
                    });
                } else {
                    // Document doesn't exist yet - use defaults
                    setStats({
                        totalCapacity: 100,
                        currentOccupied: 0,
                        availableSlots: 100,
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

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    return { stats, loading, error };
}
