'use client';

import { memo } from 'react';
import { useTypewriter } from '@/hooks/useTypewriter';
import ClientMarkdown from './ClientMarkdown';

interface AgentStreamProps {
  text: unknown;
  isStreaming: boolean;
  isComplete: boolean;
  color: string;
}

function AgentStreamInner({ text, isStreaming, isComplete, color }: AgentStreamProps) {
  const safeText = typeof text === 'string' ? text : String(text ?? '');
  const { visibleText, isDone } = useTypewriter(safeText, isStreaming);

  // Still waiting for first token
  if (!safeText && isStreaming) {
    return (
      <div className="flex items-center gap-2 py-1">
        <div className="flex gap-1">
          <span
            className="w-1.5 h-1.5 rounded-full animate-bounce"
            style={{ backgroundColor: color, animationDelay: '0s' }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full animate-bounce"
            style={{ backgroundColor: color, animationDelay: '0.15s' }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full animate-bounce"
            style={{ backgroundColor: color, animationDelay: '0.3s' }}
          />
        </div>
        <span className="text-[var(--text-muted)] text-sm">Thinking...</span>
      </div>
    );
  }

  if (!safeText) return null;

  // Streaming or typewriter still revealing: show plain text with cursor
  if (isStreaming || (!isDone && !isComplete)) {
    return (
      <div className="text-[var(--text)] text-sm leading-relaxed typewriter-text">
        {visibleText}
        <span className="streaming-cursor" />
      </div>
    );
  }

  // Complete: render full markdown
  if (isComplete || isDone) {
    return (
      <div className="prose prose-stone prose-sm max-w-none prose-p:text-[var(--text-secondary)] prose-headings:text-[var(--text)] prose-strong:text-[var(--text)] prose-li:text-[var(--text-secondary)] prose-code:text-amber-700 prose-code:bg-amber-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[var(--bg-elevated)] prose-pre:border prose-pre:border-[var(--border)] prose-a:text-[var(--gold)]">
        <ClientMarkdown text={safeText} />
      </div>
    );
  }

  return (
    <div className="text-[var(--text-secondary)] text-sm leading-relaxed typewriter-text">
      {visibleText || safeText}
    </div>
  );
}

const AgentStream = memo(AgentStreamInner);
AgentStream.displayName = 'AgentStream';

export default AgentStream;
