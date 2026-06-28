'use client';

import { useState } from 'react';
import { startCouncil } from '@/lib/api';
import { useCouncilStore } from '@/stores/councilStore';
import { AGENTS, AGENT_ORDER } from '@/lib/agents';
import SplineScene from '@/components/SplineScene';

const COUNCIL_MEMBERS = [
  AGENTS.carlos,
  ...AGENT_ORDER.map((id) => AGENTS[id]),
];

export default function BriefForm() {
  const sceneUrl = process.env.NEXT_PUBLIC_SPLINE_SCENE_URL?.trim() ?? '';
  const hasSplineScene = Boolean(sceneUrl);
  const [brief, setBrief] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setSessionId, setStatus, setError } = useCouncilStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brief.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setStatus('running');

    try {
      const { session_id } = await startCouncil(brief.trim());
      setSessionId(session_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start council');
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formProps = {
    brief,
    isSubmitting,
    setBrief,
    handleSubmit,
  };

  if (!hasSplineScene) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="w-full max-w-2xl">
          <CouncilIntro splitLayout={false} />
          <BriefComposer {...formProps} />
          <CouncilRoster splitLayout={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-8 sm:py-10">
      <div className="mx-auto flex min-h-full w-full items-start justify-center lg:items-center">
        <div className="w-full max-w-6xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
            <div className="relative w-full lg:w-1/2">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[85%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(180,83,9,0.22),rgba(254,243,199,0.18)_42%,transparent_72%)] blur-3xl animate-warm-glow" />
              <div className="relative mx-auto aspect-square w-full max-w-[32rem] max-h-[40vh] overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,251,235,0.95),rgba(250,250,249,0.9))] shadow-[var(--shadow-lg)] lg:mx-0 lg:max-h-none lg:max-w-none">
                <div className="pointer-events-none absolute inset-x-6 top-5 z-10 flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  <span>Carlos Presence</span>
                  <span>Interactive Spline</span>
                </div>
                <SplineScene scene={sceneUrl} className="h-full w-full" />
              </div>
            </div>

            <div className="w-full lg:w-1/2">
              <CouncilIntro splitLayout />
              <BriefComposer {...formProps} />
              <CouncilRoster splitLayout />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type CouncilIntroProps = {
  splitLayout: boolean;
};

function CouncilIntro({ splitLayout }: CouncilIntroProps) {
  return (
    <div className={splitLayout ? 'mb-8 text-center lg:text-left' : 'mb-10 text-center'}>
      {!splitLayout && (
        // eslint-disable-next-line @next/next/no-img-element -- static illustration; next/image is unnecessary
        <img
          src="/carlos-hero.webp"
          alt="Carlos, the Chief Strategy Conductor, seated and ready to convene the council"
          width={1000}
          height={1250}
          className="mx-auto mb-6 w-full max-w-[300px] rounded-2xl shadow-[var(--shadow-md)] animate-fade-in"
        />
      )}
      <div className={`mb-6 flex items-center gap-3 ${splitLayout ? 'justify-center lg:justify-start' : 'justify-center'}`}>
        {COUNCIL_MEMBERS.map((agent, i) => (
          <div
            key={agent.id}
            className="relative group cursor-default"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {agent.id === 'carlos' ? (
              <div
                className="h-10 w-10 overflow-hidden rounded-full shadow-sm ring-2 ring-amber-300 transition-transform duration-200 group-hover:scale-110"
                title={`${agent.name} — ${agent.title}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- static illustration; next/image is unnecessary */}
                <img
                  src="/carlos-avatar.webp"
                  alt={`${agent.name}, ${agent.title}`}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm transition-transform duration-200 group-hover:scale-110"
                style={{ backgroundColor: agent.color }}
                title={`${agent.name} — ${agent.title}`}
              >
                {agent.name[0]}
              </div>
            )}
            {agent.id === 'carlos' && (
              <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-amber-400">
                <svg className="h-2 w-2 text-amber-900" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      <h1
        className="mb-3 text-4xl font-normal"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Carlos Council
      </h1>
      <p className={`text-base leading-relaxed text-[var(--text-secondary)] ${splitLayout ? 'mx-auto max-w-md lg:mx-0' : 'mx-auto max-w-md'}`}>
        Six AI strategists ready to analyze, debate, and craft a
        comprehensive plan for your business.
      </p>
      <p className={`mt-3 text-sm italic text-[var(--text-muted)] ${splitLayout ? 'mx-auto max-w-md lg:mx-0' : 'mx-auto max-w-md'}`}
        style={{ fontFamily: 'var(--font-display)' }}>
        Carlos brings the council to order — and stays until you have a plan worth keeping.
      </p>
    </div>
  );
}

const EXAMPLE_BRIEFS = [
  'We make a project-management app for freelancers. Growth has stalled at 2,000 users. How do we reach 10,000?',
  'I run a small coffee roastery and want to launch a subscription. How should I price and position it?',
  'We have a B2B analytics product with great retention but a long sales cycle. How do we shorten it?',
];

type BriefComposerProps = {
  brief: string;
  isSubmitting: boolean;
  setBrief: (brief: string) => void;
  handleSubmit: (event: React.FormEvent) => Promise<void>;
};

function BriefComposer({
  brief,
  isSubmitting,
  setBrief,
  handleSubmit,
}: BriefComposerProps) {
  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)] transition-shadow duration-200 focus-within:border-[var(--border-strong)] focus-within:shadow-[var(--shadow-lg)]">
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          aria-label="Business brief"
          placeholder="Describe your business challenge, product idea, or strategy question..."
          rows={4}
          className="w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[15px] leading-relaxed text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none"
          disabled={isSubmitting}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.metaKey) {
              handleSubmit(e);
            }
          }}
        />
        <div className="flex items-center justify-between px-4 pb-3">
          <span className="text-xs text-[var(--text-muted)]">
            {brief.length > 0 ? `${brief.length} characters` : 'Be as detailed as you can'}
          </span>
          <button
            type="submit"
            disabled={!brief.trim() || isSubmitting}
            className="flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              backgroundColor: !brief.trim() || isSubmitting ? 'var(--bg-elevated)' : 'var(--gold)',
              color: !brief.trim() || isSubmitting ? 'var(--text-muted)' : '#FFFFFF',
            }}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner />
                Convening...
              </>
            ) : (
              <>
                Convene
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
      {brief.length === 0 && !isSubmitting && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="self-center text-xs text-[var(--text-muted)]">Try an example:</span>
          {EXAMPLE_BRIEFS.map((example, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setBrief(example)}
              className="cursor-pointer rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--border-strong)] hover:text-[var(--text)]"
            >
              {example.split('.')[0].slice(0, 38)}…
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

function CouncilRoster({ splitLayout }: { splitLayout: boolean }) {
  return (
    <div className={`mt-8 flex flex-wrap gap-2 ${splitLayout ? 'justify-center lg:justify-start' : 'justify-center'}`}>
      {COUNCIL_MEMBERS.map((agent) => (
        <div
          key={agent.id}
          className="flex cursor-default items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-secondary)]"
        >
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: agent.color }}
          />
          {agent.name}
          <span className="hidden text-[var(--text-muted)] sm:inline">
            · {agent.title}
          </span>
        </div>
      ))}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
