'use client';

import { useEffect, useRef } from 'react';
import { getCouncilSnapshot, getStreamUrl } from '@/lib/api';
import { useCouncilStore } from '@/stores/councilStore';

export function useCouncilStream(sessionId: string | null) {
  const store = useCouncilStore();
  const eventSourceRef = useRef<EventSource | null>(null);
  const tokenBufferRef = useRef<Record<string, string>>({});
  const rafRef = useRef<number | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const streamTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    let hasReceivedStreamEvent = false;
    let isUsingPolling = false;
    let es: EventSource | null = null;

    // Token batching: accumulate tokens and flush via rAF
    const flushTokens = () => {
      const buffer = tokenBufferRef.current;
      const keys = Object.keys(buffer);
      if (keys.length === 0) return;

      const currentPhase = useCouncilStore.getState().currentPhase;
      if (!currentPhase) return;

      for (const agentId of keys) {
        const tokens = buffer[agentId];
        if (tokens) {
          useCouncilStore.getState().appendToken(currentPhase, agentId, tokens);
        }
      }
      tokenBufferRef.current = {};
    };

    const clearPolling = () => {
      if (pollingIntervalRef.current) {
        window.clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };

    const clearStreamTimeout = () => {
      if (streamTimeoutRef.current) {
        window.clearTimeout(streamTimeoutRef.current);
        streamTimeoutRef.current = null;
      }
    };

    const pollSnapshot = async () => {
      try {
        const snapshot = await getCouncilSnapshot(sessionId);
        useCouncilStore.getState().hydrateFromSnapshot(snapshot);
        if (snapshot.status === 'completed' || snapshot.status === 'error') {
          clearPolling();
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to load council snapshot';
        useCouncilStore.getState().setError(message);
        clearPolling();
      }
    };

    const startPollingFallback = () => {
      if (isUsingPolling) return;
      isUsingPolling = true;
      clearStreamTimeout();
      es?.close();
      store.setTransportMode('polling');
      void pollSnapshot();
      pollingIntervalRef.current = window.setInterval(() => {
        void pollSnapshot();
      }, 3000);
    };

    const scheduleFlush = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        flushTokens();
        rafRef.current = null;
      });
    };

    const markStreamActive = () => {
      hasReceivedStreamEvent = true;
      clearStreamTimeout();
      if (!isUsingPolling) {
        store.setTransportMode('stream');
      }
    };

    if (shouldPreferPolling()) {
      startPollingFallback();
    } else {
      es = new EventSource(getStreamUrl(sessionId));
      eventSourceRef.current = es;

      es.addEventListener('phase_change', (e) => {
        markStreamActive();
        // Flush any pending tokens before phase change
        flushTokens();
        const data = JSON.parse(e.data);
        store.setPhase(data.phase);
      });

      es.addEventListener('agent_start', (e) => {
        markStreamActive();
        const data = JSON.parse(e.data);
        const currentPhase = useCouncilStore.getState().currentPhase;
        if (currentPhase) {
          store.startAgent(currentPhase, data.agent_id, data.name || data.agent_id);
        }
      });

      es.addEventListener('agent_token', (e) => {
        markStreamActive();
        const data = JSON.parse(e.data);
        const agentId = data.agent_id;
        tokenBufferRef.current[agentId] =
          (tokenBufferRef.current[agentId] || '') + data.token;
        scheduleFlush();
      });

      es.addEventListener('agent_complete', (e) => {
        markStreamActive();
        // Flush pending tokens for this agent first
        flushTokens();
        const data = JSON.parse(e.data);
        const currentPhase = useCouncilStore.getState().currentPhase;
        if (currentPhase) {
          store.completeAgent(currentPhase, data.agent_id, data.text || '');
        }
      });

      es.addEventListener('clarification', (e) => {
        markStreamActive();
        const data = JSON.parse(e.data);
        const questions = (data.questions || []).map((q: string) => ({
          id: q,
          question: q,
        }));
        store.setClarificationQuestions(questions);
      });

      es.addEventListener('clarification_received', () => {
        markStreamActive();
        store.setStatus('running');
      });

      es.addEventListener('debate_round', () => {
        markStreamActive();
      });

      es.addEventListener('council_complete', () => {
        markStreamActive();
        flushTokens();
        store.setStatus('completed');
        clearPolling();
        es?.close();
      });

      es.addEventListener('error', (e: Event) => {
        const me = e as MessageEvent;
        if (me.data) {
          try {
            const data = JSON.parse(me.data);
            store.setError(data.message || 'An unknown error occurred');
          } catch {
            // Not a JSON event
          }
        }
        if (!hasReceivedStreamEvent || es?.readyState === EventSource.CLOSED) {
          startPollingFallback();
        }
      });

      streamTimeoutRef.current = window.setTimeout(() => {
        if (!hasReceivedStreamEvent) {
          startPollingFallback();
        }
      }, 5000);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearStreamTimeout();
      clearPolling();
      flushTokens();
      es?.close();
      eventSourceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);
}


function shouldPreferPolling(): boolean {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.local')
  ) {
    return false;
  }

  if (hostname.startsWith('10.') || hostname.startsWith('192.168.')) {
    return false;
  }

  const private172 = hostname.match(/^172\.(\d+)\./);
  if (private172) {
    const secondOctet = Number(private172[1]);
    if (secondOctet >= 16 && secondOctet <= 31) {
      return false;
    }
  }

  return true;
}
