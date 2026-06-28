'use client';

import AgentCard from './AgentCard';
import ClientMarkdown from './ClientMarkdown';
import FinalSynthesis from './FinalSynthesis';
import { AGENTS, AGENT_ORDER, PHASE_NAMES } from '@/lib/agents';
import { AgentId, AgentOutput, SessionDetail } from '@/lib/types';

interface SessionReplayViewProps {
  session: SessionDetail;
}

function buildAgentOutput(agentId: AgentId, text: string): AgentOutput {
  return {
    agentId,
    name: AGENTS[agentId].name,
    text,
    isStreaming: false,
    isComplete: true,
  };
}

function ReplayPhaseHeader({ phase, label }: { phase: number; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold bg-[var(--bg-elevated)] text-[var(--text-muted)]">
        {phase}
      </div>
      <h3
        className="text-lg font-medium text-[var(--text)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {label}
      </h3>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

export default function SessionReplayView({ session }: SessionReplayViewProps) {
  const initialAnalysis = session.transcript.initial_analysis || {};
  const synthesis = session.transcript.synthesis?.carlos || '';
  const debateRounds = Object.entries(session.transcript.debate || {}).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
  const finalPlan = session.transcript.final?.carlos || '';

  const initialAnalysisOutputs = AGENT_ORDER
    .filter((agentId) => initialAnalysis[agentId])
    .map((agentId) => buildAgentOutput(agentId, initialAnalysis[agentId]));

  return (
    <div className="flex flex-col h-full">
      {/* Replay header */}
      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-4">
        <div className="flex flex-col gap-2 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--gold)]" />
            <h2
              className="text-[var(--text)] font-medium"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Session Replay
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]">
              {session.status}
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] max-w-3xl leading-relaxed">
            {session.brief}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl mx-auto px-6 py-6">
          {initialAnalysisOutputs.length > 0 && (
            <section className="mb-10">
              <ReplayPhaseHeader phase={1} label={PHASE_NAMES[1]} />
              <div className="flex flex-col gap-5">
                {initialAnalysisOutputs.map((output) => (
                  <AgentCard key={output.agentId} output={output} />
                ))}
              </div>
            </section>
          )}

          {synthesis && (
            <section className="mb-10">
              <ReplayPhaseHeader phase={2} label={PHASE_NAMES[2]} />
              <AgentCard output={buildAgentOutput('carlos', synthesis)} />
            </section>
          )}

          {debateRounds.length > 0 && (
            <section className="mb-10">
              <ReplayPhaseHeader phase={3} label={PHASE_NAMES[3]} />
              <div className="flex flex-col gap-4">
                {debateRounds.map(([roundKey, roundText], idx) => (
                  <div
                    key={roundKey}
                    className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-[var(--shadow-sm)]"
                  >
                    <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-[var(--gold)]" />
                        <span className="font-medium text-sm text-[var(--text)]">
                          Round {idx + 1}
                        </span>
                      </div>
                    </div>
                    <div className="px-4 py-4 prose prose-stone prose-sm max-w-none prose-p:text-[var(--text-secondary)] prose-headings:text-[var(--text)] prose-strong:text-[var(--text)] prose-li:text-[var(--text-secondary)] prose-code:text-amber-700 prose-code:bg-amber-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[var(--bg-elevated)] prose-pre:border prose-pre:border-[var(--border)] prose-a:text-[var(--gold)]">
                      <ClientMarkdown text={roundText} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {finalPlan && <FinalSynthesis text={finalPlan} />}
        </div>
      </div>
    </div>
  );
}
