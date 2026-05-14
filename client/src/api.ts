import { Week, PracticeScore, StudyLogEntry, Topic } from './types';

export const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/api';

const TOKEN_KEY = 'auth_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + path, {
    ...init,
    headers: {
      ...authHeader(),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

const json = (body: unknown) => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: { id: string; email: string };
}

async function authPost(path: string, body: { email: string; password: string }): Promise<AuthResponse> {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? 'Request failed');
  }
  return res.json();
}

export const loginApi = (email: string, password: string) =>
  authPost('/auth/login', { email, password });

export const registerApi = (email: string, password: string) =>
  authPost('/auth/register', { email, password });

// ── Weeks ────────────────────────────────────────────────────────────────────
export const getWeeks = () => req<Week[]>('/weeks');
export const updateWeekNotes = (id: number, notes: string) =>
  req<Week>(`/weeks/${id}`, { method: 'PUT', ...json({ notes }) });
export const updateWeekTopics = (id: number, topics: Topic[]) =>
  req<Week>(`/weeks/${id}`, { method: 'PUT', ...json({ topics }) });

// ── Topics ───────────────────────────────────────────────────────────────────
export const patchTopic = (id: number, isChecked: boolean) =>
  req<{ id: number; label: string; tag: string; completed: boolean }>(
    `/topics/${id}`, { method: 'PATCH', ...json({ isChecked }) }
  );

// ── Notes ────────────────────────────────────────────────────────────────────
export const postNote = (weekId: number, content: string) =>
  req<{ id: number; weekId: number; content: string }>(
    '/notes', { method: 'POST', ...json({ weekId, content }) }
  );

// ── Practice scores ──────────────────────────────────────────────────────────
export const getPracticeScores = () => req<PracticeScore[]>('/practice-scores');
export const updatePracticeScore = (id: number, score: number) =>
  req<PracticeScore>(`/practice-scores/${id}`, { method: 'PUT', ...json({ score }) });

// ── Export ───────────────────────────────────────────────────────────────────
export async function downloadExport() {
  const res = await fetch(API_BASE + '/export', {
    headers: authHeader(),
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'certtracker-export.json';
  a.click();
  URL.revokeObjectURL(url);
}

// ── Study log ────────────────────────────────────────────────────────────────
export const getStudyLog = () => req<StudyLogEntry[]>('/study-log');
export const addStudyLogEntry = (text: string, duration: string) =>
  req<StudyLogEntry>('/study-log', { method: 'POST', ...json({ text, duration }) });
export const deleteStudyLogEntry = (id: number) =>
  req<void>(`/study-log/${id}`, { method: 'DELETE' });
