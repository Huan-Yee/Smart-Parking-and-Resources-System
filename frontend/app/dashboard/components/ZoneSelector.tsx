export interface Zone {
    id: string;
    name: string;
    isActive: boolean;
    description?: string;
}

interface ZoneSelectorProps {
    zones: Zone[];
    selectedZoneId: string;
    onSelectZone: (id: string) => void;
}

export default function ZoneSelector({ zones, selectedZoneId, onSelectZone }: ZoneSelectorProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 px-4 md:px-8 mb-4">
            <h2 className="text-base md:text-lg font-bold text-[#1e4b8e]">Zones:</h2>
            <div className="flex flex-wrap gap-2">
                {zones.map((zone) => {
                    const isSelected = zone.id === selectedZoneId;
                    
                    return (
                        <button 
                            key={zone.id}
                            onClick={() => onSelectZone(zone.id)}
                            className={`rounded-full px-5 py-2 text-xs md:text-sm font-bold shadow-sm transition-all duration-200
                                ${isSelected 
                                    ? 'bg-[#1e4b8e] text-white hover:scale-105 active:scale-95 border-2 border-[#1e4b8e]' 
                                    : zone.isActive
                                        ? 'bg-white text-[#1e4b8e] border-2 border-[#1e4b8e] hover:bg-blue-50 hover:scale-105'
                                        : 'bg-gray-100 text-gray-500 opacity-80 border-2 border-gray-200 hover:bg-gray-200'
                                }`}
                            title={zone.isActive ? 'Active Zone' : 'Reserved for future deployment'}
                        >
                            {zone.name} {zone.isActive ? '' : '(Under Construction)'}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
