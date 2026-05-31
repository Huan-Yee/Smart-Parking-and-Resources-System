interface OccupancyGridProps {
  total: number;      // prototype: 10
  occupied: number;
}

export default function OccupancyGrid({ total, occupied }: OccupancyGridProps) {
  const cells = Array.from({ length: total }, (_, i) => i < occupied);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Occupancy Overview
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Count-based visualisation&nbsp;·&nbsp;not exact slot positions
          </p>
        </div>
        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {occupied} / {total}
        </span>
      </div>

      {/* Grid: 5 cells per row */}
      <div className="grid grid-cols-5 gap-2 md:gap-3">
        {cells.map((isOccupied, i) => (
          <div
            key={i}
            title={isOccupied ? 'Occupied' : 'Available'}
            className={`
              flex flex-col items-center justify-center
              rounded-lg border-2 py-3 md:py-4 gap-1
              transition-colors duration-300
              ${isOccupied
                ? 'bg-red-50 border-red-300'
                : 'bg-blue-50 border-blue-200'
              }
            `}
          >
            {/* Visual indicator */}
            <span
              className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${
                isOccupied ? 'bg-red-500' : 'bg-blue-400'
              }`}
            />
            {/* Lot number */}
            <span className={`text-[10px] md:text-xs font-bold ${
              isOccupied ? 'text-red-400' : 'text-blue-400'
            }`}>
              {i + 1}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
          Occupied
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
          Available
        </span>
      </div>
    </div>
  );
}
