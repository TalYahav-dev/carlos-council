'use client';

import { useEffect, useState, useCallback } from 'react';
import { listSessions } from '@/lib/api';
import { SessionSummary } from '@/lib/types';

interface SessionHistoryProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectSession: (id: string) => void;
  currentSessionId: string | null;
}

export default function SessionHistory({
  isOpen,
  onToggle,
  onSelectSession,
  currentSessionId,
}: SessionHistoryProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listSessions();
      setSessions(data);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadSessions();
  }, [isOpen, loadSessions]);

  return (
    <>
      {/* Sidebar overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-[var(--bg-surface)] border-l border-[var(--border)] z-40 transform transition-transform duration-300 shadow-[var(--shadow-lg)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
          <h3
            className="text-[var(--text)] font-medium text-lg"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Session History
          </h3>
          <button
            onClick={onToggle}
            aria-label="Close session history"
            className="p-1 hover:bg-[var(--bg-elevated)] rounded text-[var(--text-muted)] cursor-pointer"
          >
            <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-65px)] custom-scrollbar">
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && sessions.length === 0 && (
            <div className="flex flex-col items-center px-4 py-10">
              {/* eslint-disable-next-line @next/next/no-img-element -- static illustration; next/image is unnecessary */}
              <img
                src="/empty-carlos.webp"
                alt="Carlos resting, waiting for your first brief"
                width={160}
                height={160}
                className="mb-4 h-40 w-40 rounded-2xl"
              />
              <p className="text-[var(--text-muted)] text-sm text-center">
                No past sessions yet
              </p>
            </div>
          )}

          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full text-left px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer ${
                currentSessionId === session.id ? 'bg-[var(--bg-elevated)]' : ''
              }`}
            >
              <p className="text-sm text-[var(--text)] line-clamp-2 leading-relaxed">
                {session.brief}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    session.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : session.status === 'running'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]'
                  }`}
                >
                  {session.status}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {new Date(session.created_at).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
