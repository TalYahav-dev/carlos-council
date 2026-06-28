import {
  BusinessProfile,
  BusinessProfileResponse,
  ProfileSource,
  SessionDetail,
  SessionSnapshot,
  SessionSummary,
} from './types';

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? '';
}

const API_BASE = getApiBase();

export async function startCouncil(brief: string): Promise<{ session_id: string }> {
  const res = await fetch(`${API_BASE}/api/council/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brief }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to start council: ${res.status} ${body}`);
  }
  return res.json();
}

export function getStreamUrl(sessionId: string): string {
  return `${API_BASE}/api/council/${sessionId}/stream`;
}

export async function submitClarification(
  sessionId: string,
  answers: Record<string, string>,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/council/${sessionId}/clarify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to submit clarification: ${res.status} ${body}`);
  }
}

export async function listSessions(): Promise<SessionSummary[]> {
  const res = await fetch(`${API_BASE}/api/sessions`);
  if (!res.ok) return [];
  return res.json();
}

export async function getSession(id: string): Promise<SessionDetail> {
  const res = await fetch(`${API_BASE}/api/sessions/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch session: ${res.status}`);
  }
  return res.json();
}

export async function getCouncilSnapshot(sessionId: string): Promise<SessionSnapshot> {
  const res = await fetch(`${API_BASE}/api/council/${sessionId}/snapshot`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch council snapshot: ${res.status}`);
  }
  return res.json();
}

export async function getProfile(): Promise<BusinessProfileResponse> {
  const res = await fetch(`${API_BASE}/api/profile`);
  if (!res.ok) {
    throw new Error(`Failed to fetch profile: ${res.status}`);
  }
  return res.json();
}

export async function updateProfile(
  profile: BusinessProfile,
): Promise<BusinessProfileResponse> {
  const res = await fetch(`${API_BASE}/api/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to save profile: ${res.status} ${body}`);
  }
  return res.json();
}

export async function listProfileSources(): Promise<ProfileSource[]> {
  const res = await fetch(`${API_BASE}/api/profile/sources`);
  if (!res.ok) {
    throw new Error(`Failed to fetch profile sources: ${res.status}`);
  }
  return res.json();
}
