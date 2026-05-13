const resources = [
  {
    icon: '🎓',
    name: 'AWS Skill Builder',
    description: 'Official 4-step exam prep plan',
    url: 'https://skillbuilder.aws/exam-prep/developer-associate',
    accent: 'border-orange-200 dark:border-orange-700/40 hover:border-orange-300 dark:hover:border-orange-600',
    badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
    badgeLabel: 'Official',
  },
  {
    icon: '📄',
    name: 'Exam Guide PDF',
    description: 'All domains and objectives',
    url: 'https://docs.aws.amazon.com/aws-certification/latest/examguides/developer-associate-02.html',
    accent: 'border-blue-200 dark:border-blue-700/40 hover:border-blue-300 dark:hover:border-blue-600',
    badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    badgeLabel: 'AWS',
  },
  {
    icon: '🧪',
    name: 'Tutorials Dojo',
    description: 'Best 3rd-party practice exams',
    url: 'https://tutorialsdojo.com/aws-certified-developer-associate/',
    accent: 'border-green-200 dark:border-green-700/40 hover:border-green-300 dark:hover:border-green-600',
    badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    badgeLabel: 'Practice',
  },
  {
    icon: '🎬',
    name: 'Stephen Maarek Udemy',
    description: 'Top-rated DVA-C02 course',
    url: 'https://www.udemy.com/course/aws-certified-developer-associate-dva-c01/',
    accent: 'border-purple-200 dark:border-purple-700/40 hover:border-purple-300 dark:hover:border-purple-600',
    badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    badgeLabel: 'Course',
  },
  {
    icon: '💬',
    name: 'r/AWSCertifications',
    description: 'Community tips and pass reports',
    url: 'https://reddit.com/r/AWSCertifications',
    accent: 'border-red-200 dark:border-red-700/40 hover:border-red-300 dark:hover:border-red-600',
    badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    badgeLabel: 'Community',
  },
  {
    icon: '📅',
    name: 'Pearson VUE',
    description: 'Book your exam',
    url: 'https://www.aws.training/certification',
    accent: 'border-indigo-200 dark:border-indigo-700/40 hover:border-indigo-300 dark:hover:border-indigo-600',
    badge: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
    badgeLabel: 'Exam',
  },
];

export default function Resources() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {resources.map(r => (
          <a
            key={r.name}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-4 flex gap-3 items-start transition-all duration-150 hover:shadow-md ${r.accent}`}
          >
            <span className="text-2xl flex-shrink-0 mt-0.5">{r.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {r.name}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${r.badge}`}>
                  {r.badgeLabel}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                {r.description}
              </p>
            </div>
            <svg
              className="flex-shrink-0 w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 transition-colors mt-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
