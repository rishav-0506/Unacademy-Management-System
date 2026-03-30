
import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarWidget: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
  }
  for (let i = 1; i <= days; i++) {
    const isToday = i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
    calendarDays.push(
      <div 
        key={i} 
        className={`h-10 w-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all cursor-pointer ${
          isToday ? 'bg-supabase-green text-supabase-bg shadow-lg shadow-supabase-green/20' : 'text-supabase-text hover:bg-supabase-hover'
        }`}
      >
        {i}
      </div>
    );
  }

  return (
    <div className="bg-supabase-panel border border-supabase-border rounded-xl p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-supabase-muted uppercase tracking-widest flex items-center gap-2">
          <CalendarIcon size={16} className="text-supabase-green" />
          Calendar
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg bg-supabase-bg border border-supabase-border hover:bg-supabase-hover transition-colors">
            <ChevronLeft size={14} />
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg bg-supabase-bg border border-supabase-border hover:bg-supabase-hover transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="text-xl font-black text-supabase-text uppercase tracking-tight">{monthNames[month]}</div>
        <div className="text-[10px] text-supabase-muted font-bold uppercase tracking-widest">{year}</div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-[10px] font-bold text-supabase-muted uppercase tracking-widest h-8 flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays}
      </div>
    </div>
  );
};

export default CalendarWidget;
