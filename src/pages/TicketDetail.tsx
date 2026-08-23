import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ticketService } from "../services/api";
import CalendarModal from "../components/CalendarModal";
import { getDueDateInfo } from "./Tickets";
import type {
  Ticket,
  TicketComment,
  TicketHistory as TicketHistoryType,
  Department,
} from "../types";
import {
  Send,
  Clock,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Trash2,
  Calendar as CalendarIcon,
  Edit3,
  Share2,
  Paperclip,
  Lock,
} from "lucide-react";

const priorityIcon = (p: string) => {
  if (p === "High") return <ArrowUp className="w-3.5 h-3.5 text-red-500" />;
  if (p === "Low") return <ArrowDown className="w-3.5 h-3.5 text-slate-400" />;
  return <AlertCircle className="w-3.5 h-3.5 text-amber-500 fill-amber-500 text-white" />;
};

const priorityTextColor = (p: string) => {
  if (p === "High") return "text-red-600";
  if (p === "Low") return "text-slate-600";
  return "text-amber-600";
};

const TicketDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [history, setHistory] = useState<TicketHistoryType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<{ _id: string; username: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [activeTab, setActiveTab] = useState<"activity" | "notes">("activity");

  const [assignDept, setAssignDept] = useState("");
  const [assignUser, setAssignUser] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");

  const storedUser = (() => {
    try {
      const u = localStorage.getItem("otas_user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();

  const isAdmin = storedUser?.role === "Admin";

  const fetchTicket = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await ticketService.getTicket(id);
      setTicket(data.ticket);
      setComments(data.comments);
      setHistory(data.history);
      const deptData = await ticketService.getDepartments();
      setDepartments(deptData);

      const deptId =
        typeof data.ticket.department_id === "object"
          ? data.ticket.department_id?._id
          : data.ticket.department_id;
      setAssignDept(deptId || "");
      setAssignUser(
        typeof data.ticket.assigned_to === "object"
          ? data.ticket.assigned_to?._id
          : (data.ticket.assigned_to as string) || ""
      );
      setAssignDueDate(data.ticket.dueDate ? data.ticket.dueDate.split("T")[0] : "");
    } catch (error) {
      console.error("Error fetching ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  useEffect(() => {
    if (assignDept) {
      ticketService
        .getUsersByDepartment(assignDept)
        .then(setUsers)
        .catch(() => { });
    } else {
      setUsers([]);
    }
  }, [assignDept]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !id) return;
    try {
      setSendingComment(true);
      const isInternal = activeTab === "notes";
      const comment = await ticketService.addComment(id, newComment, isInternal);
      setComments([...comments, comment]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSendingComment(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!id) return;
    try {
      setStatusUpdating(true);
      await ticketService.updateStatus(id, status);
      await fetchTicket();
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAssign = async () => {
    if (!id) return;
    try {
      setAssigning(true);
      const data: any = {};
      data.department_id = assignDept || undefined;
      data.assigned_to = assignUser || undefined;
      data.dueDate = assignDueDate || undefined;
      await ticketService.assignTicket(id, data);
      await fetchTicket();
    } catch (error) {
      console.error("Error assigning ticket:", error);
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      setDeleting(true);
      await ticketService.deleteTicket(id);
      navigate("/tickets");
    } catch (error) {
      console.error("Error deleting ticket:", error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-32 text-slate-400">
        <p className="text-lg font-medium">Ticket not found</p>
        <button
          onClick={() => navigate("/tickets")}
          className="mt-4 text-primary hover:underline text-sm font-bold"
        >
          Back to tickets
        </button>
      </div>
    );
  }

  const deptName =
    typeof ticket.department_id === "object" ? ticket.department_id?.name : "-";
  const assignedName =
    typeof ticket.assigned_to === "object" ? ticket.assigned_to?.username : null;
  const createdByName =
    typeof ticket.created_by === "object"
      ? ticket.created_by?.username
      : "Unknown";
  const createdById =
    typeof ticket.created_by === "object"
      ? ticket.created_by?._id
      : ticket.created_by;
  const canDelete = isAdmin || storedUser?._id === createdById;

  const dueInfo = getDueDateInfo(ticket.dueDate, ticket.status);
  const ticketNumber = ticket._id.slice(-4).toUpperCase();

  // Separate Activity Comments (public) and Internal Notes (private)
  const activityComments = comments.filter((c) => !c.is_internal);
  const internalNotes = comments.filter((c) => c.is_internal);
  const displayedComments = activeTab === "activity" ? activityComments : internalNotes;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Main Grid Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (8 cols): Ticket Card + Comments */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          {/* 1. Ticket Top Details Card */}
          <div
            className="no-glass bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 shrink-0"
            style={{ backgroundColor: "#ffffff", opacity: 1 }}
          >
            {/* Tag & Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase ${ticket.status === "Open"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                    : ticket.status === "In Progress"
                      ? "bg-amber-50 text-amber-600 border border-amber-200/60"
                      : ticket.status === "Pending"
                        ? "bg-purple-50 text-purple-600 border border-purple-200/60"
                        : "bg-blue-50 text-blue-600 border border-blue-200/60"
                    }`}
                >
                  {ticket.status}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-bold text-slate-400 tracking-wider">
                  TICKET #{ticketNumber}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDueDatePicker(true)}
                  title="Edit Due Date"
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <CalendarIcon className="w-4 h-4" />
                </button>



                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    title="Delete Ticket"
                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Title & Description */}
            <h1 className="text-2xl font-black text-slate-900 mt-4 tracking-tight leading-tight">
              {ticket.title}
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-2.5 leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>

            {/* 4-Item Meta Row Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-100">
              {/* Priority */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  PRIORITY
                </span>
                <div
                  className={`flex items-center gap-1.5 text-xs font-bold ${priorityTextColor(
                    ticket.priority
                  )}`}
                >
                  {priorityIcon(ticket.priority)}
                  <span>{ticket.priority} Priority</span>
                </div>
              </div>

              {/* Created Date */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  CREATED DATE
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {new Date(ticket.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Created By */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  CREATED BY
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                    {createdByName.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {createdByName}
                  </span>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  DUE DATE
                </span>
                <button
                  type="button"
                  onClick={() => setShowDueDatePicker(true)}
                  className="flex items-center gap-1 text-xs font-bold text-left hover:underline cursor-pointer"
                >
                  <Clock
                    className={`w-3.5 h-3.5 ${dueInfo && dueInfo.color.includes("rose")
                      ? "text-rose-600"
                      : "text-rose-500"
                      }`}
                  />
                  <span
                    className={
                      dueInfo
                        ? dueInfo.color.includes("rose")
                          ? "text-rose-600"
                          : "text-slate-800"
                        : "text-rose-500"
                    }
                  >
                    {dueInfo ? dueInfo.label : "Set Due Date"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Comments & Discussion Card */}
          <div
            className="no-glass bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 flex-1 flex flex-col justify-between"
            style={{ backgroundColor: "#ffffff", opacity: 1 }}
          >
            {/* Header with Activity Feed / Internal Notes pill tabs */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2 font-black text-slate-800 text-xs uppercase tracking-wider">
                {activeTab === "notes" ? (
                  <>
                    <Lock className="w-4 h-4 text-amber-500" />
                    <span>INTERNAL NOTES ({internalNotes.length})</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    <span>ACTIVITY COMMENTS ({activityComments.length})</span>
                  </>
                )}
              </div>

              <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab("activity")}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${activeTab === "activity"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  ACTIVITY FEED ({activityComments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("notes")}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${activeTab === "notes"
                    ? "bg-white text-amber-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  <Lock className="w-3 h-3 text-amber-500" />
                  INTERNAL NOTES ({internalNotes.length})
                </button>
              </div>
            </div>

            {/* Comments List or Empty State */}
            <div className="py-6 flex-1 flex flex-col justify-center min-h-[180px]">
              {displayedComments.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center text-center">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${activeTab === "notes"
                      ? "bg-amber-50 border border-amber-100 text-amber-500"
                      : "bg-slate-50 border border-slate-100 text-slate-300"
                      }`}
                  >
                    {activeTab === "notes" ? (
                      <Lock className="w-6 h-6 stroke-[1.5]" />
                    ) : (
                      <MessageSquare className="w-6 h-6 stroke-[1.5]" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 italic font-medium">
                    {activeTab === "notes"
                      ? "No internal notes yet. Add private notes visible only to the team."
                      : "No comments yet in activity feed. Start the conversation below."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {displayedComments.map((c) => (
                    <div
                      key={c._id}
                      className={`p-4 rounded-2xl flex items-start gap-3 border transition-all ${c.is_internal
                        ? "bg-amber-50/60 border-amber-200/70"
                        : "bg-slate-50/70 border-slate-100"
                        }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 ${c.is_internal
                          ? "bg-gradient-to-tr from-amber-500 to-orange-600"
                          : "bg-gradient-to-tr from-blue-500 to-indigo-600"
                          }`}
                      >
                        {(c.user_id?.username || "U").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              {c.user_id?.username || "Unknown"}
                            </span>
                            {c.is_internal && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Lock className="w-2.5 h-2.5" />
                                Internal Note
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.createdAt).toLocaleDateString()} •{" "}
                            {new Date(c.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-700 mt-1.5 leading-relaxed whitespace-pre-wrap">
                          {c.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rounded Comment Input Bar */}
            <div className="pt-2 shrink-0">
              <div
                className={`p-1.5 pl-4 rounded-2xl flex items-center gap-2 shadow-2xs border transition-all ${activeTab === "notes"
                  ? "bg-amber-50/40 border-amber-200 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-400"
                  : "bg-white border-slate-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary"
                  }`}
              >
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  placeholder={
                    activeTab === "notes"
                      ? "Add a private internal note (visible only to team, no bot notification)..."
                      : "Add a comment or type @ to mention someone..."
                  }
                  className="flex-1 text-xs font-medium text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none py-1.5"
                />
                <button
                  type="button"
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={sendingComment || !newComment.trim()}
                  className={`px-5 py-2.5 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-40 shadow-md ${activeTab === "notes"
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/25"
                    : "bg-[#0284C7] hover:bg-[#0369A1] shadow-sky-600/25"
                    }`}
                >
                  {activeTab === "notes" ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <Send className="w-3.5 h-3.5 fill-white" />
                  )}
                  <span>
                    {sendingComment
                      ? "SAVING..."
                      : activeTab === "notes"
                        ? "SAVE NOTE"
                        : "SEND"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Update Status + Assignment & Schedule + Activity History */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          {/* Card 1: UPDATE TICKET STATUS */}
          <div
            className="no-glass bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 shrink-0"
            style={{ backgroundColor: "#ffffff", opacity: 1 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-4 bg-primary rounded-full" />
              <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                UPDATE TICKET STATUS
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: "Open", label: "OPEN" },
                { id: "In Progress", label: "IN PROGRESS" },
                { id: "Pending", label: "PENDING" },
                { id: "Resolved", label: "RESOLVED" },
              ].map((s) => {
                const isActive = ticket.status === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleStatusChange(s.id)}
                    disabled={statusUpdating || isActive}
                    className={`py-3 px-3 text-xs font-black rounded-2xl border transition-all text-center cursor-pointer ${isActive
                      ? s.id === "Open"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-300 shadow-xs ring-2 ring-emerald-500/10"
                        : s.id === "In Progress"
                          ? "bg-amber-50 text-amber-600 border-amber-300 shadow-xs ring-2 ring-amber-500/10"
                          : s.id === "Pending"
                            ? "bg-purple-50 text-purple-600 border-purple-300 shadow-xs ring-2 ring-purple-500/10"
                            : "bg-blue-50 text-blue-600 border-blue-300 shadow-xs ring-2 ring-blue-500/10"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: ASSIGNMENT & SCHEDULE */}
          <div
            className="no-glass bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 shrink-0"
            style={{ backgroundColor: "#ffffff", opacity: 1 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-4 bg-primary rounded-full" />
              <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                ASSIGNMENT & SCHEDULE
              </h3>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  DEPARTMENT
                </label>
                <select
                  value={assignDept}
                  onChange={(e) => {
                    setAssignDept(e.target.value);
                    setAssignUser("");
                  }}
                  className="w-full px-4 py-2.5 text-xs font-bold border border-slate-200 rounded-2xl bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-800 cursor-pointer shadow-2xs"
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  ASSIGN TO MEMBER
                </label>
                <select
                  value={assignUser}
                  onChange={(e) => setAssignUser(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-bold border border-slate-200 rounded-2xl bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-800 cursor-pointer shadow-2xs"
                >
                  <option value="">Select team member</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleAssign}
                disabled={assigning}
                className="w-full mt-2 py-3 bg-[#0F172A] hover:bg-[#1E293B] active:scale-[0.98] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-slate-900/10 transition-all cursor-pointer"
              >
                {assigning ? "SAVING..." : "SAVE ASSIGNMENTS"}
              </button>
            </div>

            {/* Footer Summary Labels */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  CURRENT DEPT:
                </span>
                <span className="font-bold text-slate-800">{deptName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  CURRENTLY ASSIGNED:
                </span>
                <span className="font-medium italic text-slate-500">
                  {assignedName || "None"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: ACTIVITY HISTORY */}
          <div
            className="no-glass bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex-1 flex flex-col justify-between"
            style={{ backgroundColor: "#ffffff", opacity: 1 }}
          >
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-primary rounded-full" />
                <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  ACTIVITY HISTORY
                </h3>
              </div>
              <span className="text-[10px] font-black text-primary cursor-pointer hover:underline uppercase tracking-wider">
                VIEW ALL
              </span>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 flex-1">
              {history.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4 italic">
                  No activity recorded
                </p>
              ) : (
                history.map((h) => (
                  <div key={h._id} className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/15 mt-1 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800 leading-snug">
                        {h.action_performed}
                        {h.user_id?.username
                          ? ` by ${h.user_id.username}`
                          : ""}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                        {new Date(h.createdAt).toLocaleDateString()} •{" "}
                        {new Date(h.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="no-glass modal-card bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 text-center"
            style={{ backgroundColor: "#ffffff", opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-3 text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1.5">
              Delete Ticket?
            </h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              This action cannot be undone. All comments and history will also be deleted.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/25 transition-all cursor-pointer"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* React Calendar Modal for Due Date */}
      <CalendarModal
        isOpen={showDueDatePicker}
        onClose={() => setShowDueDatePicker(false)}
        value={assignDueDate}
        onChange={(newDate) => {
          setAssignDueDate(newDate);
          setShowDueDatePicker(false);
          // Auto save due date immediately
          if (id) {
            ticketService
              .assignTicket(id, { dueDate: newDate || undefined })
              .then(() => fetchTicket())
              .catch((err) => console.error("Failed to update due date", err));
          }
        }}
        title="Select Ticket Due Date"
      />
    </div>
  );
};

export default TicketDetail;
