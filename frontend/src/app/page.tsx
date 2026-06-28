'use client';

import { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import { useCouncilStore } from '@/stores/councilStore';
import { useCouncilStream } from '@/hooks/useCouncilStream';
import { getSession } from '@/lib/api';
import { SessionDetail } from '@/lib/types';
import BriefForm from '@/components/BriefForm';
import CouncilView from '@/components/CouncilView';
import SessionHistory from '@/components/SessionHistory';
import SessionReplayView from '@/components/SessionReplayView';
import ErrorToast from '@/components/ErrorToast';
import OnboardingOverlay from '@/components/OnboardingOverlay';

export default function Home() {
  const sessionId = useCouncilStore((s) => s.sessionId);
  const status = useCouncilStore((s) => s.status);
  const reset = useCouncilStore((s) => s.reset);
  const setError = useCouncilStore((s) => s.setError);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [isLoadingReplay, setIsLoadingReplay] = useState(false);

  // Connect SSE stream when we have a session
  useCouncilStream(selectedSession ? null : sessionId);

  const isLiveSessionActive = status !== 'idle';

  const handleNewSession = () => {
    setSelectedSession(null);
    reset();
  };

  const handleExitReplay = () => {
    setSelectedSession(null);
  };

  const handleSelectSession = async (id: string) => {
    setHistoryOpen(false);
    setIsLoadingReplay(true);

    try {
      const session = await getSession(id);
      setSelectedSession(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setIsLoadingReplay(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <AppHeader
        activeView="council"
        onOpenHistory={() => setHistoryOpen(true)}
        actions={selectedSession ? (
          <button
            onClick={handleExitReplay}
            className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg transition-colors cursor-pointer"
          >
            Exit Replay
          </button>
        ) : isLiveSessionActive ? (
          <button
            onClick={handleNewSession}
            className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg transition-colors cursor-pointer"
          >
            New Session
          </button>
        ) : null}
      />

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {isLoadingReplay ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-3 text-[var(--text-muted)] text-sm">
              <div className="w-5 h-5 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
              Loading session replay...
            </div>
          </div>
        ) : selectedSession ? (
          <SessionReplayView session={selectedSession} />
        ) : isLiveSessionActive ? (
          <CouncilView />
        ) : (
          <BriefForm />
        )}
      </main>

      {/* Session history sidebar */}
      <SessionHistory
        isOpen={historyOpen}
        onToggle={() => setHistoryOpen(!historyOpen)}
        onSelectSession={handleSelectSession}
        currentSessionId={selectedSession?.id ?? sessionId}
      />

      {/* Error toast */}
      <ErrorToast />

      {/* First-run onboarding */}
      <OnboardingOverlay />
    </div>
  );
}
