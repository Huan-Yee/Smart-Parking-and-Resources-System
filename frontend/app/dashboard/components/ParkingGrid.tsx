export interface ZoneStats {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    totalCapacity: number;
    available: number;
}

interface ParkingGridProps {
    zones: ZoneStats[];
    onViewMap: () => void;
}

export default function ParkingGrid({ zones, onViewMap }: ParkingGridProps) {
    
    // Determine visual status based on real-time availability ratio
    const getStatusInfo = (avail: number, total: number) => {
        if (total === 0) return null;
        const ratio = avail / total;
        if (ratio > 0.5) return { text: 'Available', color: 'bg-[#16a34a]', textColor: 'text-[#16a34a]' }; 
        if (ratio > 0.1) return { text: 'Filling Up', color: 'bg-[#f59e0b]', textColor: 'text-[#f59e0b]' }; 
        if (ratio > 0) return { text: 'Almost Full', color: 'bg-[#ea580c]', textColor: 'text-[#ea580c]' }; 
        return { text: 'Full', color: 'bg-[#c41e3a]', textColor: 'text-[#c41e3a]' }; 
    };

    return (
        <div className="px-4 md:px-8 pb-16 w-full max-w-3xl mx-auto flex flex-col gap-6 mt-4">
            
            {zones.map((zone) => {
                if (zone.isActive) {
                    const status = getStatusInfo(zone.available, zone.totalCapacity);
                    
                    return (
                        <div key={zone.id} className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6 transition-all hover:shadow-lg">
                            <div className="text-center sm:text-left">
                                <h2 className="text-2xl md:text-3xl font-bold text-[#1e4b8e]">{zone.name}</h2>
                                <p className="text-sm md:text-base text-gray-500 mt-1">{zone.description}</p>
                            </div>

                            <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl md:text-6xl font-black text-gray-800 tracking-tighter">
                                        {zone.available}
                                    </span>
                                    <span className="text-sm md:text-base font-semibold text-gray-400 uppercase tracking-widest">
                                        / {zone.totalCapacity} Lots
                                    </span>
                                </div>
                                
                                {status && (
                                    <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-6 mt-6 sm:mt-4">
                                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                            <div className={`w-3 h-3 rounded-full ${status.color} shadow-sm animate-pulse`}></div>
                                            <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${status.textColor}`}>
                                                {status.text}
                                            </span>
                                        </div>
                                        
                                        {/* The Route Navigation Button handling the user transition to the detailed map */}
                                        <button 
                                            onClick={onViewMap}
                                            className="px-5 py-2.5 bg-[#1e4b8e] text-white text-xs md:text-sm font-bold rounded-xl shadow-md transition-transform hover:-translate-y-0.5 hover:bg-blue-800 active:scale-95"
                                        >
                                            View Spot Map &rarr;
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                } else {
                    return (
                        <div key={zone.id} className="bg-gray-50 rounded-3xl p-6 md:p-8 shadow-inner border border-gray-200 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 opacity-70">
                            <div className="text-center sm:text-left">
                                <h2 className="text-xl font-bold text-gray-400">{zone.name}</h2>
                                <p className="text-xs text-gray-400 mt-1">{zone.description}</p>
                            </div>
                            <div className="flex flex-col items-center sm:items-end opacity-60">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-gray-400 tracking-tighter">-</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Under Construction</span>
                                </div>
                            </div>
                        </div>
                    );
                }
            })}
        </div>
    );
}
