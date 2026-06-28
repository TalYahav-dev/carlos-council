'use client';

import { useState } from 'react';
import { AgentOutput, AgentId } from '@/lib/types';
import { AGENTS } from '@/lib/agents';
import AgentStream from './AgentStream';

interface AgentCardProps {
  output: AgentOutput;
}

export default function AgentCard({ output }: AgentCardProps) {
  const agent = AGENTS[output.agentId as AgentId];
  const [expanded, setExpanded] = useState(false);
  if (!agent) return null;

  const isLong = output.isComplete && output.text.length > 280;
  const showCollapsed = isLong && !expanded && !output.isStreaming;

  return (
    <div className="animate-slide-in">
      {/* Chat bubble */}
      <div className="flex gap-3">
        {/* Agent avatar */}
        <div className="shrink-0 pt-0.5">
          {agent.id === 'carlos' ? (
            <div
              className={`relative w-8 h-8 rounded-full overflow-hidden shadow-sm ${
                output.isStreaming ? 'agent-active' : ''
              }`}
              style={{ color: output.isStreaming ? agent.color : undefined }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static illustration; next/image is unnecessary */}
              <img
                src="/carlos-avatar.webp"
                alt="Carlos"
                width={256}
                height={256}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div
              className={`relative w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm ${
                output.isStreaming ? 'agent-active' : ''
              }`}
              style={{
                backgroundColor: agent.color,
                color: output.isStreaming ? agent.color : undefined,
              }}
            >
              {agent.name[0]}
            </div>
          )}
        </div>

        {/* Message body */}
        <div className="flex-1 min-w-0">
          {/* Name and status bar */}
          <div className="flex items-baseline gap-2 mb-1">
            <span
              className="text-sm font-semibold"
              style={{ color: agent.color }}
            >
              {agent.name}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              {agent.title}
            </span>
            {output.isStreaming && (
              <span
                className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${agent.color}12`,
                  color: agent.color,
                }}
              >
                speaking
              </span>
            )}
            {output.isComplete && !output.isStreaming && (
              <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-600">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </div>

          {/* Content card */}
          <div
            className="rounded-xl px-4 py-3 border transition-colors duration-200"
            style={{
              backgroundColor: output.isStreaming ? `${agent.color}06` : 'var(--bg-surface)',
              borderColor: output.isStreaming ? `${agent.color}25` : 'var(--border)',
            }}
          >
            {showCollapsed ? (
              <>
                <div className="line-clamp-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                  {output.text}
                </div>
                <button
                  onClick={() => setExpanded(true)}
                  className="mt-2 text-xs font-medium cursor-pointer transition-colors duration-150 hover:underline"
                  style={{ color: agent.color }}
                >
                  Read full analysis
                </button>
              </>
            ) : (
              <>
                <AgentStream
                  text={output.text}
                  isStreaming={output.isStreaming}
                  isComplete={output.isComplete}
                  color={agent.color}
                />
                {expanded && (
                  <button
                    onClick={() => setExpanded(false)}
                    className="mt-2 text-xs font-medium cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-150"
                  >
                    Collapse
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
