'use client';

import Image from 'next/image';
import { useParkingStats } from '../../hooks/useParkingStats';

// MMU Portal Colors
const MMU_BLUE = '#1e4b8e';
const MMU_RED = '#c41e3a';

// Zone configuration for MMU Staff Parking
const PARKING_ZONES = [
    { id: 'zone-a', name: 'Zone A - Staff', capacity: 10 },
    { id: 'zone-b', name: 'Zone B - Staff', capacity: 10 },
    { id: 'zone-v', name: 'Visitor Parking', capacity: 10 },
];

export default function DashboardPage() {
    const { stats, loading, error } = useParkingStats();

    if (error) {
        return (
            <main style={{ minHeight: '100vh', background: '#f5f5f5', color: '#333', padding: '2rem' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div style={{ background: '#fff', border: `1px solid ${MMU_RED}`, borderRadius: '8px', padding: '1rem' }}>
                        <p style={{ color: MMU_RED }}>⚠️ Error: {error}</p>
                    </div>
                </div>
            </main>
        );
    }

    if (loading || !stats) {
        return (
            <main style={{ minHeight: '100vh', background: '#f5f5f5', color: '#333', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '48px', height: '48px',
                        border: `4px solid ${MMU_BLUE}`,
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }}></div>
                    <p style={{ color: '#666' }}>Loading dashboard...</p>
                </div>
            </main>
        );
    }

    const occupancyPercent = Math.round(
        (stats.currentOccupied / stats.totalCapacity) * 100
    );

    return (
        <main style={{ minHeight: '100vh', background: '#f0f2f5', color: '#333' }}>
            {/* Header with MMU Logo */}
            <header style={{
                background: MMU_BLUE,
                borderBottom: `4px solid ${MMU_RED}`,
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'white'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Image
                        src="/mmu-logo.svg"
                        alt="MMU Logo"
                        width={120}
                        height={40}
                        style={{ filter: 'brightness(0) invert(1)' }}
                    />
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Smart Parking System</h1>
                        <p style={{ fontSize: '0.85rem', opacity: 0.9, margin: 0 }}>Cyberjaya Campus • Staff Parking</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        {stats.availableSlots}
                    </span>
                    <p style={{ fontSize: '0.85rem', opacity: 0.9, margin: 0 }}>Available</p>
                </div>
            </header>

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    <StatCard icon="📊" label="Total" value={stats.totalCapacity} color={MMU_BLUE} />
                    <StatCard icon="🚗" label="Occupied" value={stats.currentOccupied} color={MMU_RED} />
                    <StatCard icon="✅" label="Available" value={stats.availableSlots} color="#16a34a" />
                    <StatCard icon="📈" label="Occupancy" value={`${occupancyPercent}%`} color={occupancyPercent > 70 ? MMU_RED : MMU_BLUE} />
                </div>

                {/* Progress Bar */}
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: 600, color: '#333' }}>Overall Occupancy</span>
                        <span style={{ fontWeight: 'bold', color: occupancyPercent > 70 ? MMU_RED : MMU_BLUE }}>
                            {stats.currentOccupied} / {stats.totalCapacity} slots
                        </span>
                    </div>
                    <div style={{ width: '100%', background: '#e5e7eb', borderRadius: '8px', height: '16px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${Math.min(occupancyPercent, 100)}%`,
                            background: occupancyPercent > 80 ? MMU_RED : occupancyPercent > 50 ? '#f59e0b' : '#16a34a',
                            borderRadius: '8px',
                            transition: 'width 0.5s ease'
                        }}></div>
                    </div>
                </div>

                {/* Parking Zones */}
                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: MMU_BLUE, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🅿️ Parking Zones
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                        {PARKING_ZONES.map((zone, zoneIndex) => {
                            const zoneOccupied = Math.min(
                                zone.capacity,
                                Math.max(0, stats.currentOccupied - zoneIndex * 10)
                            );
                            const actualOccupied = Math.min(zoneOccupied, zone.capacity);

                            return (
                                <div key={zone.id} style={{
                                    background: 'white',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <h3 style={{ fontWeight: 600, margin: 0, color: MMU_BLUE }}>{zone.name}</h3>
                                        <span style={{ fontSize: '0.85rem', color: '#666' }}>
                                            {zone.capacity - actualOccupied} free
                                        </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                                        {Array.from({ length: zone.capacity }).map((_, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    aspectRatio: '1',
                                                    borderRadius: '6px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    background: i < actualOccupied ? MMU_RED : '#16a34a',
                                                    color: 'white',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                                                }}
                                                title={i < actualOccupied ? 'Occupied' : 'Available'}
                                            >
                                                {i + 1}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Footer */}
                <footer style={{
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '0.85rem',
                    padding: '1.5rem 0',
                    borderTop: '1px solid #e5e7eb'
                }}>
                    <p>Last updated: {new Date(stats.lastUpdated).toLocaleString()}</p>
                    <p style={{ marginTop: '0.5rem', color: MMU_BLUE, fontWeight: 500 }}>
                        MMU Smart Parking System • FYP Project
                    </p>
                </footer>
            </div>

            <style jsx global>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </main>
    );
}

// Stat Card Component
function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number | string; color: string }) {
    return (
        <div style={{
            background: 'white',
            borderTop: `4px solid ${color}`,
            borderRadius: '8px',
            padding: '1.25rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                <span style={{ fontSize: '0.85rem', color: '#666' }}>{label}</span>
            </div>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color, margin: 0 }}>{value}</p>
        </div>
    );
}
