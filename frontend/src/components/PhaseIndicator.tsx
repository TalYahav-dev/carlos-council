'use client';

import { Phase } from '@/lib/types';
import { PHASE_NAMES } from '@/lib/agents';

interface PhaseIndicatorProps {
  currentPhase: Phase | null;
}

export default function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const phases = [1, 2, 3, 4] as const;

  return (
    <div className="flex items-center justify-center gap-0 px-4 py-4">
      {phases.map((phase, idx) => {
        const isCurrent = currentPhase === phase;
        const isCompleted = currentPhase !== null && currentPhase > phase;
        const isFuture = currentPhase === null || currentPhase < phase;

        return (
          <div key={phase} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[var(--gold)] text-white'
                    : isCurrent
                      ? 'bg-[var(--gold)] text-white ring-4 ring-amber-200'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  phase
                )}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  isCurrent
                    ? 'text-[var(--gold)]'
                    : isCompleted
                      ? 'text-[var(--text-secondary)]'
                      : 'text-[var(--text-muted)]'
                }`}
              >
                {PHASE_NAMES[phase]}
              </span>
            </div>

            {idx < phases.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-2 mt-[-1rem] rounded-full transition-colors duration-300 ${
                  isCompleted
                    ? 'bg-[var(--gold)]'
                    : isFuture
                      ? 'bg-[var(--border)]'
                      : 'bg-[var(--border-strong)]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
