import { useState, useRef } from 'react';
import { Week, DOMAIN_COLORS, STATUS_CONFIG } from '../types';
import { updateWeekTopics, updateWeekNotes } from '../api';

interface Props {
  weeks: Week[];
  onUpdate: (updated: Week) => void;
}

export default function WeekPlan({ weeks, onUpdate }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const notesTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  function toggle(id: number) {
    setExpanded(prev => (prev === id ? null : id));
  }

  async function handleTopicToggle(week: Week, topicId: string) {
    const updated = week.topics.map(t =>
      t.id === topicId ? { ...t, completed: !t.completed } : t
    );
    const result = await updateWeekTopics(week.id, updated);
    onUpdate(result);
  }

  function handleNotesChange(week: Week, value: string) {
    onUpdate({ ...week, notes: value });
    clearTimeout(notesTimers.current[week.id]);
    notesTimers.current[week.id] = setTimeout(async () => {
      const result = await updateWeekNotes(week.id, value);
      onUpdate(result);
    }, 800);
  }

  return (
    <div className="space-y-3">
      {weeks.map(week => {
        const done = week.topics.filter(t => t.completed).length;
        const total = week.topics.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const { label, bg, text } = STATUS_CONFIG[week.status];
        const isOpen = expanded === week.id;

        return (
          <div key={week.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <button
              onClick={() => toggle(week.id)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-blue-600 font-bold text-sm w-14 shrink-0">Week {week.weekNumber}</span>
              <span className="font-semibold text-gray-900 flex-1">{week.title}</span>
              <span className="text-xs text-gray-500 shrink-0">{done}/{total} topics</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${bg} ${text}`}>{label}</span>
              <svg
                className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100 mx-5 rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 px-5 pb-2">{pct}% complete</p>

            {/* Expanded content */}
            {isOpen && (
              <div className="px-5 pb-5 border-t border-gray-50 mt-2 pt-4">
                <div className="space-y-2 mb-5">
                  {week.topics.map(topic => {
                    const dc = DOMAIN_COLORS[topic.domain];
                    return (
                      <label
                        key={topic.id}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={topic.completed}
                          onChange={() => handleTopicToggle(week, topic.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                        <span className={`text-sm ${topic.completed ? 'line-through text-gray-400' : 'text-gray-800'} flex-1`}>
                          {topic.label}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${dc.bg} ${dc.text}`}>
                          {topic.domain}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label>
                  <textarea
                    value={week.notes}
                    onChange={e => handleNotesChange(week, e.target.value)}
                    placeholder="Add notes for this week..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-300"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
