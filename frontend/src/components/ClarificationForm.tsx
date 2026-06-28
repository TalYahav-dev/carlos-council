'use client';

import { useState } from 'react';
import { submitClarification } from '@/lib/api';
import { useCouncilStore } from '@/stores/councilStore';

export default function ClarificationForm() {
  const {
    sessionId,
    clarificationQuestions,
    clarificationAnswers,
    setClarificationAnswer,
    setStatus,
    setError,
  } = useCouncilStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitClarification(sessionId, clarificationAnswers);
      setStatus('running');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to submit answers',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const allAnswered = clarificationQuestions.every(
    (q) => clarificationAnswers[q.id]?.trim(),
  );

  return (
    <div className="animate-slide-in mx-auto max-w-2xl my-6">
      <div className="rounded-2xl border border-amber-200 bg-[var(--gold-surface)] p-6 shadow-[var(--shadow)]">
        {/* Header with Carlos avatar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-amber-200 bg-[var(--bg-surface)] shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element -- static illustration; next/image is unnecessary */}
            <img
              src="/carlos-listening.webp"
              alt="Carlos leaning in to listen"
              width={240}
              height={240}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h3
              className="text-[var(--gold)] font-medium text-lg"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Carlos needs more information
            </h3>
            <p className="text-amber-700/60 text-xs">
              Help the council provide a more tailored strategy
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {clarificationQuestions.map((q, idx) => (
            <div key={q.id}>
              <label htmlFor={`clarify-${q.id}`} className="block text-sm text-[var(--text)] mb-1.5">
                <span className="text-[var(--gold)] font-semibold mr-1.5">
                  {idx + 1}.
                </span>
                {q.question}
              </label>
              <input
                id={`clarify-${q.id}`}
                type="text"
                value={clarificationAnswers[q.id] || ''}
                onChange={(e) => setClarificationAnswer(q.id, e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-amber-200 rounded-xl px-4 py-2.5 text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] transition-colors text-sm"
                placeholder="Your answer..."
                disabled={isSubmitting}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={!allAnswered || isSubmitting}
            className="w-full py-3 px-6 bg-[var(--gold)] hover:bg-amber-600 disabled:bg-[var(--bg-elevated)] disabled:text-[var(--text-muted)] text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </>
            ) : (
              'Submit Answers'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
