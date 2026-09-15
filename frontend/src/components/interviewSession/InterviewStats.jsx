import React, { useMemo } from 'react';
import { Calendar as CalendarIcon, CalendarPlus, Clock } from 'lucide-react';

export default function InterviewStats({ sessions = [], count, loading = false }) {
  // Derive active and upcoming stats if full session data array is passed
  const stats = useMemo(() => {
    // Fallback to explicit `count` prop if session list array isn't provided
    const totalCount = Array.isArray(sessions) && sessions.length > 0 ? sessions.length : (count || 0);

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return {
        total: totalCount,
        upcoming: totalCount,
        thisMonth: 0,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let upcomingCount = 0;
    let monthCount = 0;

    sessions.forEach((s) => {
      if (!s.session_date) return;
      const sessionDate = new Date(s.session_date);

      if (sessionDate >= today) {
        upcomingCount += 1;
      }

      if (sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear) {
        monthCount += 1;
      }
    });

    return {
      total: totalCount,
      upcoming: upcomingCount,
      thisMonth: monthCount,
    };
  }, [sessions, count]);

  const statCards = [
    { 
      id: 'total', 
      value: stats.total, 
      label: 'Total Tracked Sessions', 
      topBorderColor: 'border-[#0f2c59]', 
      iconBg: 'bg-[#0f2c59]/10', 
      iconColor: 'text-[#0f2c59]', 
      icon: CalendarIcon 
    },
    { 
      id: 'upcoming', 
      value: stats.upcoming, 
      label: 'Upcoming / Active Schedules', 
      topBorderColor: 'border-blue-500', 
      iconBg: 'bg-blue-50', 
      iconColor: 'text-blue-600', 
      icon: CalendarPlus 
    },
    { 
      id: 'thisMonth', 
      value: stats.thisMonth, 
      label: 'Scheduled This Month', 
      topBorderColor: 'border-emerald-500', 
      iconBg: 'bg-emerald-50', 
      iconColor: 'text-emerald-600', 
      icon: Clock 
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {statCards.map((card) => {
        const IconComp = card.icon;
        return (
          <div 
            key={card.id} 
            className={`bg-white rounded-xl shadow-sm border border-slate-200 border-t-4 ${card.topBorderColor} px-5 py-4 flex items-center gap-4 transition-all`}
          >
            <div className={`p-3 rounded-xl ${card.iconBg} ${card.iconColor} shrink-0`}>
              <IconComp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="h-7 w-12 bg-slate-200 animate-pulse rounded-md" />
              ) : (
                <span className="text-2xl font-black text-slate-800 leading-none tracking-tight block">
                  {card.value}
                </span>
              )}
              <span className="text-[11px] font-semibold text-slate-500 block mt-1 truncate">
                {card.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}