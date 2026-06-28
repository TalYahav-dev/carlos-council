'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '@/lib/api';

const STORAGE_KEY = 'carlos-onboarding-seen';

const STEPS = [
  {
    image: '/onboarding-analyze.webp',
    alt: 'Carlos and five specialists studying a business brief together',
    heading: 'Your council convenes',
    copy: 'Five specialists and Carlos study your brief from every angle.',
  },
  {
    image: '/onboarding-clarify.webp',
    alt: 'Carlos pausing to ask a clarifying question',
    heading: 'Carlos asks what matters',
    copy: 'He pauses to ask the few questions that change the answer.',
  },
  {
    image: '/onboarding-plan.webp',
    alt: 'Carlos presenting a finished strategic plan',
    heading: 'A plan grounded in your business',
    copy: 'The council debates, then Carlos delivers one clear plan — sharper when it knows your business. Set up your dossier once and every council inherits it.',
  },
];

export default function OnboardingOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Onboarding is the first-time setup: show it only when the business dossier
  // has never been saved (updated_at === null) and the user hasn't dismissed it
  // before. Both checks run after mount to stay SSR-safe.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (localStorage.getItem(STORAGE_KEY)) return;
        const { updated_at } = await getProfile();
        if (!cancelled && updated_at === null) setIsOpen(true);
      } catch {
        // Backend unreachable or storage blocked — skip onboarding.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore write failures; the modal still closes for this session.
    }
    setIsOpen(false);
  }, []);

  // Finish onboarding by sending the user into business-dossier setup.
  const goToDossier = useCallback(() => {
    dismiss();
    router.push('/profile');
  }, [dismiss, router]);

  // Focus the dialog when it opens.
  useEffect(() => {
    if (isOpen) dialogRef.current?.focus();
  }, [isOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, dismiss]);

  if (!isOpen) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const headingId = 'carlos-onboarding-heading';
  const descId = 'carlos-onboarding-desc';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm animate-fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descId}
        tabIndex={-1}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)] animate-slide-in focus:outline-none"
      >
        {/* Skip */}
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 z-10 cursor-pointer rounded-lg px-2.5 py-1 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
        >
          Skip for now
        </button>

        <div className="px-6 pb-6 pt-8">
          {/* Illustration */}
          <div className="mx-auto mb-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--gold-surface)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- static illustration; next/image is unnecessary */}
            <img
              src={current.image}
              alt={current.alt}
              width={800}
              height={600}
              className="h-auto w-full"
            />
          </div>

          <h2
            id={headingId}
            className="mb-2 text-2xl font-normal text-[var(--text)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {current.heading}
          </h2>
          <p
            id={descId}
            className="text-sm leading-relaxed text-[var(--text-secondary)]"
          >
            {current.copy}
          </p>

          {/* Step indicator */}
          <div className="mt-5 flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s.heading}
                aria-hidden="true"
                className="h-1.5 rounded-full transition-all duration-200"
                style={{
                  width: i === step ? 20 : 6,
                  backgroundColor:
                    i === step ? 'var(--gold)' : 'var(--border-strong)',
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] ${
                step === 0 ? 'invisible' : ''
              }`}
            >
              Back
            </button>
            <button
              type="button"
              onClick={() =>
                isLast ? goToDossier() : setStep((s) => Math.min(STEPS.length - 1, s + 1))
              }
              className="cursor-pointer rounded-xl px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
              style={{ backgroundColor: 'var(--gold)' }}
            >
              {isLast ? 'Set up your business dossier' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
