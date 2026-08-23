import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ChevronDown, X, Calendar as CalendarIcon } from "lucide-react";

export interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  value?: string; // YYYY-MM-DD or ISO string
  onChange: (dateStr: string) => void;
  title?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  value,
  onChange,
  title = "Select Date",
}) => {
  // Parse initial selected date
  const parseDate = (val?: string) => {
    if (!val) return new Date();
    const parts = val.split("T")[0].split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const selectedDate = value ? parseDate(value) : null;

  const [currentYear, setCurrentYear] = useState<number>(
    selectedDate ? selectedDate.getFullYear() : new Date().getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState<number>(
    selectedDate ? selectedDate.getMonth() : new Date().getMonth()
  );
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  useEffect(() => {
    if (isOpen && value) {
      const d = parseDate(value);
      setCurrentYear(d.getFullYear());
      setCurrentMonth(d.getMonth());
    }
  }, [isOpen, value]);

  if (!isOpen) return null;

  // Days in month calculation
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const totalDays = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const prevMonthDays = getDaysInMonth(
    currentMonth === 0 ? currentYear - 1 : currentYear,
    currentMonth === 0 ? 11 : currentMonth - 1
  );

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const m = String(currentMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const formatted = `${currentYear}-${m}-${d}`;
    onChange(formatted);
    onClose();
  };

  const handleToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const formatted = `${y}-${m}-${d}`;
    onChange(formatted);
    onClose();
  };

  const handleClear = () => {
    onChange("");
    onClose();
  };

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === currentYear &&
    today.getMonth() === currentMonth &&
    today.getDate() === day;

  const isSelected = (day: number) =>
    selectedDate &&
    selectedDate.getFullYear() === currentYear &&
    selectedDate.getMonth() === currentMonth &&
    selectedDate.getDate() === day;

  // Calendar cells
  const cells = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      isPrev: true,
    });
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    cells.push({
      day: d,
      isCurrentMonth: true,
    });
  }

  // Next month leading days to complete the 35 or 42 grid
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let n = 1; n <= remaining; n++) {
    cells.push({
      day: n,
      isCurrentMonth: false,
      isNext: true,
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="calendar-card no-glass bg-white rounded-3xl shadow-2xl w-full max-w-[340px] overflow-hidden border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col"
        style={{ backgroundColor: "#ffffff", opacity: 1, backdropFilter: "none", WebkitBackdropFilter: "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Close */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month & Year Navigation Bar */}
        <div className="flex items-center justify-between py-2 mb-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="flex items-center gap-1.5 text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
            >
              <span>{MONTH_NAMES[currentMonth]} {currentYear}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showMonthDropdown ? "rotate-180" : ""}`} />
            </button>

            {/* Quick Month / Year Picker Dropdown */}
            {showMonthDropdown && (
              <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-20 grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                {MONTH_NAMES.map((name, idx) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setCurrentMonth(idx);
                      setShowMonthDropdown(false);
                    }}
                    className={`px-2 py-1.5 text-xs font-medium rounded-lg text-left transition-colors ${
                      currentMonth === idx
                        ? "bg-blue-600 text-white font-bold"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {name.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              title="Previous Month"
              className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-slate-900"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              title="Next Month"
              className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-slate-900"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Row */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {DAYS_OF_WEEK.map((dw) => (
            <div
              key={dw}
              className="text-xs font-bold text-slate-600 py-1"
            >
              {dw}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center mb-4">
          {cells.map((cell, idx) => {
            if (!cell.isCurrentMonth) {
              return (
                <div
                  key={idx}
                  className="h-9 flex items-center justify-center text-xs text-slate-300 font-medium select-none"
                >
                  {cell.day}
                </div>
              );
            }

            const sel = isSelected(cell.day);
            const tod = isToday(cell.day);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleDateClick(cell.day)}
                className={`h-9 w-full flex items-center justify-center text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  sel
                    ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30 scale-105"
                    : tod
                    ? "border border-blue-500 text-blue-600 font-bold bg-blue-50/50 hover:bg-blue-100"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {cell.day}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions: Clear & Today */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold">
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-red-500 transition-colors py-1 px-2 rounded-lg hover:bg-red-50"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="text-blue-600 hover:text-blue-700 transition-colors py-1 px-3 rounded-lg hover:bg-blue-50"
          >
            Today
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CalendarModal;
