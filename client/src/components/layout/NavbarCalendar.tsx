import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, Clock, CalendarDays, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavbarCalendarProps {
  className?: string;
  variant?: 'navbar' | 'dashboard';
}

export const NavbarCalendar: React.FC<NavbarCalendarProps> = ({ className = '', variant = 'navbar' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isCaptain = location.pathname.startsWith('/captain');
  const isSupporter = location.pathname.startsWith('/supporter');
  const basePrefix = isCaptain ? '/captain' : isSupporter ? '/supporter' : '/admin';

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Real today's date
  const realToday = new Date();
  
  // State for view month/year and user-selected date
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<string>('');

  // Live clock updates every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Label for the button (e.g. "27 Oct 2026")
  const todayButtonLabel = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(selectedDate);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Navigate months
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleJumpToToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  // Build days grid for the view month
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays: Array<{
    day: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    dateObj: Date;
    isToday: boolean;
    isSelected: boolean;
  }> = [];

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dateObj = new Date(viewYear, viewMonth - 1, day);
    calendarDays.push({
      day,
      month: viewMonth - 1,
      year: viewYear,
      isCurrentMonth: false,
      dateObj,
      isToday: isSameDay(dateObj, realToday),
      isSelected: isSameDay(dateObj, selectedDate)
    });
  }

  // Current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const dateObj = new Date(viewYear, viewMonth, day);
    calendarDays.push({
      day,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true,
      dateObj,
      isToday: isSameDay(dateObj, realToday),
      isSelected: isSameDay(dateObj, selectedDate)
    });
  }

  // Next month leading days to complete 35 or 42 cells
  const remainingCells = (calendarDays.length <= 35 ? 35 : 42) - calendarDays.length;
  for (let day = 1; day <= remainingCells; day++) {
    const dateObj = new Date(viewYear, viewMonth + 1, day);
    calendarDays.push({
      day,
      month: viewMonth + 1,
      year: viewYear,
      isCurrentMonth: false,
      dateObj,
      isToday: isSameDay(dateObj, realToday),
      isSelected: isSameDay(dateObj, selectedDate)
    });
  }

  function isSameDay(d1: Date, d2: Date) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  // Format selected date YYYY-MM-DD for routing
  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const selectedDay = String(selectedDate.getDate()).padStart(2, '0');
  const selectedYMD = `${selectedYear}-${selectedMonth}-${selectedDay}`;

  const selectedDateFull = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(selectedDate);

  const isTodaySelected = isSameDay(selectedDate, realToday);
  const isPast = selectedDate < new Date(realToday.getFullYear(), realToday.getMonth(), realToday.getDate());

  const handleActionClick = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Calendar Trigger Button */}
      {variant === 'dashboard' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 select-none group ${
            isOpen
              ? 'bg-blue-50 border-blue-400 text-blue-800 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
          }`}
          title="Fleet Operations Calendar & Schedule (Click to open)"
          aria-label="Toggle fleet calendar"
          aria-expanded={isOpen}
        >
          <CalendarDays className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
          <span>{todayButtonLabel}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer select-none group ${
            isOpen
              ? 'bg-blue-50/90 border-blue-400 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
          }`}
          title="Fleet Calendar & Operations Schedule (Click to open)"
          aria-label="Toggle fleet calendar"
          aria-expanded={isOpen}
        >
          <Calendar className="w-3.5 h-3.5 text-[#2563EB] group-hover:scale-110 transition-transform" />
          <span className="font-semibold">{todayButtonLabel}</span>
        </button>
      )}

      {/* Calendar Dropdown Modal */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 text-slate-800 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95">
          {/* Top Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#142B4A] to-[#1E3A5F] text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CalendarDays className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-sm">Fleet Calendar & Schedule</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-mono text-blue-200 border border-white/20">
                <Clock className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>{currentTime || 'Live'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month Navigation & Controls */}
          <div className="p-4 bg-slate-50/60 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="font-black text-sm text-slate-800 tracking-tight px-1">
                  {monthNames[viewMonth]} {viewYear}
                </h3>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 mt-3 text-center">
              {daysOfWeek.map((day, idx) => (
                <div
                  key={day}
                  className={`text-[11px] font-bold py-1 ${
                    idx === 0 || idx === 6 ? 'text-amber-600' : 'text-slate-400'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1 mt-1 text-center">
              {calendarDays.map((item, index) => {
                const isSelected = item.isSelected;
                const isToday = item.isToday;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedDate(item.dateObj)}
                    className={`h-8 text-xs font-semibold rounded-xl flex items-center justify-center transition-all relative cursor-pointer ${
                      isSelected
                        ? 'bg-[#142B4A] text-white shadow-sm font-bold scale-105 z-10'
                        : isToday
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-300 hover:bg-blue-100'
                        : item.isCurrentMonth
                        ? 'text-slate-700 hover:bg-slate-100'
                        : 'text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.day}</span>
                    {isToday && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Details & Operational Navigation Shortcuts */}
          <div className="p-3.5 bg-white text-xs space-y-2.5">
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-800 text-xs">{selectedDateFull}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {isTodaySelected ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Today's Live Fleet Operations
                    </span>
                  ) : isPast ? (
                    'Historical Fleet Operations'
                  ) : (
                    'Future Scheduled Roster'
                  )}
                </p>
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {selectedYMD}
              </span>
            </div>

            {/* Quick Action Shortcuts */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {!isCaptain && !isSupporter && (
                <button
                  type="button"
                  onClick={() => handleActionClick(`/admin/tasks?date=${selectedYMD}`)}
                  className="flex items-center justify-between p-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 transition-all text-left group cursor-pointer"
                >
                  <div>
                    <p className="font-bold text-[11px] text-slate-900 group-hover:text-blue-700">Trip & Tasks</p>
                    <p className="text-[10px] text-slate-400">View roster for date</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              )}

              <button
                type="button"
                onClick={() => handleActionClick(`${basePrefix}/daily-kilometers?date=${selectedYMD}`)}
                className="flex items-center justify-between p-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 transition-all text-left group cursor-pointer"
              >
                <div>
                  <p className="font-bold text-[11px] text-slate-900 group-hover:text-blue-700">Daily KM Logs</p>
                  <p className="text-[10px] text-slate-400">Mileage & fueling</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => handleActionClick(`${basePrefix}/maintenance-schedule`)}
                className="flex items-center justify-between p-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 transition-all text-left group cursor-pointer"
              >
                <div>
                  <p className="font-bold text-[11px] text-slate-900 group-hover:text-blue-700">Maintenance</p>
                  <p className="text-[10px] text-slate-400">Service schedules</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => handleActionClick(`${basePrefix}/dashboard`)}
                className="flex items-center justify-between p-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 transition-all text-left group cursor-pointer"
              >
                <div>
                  <p className="font-bold text-[11px] text-slate-900 group-hover:text-blue-700">Dashboard</p>
                  <p className="text-[10px] text-slate-400">Fleet overview</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Select any date to inspect duty logs</span>
            <button
              type="button"
              onClick={handleJumpToToday}
              className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
            >
              Reset to Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
