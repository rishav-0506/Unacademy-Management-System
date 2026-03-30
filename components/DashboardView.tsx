import React, { useEffect, useState } from 'react';
import { MetricData, ClassSession, ClassInfo } from '../types';
import { Activity, Database, CheckCircle2, Clock, MapPin, User, Calendar, Cloud, MonitorPlay, Sparkles } from 'lucide-react';
import { scheduleService } from '../services/scheduleService';
import { supabase } from '../services/supabaseClient';
import DashboardReports from './DashboardReports';
import RecentActivity from './RecentActivity';
import UpcomingTests from './UpcomingTests';
import CalendarWidget from './CalendarWidget';
import Animated3D from './Animated3D';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const EMPTY_THEMES = [
    { wrapper: 'border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/5', overlay: 'bg-blue-50 dark:bg-blue-500/5', text: 'text-blue-500/60 dark:text-blue-400/60' },
    { wrapper: 'border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/5', overlay: 'bg-purple-50 dark:bg-purple-500/5', text: 'text-purple-500/60 dark:text-purple-400/60' },
    { wrapper: 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5', overlay: 'bg-emerald-50 dark:bg-emerald-500/5', text: 'text-emerald-500/60 dark:text-emerald-400/60' },
    { wrapper: 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5', overlay: 'bg-amber-50 dark:bg-amber-500/5', text: 'text-amber-500/60 dark:text-amber-400/60' },
    { wrapper: 'border-pink-200 dark:border-pink-500/30 bg-pink-50 dark:bg-pink-500/5', overlay: 'bg-pink-50 dark:bg-pink-500/5', text: 'text-pink-500/60 dark:text-pink-400/60' },
    { wrapper: 'border-cyan-200 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/5', overlay: 'bg-cyan-50 dark:bg-cyan-500/5', text: 'text-cyan-800 dark:text-cyan-400/60' },
];

interface ExtendedClassSession extends ClassSession {
    show_profiles?: boolean;
}

interface PublishedSchedule {
    id: string;
    class: string;
    content: ExtendedClassSession[];
    updated_at: string;
}

const DashboardView: React.FC = () => {
  const [publishedSchedules, setPublishedSchedules] = useState<PublishedSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [classesInfo, setClassesInfo] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const [employeeStats, setEmployeeStats] = useState({ total: 0, present: 0, absent: 0, onLeave: 0 });
  const [studentStats, setStudentStats] = useState({ total: 0, present: 0, absent: 0, boys: 0, girls: 0 });
  const [activities, setActivities] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);

  useEffect(() => {
      fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
      setLoading(true);
      try {
          // Fetch Schedules
          const published = await scheduleService.getPublished();
          setPublishedSchedules(published as PublishedSchedule[]);
          if (published.length > 0) {
              setSelectedScheduleId(published[0].id);
          }
          
          const infos = await scheduleService.getClasses();
          setClassesInfo(infos);

          if (supabase) {
              // Fetch Employee Stats
              const { data: employees } = await supabase.from('employees').select('status');
              if (employees) {
                setEmployeeStats({
                  total: employees.length,
                  present: employees.filter(e => e.status === 'active').length,
                  absent: employees.filter(e => e.status === 'inactive').length,
                  onLeave: employees.filter(e => e.status === 'on_leave').length || 0
                });
              }

              // Fetch Student Stats
              const { data: students } = await supabase.from('students').select('status, gender');
              if (students) {
                setStudentStats({
                  total: students.length,
                  present: students.filter(s => s.status === 'active').length,
                  absent: students.filter(s => s.status === 'inactive').length,
                  boys: students.filter(s => s.gender?.toLowerCase() === 'male' || s.gender?.toLowerCase() === 'boy').length,
                  girls: students.filter(s => s.gender?.toLowerCase() === 'female' || s.gender?.toLowerCase() === 'girl').length
                });
              }

              // Mock Activities if none in DB
              setActivities([
                { id: '1', type: 'attendance', title: 'Morning Attendance Completed', user: 'Admin', time: '10 mins ago', status: 'success' },
                { id: '2', type: 'registration', title: 'New Student Registered', user: 'Admission Office', time: '45 mins ago', status: 'info' },
                { id: '3', type: 'fee', title: 'Fee Collection Alert', user: 'Finance', time: '2 hours ago', status: 'warning' },
                { id: '4', type: 'task', title: 'Weekly Report Generated', user: 'System', time: '5 hours ago', status: 'success' },
              ]);

              // Mock Tests
              setTests([
                { id: '1', subject: 'Mathematics', class: 'Grade 10-A', date: 'APR 05', time: '09:00 AM', room: 'Room 101', type: 'midterm' },
                { id: '2', subject: 'Physics', class: 'Grade 11-B', date: 'APR 07', time: '11:30 AM', room: 'Lab 02', type: 'quiz' },
                { id: '3', subject: 'History', class: 'Grade 09-C', date: 'APR 12', time: '01:00 PM', room: 'Room 204', type: 'final' },
              ]);
          }
      } catch (e) {
          console.error("Dashboard load failed", e);
      } finally {
          setLoading(false);
      }
  };

  const getClassesForDay = (schedule: ExtendedClassSession[], day: string) => {
    if (!Array.isArray(schedule)) return [];
    return schedule
      .filter(s => s && s.day === day)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  };

  const currentSchedule = publishedSchedules.find(s => s.id === selectedScheduleId);
  const currentClassMetadata = classesInfo.find(c => c.name === currentSchedule?.class);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-supabase-muted gap-4 bg-supabase-bg">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-supabase-green"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="text-supabase-green animate-pulse" size={20} />
          </div>
        </div>
        <p className="text-sm font-mono tracking-[0.3em] uppercase animate-pulse">Initializing Dashboard Systems...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-supabase-panel border border-supabase-border rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden group">
            <Animated3D className="absolute inset-0 opacity-40 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 text-supabase-green font-black text-3xl">U</div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-supabase-text uppercase tracking-tighter flex items-center gap-3">
              Dashboard
              <span className="text-[10px] px-2 py-0.5 bg-supabase-green/10 text-supabase-green border border-supabase-green/20 rounded-full font-bold tracking-widest">v2.0 LIVE</span>
            </h1>
            <p className="text-xs text-supabase-muted mt-1 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <Activity size={12} className="text-supabase-green" />
              Real-time Academic Intelligence & Management
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-supabase-panel border border-supabase-border rounded-lg flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-supabase-green animate-pulse"></div>
            <div className="text-[10px] font-bold text-supabase-muted uppercase tracking-widest">System Status: Optimal</div>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="p-2 bg-supabase-panel border border-supabase-border rounded-lg text-supabase-muted hover:text-supabase-green hover:border-supabase-green/30 transition-all"
          >
            <Sparkles size={18} />
          </button>
        </div>
      </div>

      {/* Reports Section */}
      <DashboardReports employeeStats={employeeStats} studentStats={studentStats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Activity & Tests */}
        <div className="xl:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <RecentActivity activities={activities} />
            <UpcomingTests tests={tests} />
          </div>

          {/* Schedule Explorer Integrated */}
          <div className="bg-supabase-panel border border-supabase-border rounded-xl overflow-hidden flex flex-col min-h-[500px]">
            <div className="px-6 py-4 border-b border-supabase-border flex flex-col sm:flex-row items-center justify-between bg-supabase-sidebar gap-4">
                <div className="flex items-center gap-3 self-start sm:self-auto">
                     <div className="p-1.5 bg-supabase-green/10 rounded-lg">
                          <Calendar className="text-supabase-green" size={18} />
                     </div>
                     <h2 className="text-xs font-black text-supabase-text uppercase tracking-[0.2em]">Live Schedule Explorer</h2>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end">
                    {publishedSchedules.length === 0 && <span className="text-[10px] text-supabase-muted italic uppercase font-bold tracking-tighter">No active signals found</span>}
                    {publishedSchedules.map(sch => (
                        <button
                          key={sch.id}
                          onClick={() => setSelectedScheduleId(sch.id)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 ${selectedScheduleId === sch.id ? 'bg-supabase-green/10 text-supabase-green border-supabase-green/30 shadow-sm' : 'text-supabase-muted border-transparent hover:bg-supabase-hover hover:text-supabase-text'}`}
                        >
                            {sch.class}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-supabase-bg">
                {!currentSchedule ? (
                     <div className="h-full flex flex-col items-center justify-center text-supabase-muted gap-4 opacity-60">
                         <Cloud size={48} strokeWidth={1} />
                         <div className="text-center">
                             <p className="text-lg font-medium text-supabase-text">No Published Signals</p>
                             <p className="text-sm mt-1">Publish a schedule from the Table Editor to see it here.</p>
                         </div>
                     </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {DAYS.map((day, index) => {
                          const classes = getClassesForDay(currentSchedule.content, day);
                          const theme = EMPTY_THEMES[index % EMPTY_THEMES.length];
                          return (
                              <div key={day} className="flex flex-col gap-4 min-w-0">
                                  <div className="sticky top-0 z-10 pb-2 bg-supabase-bg border-b border-supabase-border/50">
                                      <h3 className="font-bold text-supabase-text uppercase tracking-[0.2em] text-[10px] flex justify-between items-center">
                                          {day}
                                          <span className="text-[10px] text-supabase-green bg-supabase-green/10 border border-supabase-green/20 px-2 py-0.5 rounded-full">{classes.length}</span>
                                      </h3>
                                  </div>
                                  <div className="flex flex-col gap-3">
                                      {classes.length === 0 && (
                                          <div className={`h-24 rounded-xl border border-dashed ${theme.wrapper} flex items-center justify-center group overflow-hidden relative`}>
                                              <div className={`absolute inset-0 ${theme.overlay} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                                              <span className={`text-xs font-bold ${theme.text} uppercase tracking-widest select-none animate-pulse`}>No Sessions</span>
                                          </div>
                                      )}
                                      {classes.map(session => {
                                          const displayRoom = session.room || currentClassMetadata?.room_no || 'N/A';
                                          return (
                                              <div key={session.id} className="p-4 rounded-xl border border-supabase-border bg-supabase-panel hover:border-supabase-green/30 transition-all group">
                                                  <div className="flex flex-col gap-3">
                                                      <div className="flex items-center justify-between gap-2">
                                                          <div className="font-bold text-sm leading-tight truncate text-supabase-text group-hover:text-supabase-green transition-colors">{session.title}</div>
                                                          <div className="w-8 h-8 rounded-lg border border-supabase-border overflow-hidden shrink-0 flex items-center justify-center bg-supabase-sidebar">
                                                              {session.instructorPhotoUrl && session.show_profiles === true ? (
                                                                  <img src={session.instructorPhotoUrl} alt="" className="w-full h-full object-cover" />
                                                              ) : (
                                                                  <User size={14} className="text-supabase-muted" />
                                                              )}
                                                          </div>
                                                      </div>
                                                      <div className="flex items-center gap-2 text-[10px] text-supabase-muted uppercase font-bold tracking-tight">
                                                          <div className={`w-1.5 h-1.5 rounded-full ${session.instructorStatus === 'active' ? 'bg-supabase-green' : 'bg-red-500'}`}></div>
                                                          <span className="truncate">{session.instructor}</span>
                                                      </div>
                                                      <div className="flex items-center justify-between text-[10px] pt-2 border-t border-supabase-border mt-1 text-supabase-muted font-bold uppercase tracking-tight">
                                                           <div className="flex items-center gap-1.5"><MapPin size={12} /><span>{displayRoom}</span></div>
                                                           <div className="flex items-center gap-1.5"><Clock size={12} /><span>{session.startTime}</span></div>
                                                      </div>
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Right Column: Calendar & 3D */}
        <div className="space-y-8">
          <CalendarWidget />
          
          <div className="bg-supabase-panel border border-supabase-border rounded-xl p-6 relative overflow-hidden group min-h-[300px] flex flex-col">
            <div className="relative z-10">
              <h3 className="text-sm font-bold text-supabase-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-supabase-green" />
                System Core
              </h3>
              <p className="text-[10px] text-supabase-muted uppercase font-bold tracking-widest">Neural Visualization Engine</p>
            </div>
            
            <div className="flex-1 relative">
              <Animated3D className="absolute inset-0" />
            </div>
            
            <div className="relative z-10 mt-4 p-3 rounded-lg bg-supabase-bg/50 border border-supabase-border/50 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[9px] font-bold text-supabase-muted uppercase tracking-widest">
                <span>Processing Load</span>
                <span className="text-supabase-green">2.4%</span>
              </div>
              <div className="w-full h-1 bg-supabase-border rounded-full mt-2 overflow-hidden">
                <div className="w-[24%] h-full bg-supabase-green"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
