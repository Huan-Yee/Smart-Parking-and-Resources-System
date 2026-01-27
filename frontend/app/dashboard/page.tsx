'use client';

import { useParkingStats } from '../../hooks/useParkingStats';

export default function DashboardPage() {
    const { stats, loading, error } = useParkingStats();

    if (error) {
        return (
            <main className="min-h-screen bg-gray-900 text-white p-8">
                <p className="text-red-500">Error: {error}</p>
            </main>
        );
    }

    if (loading || !stats) {
        return (
            <main className="min-h-screen bg-gray-900 text-white p-8">
                <p>Loading dashboard...</p>
            </main>
        );
    }

    const occupancyPercent = Math.round(
        (stats.currentOccupied / stats.totalCapacity) * 100
    );

    return (
        <main className="min-h-screen bg-gray-900 text-white p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold">🚗 MMU Smart Parking Dashboard</h1>
                <p className="text-gray-400">Real-time parking monitoring system</p>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    label="Total Capacity"
                    value={stats.totalCapacity}
                    color="blue"
                />
                <StatCard
                    label="Occupied"
                    value={stats.currentOccupied}
                    color="red"
                />
                <StatCard
                    label="Available"
                    value={stats.availableSlots}
                    color="green"
                />
            </div>

            {/* Occupancy Bar */}
            <div className="mb-8">
                <div className="flex justify-between mb-2">
                    <span>Occupancy</span>
                    <span>{occupancyPercent}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                    <div
                        className={`h-4 rounded-full transition-all duration-500 ${occupancyPercent > 80
                            ? 'bg-red-500'
                            : occupancyPercent > 50
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                        style={{ width: `${occupancyPercent}%` }}
                    />
                </div>
            </div>

            {/* Parking Slot Grid (Visual Representation) */}
            <section>
                <h2 className="text-xl font-semibold mb-4">Parking Slots</h2>
                <div className="grid grid-cols-10 gap-2">
                    {Array.from({ length: stats.totalCapacity }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-8 h-8 rounded ${i < stats.currentOccupied ? 'bg-red-500' : 'bg-green-500'
                                }`}
                            title={i < stats.currentOccupied ? 'Occupied' : 'Available'}
                        />
                    ))}
                </div>
            </section>

            <footer className="mt-8 text-gray-500 text-sm">
                Last updated: {new Date(stats.lastUpdated).toLocaleString()}
            </footer>
        </main>
    );
}

// Reusable Stat Card Component
function StatCard({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: 'blue' | 'red' | 'green';
}) {
    const colorClasses = {
        blue: 'bg-blue-600',
        red: 'bg-red-600',
        green: 'bg-green-600',
    };

    return (
        <div className={`${colorClasses[color]} rounded-lg p-6 shadow-lg`}>
            <p className="text-sm opacity-80">{label}</p>
            <p className="text-4xl font-bold">{value}</p>
        </div>
    );
}
