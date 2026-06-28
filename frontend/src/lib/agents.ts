import { AgentId, AgentMeta } from './types';

export const AGENTS: Record<AgentId, AgentMeta> = {
  carlos: {
    id: 'carlos',
    name: 'Carlos',
    title: 'Chief Strategy Conductor',
    color: '#B45309',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    textColor: 'text-amber-700',
  },
  storyteller: {
    id: 'storyteller',
    name: 'The Storyteller',
    title: 'Brand & Narrative',
    color: '#7C3AED',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-300',
    textColor: 'text-violet-700',
  },
  product_architect: {
    id: 'product_architect',
    name: 'Product Architect',
    title: 'Product & UX Strategy',
    color: '#0891B2',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-300',
    textColor: 'text-cyan-700',
  },
  revenue_strategist: {
    id: 'revenue_strategist',
    name: 'Revenue Strategist',
    title: 'Monetization & Growth',
    color: '#059669',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
    textColor: 'text-emerald-700',
  },
  growth_hunter: {
    id: 'growth_hunter',
    name: 'Growth Hunter',
    title: 'Acquisition & Distribution',
    color: '#DC2626',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    textColor: 'text-red-700',
  },
  field_operator: {
    id: 'field_operator',
    name: 'Field Operator',
    title: 'Operations & Execution',
    color: '#EA580C',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    textColor: 'text-orange-700',
  },
};

export const PHASE_NAMES: Record<number, string> = {
  1: 'Initial Analysis',
  2: 'Synthesis & Clarification',
  3: 'Strategic Debate',
  4: 'Final Plan',
};

export const AGENT_ORDER: AgentId[] = [
  'storyteller',
  'product_architect',
  'revenue_strategist',
  'growth_hunter',
  'field_operator',
];
