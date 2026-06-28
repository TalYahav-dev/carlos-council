'use client';

import ClientMarkdown from './ClientMarkdown';

interface FinalSynthesisProps {
  text: unknown;
}

export default function FinalSynthesis({ text }: FinalSynthesisProps) {
  const safeText = typeof text === 'string' ? text : String(text ?? '');
  if (!safeText) return null;

  return (
    <div className="mx-auto max-w-3xl my-8 animate-slide-in">
      <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-[var(--gold-surface)] to-[var(--bg-surface)] overflow-hidden shadow-[var(--shadow-lg)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-amber-200 bg-[var(--gold-light)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-amber-200 bg-[var(--bg-surface)] shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element -- static illustration; next/image is unnecessary */}
                <img
                  src="/carlos-avatar.webp"
                  alt="Carlos"
                  width={256}
                  height={256}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h3
                  className="text-[var(--gold)] font-medium text-lg"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Final Strategic Plan
                </h3>
                <p className="text-amber-700/60 text-xs mt-0.5">
                  Synthesized from all council members
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-700 text-xs font-medium">
                Complete
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <div className="prose prose-stone prose-base max-w-none prose-p:text-[var(--text-secondary)] prose-headings:text-[var(--text)] prose-strong:text-[var(--text)] prose-li:text-[var(--text-secondary)] prose-code:text-amber-700 prose-code:bg-amber-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[var(--bg-elevated)] prose-pre:border prose-pre:border-[var(--border)] prose-a:text-[var(--gold)] prose-h2:border-b prose-h2:border-[var(--border)] prose-h2:pb-2">
            <ClientMarkdown text={safeText} />
          </div>
        </div>
      </div>
    </div>
  );
}
