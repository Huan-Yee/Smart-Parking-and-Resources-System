interface ParkingSlotProps {
    id: number;
    isOccupied: boolean;
}

export default function ParkingSlot({ id, isOccupied }: ParkingSlotProps) {
    // Replicating the exact styling from the provided prototype media
    // Red dot = Occupied, Blue dot = Available
    
    return (
        <div className="flex flex-col items-center justify-between w-[48px] h-[95px] md:w-[60px] md:h-[110px] bg-white rounded-full shadow-sm border border-gray-100 py-3 transition-transform hover:-translate-y-1 hover:shadow-md cursor-default">
            
            {/* Top Indicator Dot */}
            <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shadow-sm ${isOccupied ? 'bg-[#ef4444]' : 'bg-[#3b82f6]'}`}></div>
            
            {/* Center Vehicle or Empty Space */}
            <div className="flex-1 flex items-center justify-center w-full">
                {isOccupied ? (
                    // Top-Down Vehicle SVG
                    <svg viewBox="0 0 24 48" className="w-[60%] h-[75%] text-gray-700 drop-shadow-md" fill="currentColor">
                        <rect x="3" y="1" width="18" height="46" rx="5" />
                        <rect x="5" y="10" width="14" height="8" rx="2" fill="rgba(255,255,255,0.4)" />
                        <rect x="5" y="32" width="14" height="7" rx="2" fill="rgba(255,255,255,0.4)" />
                        <path d="M1 12 h3 v6 h-3 z" />
                        <path d="M20 12 h3 v6 h-3 z" />
                        <rect x="5" y="1" width="3" height="2" fill="#fff" opacity="0.8" />
                        <rect x="16" y="1" width="3" height="2" fill="#fff" opacity="0.8" />
                        <rect x="5" y="45" width="4" height="2" fill="#ff0000" opacity="0.8" />
                        <rect x="15" y="45" width="4" height="2" fill="#ff0000" opacity="0.8" />
                    </svg>
                ) : (
                    // Empty visual space to maintain aspect ratio
                    <div className="w-[60%] h-[75%]"></div> 
                )}
            </div>
            
            {/* Bottom Lot Number */}
            <span className="text-[10px] md:text-sm font-bold text-gray-400 leading-none">
                {id}
            </span>
        </div>
    );
}
