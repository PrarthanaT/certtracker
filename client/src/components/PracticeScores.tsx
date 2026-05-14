import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPracticeScores, updatePracticeScore } from '../api';
import { PracticeScore } from '../types';

// Target scores per exam (by position/index in the seeded list)
const TARGETS = [75, 80, 80, 80, 85];

function PassBadge({ score, target }: { score: number | null; target: number }) {
  if (score === null) {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500">
        —
      </span>
    );
  }
  const pass = score >= target;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
        pass
          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
          : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
      }`}
    >
      {pass ? 'Pass' : 'Below target'}
    </span>
  );
}


export default function PracticeScores() {
  const { data: scores, isLoading } = useQuery({
    queryKey: ['practice-scores'],
    queryFn: getPracticeScores,
  });

  const lastTwo = scores?.slice(-2) ?? [];
  const readyToBook =
    lastTwo.length === 2 &&
    lastTwo.every((s, i) => {
      const target = TARGETS[scores!.length - 2 + i] ?? 85;
      return s.score !== null && s.score >= target;
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 dark:text-gray-500 text-sm">
        Loading scores…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Ready-to-book banner */}
      <div
        className={`rounded-xl border px-4 py-3 flex items-center gap-3 transition-colors ${
          readyToBook
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700/50'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}
      >
        {readyToBook ? (
          <>
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                Ready to book!
              </p>
              <p className="text-xs text-green-600 dark:text-green-500">
                Your last two scores both hit target. Schedule your exam on Pearson VUE.
              </p>
            </div>
          </>
        ) : (
          <>
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Not ready to book yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Hit target on the last two exams to unlock this indicator.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Scores table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-2.5">
                Exam
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 pr-4 py-2.5">
                Target
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 pr-4 py-2.5">
                Score %
              </th>
              <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 py-2.5">
                Result
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50 px-4">
            {scores?.map((exam, i) => (
              <tr key={exam.id} className="px-4">
                <td className="py-3 pl-4 pr-4">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {exam.examName}
                  </div>
                  {exam.takenAt && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Taken{' '}
                      {new Date(exam.takenAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  )}
                </td>
                <td className="py-3 pr-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  ≥{TARGETS[i] ?? 80}%
                </td>
                <td className="py-3 pr-4">
                  <ScoreInput exam={exam} target={TARGETS[i] ?? 80} />
                </td>
                <td className="py-3 pr-4">
                  <PassBadge score={exam.score} target={TARGETS[i] ?? 80} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScoreInput({ exam }: { exam: PracticeScore; target: number }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState(exam.score !== null ? String(exam.score) : '');
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: (val: number) => updatePracticeScore(exam.id, val),
    onSuccess: updated => {
      qc.setQueryData<PracticeScore[]>(['practice-scores'], old =>
        old?.map(s => (s.id === updated.id ? updated : s))
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    },
  });

  const handleBlur = () => {
    const val = parseFloat(draft);
    if (isNaN(val) || val < 0 || val > 100) return;
    if (val === exam.score) return;
    save.mutate(val);
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={0}
        max={100}
        step={0.5}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={handleBlur}
        placeholder="—"
        className="w-16 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      {saved && (
        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );
}
