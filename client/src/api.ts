import { Week, PracticeScore, StudyLogEntry, Topic } from './types';

export const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001') + '/api';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + path, init);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

const json = (body: unknown) => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

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
export function downloadExport() {
  const a = document.createElement('a');
  a.href = API_BASE + '/export';
  a.download = 'certtracker-export.json';
  a.click();
}

// ── Study log ────────────────────────────────────────────────────────────────
export const getStudyLog = () => req<StudyLogEntry[]>('/study-log');
export const addStudyLogEntry = (text: string, duration: string) =>
  req<StudyLogEntry>('/study-log', { method: 'POST', ...json({ text, duration }) });
export const deleteStudyLogEntry = (id: number) =>
  req<void>(`/study-log/${id}`, { method: 'DELETE' });
