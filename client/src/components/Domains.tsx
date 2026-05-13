import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const domains = [
  { name: 'Development with AWS Services', short: 'Development', weight: 32, color: '#6366f1' },
  { name: 'Security', short: 'Security', weight: 26, color: '#a855f7' },
  { name: 'Deployment', short: 'Deployment', weight: 24, color: '#22c55e' },
  { name: 'Troubleshooting & Optimization', short: 'Troubleshooting', weight: 18, color: '#f97316' },
];

const examPills = [
  { label: '65 questions' },
  { label: '130 min' },
  { label: '$150 USD' },
  { label: 'Passing ~72%' },
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { value: number; name: string }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 text-sm">
      <span className="font-semibold text-gray-800 dark:text-gray-100">{payload[0].value}%</span>
      <span className="text-gray-500 dark:text-gray-400"> of exam</span>
    </div>
  );
}

export default function Domains() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Exam info pills */}
      <div className="flex flex-wrap gap-2">
        {examPills.map(p => (
          <span
            key={p.label}
            className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium"
          >
            {p.label}
          </span>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
          DVA-C02 Domain Weights
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={domains}
            layout="vertical"
            margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
            <XAxis
              type="number"
              domain={[0, 40]}
              tickFormatter={v => `${v}%`}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="short"
              width={110}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
            <Bar dataKey="weight" radius={[0, 6, 6, 0]} barSize={28}>
              {domains.map(d => (
                <Cell key={d.short} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3">
          {domains.map(d => (
            <div key={d.short} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {d.short} <span className="font-medium text-gray-700 dark:text-gray-300">{d.weight}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Focus tip */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/50 rounded-xl p-4">
        <div className="flex gap-3">
          <span className="text-xl flex-shrink-0">💡</span>
          <div>
            <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-1">
              Study focus tip
            </p>
            <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed">
              <strong>Development (32%)</strong> is the biggest domain — Lambda, DynamoDB, S3, API
              Gateway. <strong>Security (26%)</strong> is where most candidates lose points. Nail IAM
              roles, Cognito, and KMS patterns early.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
