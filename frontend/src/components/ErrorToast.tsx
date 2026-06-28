'use client';

import { useEffect } from 'react';
import { useCouncilStore } from '@/stores/councilStore';

export default function ErrorToast() {
  const error = useCouncilStore((s) => s.error);
  const setError = useCouncilStore((s) => s.setError);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(''), 8000);
    return () => clearTimeout(timer);
  }, [error, setError]);

  if (!error) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in">
      <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-[var(--shadow-lg)] max-w-sm">
        <svg
          className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={() => setError('')}
          className="text-red-400 hover:text-red-600 shrink-0 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
