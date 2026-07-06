import { useNavigate } from 'react-router-dom';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CATEGORY_COLORS } from '../lib/categories';
import { formatCurrency, titleCase } from '../lib/format';
import type { CategoryTotal } from '../types/expense';

interface CategoryPieChartProps {
  data: CategoryTotal[];
  year: number;
  month: number;
}

export default function CategoryPieChart({ data, year, month }: CategoryPieChartProps) {
  const navigate = useNavigate();

  if (data.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-1 text-sm text-slate-400 dark:text-slate-500">
        <p>No expenses this month yet</p>
        <p className="text-xs">Add one and the chart fills in</p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: titleCase(item.category),
    value: item.total,
    category: item.category,
  }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            strokeWidth={0}
            className="cursor-pointer outline-none"
            onClick={(_, index) => {
              const entry = chartData[index];
              if (entry) {
                navigate(`/expenses?year=${year}&month=${month}&category=${entry.category}`);
              }
            }}
          >
            {chartData.map((entry) => (
              <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={{
              backgroundColor: 'var(--chart-tooltip-bg)',
              border: '1px solid var(--chart-tooltip-border)',
              borderRadius: 6,
              color: 'var(--chart-tooltip-text)',
            }}
            itemStyle={{ color: 'var(--chart-tooltip-text)' }}
          />
          <Legend iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-xs text-slate-400 dark:text-slate-500">
        Click a slice to see those expenses
      </p>
    </div>
  );
}
