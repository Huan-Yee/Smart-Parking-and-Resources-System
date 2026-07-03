'use client';

import { useParkingStats } from '../../hooks/useParkingStats';
import { useRecentEvents } from '../../hooks/useRecentEvents';
import DashboardHeader from './components/DashboardHeader';
import SummaryCards from './components/SummaryCards';
import OccupancyGrid from './components/OccupancyGrid';
import ManualCorrection from './components/ManualCorrection';
import RecentEvents from './components/RecentEvents';
import PrototypeInfo from './components/PrototypeInfo';

export default function DashboardPage() {
  const { stats, loading, error, refetch: refetchStats } = useParkingStats();
  const { events, loading: eventsLoading, error: eventsError, refetch: refetchEvents } = useRecentEvents(8);

  /* ── Error state ─────────────────────────────────────────────── */
  if (error) {
    return (
      <main className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm max-w-sm w-full text-center">
          <p className="text-2xl mb-2">⚠️</p>
          <h2 className="text-red-700 font-bold mb-1">Backend Connection Error</h2>
          <p className="text-gray-500 text-sm">{error}</p>
          <p className="text-gray-400 text-xs mt-3">
            Make sure the NestJS backend is running on port 5001.
          </p>
        </div>
      </main>
    );
  }

  /* ── Loading state ───────────────────────────────────────────── */
  if (loading || !stats) {
    return (
      <main className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center gap-3 p-4">
        <span className="w-10 h-10 border-4 border-[#1e4b8e] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Connecting to live data…</p>
      </main>
    );
  }

  /* ── Dashboard ───────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col">
      <DashboardHeader lastUpdated={stats.lastUpdated} />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-5 fade-up">

        {/* Row 1: Summary cards */}
        <SummaryCards
          available={stats.availableSlots}
          occupied={stats.currentOccupied}
          total={stats.totalCapacity}
          status={stats.status}
        />

        {/* Row 2: Occupancy grid + Side panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Occupancy grid — takes 2/3 width on desktop */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <OccupancyGrid
              total={stats.totalCapacity}
              occupied={stats.currentOccupied}
            />
          </div>

          {/* Side panel — Manual correction + Recent events */}
          <div className="flex flex-col gap-5">
            <ManualCorrection
              currentOccupied={stats.currentOccupied}
              onSuccess={() => { refetchStats(); refetchEvents(); }}
            />
          </div>
        </div>

        {/* Row 3: Recent events full-width */}
        <RecentEvents
          events={events}
          loading={eventsLoading}
          error={eventsError}
        />

        {/* Row 4: Prototype info (collapsible) */}
        <PrototypeInfo />
      </main>

      <footer className="py-5 text-center text-xs text-gray-400 border-t border-gray-200 mt-auto">
        MMU Smart Parking System&nbsp;·&nbsp;FYP Prototype&nbsp;·&nbsp;
        Capacity: {stats.totalCapacity} lots
      </footer>
    </div>
  );
}
