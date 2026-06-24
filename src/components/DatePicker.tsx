import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label: string;
  error?: boolean;
  className?: string;
  alignRight?: boolean;
  onOpenChange?: (open: boolean) => void;
  openUpward?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'YYYY-MM-DD',
  label,
  error = false,
  className = '',
  alignRight = false,
  onOpenChange,
  openUpward = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Propagate open state to parent
  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(isOpen);
    }
  }, [isOpen, onOpenChange]);

  // Parse initial date or default to today
  const getParsedDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d);
      }
    }
    return new Date();
  };

  const initialDate = getParsedDate(value);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-11

  // Update calendar view when value changes from outside
  useEffect(() => {
    if (value) {
      const date = getParsedDate(value);
      setViewYear(date.getFullYear());
      setViewMonth(date.getMonth());
    }
  }, [value]);

  // Click outside listener list
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Format YYYY-MM-DD manually
  const formatDateString = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // Keyboard input formatter (auto-dash)
  const handleTextInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw.length > 8) raw = raw.slice(0, 8);

    let formatted = raw;
    if (raw.length >= 5) {
      formatted = `${raw.slice(0, 4)}-${raw.slice(4, 6)}`;
      if (raw.length >= 7) {
        formatted = `${formatted}-${raw.slice(6, 8)}`;
      }
    } else if (raw.length >= 4) {
      formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`;
    }
    onChange(formatted);
  };

  // Pre-calculate years for dropdown (currentYear + 10 down to 1930 for much quicker year selection)
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear + 10; y >= 1930; y--) {
    years.push(y);
  }

  const months = [
    { label: '1월 (Jan)', value: 0 },
    { label: '2월 (Feb)', value: 1 },
    { label: '3월 (Mar)', value: 2 },
    { label: '4월 (Apr)', value: 3 },
    { label: '5월 (May)', value: 4 },
    { label: '6월 (Jun)', value: 5 },
    { label: '7월 (Jul)', value: 6 },
    { label: '8월 (Aug)', value: 7 },
    { label: '9월 (Sep)', value: 8 },
    { label: '10월 (Oct)', value: 9 },
    { label: '11월 (Nov)', value: 10 },
    { label: '12월 (Dec)', value: 11 },
  ];

  // Calendar days grid calculations
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 = Sunday
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  // Month step back/forward
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const selectDate = (day: number) => {
    const formatted = formatDateString(viewYear, viewMonth, day);
    onChange(formatted);
    setIsOpen(false);
  };

  // Helper to highlight currently selected date in value
  const isSelectedDate = (day: number) => {
    return value === formatDateString(viewYear, viewMonth, day);
  };

  // Generates day cells
  const dayCells = [];
  for (let i = 0; i < firstDay; i++) {
    dayCells.push(<div key={`empty-${i}`} className="h-8" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const isSelected = isSelectedDate(day);
    dayCells.push(
      <button
        key={`day-${day}`}
        type="button"
        onClick={() => selectDate(day)}
        className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-semibold cursor-pointer transition-all ${
          isSelected 
            ? 'bg-blue-600 text-white font-extrabold shadow shadow-blue-500/50' 
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`}
      >
        {day}
      </button>
    );
  }

  return (
    <div className={`relative ${className} ${isOpen ? 'z-[9999]' : 'z-10'}`} ref={containerRef}>
      <label className={`block text-xs font-bold leading-none mb-1.5 uppercase tracking-wider ${
        error ? 'text-rose-500' : 'text-slate-400'
      }`}>
        {label}
      </label>

      <div className="relative" onClick={() => setIsOpen(true)}>
        <input
          type="text"
          value={value}
          onChange={handleTextInput}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          maxLength={10}
          className={`w-full bg-black/40 border border-white/10 text-white placeholder-slate-500 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all font-mono font-bold ${
            error ? 'border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.15)] bg-rose-950/10' : ''
          }`}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-white/5 active:bg-white/10 rounded-lg transition-all"
        >
          <CalendarIcon className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Polish Grid calendar popover dropdown */}
      {isOpen && (
        <div className={`absolute z-[9999] w-[280px] bg-slate-900/95 backdrop-blur-md border border-white/15 shadow-2xl rounded-2xl p-4 text-slate-200 ${
          openUpward ? 'bottom-full mb-2 origin-bottom' : 'mt-1.5 origin-top'
        } ${
          alignRight ? 'right-0' : 'left-0'
        }`}>
          {/* Header containing Fast Select Year and Month dropdowns */}
          <div className="flex items-center justify-between gap-1 mb-3 bg-black/30 p-1.5 rounded-xl">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 cursor-pointer hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-1 items-center flex-1 justify-center">
              {/* Month Selector dropdown */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="bg-transparent text-xs font-extrabold text-blue-400 border-0 outline-none cursor-pointer hover:text-blue-300 pr-1 py-0.5 focus:ring-0"
                style={{ colorScheme: 'dark' }}
              >
                {months.map(m => (
                  <option key={m.value} value={m.value} className="bg-slate-950 text-slate-200 font-semibold">
                    {m.label}
                  </option>
                ))}
              </select>

              {/* Year Selector dropdown */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="bg-transparent text-xs font-extrabold text-white border-0 outline-none cursor-pointer hover:text-slate-200 py-0.5 focus:ring-0"
                style={{ colorScheme: 'dark' }}
              >
                {years.map(y => (
                  <option key={y} value={y} className="bg-slate-950 text-slate-200 font-semibold">
                    {y}년
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1 cursor-pointer hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">
            <div>일</div>
            <div>월</div>
            <div>화</div>
            <div>수</div>
            <div>목</div>
            <div>금</div>
            <div>토</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {dayCells}
          </div>

          {/* Quick close button */}
          <div className="flex justify-end mt-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[10px] cursor-pointer text-slate-400 hover:text-white bg-white/5 hover:bg-white/15 px-2 py-1 rounded-md transition-all font-semibold"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
