import { ParkingEvent } from '../../../lib/api';

interface RecentEventsProps {
  events: ParkingEvent[];
  loading: boolean;
  error: string | null;
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(isoString).toLocaleDateString();
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function RecentEvents({ events, loading, error }: RecentEventsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Recent Events
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Entry / exit detections</p>
        </div>
        {loading && (
          <span className="w-4 h-4 border-2 border-[#1e4b8e] border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Could not load events: {error}
        </p>
      )}

      {!error && events.length === 0 && !loading && (
        <p className="text-xs text-gray-400 italic text-center py-4">
          No events recorded yet.
        </p>
      )}

      {!error && events.length > 0 && (
        <ul className="flex flex-col gap-2">
          {events.map((ev, idx) => {
            const isEntry = ev.type === 'entry';
            return (
              <li
                key={idx}
                className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
              >
                {/* Direction arrow */}
                <span
                  className={`text-base font-black w-5 text-center shrink-0 ${
                    isEntry ? 'text-green-600' : 'text-red-500'
                  }`}
                  title={isEntry ? 'Entry' : 'Exit'}
                >
                  {isEntry ? '↑' : '↓'}
                </span>

                {/* Event type */}
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${
                    isEntry
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {isEntry ? 'Entry' : 'Exit'}
                </span>

                {/* Detected vehicle label */}
                <span className="text-xs text-gray-500 truncate flex-1">
                  Detected vehicle
                </span>

                {/* Timestamp */}
                <span
                  className="text-[10px] text-gray-400 shrink-0 font-mono"
                  title={formatTime(ev.timestamp)}
                >
                  {formatRelativeTime(ev.timestamp)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
