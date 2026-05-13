export type Domain = 'Development' | 'Security' | 'Deployment' | 'Troubleshooting';
export type WeekStatus = 'not-started' | 'in-progress' | 'complete';

export interface Topic {
  id: number;
  label: string;
  tag: string;
  completed: boolean;
}

export interface Week {
  id: number;
  weekNumber: number;
  title: string;
  days: number;
  isOpen: boolean;
  topics: Topic[];
  notes: string;
  status: WeekStatus;
}

export interface PracticeScore {
  id: number;
  examName: string;
  score: number | null;
  passingScore: number;
  takenAt: string | null;
}

export interface StudyLogEntry {
  id: number;
  text: string;
  duration: string | null;
  createdAt: string;
}

export const DOMAIN_WEIGHTS: Record<Domain, number> = {
  Development: 32,
  Security: 26,
  Deployment: 24,
  Troubleshooting: 18,
};

export const DOMAIN_COLORS: Record<Domain, { bg: string; text: string; bar: string }> = {
  Development:    { bg: 'bg-blue-100',   text: 'text-blue-700',   bar: 'bg-blue-500' },
  Security:       { bg: 'bg-purple-100', text: 'text-purple-700', bar: 'bg-purple-500' },
  Deployment:     { bg: 'bg-green-100',  text: 'text-green-700',  bar: 'bg-green-500' },
  Troubleshooting:{ bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-500' },
};

export const STATUS_CONFIG: Record<WeekStatus, { label: string; bg: string; text: string }> = {
  'not-started': { label: 'Not Started', bg: 'bg-gray-100',   text: 'text-gray-500' },
  'in-progress': { label: 'In Progress', bg: 'bg-amber-100',  text: 'text-amber-700' },
  'complete':    { label: 'Complete',    bg: 'bg-green-100',  text: 'text-green-700' },
};

// Granular topic tag colors used in WeeklyPlan
export const TAG_STYLES: Record<string, string> = {
  IAM:        'bg-blue-100   text-blue-700   dark:bg-blue-900/40   dark:text-blue-300',
  Serverless: 'bg-pink-100   text-pink-700   dark:bg-pink-900/40   dark:text-pink-300',
  Database:   'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Messaging:  'bg-red-100    text-red-700    dark:bg-red-900/40    dark:text-red-300',
  Security:   'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  DevOps:     'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  Monitoring: 'bg-green-100  text-green-700  dark:bg-green-900/40  dark:text-green-300',
  Compute:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
};
