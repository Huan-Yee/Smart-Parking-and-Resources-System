'use client';

import { useState } from 'react';
import { useParkingStats } from '../../hooks/useParkingStats';
import DashboardHeader from './components/DashboardHeader';
import ZoneSelector from './components/ZoneSelector';
import ParkingGrid from './components/ParkingGrid';
import ParkingMap from './components/ParkingMap';
import { PARKING_ZONES } from './config/zones';

export default function DashboardPage() {
    const { stats, loading, error } = useParkingStats();

    // The Master Canvas Orchestrator states
    const [selectedZoneId, setSelectedZoneId] = useState<string>(PARKING_ZONES[0].id);
    const [isMapView, setIsMapView] = useState<boolean>(false);
    
    // Safety fallback mathematically if stats haven't loaded
    const safeTotal = stats ? stats.totalCapacity : 40;
    const safeAvailable = stats ? stats.availableSlots : 40;
    const safeOccupied = stats ? stats.currentOccupied : 0;

    // Dynamically merge the static abstract database (PARKING_ZONES) 
    const systemZones = PARKING_ZONES.map(zone => ({
        ...zone,
        totalCapacity: zone.isActive ? safeTotal : zone.physicalCapacity,
        available: zone.isActive ? safeAvailable : zone.physicalCapacity,
    }));

    const activeZoneData = systemZones.filter(z => z.id === selectedZoneId);
    const activeZone = activeZoneData[0];

    // Handle view routing elegantly
    const handleViewMap = () => setIsMapView(true);
    const handleBackToDashboard = () => setIsMapView(false);

    if (error) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white border border-[#c41e3a] p-6 rounded-2xl shadow-md max-w-md w-full text-center">
                    <h2 className="text-[#c41e3a] text-xl font-bold mb-2">Connection Error</h2>
                    <p className="text-gray-600 text-sm">{error}</p>
                </div>
            </main>
        );
    }

    if (loading || !stats) {
        return (
            <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 border-4 border-[#1e4b8e] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[#1e4b8e] font-semibold tracking-wide">Syncing Real-Time Data...</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f0f2f5] flex flex-col">
            <DashboardHeader availableSlots={stats.availableSlots} />

            <div className="flex-1 w-full max-w-[1400px] mx-auto py-6">
                
                {!isMapView ? (
                    // 1. The Volumetric Dashboard View
                    <div className="fade-in">
                        <ZoneSelector 
                            zones={systemZones} 
                            selectedZoneId={selectedZoneId}
                            onSelectZone={setSelectedZoneId}
                        />
                        <ParkingGrid 
                            zones={activeZoneData} 
                            onViewMap={handleViewMap}
                        />
                    </div>
                ) : (
                    // 2. The Detailed Spot Map View (Parquo Style)
                    activeZone && activeZone.isActive && (
                        <div className="fade-in">
                            <ParkingMap 
                                zoneName={activeZone.name}
                                totalSlots={activeZone.physicalCapacity}
                                occupiedSlots={safeOccupied} 
                                onBack={handleBackToDashboard}
                            />
                        </div>
                    )
                )}
                
            </div>

            <footer className="mt-auto py-8 text-center text-gray-500">
                <p className="text-xs font-medium tracking-wide">
                    Last updated: {new Date(stats.lastUpdated).toLocaleTimeString()}
                </p>
            </footer>
        </main>
    );
}
