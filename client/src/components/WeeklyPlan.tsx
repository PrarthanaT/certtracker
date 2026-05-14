import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { getWeeks, patchTopic, postNote } from '../api';
import { Week, TAG_STYLES, STATUS_CONFIG } from '../types';

function getWeekStartDate(weekNumber: number): Date {
  const examDateStr = localStorage.getItem('dva_exam_date');
  const base = examDateStr ? new Date(examDateStr) : null;
  if (base && !isNaN(base.getTime())) {
    // Week 1 starts 10 weeks before exam date
    const week1Start = new Date(base);
    week1Start.setDate(week1Start.getDate() - 10 * 7);
    const start = new Date(week1Start);
    start.setDate(start.getDate() + (weekNumber - 1) * 7);
    return start;
  }
  // Fallback: week 1 starts today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  today.setDate(today.getDate() + (weekNumber - 1) * 7);
  return today;
}

function formatDateRange(weekNumber: number): string {
  const start = getWeekStartDate(weekNumber);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${pct > 0 ? (pct === 100 ? 'bg-green-500' : 'bg-amber-400') : ''}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function WeekCard({ week }: { week: Week }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(week.isOpen);
  const [notes, setNotes] = useState(week.notes ?? '');
  const prevPct = useRef(
    week.topics.length
      ? Math.round((week.topics.filter(t => t.completed).length / week.topics.length) * 100)
      : 0
  );

  const toggleTopic = useMutation({
    mutationFn: ({ id, isChecked }: { id: number; isChecked: boolean }) =>
      patchTopic(id, isChecked),
    onMutate: async ({ id, isChecked }) => {
      await qc.cancelQueries({ queryKey: ['weeks'] });
      const prev = qc.getQueryData<Week[]>(['weeks']);
      qc.setQueryData<Week[]>(['weeks'], old =>
        old?.map(w =>
          w.id === week.id
            ? {
                ...w,
                topics: w.topics.map(t =>
                  t.id === id ? { ...t, completed: isChecked } : t
                ),
              }
            : w
        )
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['weeks'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['weeks'] });
    },
    onSuccess: () => {
      const updated = qc.getQueryData<Week[]>(['weeks']);
      const updatedWeek = updated?.find(w => w.id === week.id);
      if (!updatedWeek) return;
      const total = updatedWeek.topics.length;
      if (!total) return;
      const done = updatedWeek.topics.filter(t => t.completed).length;
      const newPct = Math.round((done / total) * 100);
      if (newPct === 100 && prevPct.current < 100) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
      prevPct.current = newPct;
    },
  });

  const saveNote = useMutation({
    mutationFn: (content: string) => postNote(week.id, content),
  });

  const completed = week.topics.filter(t => t.completed).length;
  const total = week.topics.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const statusCfg = STATUS_CONFIG[week.status];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center">
          {week.weekNumber}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {week.title}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.bg} ${statusCfg.text}`}
            >
              {statusCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-400 dark:text-gray-400">
              {formatDateRange(week.weekNumber)}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-400">
              {completed}/{total} topics
            </span>
          </div>
          <div className="mt-1.5">
            <ProgressBar pct={pct} />
          </div>
        </div>
        <svg
          className={`flex-shrink-0 w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 space-y-4">
          {/* Topics */}
          <ul className="space-y-2">
            {week.topics.map(topic => (
              <li key={topic.id} className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={topic.completed}
                  onChange={e =>
                    toggleTopic.mutate({ id: topic.id, isChecked: e.target.checked })
                  }
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                />
                <span
                  className={`flex-1 text-sm leading-snug transition-colors ${
                    topic.completed
                      ? 'line-through text-gray-400 dark:text-gray-500'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {topic.label}
                </span>
                <span
                  className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
                    TAG_STYLES[topic.tag] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {topic.tag}
                </span>
              </li>
            ))}
          </ul>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={() => saveNote.mutate(notes)}
              rows={3}
              placeholder="Add notes for this week…"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function WeeklyPlan() {
  const { data: weeks, isLoading, isError } = useQuery({ queryKey: ['weeks'], queryFn: getWeeks });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 dark:text-gray-500">
        Loading study plan…
      </div>
    );
  }

  if (isError || !weeks) {
    return (
      <div className="flex items-center justify-center py-24 text-red-400">
        Failed to load weeks. Is the server running?
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {weeks.map(week => (
        <WeekCard key={week.id} week={week} />
      ))}
    </div>
  );
}
