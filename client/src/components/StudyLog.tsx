import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStudyLog, addStudyLogEntry, deleteStudyLogEntry } from '../api';
import { StudyLogEntry } from '../types';

function formatEntryDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function StudyLog() {
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [duration, setDuration] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const textRef = useRef<HTMLInputElement>(null);

  const { data: entries, isLoading } = useQuery({
    queryKey: ['study-log'],
    queryFn: getStudyLog,
  });

  const addEntry = useMutation({
    mutationFn: () => addStudyLogEntry(text.trim(), duration.trim()),
    onSuccess: () => {
      setText('');
      setDuration('');
      qc.invalidateQueries({ queryKey: ['study-log'] });
      textRef.current?.focus();
    },
  });

  const removeEntry = useMutation({
    mutationFn: (id: number) => deleteStudyLogEntry(id),
    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: ['study-log'] });
      const prev = qc.getQueryData<StudyLogEntry[]>(['study-log']);
      qc.setQueryData<StudyLogEntry[]>(['study-log'], old => old?.filter(e => e.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['study-log'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['study-log'] });
      setConfirmDelete(null);
    },
  });

  // Press "/" to focus the study text input
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        textRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addEntry.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Add entry form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4"
      >
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          Log a study session
        </h3>
        <div className="flex gap-2">
          <input
            ref={textRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="What did you study?"
            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            type="text"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            placeholder="Duration"
            className="w-28 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            disabled={!text.trim() || addEntry.isPending}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {addEntry.isPending ? '…' : 'Log'}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          Press <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-mono text-xs border border-gray-200 dark:border-gray-600">/</kbd> to focus
        </p>
      </form>

      {/* Feed */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
          Loading log…
        </div>
      ) : !entries?.length ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">
          No entries yet. Log your first session above.
        </div>
      ) : (
        <ul className="space-y-2">
          {entries.map(entry => (
            <li
              key={entry.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm px-4 py-3 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                  {entry.text}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatEntryDate(entry.createdAt)}
                  </span>
                  {entry.duration && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium">
                      {entry.duration}
                    </span>
                  )}
                </div>
              </div>

              {confirmDelete === entry.id ? (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Delete?</span>
                  <button
                    onClick={() => removeEntry.mutate(entry.id)}
                    className="text-xs px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium transition-colors"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(entry.id)}
                  className="flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-400 transition-colors"
                  aria-label="Delete entry"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
