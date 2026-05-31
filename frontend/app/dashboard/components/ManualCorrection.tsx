'use client';

import { useState } from 'react';
import { setManualCount } from '../../../lib/api';
import { PARKING_CONFIG } from '../../../lib/parking.config';

interface ManualCorrectionProps {
  currentOccupied: number;
  onSuccess?: () => void; // optional callback (e.g. refetch events)
}

type FeedbackState =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

export default function ManualCorrection({ currentOccupied, onSuccess }: ManualCorrectionProps) {
  const [value, setValue] = useState<string>(String(currentOccupied));
  const [feedback, setFeedback] = useState<FeedbackState>({ type: 'idle' });

  const numValue = parseInt(value, 10);
  const isValid =
    !isNaN(numValue) &&
    numValue >= 0 &&
    numValue <= PARKING_CONFIG.TOTAL_LOTS &&
    value.trim() !== '';

  const handleApply = async () => {
    if (!isValid) return;
    setFeedback({ type: 'loading' });
    try {
      const result = await setManualCount(numValue);
      setFeedback({
        type: 'success',
        message: `Count set to ${result.occupied} (${result.available} available)`,
      });
      onSuccess?.();
      // Auto-clear success message after 4 s
      setTimeout(() => setFeedback({ type: 'idle' }), 4000);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Correction failed',
      });
    }
  };

  const handleStep = (delta: number) => {
    const next = Math.min(
      PARKING_CONFIG.TOTAL_LOTS,
      Math.max(0, (isNaN(numValue) ? currentOccupied : numValue) + delta)
    );
    setValue(String(next));
    setFeedback({ type: 'idle' });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 shadow-sm">
      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1">
        Manual Correction
      </h2>
      <p className="text-xs text-gray-400 mb-4">
        Override occupied count when detection drifts.
      </p>

      {/* Stepper input */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => handleStep(-1)}
          disabled={feedback.type === 'loading'}
          aria-label="Decrease occupied count"
          className="w-9 h-9 rounded-lg border border-gray-300 text-gray-600 font-bold text-lg flex items-center justify-center hover:bg-gray-100 active:scale-95 disabled:opacity-40 transition"
        >
          −
        </button>

        <input
          id="manual-correction-input"
          type="number"
          min={0}
          max={PARKING_CONFIG.TOTAL_LOTS}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setFeedback({ type: 'idle' });
          }}
          className="w-16 text-center text-xl font-black border-2 border-gray-300 rounded-lg py-1.5 focus:outline-none focus:border-[#1e4b8e] transition"
        />

        <button
          onClick={() => handleStep(1)}
          disabled={feedback.type === 'loading'}
          aria-label="Increase occupied count"
          className="w-9 h-9 rounded-lg border border-gray-300 text-gray-600 font-bold text-lg flex items-center justify-center hover:bg-gray-100 active:scale-95 disabled:opacity-40 transition"
        >
          +
        </button>

        <span className="text-xs text-gray-400">
          / {PARKING_CONFIG.TOTAL_LOTS} lots
        </span>
      </div>

      {/* Validation hint */}
      {!isValid && value.trim() !== '' && (
        <p className="text-xs text-red-500 mb-2">
          Enter a whole number between 0 and {PARKING_CONFIG.TOTAL_LOTS}.
        </p>
      )}

      {/* Apply button */}
      <button
        onClick={handleApply}
        disabled={!isValid || feedback.type === 'loading'}
        className="w-full py-2.5 bg-[#1e4b8e] text-white text-sm font-bold rounded-lg hover:bg-[#163a70] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {feedback.type === 'loading' ? 'Applying…' : 'Apply Correction'}
      </button>

      {/* Inline feedback */}
      {feedback.type === 'success' && (
        <p className="mt-2 text-xs font-medium text-green-600">
          ✓ {feedback.message}
        </p>
      )}
      {feedback.type === 'error' && (
        <p className="mt-2 text-xs font-medium text-red-600">
          ✗ {feedback.message}
        </p>
      )}

      <p className="mt-4 text-[10px] text-gray-400 leading-relaxed">
        This calls <code className="bg-gray-100 px-1 rounded">POST /events/set-count</code> directly.
        The dashboard updates automatically via Firestore.
      </p>
    </div>
  );
}
