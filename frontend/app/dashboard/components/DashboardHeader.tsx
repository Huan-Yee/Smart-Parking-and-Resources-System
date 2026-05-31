import Image from 'next/image';

interface DashboardHeaderProps {
  lastUpdated: string; // ISO string
}

export default function DashboardHeader({ lastUpdated }: DashboardHeaderProps) {
  const timeLabel = new Date(lastUpdated).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="bg-[#1e4b8e] border-b-4 border-[#c41e3a] px-4 md:px-8 py-3 flex items-center justify-between text-white sticky top-0 z-50 shadow-md">
      {/* Left: Logo + title */}
      <div className="flex items-center gap-3">
        <div className="relative w-[72px] h-[24px] md:w-[100px] md:h-[33px] shrink-0">
          <Image
            src="/mmu-logo.svg"
            alt="MMU Logo"
            fill
            className="object-contain brightness-0 invert"
            priority
          />
        </div>
        <div>
          <h1 className="text-sm md:text-base font-bold leading-tight">
            MMU Smart Parking
          </h1>
          <p className="text-[10px] md:text-xs opacity-75 leading-tight">
            Prototype&nbsp;·&nbsp;Admin Dashboard
          </p>
        </div>
      </div>

      {/* Right: Last updated */}
      <div className="text-right text-[10px] md:text-xs opacity-80 leading-snug">
        <span className="block uppercase tracking-widest font-semibold">Last updated</span>
        <span className="block font-mono">{timeLabel}</span>
      </div>
    </header>
  );
}
