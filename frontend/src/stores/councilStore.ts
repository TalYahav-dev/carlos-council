'use client';

import { create } from 'zustand';
import {
  AgentId,
  AgentOutput,
  ClarificationQuestion,
  Phase,
  SessionStatus,
  SessionSnapshot,
  TransportMode,
} from '@/lib/types';
import { AGENTS } from '@/lib/agents';
import { AGENT_ORDER } from '@/lib/agents';

interface CouncilState {
  sessionId: string | null;
  status: SessionStatus;
  transportMode: TransportMode;
  currentPhase: Phase | null;
  agentOutputs: Record<number, AgentOutput[]>;
  clarificationQuestions: ClarificationQuestion[];
  clarificationAnswers: Record<string, string>;
  finalSynthesis: string;
  error: string | null;

  setSessionId: (id: string) => void;
  setStatus: (status: SessionStatus) => void;
  setTransportMode: (mode: TransportMode) => void;
  setPhase: (phase: Phase) => void;
  appendToken: (phase: number, agentId: string, token: string) => void;
  startAgent: (phase: number, agentId: string, name: string) => void;
  completeAgent: (phase: number, agentId: string, text: string) => void;
  setClarificationQuestions: (questions: ClarificationQuestion[]) => void;
  setClarificationAnswer: (id: string, answer: string) => void;
  setFinalSynthesis: (text: string) => void;
  setError: (error: string) => void;
  hydrateFromSnapshot: (snapshot: SessionSnapshot) => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  status: 'idle' as SessionStatus,
  transportMode: null as TransportMode,
  currentPhase: null as Phase | null,
  agentOutputs: {} as Record<number, AgentOutput[]>,
  clarificationQuestions: [] as ClarificationQuestion[],
  clarificationAnswers: {} as Record<string, string>,
  finalSynthesis: '',
  error: null as string | null,
};

export const useCouncilStore = create<CouncilState>((set) => ({
  ...initialState,

  setSessionId: (id) => set({ sessionId: id }),

  setStatus: (status) => set({ status }),

  setTransportMode: (transportMode) => set({ transportMode }),

  setPhase: (phase) =>
    set((state) => ({
      currentPhase: phase,
      status: 'running',
      agentOutputs: {
        ...state.agentOutputs,
        [phase]: state.agentOutputs[phase] || [],
      },
    })),

  startAgent: (phase, agentId, name) =>
    set((state) => {
      const phaseOutputs = state.agentOutputs[phase] || [];
      const existing = phaseOutputs.find((o) => o.agentId === agentId);
      if (existing) return state;

      const agentMeta = AGENTS[agentId as AgentId];
      return {
        agentOutputs: {
          ...state.agentOutputs,
          [phase]: [
            ...phaseOutputs,
            {
              agentId: agentId as AgentId,
              name: agentMeta?.name || name,
              text: '',
              isStreaming: true,
              isComplete: false,
            },
          ],
        },
      };
    }),

  appendToken: (phase, agentId, token) =>
    set((state) => {
      const phaseOutputs = state.agentOutputs[phase] || [];
      const idx = phaseOutputs.findIndex((o) => o.agentId === agentId);
      if (idx === -1) return state;

      const updated = [...phaseOutputs];
      updated[idx] = {
        ...updated[idx],
        text: updated[idx].text + token,
      };

      return {
        agentOutputs: {
          ...state.agentOutputs,
          [phase]: updated,
        },
      };
    }),

  completeAgent: (phase, agentId, text) =>
    set((state) => {
      const phaseOutputs = state.agentOutputs[phase] || [];
      const idx = phaseOutputs.findIndex((o) => o.agentId === agentId);
      if (idx === -1) return state;

      const updated = [...phaseOutputs];
      updated[idx] = {
        ...updated[idx],
        text: text || updated[idx].text,
        isStreaming: false,
        isComplete: true,
      };

      return {
        agentOutputs: {
          ...state.agentOutputs,
          [phase]: updated,
        },
      };
    }),

  setClarificationQuestions: (questions) =>
    set({
      clarificationQuestions: questions,
      status: 'clarifying',
    }),

  setClarificationAnswer: (id, answer) =>
    set((state) => ({
      clarificationAnswers: {
        ...state.clarificationAnswers,
        [id]: answer,
      },
    })),

  setFinalSynthesis: (text) => set({ finalSynthesis: text }),

  setError: (error) => set({ error, status: 'error' }),

  hydrateFromSnapshot: (snapshot) =>
    set((state) => {
      const phaseOutputs = buildAgentOutputsFromTranscript(snapshot.transcript);
      const clarificationQuestions = (snapshot.clarification_questions || []).map((question) => ({
        id: question,
        question,
      }));

      return {
        sessionId: snapshot.session_id,
        status: mapBackendStatus(snapshot.status),
        currentPhase: snapshot.phase,
        agentOutputs: phaseOutputs,
        clarificationQuestions,
        clarificationAnswers:
          Object.keys(snapshot.clarification_answers || {}).length > 0
            ? snapshot.clarification_answers
            : state.clarificationAnswers,
        finalSynthesis: snapshot.transcript.final?.carlos || '',
        error: state.error,
      };
    }),

  reset: () => set(initialState),
}));


function mapBackendStatus(status: string): SessionStatus {
  if (status === 'awaiting_clarification') return 'clarifying';
  if (status === 'completed') return 'completed';
  if (status === 'error') return 'error';
  return 'running';
}


function buildAgentOutputsFromTranscript(
  transcript: Record<string, Record<string, string>>,
): Record<number, AgentOutput[]> {
  const outputs: Record<number, AgentOutput[]> = {};
  const initialAnalysis = transcript.initial_analysis || {};
  const synthesis = transcript.synthesis?.carlos || '';
  const debate = transcript.debate || {};
  const finalPlan = transcript.final?.carlos || '';

  const phaseOne = AGENT_ORDER
    .filter((agentId) => initialAnalysis[agentId])
    .map((agentId) => buildCompleteOutput(agentId, initialAnalysis[agentId]));
  if (phaseOne.length > 0) {
    outputs[1] = phaseOne;
  }

  if (synthesis) {
    outputs[2] = [buildCompleteOutput('carlos', synthesis)];
  }

  const debateText = Object.entries(debate)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([roundKey, text]) => `## ${roundKey.replace('_', ' ')}\n\n${text}`)
    .join('\n\n');
  if (debateText) {
    outputs[3] = [buildCompleteOutput('carlos', debateText)];
  }

  if (finalPlan) {
    outputs[4] = [buildCompleteOutput('carlos', finalPlan)];
  }

  return outputs;
}


function buildCompleteOutput(agentId: AgentId, text: string): AgentOutput {
  return {
    agentId,
    name: AGENTS[agentId].name,
    text,
    isStreaming: false,
    isComplete: true,
  };
}
