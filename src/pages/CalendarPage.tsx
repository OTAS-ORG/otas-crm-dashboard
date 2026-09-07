import React, { useState, useEffect, useMemo } from "react";
import { eventService, userManagementService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { CalendarEvent, UserInfo } from "../types";
import EventModal from "../components/EventModal";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  MapPin,
  Users,
  Clock,
  Building2,
  CalendarDays,
  List,
  Columns,
  Search,
  ExternalLink,
  User,
  Globe,
  X,
  ArrowUpDown,
} from "lucide-react";

type CalendarViewMode = "month" | "week" | "day" | "agenda";

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

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS_RANGE = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", badge: "bg-blue-500" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", badge: "bg-indigo-500" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", badge: "bg-emerald-500" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-500" },
  rose: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", badge: "bg-rose-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", badge: "bg-purple-500" },
};

// Helper: Format a Date object into YYYY-MM-DD using local timezone (NOT UTC toISOString)
const getLocalDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const CalendarPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [initialModalDate, setInitialModalDate] = useState<string>("");
  const [initialModalTime, setInitialModalTime] = useState<string>("09:00");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [currentDate, viewMode]);

  const fetchUsers = async () => {
    try {
      const data = await userManagementService.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to load users for calendar", err);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Fetch 3 months range around current date for smooth navigation
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month + 2, 0, 23, 59, 59);

      const data = await eventService.getEvents({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      setEvents(data || []);
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // User filter
      if (selectedUserFilter !== "all") {
        const orgId = typeof ev.organizer === "object" && ev.organizer ? ev.organizer._id : ev.organizer;
        const attIds = (ev.attendees || []).map((a) => (typeof a === "object" && a ? a._id : a));
        if (orgId !== selectedUserFilter && !attIds.includes(selectedUserFilter)) {
          return false;
        }
      }

      // Type filter
      if (selectedTypeFilter !== "all" && ev.type !== selectedTypeFilter) {
        return false;
      }

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchDesc = ev.description?.toLowerCase().includes(q);
        const matchClient =
          typeof ev.clientId === "object" && ev.clientId
            ? ev.clientId.companyName.toLowerCase().includes(q)
            : false;
        if (!matchTitle && !matchDesc && !matchClient) return false;
      }

      return true;
    });
  }, [events, selectedUserFilter, selectedTypeFilter, searchQuery]);

  // Navigation Handlers
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const openCreateModal = (dateStr?: string, timeStr?: string) => {
    setEventToEdit(null);
    setInitialModalDate(dateStr || getLocalDateString(new Date()));
    setInitialModalTime(timeStr || "09:00");
    setShowEventModal(true);
  };

  const openEditModal = (ev: CalendarEvent) => {
    setEventToEdit(ev);
    setShowEventModal(true);
  };

  // Month Grid Calculation
  const monthDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dateStr: getLocalDateString(d),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        isCurrentMonth: true,
        dateStr: getLocalDateString(d),
      });
    }

    // Next month padding to fill 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dateStr: getLocalDateString(d),
      });
    }

    return days;
  }, [year, month]);

  // Week Days Calculation
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return {
        date: d,
        dateStr: getLocalDateString(d),
        dayName: DAYS_SHORT[d.getDay()],
        dayNum: d.getDate(),
        isToday: d.toDateString() === new Date().toDateString(),
      };
    });
  }, [currentDate]);

  // Group events by Date String for quick lookup using local date
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach((ev) => {
      const dateKey = getLocalDateString(new Date(ev.startDate));
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(ev);
    });
    return map;
  }, [filteredEvents]);

  // Agenda sort order: "desc" (latest first / reverted) or "asc" (oldest first)
  const [agendaSortOrder, setAgendaSortOrder] = useState<"desc" | "asc">("desc");

  const agendaEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const diff = new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      return agendaSortOrder === "desc" ? diff : -diff;
    });
  }, [filteredEvents, agendaSortOrder]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header matching OTAS CRM Design System */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-blue-500 to-indigo-600 bg-clip-text text-transparent tracking-tight">
            Calendar & Meetings
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Team schedules, client appointments and company events
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "month"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "week"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Week</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("agenda")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "agenda"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>
          </div>

          {/* Schedule Meeting Button */}
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-primary to-indigo-500 text-white text-xs rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all font-bold cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Meeting
          </button>
        </div>
      </div>

      {/* Main Layout Grid (Filter Sidebar + Calendar Body) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Team & Schedule Filters */}
        <div className="lg:col-span-3 space-y-5">
          {/* Navigation Month / Date Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">
                {MONTH_NAMES[month]} {year}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  title="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20 rounded-md hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  title="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Team Member Filter: "Who has meetings?" */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" /> Team Availability
              </span>
              {selectedUserFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedUserFilter("all")}
                  className="text-[10px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Reset Filter
                </button>
              )}
            </div>

            {/* Quick Switch Buttons */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/80 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedUserFilter("all")}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedUserFilter === "all"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>All Team</span>
                <span className="text-[10px] font-bold opacity-75">({events.length})</span>
              </button>

              {currentUser && (
                <button
                  type="button"
                  onClick={() => setSelectedUserFilter(currentUser._id || "")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedUserFilter === currentUser._id
                      ? "bg-white text-primary shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>My Schedule</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              Click a member below to view their schedule:
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {users.map((u) => {
                const isSelected = selectedUserFilter === u._id;
                // Count meetings for this user
                const userEventCount = events.filter((ev) => {
                  const orgId = typeof ev.organizer === "object" && ev.organizer ? ev.organizer._id : ev.organizer;
                  const attIds = (ev.attendees || []).map((a) => (typeof a === "object" && a ? a._id : a));
                  return orgId === u._id || attIds.includes(u._id);
                }).length;

                return (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => setSelectedUserFilter(isSelected ? "all" : u._id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
                      isSelected
                        ? "bg-primary text-white border-primary shadow-2xs"
                        : "bg-slate-50/70 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isSelected
                            ? "bg-white"
                            : userEventCount > 0
                            ? "bg-blue-500"
                            : "bg-emerald-500"
                        }`}
                      />
                      <span className="truncate">{u.username}</span>
                      {u.role && (
                        <span
                          className={`text-[9px] font-normal px-1 py-0.2 rounded shrink-0 ${
                            isSelected ? "text-white/80" : "text-slate-400"
                          }`}
                        >
                          {u.role}
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    {userEventCount > 0 ? (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {userEventCount} {userEventCount === 1 ? "meeting" : "meetings"}
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg shrink-0 ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}
                      >
                        Free
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Event Types Filter & Legend */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Event Types
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: "All Types" },
                { id: "meeting", label: "Meeting" },
                { id: "call", label: "Call" },
                { id: "task", label: "Task" },
                { id: "reminder", label: "Reminder" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTypeFilter(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    selectedTypeFilter === t.id
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Calendar Grid Area */}
        <div className="lg:col-span-9 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[680px]">
          {/* Header Date Info inside Container */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-800">
                    {viewMode === "month" && `${MONTH_NAMES[month]} ${year}`}
                    {viewMode === "week" && `Week of ${weekDays[0].date.toLocaleDateString()} — ${weekDays[6].date.toLocaleDateString()}`}
                    {viewMode === "agenda" && `Upcoming Schedule (${filteredEvents.length} Meetings)`}
                  </h3>
                  {loading && (
                    <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[11px] text-slate-400 font-medium">
                    {selectedUserFilter === "all" ? (
                      "Viewing entire team schedule"
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md font-bold text-[10px]">
                        <User className="w-3 h-3" />
                        Filtered: {users.find((u) => u._id === selectedUserFilter)?.username || "User"}
                        <button
                          type="button"
                          onClick={() => setSelectedUserFilter("all")}
                          className="ml-1 hover:text-rose-500 cursor-pointer font-bold"
                          title="Clear filter"
                        >
                          ✕
                        </button>
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {viewMode === "agenda" && (
                <button
                  type="button"
                  onClick={() => setAgendaSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer mr-1"
                  title={agendaSortOrder === "desc" ? "Showing Latest First (click to switch to Oldest First)" : "Showing Oldest First (click to switch to Latest First)"}
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>{agendaSortOrder === "desc" ? "Latest First" : "Oldest First"}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handlePrev}
                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* VIEW 1: MONTH VIEW */}
          {viewMode === "month" && (
            <div className="flex-1 flex flex-col">
              {/* Day Headers (Sun - Sat) */}
              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70 text-center py-2.5">
                {DAYS_SHORT.map((d) => (
                  <span key={d} className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {d}
                  </span>
                ))}
              </div>

              {/* Month Days Grid */}
              <div className="grid grid-cols-7 grid-rows-5 flex-1 divide-x divide-y divide-slate-100">
                {monthDays.map((dayItem, idx) => {
                  const dayEvents = eventsByDate[dayItem.dateStr] || [];
                  const isToday = dayItem.date.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={idx}
                      onClick={() => openCreateModal(dayItem.dateStr)}
                      className={`min-h-[110px] p-2 flex flex-col transition-colors cursor-pointer group hover:bg-blue-50/30 ${
                        !dayItem.isCurrentMonth ? "bg-slate-50/40 text-slate-300" : "bg-white"
                      }`}
                    >
                      {/* Day Number Header */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isToday
                              ? "bg-primary text-white shadow-xs"
                              : dayItem.isCurrentMonth
                              ? "text-slate-700 group-hover:text-primary"
                              : "text-slate-300"
                          }`}
                        >
                          {dayItem.date.getDate()}
                        </span>

                        {dayEvents.length > 0 && (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-md">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Event Chips */}
                      <div className="space-y-1 overflow-hidden flex-1">
                        {dayEvents.slice(0, 3).map((ev) => {
                          const cStyle = COLOR_MAP[ev.color] || COLOR_MAP.blue;
                          const startTimeStr = new Date(ev.startDate).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          });
                          const orgName = typeof ev.organizer === "object" && ev.organizer ? ev.organizer.username : "Team";
                          const clientName = typeof ev.clientId === "object" && ev.clientId ? ev.clientId.companyName : "";
                          const attendeeNames = (ev.attendees || [])
                            .map((a) => (typeof a === "object" && a ? a.username : ""))
                            .filter(Boolean)
                            .join(", ");

                          const tooltipText = `${ev.title}\nTime: ${startTimeStr}\nOrganizer: ${orgName}${attendeeNames ? `\nAttendees: ${attendeeNames}` : ""}${clientName ? `\nClient: ${clientName}` : ""}`;

                          return (
                            <div
                              key={ev._id}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(ev);
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all truncate flex items-center gap-1.5 shadow-2xs hover:scale-[1.02] cursor-pointer ${cStyle.bg} ${cStyle.text} ${cStyle.border}`}
                              title={tooltipText}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${cStyle.badge} shrink-0`} />
                              <span className="font-mono text-[9px] opacity-75 shrink-0">{startTimeStr}</span>
                              <span className="truncate">{ev.title}</span>
                              <span className="text-[9px] font-normal opacity-70 truncate max-w-[60px] shrink-0">
                                ({orgName})
                              </span>
                              {ev.meetingUrl && <Video className="w-2.5 h-2.5 shrink-0 ml-auto text-blue-600" />}
                            </div>
                          );
                        })}

                        {dayEvents.length > 3 && (
                          <span className="text-[9px] font-bold text-slate-400 block text-center mt-0.5">
                            +{dayEvents.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: WEEK VIEW */}
          {viewMode === "week" && (
            <div className="flex-1 flex flex-col overflow-y-auto max-h-[700px]">
              {/* Week Day Header */}
              <div className="grid grid-cols-8 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10">
                <div className="p-3 text-center text-[10px] font-bold text-slate-400 border-r border-slate-100">
                  TIME
                </div>
                {weekDays.map((wd) => (
                  <div
                    key={wd.dateStr}
                    className={`p-2.5 text-center border-r border-slate-100 last:border-r-0 ${
                      wd.isToday ? "bg-primary/5" : ""
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {wd.dayName}
                    </span>
                    <span
                      className={`inline-block w-7 h-7 rounded-full text-xs font-bold leading-7 mt-0.5 ${
                        wd.isToday ? "bg-primary text-white shadow-2xs" : "text-slate-800"
                      }`}
                    >
                      {wd.dayNum}
                    </span>
                  </div>
                ))}
              </div>

              {/* Time Slots Rows */}
              <div className="divide-y divide-slate-100">
                {HOURS_RANGE.map((hour) => {
                  const hourStr = `${String(hour).padStart(2, "0")}:00`;
                  return (
                    <div key={hour} className="grid grid-cols-8 min-h-[64px]">
                      {/* Time Label */}
                      <div className="p-2 text-center text-[10px] font-bold text-slate-400 border-r border-slate-100">
                        {hourStr}
                      </div>

                      {/* Day Columns for this hour */}
                      {weekDays.map((wd) => {
                        const dayEvents = (eventsByDate[wd.dateStr] || []).filter((ev) => {
                          const evH = new Date(ev.startDate).getHours();
                          return evH === hour;
                        });

                        return (
                          <div
                            key={wd.dateStr}
                            onClick={() => openCreateModal(wd.dateStr, hourStr)}
                            className="p-1 border-r border-slate-100 last:border-r-0 hover:bg-blue-50/30 transition-colors cursor-pointer space-y-1 relative"
                          >
                            {dayEvents.map((ev) => {
                              const cStyle = COLOR_MAP[ev.color] || COLOR_MAP.blue;
                              return (
                                <div
                                  key={ev._id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(ev);
                                  }}
                                  className={`p-1.5 rounded-lg text-[10px] font-bold border transition-all shadow-2xs hover:shadow-xs cursor-pointer ${cStyle.bg} ${cStyle.text} ${cStyle.border}`}
                                >
                                  <div className="flex items-center gap-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${cStyle.badge}`} />
                                    <span className="truncate">{ev.title}</span>
                                  </div>
                                  {ev.meetingUrl && (
                                    <div className="flex items-center gap-1 mt-1 text-[9px] text-blue-600">
                                      <Video className="w-2.5 h-2.5" />
                                      <span>Meeting Link</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 3: AGENDA / LIST VIEW */}
          {viewMode === "agenda" && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {agendaEvents.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mx-auto">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">No Meetings Scheduled</h4>
                  <p className="text-xs text-slate-400">
                    Click "New Meeting" above to schedule a client meeting or internal event.
                  </p>
                </div>
              ) : (
                agendaEvents.map((ev) => {
                  const sDate = new Date(ev.startDate);
                  const eDate = new Date(ev.endDate);
                  const cStyle = COLOR_MAP[ev.color] || COLOR_MAP.blue;

                  return (
                    <div
                      key={ev._id}
                      onClick={() => openEditModal(ev)}
                      className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-primary/40 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-center font-bold border shrink-0 ${cStyle.bg} ${cStyle.text} ${cStyle.border}`}>
                          <span className="text-[9px] uppercase tracking-wider">{MONTH_NAMES[sDate.getMonth()].slice(0, 3)}</span>
                          <span className="text-base font-black leading-none">{sDate.getDate()}</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-800">{ev.title}</h4>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${cStyle.bg} ${cStyle.text} ${cStyle.border}`}>
                              {ev.type}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                              {ev.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap pt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {sDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — {eDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>

                            {typeof ev.clientId === "object" && ev.clientId && (
                              <span className="flex items-center gap-1 text-primary font-bold">
                                <Building2 className="w-3.5 h-3.5" />
                                {ev.clientId.companyName}
                              </span>
                            )}

                            {ev.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                {ev.location}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <span className="text-[11px] text-slate-400 font-semibold">Organizer:</span>
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold text-slate-700">
                              {typeof ev.organizer === "object" && ev.organizer ? ev.organizer.username : "Team"}
                            </span>

                            {ev.attendees && ev.attendees.length > 0 && (
                              <>
                                <span className="text-[11px] text-slate-400 font-semibold ml-2">Attendees:</span>
                                {ev.attendees.map((att) => {
                                  const name = typeof att === "object" && att ? att.username : "User";
                                  const attId = typeof att === "object" && att ? att._id : att;
                                  return (
                                    <span
                                      key={attId}
                                      className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md text-[10px] font-bold text-primary"
                                    >
                                      {name}
                                    </span>
                                  );
                                })}
                              </>
                            )}
                          </div>

                          {ev.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {ev.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Action */}
                      <div className="shrink-0 flex items-center gap-2">
                        {ev.meetingUrl && (
                          <a
                            href={ev.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-3.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5 shadow-2xs"
                          >
                            <Video className="w-3.5 h-3.5" />
                            Join Video Call
                            <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Event Creator / Editor Modal */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        onSaved={fetchEvents}
        eventToEdit={eventToEdit}
        initialDate={initialModalDate}
        initialStartTime={initialModalTime}
      />
    </div>
  );
};

export default CalendarPage;
