import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ExpertiseData {
  practiceArea?: string; // For summary chart
  specialization?: string; // For per-area charts
  years: number;
}

interface ExpertisePieChartProps {
  expertiseData: ExpertiseData[];
  title?: string;
  description?: string;
  height?: number;
}

const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#6366f1', // indigo
  '#ef4444', // red
  '#14b8a6', // teal
  '#f97316', // orange
  '#a855f7', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
];

const ExpertisePieChart = ({ 
  expertiseData, 
  title,
  description,
  height = 300 
}: ExpertisePieChartProps) => {
  if (!expertiseData || expertiseData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No expertise data available
      </div>
    );
  }

  const totalYears = expertiseData.reduce((sum, item) => sum + item.years, 0);
  const nameKey = expertiseData[0]?.specialization ? "specialization" : "practiceArea";

  const renderCustomLabel = (entry: any) => {
    const percentage = ((entry.years / totalYears) * 100).toFixed(0);
    return `${percentage}%`;
  };

  return (
    <div className="space-y-2">
      {title && (
        <div>
          <h4 className="text-sm font-semibold">{title}</h4>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={expertiseData}
            dataKey="years"
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={height < 250 ? 60 : 80}
            label={renderCustomLabel}
            labelLine={false}
          >
            {expertiseData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => {
              const percentage = ((value / totalYears) * 100).toFixed(1);
              return [`${value} years (${percentage}%)`, name];
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-sm">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpertisePieChart;
