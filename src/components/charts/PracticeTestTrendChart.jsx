import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DAT_SECTION_COLORS, DAT_SECTIONS } from '../../data/manualWorkflow';

export function PracticeTestTrendChart({ tests, height = 280 }) {
  const data = (Array.isArray(tests) ? tests : []).map((test) => ({
    label: `PT ${test.testNumber}`,
    ...test.sections,
  }));

  if (!data.length) {
    return (
      <div style={{
        minHeight: height,
        borderRadius: 14,
        border: '1px solid var(--border)',
        background: 'var(--bg-panel-hover)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: 13,
      }}
      >
        No practice test data yet.
      </div>
    );
  }

  return (
    <div style={{
      height,
      borderRadius: 14,
      border: '1px solid var(--border)',
      background: 'var(--bg-panel-hover)',
      padding: '12px 12px 0',
    }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, left: -12, bottom: 12 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
          <YAxis
            domain={[0, 30]}
            allowDecimals={false}
            stroke="var(--text-muted)"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#11151d',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
            }}
          />
          <Legend />
          {DAT_SECTIONS.map((section) => (
            <Line
              key={section}
              type="monotone"
              dataKey={section}
              stroke={DAT_SECTION_COLORS[section]}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
