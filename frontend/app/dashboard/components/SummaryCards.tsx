import { OccupancyStatus, STATUS_LABELS } from '../../../lib/parking.config';

interface SummaryCardsProps {
  available: number;
  occupied: number;
  total: number;
  status: OccupancyStatus;
}

const STATUS_STYLES: Record<OccupancyStatus, { bg: string; text: string; dot: string }> = {
  available:    { bg: 'bg-green-50  border-green-200',  text: 'text-green-700',  dot: 'bg-green-500' },
  filling:      { bg: 'bg-amber-50  border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  'almost-full':{ bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
  full:         { bg: 'bg-red-50    border-red-200',    text: 'text-red-700',    dot: 'bg-red-500'   },
};

export default function SummaryCards({ available, occupied, total, status }: SummaryCardsProps) {
  const s = STATUS_STYLES[status];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">

      {/* Available — primary, largest */}
      <div className="col-span-2 lg:col-span-1 bg-[#1e4b8e] text-white rounded-xl p-5 md:p-6 flex flex-col justify-between shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-widest opacity-80">
          Available
        </span>
        <span className="text-5xl md:text-6xl font-black leading-none mt-2">
          {available}
        </span>
        <span className="text-xs opacity-70 mt-1">lots free</span>
      </div>

      {/* Occupied */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 flex flex-col justify-between shadow-sm">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Occupied
        </span>
        <span className="text-3xl md:text-4xl font-black text-gray-800 leading-none mt-2">
          {occupied}
        </span>
        <span className="text-xs text-gray-400 mt-1">lots in use</span>
      </div>

      {/* Total capacity */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 flex flex-col justify-between shadow-sm">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Capacity
        </span>
        <span className="text-3xl md:text-4xl font-black text-gray-800 leading-none mt-2">
          {total}
        </span>
        <span className="text-xs text-gray-400 mt-1">total lots</span>
      </div>

      {/* Status badge */}
      <div className={`border rounded-xl p-4 md:p-5 flex flex-col justify-between shadow-sm ${s.bg}`}>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Status
        </span>
        <div className="flex items-center gap-2 mt-2">
          <span className={`w-3 h-3 rounded-full shrink-0 status-pulse ${s.dot}`} />
          <span className={`text-lg md:text-xl font-black leading-tight ${s.text}`}>
            {STATUS_LABELS[status]}
          </span>
        </div>
        <span className="text-xs text-gray-400 mt-1">real-time</span>
      </div>
    </div>
  );
}
