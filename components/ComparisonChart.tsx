
import React from 'react';
import { StateSummary } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface Props {
  selectedStates: StateSummary[];
}

const COLORS = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const ComparisonChart: React.FC<Props> = ({ selectedStates }) => {
  // Pivot data for Recharts: [{ month: '2024-01', 'Assam': 100, 'Punjab': 150 }, ...]
  const monthsSet = new Set<string>();
  selectedStates.forEach(s => s.monthlyTrends.forEach(t => monthsSet.add(t.month)));
  const sortedMonths = Array.from(monthsSet).sort();

  const chartData = sortedMonths.map(month => {
    const entry: any = { month };
    selectedStates.forEach(s => {
      const trend = s.monthlyTrends.find(t => t.month === month);
      entry[s.state] = trend ? trend.total : 0;
    });
    return entry;
  });

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'short' });
  };

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="month" 
            tickFormatter={formatMonth}
            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
            labelFormatter={formatMonth}
          />
          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
          {selectedStates.map((s, idx) => (
            <Line 
              key={s.state}
              type="monotone" 
              dataKey={s.state} 
              stroke={COLORS[idx % COLORS.length]} 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparisonChart;
