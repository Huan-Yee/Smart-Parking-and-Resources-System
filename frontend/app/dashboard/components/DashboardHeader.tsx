import Image from 'next/image';

interface DashboardHeaderProps {
    availableSlots: number;
}

export default function DashboardHeader({ availableSlots }: DashboardHeaderProps) {
    return (
        <header className="bg-[#1e4b8e] border-b-4 border-[#c41e3a] px-4 md:px-8 py-4 flex justify-between items-center text-white sticky top-0 z-50 shadow-md">
            <div className="flex items-center gap-3 md:gap-4">
                <div className="relative w-[80px] h-[26px] md:w-[120px] md:h-[40px]">
                    <Image
                        src="/mmu-logo.svg"
                        alt="MMU Logo"
                        fill
                        className="object-contain brightness-0 invert"
                        priority
                    />
                </div>
                <div>
                    <h1 className="text-sm md:text-xl font-bold m-0 leading-tight">Smart Parking System</h1>
                    <p className="text-xs md:text-sm opacity-90 m-0 hidden sm:block">Cyberjaya Campus</p>
                </div>
            </div>
            <div className="text-right">
                <span className="text-2xl md:text-3xl font-black leading-none block">
                    {availableSlots}
                </span>
                <span className="text-[10px] md:text-xs font-bold opacity-90 uppercase tracking-widest">
                    Available
                </span>
            </div>
        </header>
    );
}
