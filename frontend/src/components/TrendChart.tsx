import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '../lib/format';
import type { MonthTotal } from '../types/budget';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TrendChart({ data }: { data: MonthTotal[] }) {
  const chartData = data.map((item) => ({
    label: `${MONTH_NAMES[item.month - 1]} ${String(item.year).slice(2)}`,
    total: item.total,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--chart-axis)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--chart-axis)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={70}
            tickFormatter={(value) => formatCurrency(Number(value)).replace(/\.00$/, '')}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value)), 'Spent']}
            contentStyle={{
              backgroundColor: 'var(--chart-tooltip-bg)',
              border: '1px solid var(--chart-tooltip-border)',
              borderRadius: 8,
              color: 'var(--chart-tooltip-text)',
            }}
            itemStyle={{ color: 'var(--chart-tooltip-text)' }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#trendFill)"
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
