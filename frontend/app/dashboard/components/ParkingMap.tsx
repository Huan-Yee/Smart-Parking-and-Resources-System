import ParkingSlot from './ParkingSlot';

interface ParkingMapProps {
    zoneName: string;
    totalSlots: number;
    occupiedSlots: number;
    onBack: () => void;
}

export default function ParkingMap({ zoneName, totalSlots, occupiedSlots, onBack }: ParkingMapProps) {
    if (totalSlots === 0) return null;

    const available = Math.max(0, totalSlots - occupiedSlots);

    // Generate accurate architectural map slots
    const slots = Array.from({ length: totalSlots }, (_, i) => ({
        id: i + 1,
        // Sequential simulation fallback for global zone counters
        isOccupied: i < occupiedSlots,
    }));

    return (
        <div className="px-4 md:px-8 pb-16 w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 md:gap-8 mt-4">
            
            {/* Main Center UI: The Detailed Visual Grid Map */}
            <div className="flex-1 bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm relative">
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center px-2 gap-4">
                    <button 
                        onClick={onBack} 
                        className="text-gray-500 hover:text-[#1e4b8e] flex items-center gap-2 text-sm font-bold transition-transform hover:-translate-x-1"
                    >
                        &larr; Back to Dashboard
                    </button>
                    <div className="flex gap-4 bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
                        <span className="flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">
                            <span className="w-2 h-2 rounded-full bg-[#ef4444] shadow-sm"></span> Busy
                        </span>
                        <span className="flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">
                            <span className="w-2 h-2 rounded-full bg-[#3b82f6] shadow-sm"></span> Free
                        </span>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-x-4 gap-y-6 md:gap-x-6 md:gap-y-8 justify-center lg:justify-start">
                    {slots.map(slot => (
                        <ParkingSlot 
                            key={slot.id} 
                            id={slot.id} 
                            isOccupied={slot.isOccupied} 
                        />
                    ))}
                </div>
            </div>

            {/* Right Sidebar: Stats Profile (Based directly on Parquo Prototype) */}
            <div className="w-full lg:w-80 flex flex-col gap-6">
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-6">
                    <div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-800">{zoneName} Profile</h3>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Real-Time Metrics</p>
                    </div>
                    
                    {/* The Custom System Metrics mimicking the Parquo reference aesthetic but simplified for MMU */}
                    <div className="flex flex-col gap-3">
                        <div className="bg-[#1e4b8e] text-white rounded-2xl p-5 flex flex-col items-center justify-center shadow-md transition-transform hover:-translate-y-1">
                            <span className="text-4xl font-black">{available}</span>
                            <span className="text-[10px] uppercase tracking-widest font-bold opacity-90 mt-1">Available Slots</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#2e313d] text-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-md">
                                <span className="text-2xl font-black">{totalSlots}</span>
                                <span className="text-[9px] uppercase tracking-widest font-bold opacity-80 mt-1">Total Capacity</span>
                            </div>
                            <div className="bg-[#ef4444] text-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-md">
                                <span className="text-2xl font-black">{occupiedSlots}</span>
                                <span className="text-[9px] uppercase tracking-widest font-bold text-red-100 mt-1">Occupied</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
