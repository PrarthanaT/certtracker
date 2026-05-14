import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getWeeks, downloadExport } from './api';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import WeeklyPlan from './components/WeeklyPlan';
import Domains from './components/Domains';
import PracticeScores from './components/PracticeScores';
import StudyLog from './components/StudyLog';
import Resources from './components/Resources';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'weekly-plan' | 'domains' | 'practice' | 'log' | 'resources';

const TABS: { id: Tab; label: string }[] = [
  { id: 'weekly-plan', label: '10-Week Plan' },
  { id: 'domains',     label: 'Domains' },
  { id: 'practice',    label: 'Practice Scores' },
  { id: 'log',         label: 'Study Log' },
  { id: 'resources',   label: 'Resources' },
];

const EXAM_DATE_KEY = 'dva_exam_date';
const DARK_MODE_KEY = 'theme';

// ─── Icons ────────────────────────────────────────────────────────────────────

function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  onClick?: () => void;
  clickable?: boolean;
}

function StatCard({ label, value, sub, accent = 'text-blue-600 dark:text-blue-400', onClick, clickable }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable && !onClick}
      className={`
        text-left w-full bg-white dark:bg-gray-800 rounded-xl px-4 py-3
        border border-gray-100 dark:border-gray-700 shadow-sm
        transition-all
        ${onClick ? 'hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md cursor-pointer' : 'cursor-default'}
      `}
    >
      <p className={`text-2xl font-bold leading-tight ${accent}`}>{value}</p>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </button>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-500 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── App shell (auth gate) ────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const { user, token, loginWithToken } = useAuth();

  // Handle Google OAuth redirect: ?token=<jwt>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlError = params.get('error');
    if (urlToken) {
      window.history.replaceState({}, '', window.location.pathname);
      loginWithToken(urlToken);
    } else if (urlError) {
      window.history.replaceState({}, '', window.location.pathname);
      // Error is surfaced via the login page naturally (user stays unauthenticated)
      console.warn('OAuth error:', urlError);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user || !token) return <LoginPage />;
  return <AppContent />;
}

// ─── Main app ────────────────────────────────────────────────────────────────

function LogoutButton() {
  const { logout, user } = useAuth();
  const qc = useQueryClient();

  function handleLogout() {
    qc.clear();
    logout();
  }

  return (
    <button
      onClick={handleLogout}
      title={`Signed in as ${user?.email}`}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Logout
    </button>
  );
}

function AppContent() {
  // ── Theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<string>(
    () => localStorage.getItem(DARK_MODE_KEY) || 'dark'
  );

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(DARK_MODE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  // ── Tab ────────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('weekly-plan');

  // ── Exam date ──────────────────────────────────────────────────────────────
  const [examDate, setExamDate] = useState<string>(
    () => localStorage.getItem(EXAM_DATE_KEY) ?? ''
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateInput, setDateInput] = useState(examDate);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    }
    if (showDatePicker) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDatePicker]);

  function saveExamDate() {
    setExamDate(dateInput);
    localStorage.setItem(EXAM_DATE_KEY, dateInput);
    setShowDatePicker(false);
  }

  function clearExamDate() {
    setExamDate('');
    setDateInput('');
    localStorage.removeItem(EXAM_DATE_KEY);
    setShowDatePicker(false);
  }

  // ── Countdown ──────────────────────────────────────────────────────────────
  const daysToExam = examDate
    ? Math.ceil((new Date(examDate).getTime() - Date.now()) / 86_400_000)
    : null;

  function countdownLabel(): string {
    if (daysToExam === null) return 'Set date';
    if (daysToExam < 0) return 'Past';
    if (daysToExam === 0) return 'Today!';
    return `${daysToExam}d`;
  }

  function countdownSub(): string {
    if (daysToExam === null) return 'click to set exam date';
    if (daysToExam < 0) return 'exam date has passed';
    if (daysToExam === 0) return 'good luck today!';
    return examDate;
  }

  const countdownAccent =
    daysToExam === null ? 'text-gray-400 dark:text-gray-500' :
    daysToExam <= 7     ? 'text-red-500 dark:text-red-400' :
    daysToExam <= 30    ? 'text-amber-500 dark:text-amber-400' :
                          'text-emerald-600 dark:text-emerald-400';

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: weeks = [] } = useQuery({
    queryKey: ['weeks'],
    queryFn: getWeeks,
  });

  const allTopics = weeks.flatMap(w => w.topics);
  const checked   = allTopics.filter(t => t.completed).length;
  const total     = allTopics.length;
  const pct       = total > 0 ? Math.round((checked / total) * 100) : 0;
  const weeksComplete = weeks.filter(w => w.status === 'complete').length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">

      {/* ── Header ── */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* Left: wordmark */}
          <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">
            CertTracker
          </span>

          {/* Right: badge + export + logout + toggle */}
          <div className="flex items-center gap-2">
            <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 text-xs font-semibold px-2.5 py-1 rounded-full tracking-wide">
              AWS DVA-C02
            </span>

            <button
              onClick={downloadExport}
              aria-label="Export data"
              title="Export as JSON"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>

            <LogoutButton />

            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Stats bar ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 pt-4 pb-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">

            <StatCard
              label="Overall Progress"
              value={`${pct}%`}
              sub={total > 0 ? `${checked} of ${total} topics` : 'no data yet'}
            />

            <StatCard
              label="Topics Checked"
              value={`${checked} / ${total}`}
              sub={`${total - checked} remaining`}
              accent="text-violet-600 dark:text-violet-400"
            />

            <StatCard
              label="Weeks Complete"
              value={`${weeksComplete} / 10`}
              sub={`${10 - weeksComplete} weeks left`}
              accent="text-emerald-600 dark:text-emerald-400"
            />

            {/* Countdown — clickable */}
            <div className="relative" ref={pickerRef}>
              <StatCard
                label="Days to Exam"
                value={countdownLabel()}
                sub={countdownSub()}
                accent={countdownAccent}
                onClick={() => { setDateInput(examDate); setShowDatePicker(s => !s); }}
              />

              {/* Date picker popover */}
              {showDatePicker && (
                <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarIcon />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Exam Date</p>
                  </div>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={e => setDateInput(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveExamDate}
                      className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Save
                    </button>
                    {examDate && (
                      <button
                        onClick={clearExamDate}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Overall progress bar */}
          <ProgressBar pct={pct} />
        </div>
      </div>

      {/* ── Tab nav ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`
                  px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                  ${tab === t.id
                    ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'weekly-plan' && <WeeklyPlan />}
        {tab === 'domains'     && <Domains />}
        {tab === 'practice'    && <PracticeScores />}
        {tab === 'log'         && <StudyLog />}
        {tab === 'resources'   && <Resources />}
      </main>

    </div>
  );
}
