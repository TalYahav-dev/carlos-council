export type AgentId =
  | 'carlos'
  | 'storyteller'
  | 'product_architect'
  | 'revenue_strategist'
  | 'growth_hunter'
  | 'field_operator';

export type Phase = 1 | 2 | 3 | 4;

export type SessionStatus =
  | 'idle'
  | 'running'
  | 'clarifying'
  | 'completed'
  | 'error';

export type TransportMode =
  | 'stream'
  | 'polling'
  | null;

export interface AgentMeta {
  id: AgentId;
  name: string;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export interface SSEEvent {
  event: string;
  data: unknown;
}

export interface AgentOutput {
  agentId: AgentId;
  name: string;
  text: string;
  isStreaming: boolean;
  isComplete: boolean;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
}

export interface SessionSummary {
  id: string;
  brief: string;
  status: string;
  created_at: string;
}

export interface SessionDetail extends SessionSummary {
  transcript: Record<string, Record<string, string>>;
  updated_at: string;
}

export interface SessionSnapshot {
  session_id: string;
  status: string;
  phase: Phase | null;
  transcript: Record<string, Record<string, string>>;
  clarification_questions: string[];
  clarification_answers: Record<string, string>;
}

export interface BusinessProfile {
  company: Record<string, unknown>;
  offer: Record<string, unknown>;
  audience: Record<string, unknown>;
  channels: Record<string, unknown>;
  social: Record<string, unknown>;
  metrics: Record<string, unknown>;
  tech_stack: Record<string, unknown>;
  constraints: Record<string, unknown>;
  strategy: Record<string, unknown>;
  brand: Record<string, unknown>;
  notes: string[];
}

export interface BusinessProfileResponse {
  profile: BusinessProfile;
  updated_at: string | null;
}

export interface ProfileSource {
  id: number;
  source_type: string;
  source_name: string;
  payload: unknown;
  created_at: string;
  updated_at: string;
}
