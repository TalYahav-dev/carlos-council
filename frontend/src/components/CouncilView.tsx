'use client';

import { useState } from 'react';
import { useCouncilStore } from '@/stores/councilStore';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { Phase } from '@/lib/types';
import PhaseIndicator from './PhaseIndicator';
import PhaseSection from './PhaseSection';
import ClarificationForm from './ClarificationForm';
import FinalSynthesis from './FinalSynthesis';

export default function CouncilView() {
  const status = useCouncilStore((s) => s.status);
  const transportMode = useCouncilStore((s) => s.transportMode);
  const currentPhase = useCouncilStore((s) => s.currentPhase);
  const agentOutputs = useCouncilStore((s) => s.agentOutputs);
  const finalSynthesis = useCouncilStore((s) => s.finalSynthesis);
  const [debateViewMode, setDebateViewMode] = useState<'review' | 'live'>('review');

  const { containerRef, handleScroll } = useAutoScroll([
    agentOutputs,
    currentPhase,
    status,
  ]);

  const phases = Array.from(
    new Set(
      [
        ...Object.keys(agentOutputs).map(Number),
        currentPhase ?? null,
      ].filter((phase): phase is Phase => phase !== null),
    ),
  )
    .map(Number)
    .sort() as Phase[];

  return (
    <div className="flex flex-col h-full">
      {/* Phase indicator bar */}
      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--bg-surface)] sticky top-0 z-10">
        <PhaseIndicator currentPhase={currentPhase} />
        <div className="px-6 pb-3 flex items-center justify-between gap-4">
          <div className="text-xs text-[var(--text-muted)]">
            Debate view
          </div>
          <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-0.5">
            <button
              onClick={() => setDebateViewMode('review')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                debateViewMode === 'review'
                  ? 'bg-[var(--bg-surface)] text-[var(--text)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              After Debate
            </button>
            <button
              onClick={() => setDebateViewMode('live')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                debateViewMode === 'live'
                  ? 'bg-[var(--bg-surface)] text-[var(--text)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Live
            </button>
          </div>
        </div>
      </div>

      {/* Main scrollable area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar"
      >
        <div className="max-w-3xl mx-auto px-6 py-6">
          {transportMode === 'polling' && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-[var(--gold-surface)] px-4 py-4 text-sm text-amber-800">
              Live streaming is unavailable on this network. The council is using compatibility mode.
            </div>
          )}

          {/* Loading state */}
          {phases.length === 0 && status === 'running' && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-amber-200" />
                <div className="absolute inset-0 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
              </div>
              <p className="text-[var(--text-muted)] text-sm">
                Council is assembling...
              </p>
            </div>
          )}

          {/* Phase sections */}
          {phases.map((phase) => (
            <PhaseSection
              key={phase}
              phase={phase}
              outputs={agentOutputs[phase] || []}
              isCurrent={currentPhase === phase}
              hideWhileStreaming={debateViewMode === 'review'}
            />
          ))}

          {/* Clarification form */}
          {status === 'clarifying' && <ClarificationForm />}

          {/* Final synthesis */}
          {finalSynthesis && <FinalSynthesis text={finalSynthesis} />}

          {/* Completed */}
          {status === 'completed' && !finalSynthesis && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Council session complete
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
