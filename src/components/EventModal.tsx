import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { clientService, userManagementService, eventService } from "../services/api";
import CalendarModal from "./CalendarModal";
import TimePickerModal from "./TimePickerModal";
import type { CalendarEvent, Client, UserInfo, EventType } from "../types";
import {
  X,
  Clock,
  Video,
  MapPin,
  Users,
  Briefcase,
  Trash2,
  Check,
  AlignLeft,
  Plus,
  Calendar as CalendarIcon,
} from "lucide-react";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  eventToEdit?: CalendarEvent | null;
  initialDate?: string; // YYYY-MM-DD
  initialStartTime?: string; // HH:mm
}

const COLOR_OPTIONS = [
  { id: "blue", label: "Blue", bg: "bg-[#2563EB]" },
  { id: "indigo", label: "Light Blue", bg: "bg-[#6366F1]" },
  { id: "emerald", label: "Emerald", bg: "bg-[#10B981]" },
  { id: "amber", label: "Yellow", bg: "bg-[#F59E0B]" },
  { id: "rose", label: "Coral", bg: "bg-[#F43F5E]" },
  { id: "purple", label: "Purple", bg: "bg-[#A855F7]" },
];

const EVENT_TYPES: { id: EventType; label: string }[] = [
  { id: "call", label: "Client Call" },
  { id: "meeting", label: "Meeting" },
  { id: "task", label: "Task / Deadline" },
  { id: "reminder", label: "Reminder" },
  { id: "event", label: "General Event" },
];

const getLocalDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  eventToEdit,
  initialDate,
  initialStartTime,
}) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("call");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [color, setColor] = useState("blue");
  const [clientId, setClientId] = useState("");
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"scheduled" | "completed" | "cancelled">("scheduled");

  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAttendeeDropdown, setShowAttendeeDropdown] = useState(false);
  const attendeeDropdownRef = useRef<HTMLDivElement>(null);
  const [activeCalendarField, setActiveCalendarField] = useState<"start" | "end" | null>(null);
  const [activeTimeField, setActiveTimeField] = useState<"start" | "end" | null>(null);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "Select Date";
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatDisplayTime = (time24Str: string) => {
    if (!time24Str) return "09:00 AM";
    const [hStr, mStr] = time24Str.split(":");
    let h = parseInt(hStr || "9", 10);
    const m = parseInt(mStr || "0", 10);
    const period = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
  };

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      if (eventToEdit) {
        setTitle(eventToEdit.title);
        setType(eventToEdit.type || "call");
        setColor(eventToEdit.color || "blue");
        setAllDay(eventToEdit.allDay || false);
        setLocation(eventToEdit.location || "");
        setMeetingUrl(eventToEdit.meetingUrl || "");
        setDescription(eventToEdit.description || "");
        setStatus(eventToEdit.status || "scheduled");

        const sDate = new Date(eventToEdit.startDate);
        const eDate = new Date(eventToEdit.endDate);
        setStartDate(getLocalDateString(sDate));
        setStartTime(sDate.toTimeString().slice(0, 5));
        setEndDate(getLocalDateString(eDate));
        setEndTime(eDate.toTimeString().slice(0, 5));

        const cId =
          typeof eventToEdit.clientId === "object" && eventToEdit.clientId
            ? eventToEdit.clientId._id
            : (eventToEdit.clientId as string) || "";
        setClientId(cId);

        const attIds = (eventToEdit.attendees || []).map((att) =>
          typeof att === "object" && att ? att._id : (att as string)
        );
        setAttendeeIds(attIds);
      } else {
        const todayStr = initialDate || getLocalDateString(new Date());
        const sTime = initialStartTime || "09:00";
        const [h, m] = sTime.split(":").map(Number);
        const endH = String((h + 1) % 24).padStart(2, "0");
        const eTime = `${endH}:${String(m).padStart(2, "0")}`;

        setTitle("");
        setType("call");
        setStartDate(todayStr);
        setStartTime(sTime);
        setEndDate(todayStr);
        setEndTime(eTime);
        setAllDay(false);
        setLocation("");
        setMeetingUrl("");
        setColor("blue");
        setClientId("");
        setAttendeeIds([]);
        setDescription("");
        setStatus("scheduled");
      }
    }
  }, [isOpen, eventToEdit, initialDate, initialStartTime]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        attendeeDropdownRef.current &&
        !attendeeDropdownRef.current.contains(e.target as Node)
      ) {
        setShowAttendeeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadInitialData = async () => {
    try {
      const [clientsData, usersData] = await Promise.all([
        clientService.getClients(),
        userManagementService.getUsers(),
      ]);
      setClients(clientsData || []);
      setUsers(usersData || []);
    } catch (err) {
      console.error("Error loading dropdown data for events", err);
    }
  };

  const handleToggleAttendee = (userId: string) => {
    setAttendeeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim() || `${EVENT_TYPES.find((t) => t.id === type)?.label || "Activity"}`;

    try {
      setSaving(true);
      const startDateTime = allDay
        ? new Date(`${startDate}T00:00:00`)
        : new Date(`${startDate}T${startTime || "09:00"}:00`);

      const endDateTime = allDay
        ? new Date(`${endDate || startDate}T23:59:59`)
        : new Date(`${endDate || startDate}T${endTime || "10:00"}:00`);

      const payload: Partial<CalendarEvent> = {
        title: cleanTitle,
        description: description.trim(),
        type,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        allDay,
        location: location.trim(),
        meetingUrl: meetingUrl.trim(),
        color,
        clientId: clientId || undefined,
        attendees: attendeeIds,
        status,
      };

      if (eventToEdit) {
        await eventService.updateEvent(eventToEdit._id, payload);
      } else {
        await eventService.createEvent(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to save event", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!eventToEdit) return;

    try {
      setDeleting(true);
      await eventService.deleteEvent(eventToEdit._id);
      setShowDeleteConfirm(false);
      onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to delete event", err);
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  const submitButtonLabel = eventToEdit
    ? "Save Changes"
    : type === "call"
    ? "Schedule Call"
    : type === "meeting"
    ? "Schedule Meeting"
    : "Save Activity";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* 100% Solid Opaque Modal Box with wider width to prevent overlap */}
      <div
        className="no-glass modal-card rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ backgroundColor: "#ffffff", opacity: 1 }}
      >
        {/* Header matching design image */}
        <div
          className="px-6 py-5 border-b border-slate-100 flex items-start justify-between"
          style={{ backgroundColor: "#ffffff" }}
        >
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {eventToEdit ? "Edit Activity" : "Schedule Activity"}
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
              Plan Follow-ups and Client Calls
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body with Solid Background */}
        <form
          onSubmit={handleSave}
          className="flex-1 overflow-y-auto p-6 space-y-5"
          style={{ backgroundColor: "#ffffff" }}
        >
          {/* Event Title / Subject */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Event Title / Subject *
            </label>
            <input
              type="text"
              placeholder="e.g. Client Demo with Win Tun, Team Sprint Sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 text-sm font-semibold border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 placeholder-slate-400 bg-white shadow-2xs"
            />
          </div>

          {/* Activity Type & Badge Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Activity Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                className="w-full px-4 py-2.5 text-xs font-bold border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 bg-white cursor-pointer shadow-2xs"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Badge Color
              </label>
              <div className="flex items-center gap-2.5 pt-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`w-7 h-7 rounded-full ${c.bg} transition-all flex items-center justify-center cursor-pointer ${
                      color === c.id
                        ? "ring-2 ring-offset-2 ring-primary scale-110 shadow-xs"
                        : "opacity-85 hover:opacity-100"
                    }`}
                  >
                    {color === c.id && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date & Time Card */}
          <div className="p-4 rounded-3xl border border-slate-200 bg-white space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" /> Date & Time
              </span>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="rounded text-primary focus:ring-primary/20"
                />
                All Day Event
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Start Date & Time
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCalendarField("start")}
                    className="flex-1 min-w-[135px] px-3.5 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-800 bg-slate-50/60 hover:bg-white hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all flex items-center justify-between shadow-2xs cursor-pointer text-left"
                  >
                    <span>{formatDisplayDate(startDate)}</span>
                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                  </button>
                  {!allDay && (
                    <button
                      type="button"
                      onClick={() => setActiveTimeField("start")}
                      className="w-32 shrink-0 px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-800 bg-slate-50/60 hover:bg-white hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all flex items-center justify-between shadow-2xs cursor-pointer text-left"
                    >
                      <span>{formatDisplayTime(startTime)}</span>
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  End Date & Time
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCalendarField("end")}
                    className="flex-1 min-w-[135px] px-3.5 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-800 bg-slate-50/60 hover:bg-white hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all flex items-center justify-between shadow-2xs cursor-pointer text-left"
                  >
                    <span>{formatDisplayDate(endDate)}</span>
                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                  </button>
                  {!allDay && (
                    <button
                      type="button"
                      onClick={() => setActiveTimeField("end")}
                      className="w-32 shrink-0 px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-800 bg-slate-50/60 hover:bg-white hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all flex items-center justify-between shadow-2xs cursor-pointer text-left"
                    >
                      <span>{formatDisplayTime(endTime)}</span>
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Associated Client */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Associated Client (Optional)
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-4 py-2.5 text-xs font-bold border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 bg-white cursor-pointer shadow-2xs"
            >
              <option value="">-- No Client Linked --</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.companyName} ({c.contactPerson}) - {c.status}
                </option>
              ))}
            </select>
          </div>

          {/* Attendees / Team Members */}
          <div className="relative" ref={attendeeDropdownRef}>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" /> Attendees / Team Members
            </label>

            <div className="p-3 rounded-2xl border border-slate-200 bg-white min-h-[56px] flex items-center gap-2 flex-wrap shadow-2xs">
              {attendeeIds.map((attId) => {
                const u = users.find((user) => user._id === attId);
                const name = u ? u.username : "Team Member";
                return (
                  <span
                    key={attId}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>{name}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleAttendee(attId)}
                      className="ml-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}

              {/* Plus Button to add attendee */}
              <button
                type="button"
                onClick={() => setShowAttendeeDropdown(!showAttendeeDropdown)}
                className="w-7 h-7 rounded-full border border-dashed border-slate-300 text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Add Team Member"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Dropdown Popover */}
            {showAttendeeDropdown && (
              <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-30 max-h-48 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150">
                {users.map((u) => {
                  const isSelected = attendeeIds.includes(u._id);
                  return (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => handleToggleAttendee(u._id)}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-primary" : "bg-slate-300"}`} />
                        <span>{u.username}</span>
                        {u.role && <span className="text-[10px] text-slate-400 font-normal">({u.role})</span>}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Meeting URL & Location / Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-blue-600" /> Meeting URL
              </label>
              <input
                type="url"
                placeholder="https://meet.google.com/xyz..."
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                className="w-full px-4 py-2.5 text-xs font-semibold border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-800 placeholder-slate-400 bg-white shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" /> Location / Room
              </label>
              <input
                type="text"
                placeholder="e.g. Conference Room A, Online"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 text-xs font-semibold border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-800 placeholder-slate-400 bg-white shadow-2xs"
              />
            </div>
          </div>

          {/* Agenda / Description Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-slate-700" /> Agenda / Description Notes
            </label>
            <div className="relative">
              <textarea
                rows={4}
                placeholder="Meeting agenda, discussion topics, preparation notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 text-xs font-medium border border-slate-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-800 placeholder-slate-400 bg-white resize-none shadow-2xs"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-between gap-3">
            {eventToEdit ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Event
              </button>
            ) : <div />}

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-600/25 hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
              >
                {saving ? "Saving..." : submitButtonLabel}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Interactive Custom React Calendar Modal */}
      <CalendarModal
        isOpen={activeCalendarField !== null}
        onClose={() => setActiveCalendarField(null)}
        value={activeCalendarField === "start" ? startDate : endDate}
        onChange={(newDate) => {
          if (!newDate) return;
          if (activeCalendarField === "start") {
            setStartDate(newDate);
            if (endDate && newDate > endDate) {
              setEndDate(newDate);
            }
          } else if (activeCalendarField === "end") {
            setEndDate(newDate);
          }
          setActiveCalendarField(null);
        }}
        title={activeCalendarField === "start" ? "Select Start Date" : "Select End Date"}
      />

      {/* Interactive Custom React TimePicker Modal */}
      <TimePickerModal
        isOpen={activeTimeField !== null}
        onClose={() => setActiveTimeField(null)}
        value={activeTimeField === "start" ? startTime : endTime}
        onChange={(newTime24) => {
          if (!newTime24) return;
          if (activeTimeField === "start") {
            setStartTime(newTime24);
          } else if (activeTimeField === "end") {
            setEndTime(newTime24);
          }
          setActiveTimeField(null);
        }}
        title={activeTimeField === "start" ? "Select Start Time" : "Select End Time"}
      />

      {/* Custom Styled Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[80] flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !deleting && setShowDeleteConfirm(false)}
        >
          <div
            className="no-glass modal-card bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-150"
            style={{ backgroundColor: "#ffffff", opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h4 className="text-base font-bold text-slate-900 mb-1.5">
              Delete Activity?
            </h4>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-800">"{eventToEdit?.title}"</span>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default EventModal;
