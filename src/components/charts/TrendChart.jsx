import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

export function TrendChart({ data, dataKey, color = '#c19a2f', valueType = 'number' }) {
  return (
    <div className="chart-surface">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid stroke="#e8ddd0" strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke="#8d7b68" tickLine={false} axisLine={false} />
          <YAxis stroke="#8d7b68" tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fffdfa',
              border: '1px solid #e8ddd0',
              borderRadius: '14px',
            }}
            formatter={(value) => (valueType === 'currency' ? formatCurrency(value) : value)}
          />
          <Line dataKey={dataKey} stroke={color} strokeWidth={3} dot={{ fill: color, r: 4 }} type="monotone" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
