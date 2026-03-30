
import React from 'react';
import { Users, UserCheck, UserX, UserMinus, GraduationCap, Baby, UserCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ReportCardProps {
  title: string;
  stats: { label: string; value: number; icon: React.ReactNode; color: string }[];
  chartData: { name: string; value: number; color: string }[];
}

const ReportCard: React.FC<ReportCardProps> = ({ title, stats, chartData }) => (
  <div className="bg-supabase-panel border border-supabase-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
    <h3 className="text-sm font-bold text-supabase-muted uppercase tracking-widest mb-6 flex items-center gap-2">
      <div className="w-1 h-4 bg-supabase-green rounded-full"></div>
      {title}
    </h3>
    
    <div className="grid grid-cols-2 gap-4 mb-6">
      {stats.map((stat, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-supabase-bg border border-supabase-border/50">
          <div className={`p-2 rounded-md ${stat.color} bg-opacity-10`}>
            {React.isValidElement(stat.icon) && React.cloneElement(stat.icon as React.ReactElement<any>, { size: 18, className: stat.color.replace('bg-', 'text-') })}
          </div>
          <div>
            <div className="text-lg font-bold text-supabase-text">{stat.value}</div>
            <div className="text-[10px] text-supabase-muted uppercase font-bold tracking-tight">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>

    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1c1c1c', border: '1px solid #2e2e2e', borderRadius: '8px' }}
            itemStyle={{ color: '#fff', fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const DashboardReports: React.FC<{ 
  employeeStats: { total: number; present: number; absent: number; onLeave: number };
  studentStats: { total: number; present: number; absent: number; boys: number; girls: number };
}> = ({ employeeStats, studentStats }) => {
  const empChartData = [
    { name: 'Present', value: employeeStats.present, color: '#3ecf8e' },
    { name: 'Absent', value: employeeStats.absent, color: '#f87171' },
    { name: 'On Leave', value: employeeStats.onLeave, color: '#fbbf24' },
  ];

  const studentChartData = [
    { name: 'Present', value: studentStats.present, color: '#3ecf8e' },
    { name: 'Absent', value: studentStats.absent, color: '#f87171' },
  ];

  const genderChartData = [
    { name: 'Boys', value: studentStats.boys, color: '#60a5fa' },
    { name: 'Girls', value: studentStats.girls, color: '#f472b6' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ReportCard 
        title="Employees Report"
        stats={[
          { label: 'Total', value: employeeStats.total, icon: <Users />, color: 'bg-blue-500' },
          { label: 'Present', value: employeeStats.present, icon: <UserCheck />, color: 'bg-supabase-green' },
          { label: 'Absent', value: employeeStats.absent, icon: <UserX />, color: 'bg-red-500' },
          { label: 'On Leave', value: employeeStats.onLeave, icon: <UserMinus />, color: 'bg-amber-500' },
        ]}
        chartData={empChartData}
      />
      <ReportCard 
        title="Students Report"
        stats={[
          { label: 'Total', value: studentStats.total, icon: <GraduationCap />, color: 'bg-purple-500' },
          { label: 'Present', value: studentStats.present, icon: <UserCheck />, color: 'bg-supabase-green' },
          { label: 'Boys', value: studentStats.boys, icon: <Baby />, color: 'bg-blue-400' },
          { label: 'Girls', value: studentStats.girls, icon: <UserCircle2 />, color: 'bg-pink-400' },
        ]}
        chartData={studentChartData}
      />
    </div>
  );
};

export default DashboardReports;
