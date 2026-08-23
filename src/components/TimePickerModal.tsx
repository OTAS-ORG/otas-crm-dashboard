import React, { useState, useEffect } from "react";
import { X, Clock, Check } from "lucide-react";

export interface TimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  value?: string; // "HH:mm" in 24-hour format, e.g. "09:30" or "14:00"
  onChange: (time24: string) => void;
  title?: string;
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const QUICK_TIMES = [
  { label: "09:00 AM", val: "09:00" },
  { label: "10:00 AM", val: "10:00" },
  { label: "11:30 AM", val: "11:30" },
  { label: "01:00 PM", val: "13:00" },
  { label: "02:30 PM", val: "14:30" },
  { label: "04:00 PM", val: "16:00" },
  { label: "05:00 PM", val: "17:00" },
];

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  isOpen,
  onClose,
  value = "09:00",
  onChange,
  title = "Select Time",
}) => {
  // Parse initial 24h string into 12h, minute and period (AM/PM)
  const parseTime = (timeStr?: string) => {
    if (!timeStr) return { hour12: 9, minute: 0, period: "AM" as const };
    const [hStr, mStr] = timeStr.split(":");
    let h = parseInt(hStr || "9", 10);
    const m = parseInt(mStr || "0", 10);
    const period = h >= 12 ? ("PM" as const) : ("AM" as const);
    h = h % 12;
    if (h === 0) h = 12;
    return { hour12: h, minute: m, period };
  };

  const initial = parseTime(value);
  const [selectedHour, setSelectedHour] = useState<number>(initial.hour12);
  const [selectedMinute, setSelectedMinute] = useState<number>(initial.minute);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(initial.period);
  const [mode, setMode] = useState<"hours" | "minutes">("hours");

  useEffect(() => {
    if (isOpen) {
      const parsed = parseTime(value);
      setSelectedHour(parsed.hour12);
      setSelectedMinute(parsed.minute);
      setSelectedPeriod(parsed.period);
      setMode("hours");
    }
  }, [isOpen, value]);

  if (!isOpen) return null;

  const handleHourSelect = (h: number) => {
    setSelectedHour(h);
    // Smooth transition to minute selection like timepicker-ui
    setMode("minutes");
  };

  const handleMinuteSelect = (m: number) => {
    setSelectedMinute(m);
  };

  const handleConfirm = () => {
    let h24 = selectedHour;
    if (selectedPeriod === "PM" && h24 < 12) h24 += 12;
    if (selectedPeriod === "AM" && h24 === 12) h24 = 0;

    const formattedH = String(h24).padStart(2, "0");
    const formattedM = String(selectedMinute).padStart(2, "0");
    onChange(`${formattedH}:${formattedM}`);
    onClose();
  };

  const handleQuickSelect = (time24: string) => {
    onChange(time24);
    onClose();
  };

  // Coordinates for clock numbers (12 items around 360 deg)
  const getClockPosition = (index: number, total: number, radius = 96) => {
    // 12 is at the top (-90 degrees)
    const angle = (index * (360 / total) - 90) * (Math.PI / 180);
    const x = Math.round(radius * Math.cos(angle));
    const y = Math.round(radius * Math.sin(angle));
    return { x, y };
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[75] flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* 100% Solid Opaque Timepicker Dialog */}
      <div
        className="no-glass modal-card bg-white rounded-3xl shadow-2xl w-full max-w-[340px] overflow-hidden border border-slate-200 p-6 animate-in zoom-in-95 duration-150 flex flex-col"
        style={{ backgroundColor: "#ffffff", opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {title}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Digital Time Header (Interactive Large Digits) */}
        <div className="my-4 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-center gap-3">
          <div className="flex items-center gap-1">
            {/* Hour Button */}
            <button
              type="button"
              onClick={() => setMode("hours")}
              className={`w-16 h-14 rounded-2xl flex items-center justify-center text-2xl font-black transition-all cursor-pointer ${
                mode === "hours"
                  ? "bg-primary text-white shadow-md shadow-primary/25 scale-105"
                  : "bg-white text-slate-800 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {String(selectedHour).padStart(2, "0")}
            </button>

            <span className="text-2xl font-bold text-slate-400 pb-1">:</span>

            {/* Minute Button */}
            <button
              type="button"
              onClick={() => setMode("minutes")}
              className={`w-16 h-14 rounded-2xl flex items-center justify-center text-2xl font-black transition-all cursor-pointer ${
                mode === "minutes"
                  ? "bg-primary text-white shadow-md shadow-primary/25 scale-105"
                  : "bg-white text-slate-800 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {String(selectedMinute).padStart(2, "0")}
            </button>
          </div>

          {/* AM / PM Toggle */}
          <div className="flex flex-col gap-1 p-1 bg-white rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedPeriod("AM")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                selectedPeriod === "AM"
                  ? "bg-primary text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod("PM")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                selectedPeriod === "PM"
                  ? "bg-primary text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              PM
            </button>
          </div>
        </div>

        {/* Circular Clock Face */}
        <div className="relative w-60 h-60 mx-auto my-2 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
          {/* Clock Center Dot */}
          <div className="w-3 h-3 rounded-full bg-primary z-10" />

          {/* Hour Mode Clock Numbers */}
          {mode === "hours" &&
            HOURS.map((h, i) => {
              const { x, y } = getClockPosition(i, 12, 90);
              const isCurrent = selectedHour === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleHourSelect(h)}
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                  className={`absolute w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-primary text-white shadow-md shadow-primary/30 scale-115 z-20"
                      : "text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {h}
                </button>
              );
            })}

          {/* Minute Mode Clock Numbers */}
          {mode === "minutes" &&
            MINUTES.map((m, i) => {
              const { x, y } = getClockPosition(i, 12, 90);
              const isCurrent = selectedMinute === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMinuteSelect(m)}
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                  className={`absolute w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-primary text-white shadow-md shadow-primary/30 scale-115 z-20"
                      : "text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {String(m).padStart(2, "0")}
                </button>
              );
            })}
        </div>

        {/* Quick Presets */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Quick Times
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TIMES.slice(0, 5).map((q) => (
              <button
                key={q.val}
                type="button"
                onClick={() => handleQuickSelect(q.val)}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-600 transition-colors cursor-pointer"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 bg-primary hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-primary/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimePickerModal;
