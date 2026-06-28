'use client';

import { lazy, Suspense, useEffect, useState } from 'react';

const LazySpline = lazy(() => import('@splinetool/react-spline'));

type SplineSceneProps = {
  scene: string;
  className?: string;
};

export default function SplineScene({ scene, className = '' }: SplineSceneProps) {
  const [shouldLoadScene, setShouldLoadScene] = useState(false);

  useEffect(() => {
    let active = true;
    const requestIdleCallback = window.requestIdleCallback?.bind(window);
    const cancelIdleCallback = window.cancelIdleCallback?.bind(window);

    const startLoading = () => {
      if (active) {
        setShouldLoadScene(true);
      }
    };

    if (requestIdleCallback && cancelIdleCallback) {
      const idleId = requestIdleCallback(startLoading, { timeout: 1200 });
      return () => {
        active = false;
        cancelIdleCallback(idleId);
      };
    }

    const timeoutId = globalThis.setTimeout(startLoading, 250);
    return () => {
      active = false;
      globalThis.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className={`relative h-full w-full ${className}`.trim()}>
      <Suspense fallback={<SplineFallback />}>
        {shouldLoadScene ? (
          <LazySpline scene={scene} className="h-full w-full" />
        ) : (
          <SplineFallback />
        )}
      </Suspense>
    </div>
  );
}

function SplineFallback() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(250,250,249,0.92))]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.22),transparent_55%)]" />
      <div className="relative z-10 flex flex-col items-center gap-4 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-amber-200/80 bg-white/80 shadow-[0_18px_40px_rgba(180,83,9,0.12)] backdrop-blur">
          <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 border-t-amber-600 animate-spin" />
          <PawPrintIcon className="h-8 w-8 text-amber-700" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Warming up Carlos&apos;s corner
          </p>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
            Spline scene loading
          </p>
        </div>
      </div>
    </div>
  );
}

function PawPrintIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true" className={className}>
      <circle cx="18" cy="20" r="6" />
      <circle cx="30" cy="14" r="6" />
      <circle cx="44" cy="18" r="6" />
      <circle cx="50" cy="32" r="6" />
      <path d="M32.9 28.5c-7.4 0-14.8 5.3-14.8 12.8 0 5.5 4.2 9.7 10.2 9.7 2.2 0 4.1-.8 5.6-1.7 1.5.9 3.4 1.7 5.6 1.7 6 0 10.2-4.2 10.2-9.7 0-7.5-7.5-12.8-14.9-12.8-.6 0-1.3 0-1.9.1z" />
    </svg>
  );
}
