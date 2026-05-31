'use client';

import { useState } from 'react';
import { PARKING_CONFIG } from '../../../lib/parking.config';

const INFO_ROWS = [
  { label: 'Prototype',   value: '10-lot one-way route' },
  { label: 'Entry camera',  value: 'ESP32-CAM → POST /events/entry' },
  { label: 'Exit camera',   value: 'ESP32-CAM → POST /events/exit' },
  { label: 'Detection',     value: 'ROI-based motion detection' },
  { label: 'Tracking',      value: 'Count-based (not individual slot sensors)' },
  { label: 'Vehicle label', value: '"Detected vehicle" — no licence plate recognition at this resolution' },
  { label: 'Backend URL',   value: PARKING_CONFIG.BACKEND_URL },
];

export default function PrototypeInfo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-100 transition"
        aria-expanded={open}
      >
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
          System / Prototype Info
        </span>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-200 px-5 py-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
            {INFO_ROWS.map(({ label, value }) => (
              <div key={label} className="flex flex-col">
                <dt className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                  {label}
                </dt>
                <dd className="text-xs text-gray-700 mt-0.5 font-mono">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[10px] text-gray-400 italic">
            This panel is for FYP presentation context. It describes the prototype architecture, not a commercial deployment.
          </p>
        </div>
      )}
    </div>
  );
}
