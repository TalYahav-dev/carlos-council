'use client';

import { AgentOutput, Phase } from '@/lib/types';
import { PHASE_NAMES } from '@/lib/agents';
import AgentCard from './AgentCard';

interface PhaseSectionProps {
  phase: Phase;
  outputs: AgentOutput[];
  isCurrent: boolean;
  hideWhileStreaming?: boolean;
}

export default function PhaseSection({
  phase,
  outputs,
  isCurrent,
  hideWhileStreaming = false,
}: PhaseSectionProps) {
  const shouldHideContent = phase === 3 && isCurrent && hideWhileStreaming;

  if (outputs.length === 0 && !shouldHideContent && !isCurrent) return null;

  return (
    <div className="mb-10" id={`phase-${phase}`}>
      {/* Phase divider */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
            isCurrent
              ? 'bg-amber-100 text-[var(--gold)]'
              : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
          }`}
        >
          {phase}
        </div>
        <h2
          className={`text-lg font-medium ${
            isCurrent ? 'text-[var(--text)]' : 'text-[var(--text-secondary)]'
          }`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {PHASE_NAMES[phase]}
        </h2>
        {isCurrent && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--gold)] ml-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--gold)]" />
            </span>
            In Progress
          </div>
        )}
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      {/* Agent outputs */}
      {shouldHideContent ? (
        <div className="rounded-xl border border-amber-200 bg-[var(--gold-surface)] px-4 py-4 text-sm text-amber-800">
          The debate is in progress. Switch to live view at the top, or review the full debate when this phase finishes.
        </div>
      ) : outputs.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-4 text-sm text-[var(--text-muted)]">
          Waiting for this phase to begin...
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {outputs.map((output) => (
            <AgentCard key={`${phase}-${output.agentId}`} output={output} />
          ))}
        </div>
      )}
    </div>
  );
}
