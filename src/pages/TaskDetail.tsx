import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { projectService, userManagementService } from "../services/api";
import EmojiPickerPopover from "../components/EmojiPickerPopover";
import type {
  Task,
  TaskComment,
  UserInfo,
  SDLCStatus,
  TaskPriority,
  TaskChecklistItem,
  TaskAttachment,
} from "../types";
import {
  ArrowLeft,
  Send,
  Save,
  Trash2,
  CheckCircle2,
  Plus,
  Paperclip,
  Smile,
  X,
  Copy,
  ExternalLink,
  ChevronDown,
  Flag,
  Check,
  Download,
  Eye,
  Loader2,
  FileText,
  Timer,
  MessageSquare,
} from "lucide-react";

const STATUS_CONFIG: Record<
  SDLCStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  backlog: {
    label: "Backlog",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
    dot: "bg-slate-400",
  },
  todo: {
    label: "To Do",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  "in-progress": {
    label: "In Progress",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  "code-review": {
    label: "Code Review",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  "qa-testing": {
    label: "QA Testing",
    bg: "bg-pink-50",
    text: "text-pink-700",
    border: "border-pink-200",
    dot: "bg-pink-500",
  },
  done: {
    label: "Done",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
};

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; bg: string; text: string; border: string }
> = {
  urgent: {
    label: "Urgent",
    color: "text-red-600",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  high: {
    label: "High",
    color: "text-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  normal: {
    label: "Normal",
    color: "text-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  low: {
    label: "Low",
    color: "text-slate-400",
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
  },
};

const QUICK_REACTION_EMOJIS = ["👍", "❤️", "🔥", "🎉", "🚀", "👀"];

const TaskDetail: React.FC = () => {
  const { id: projectId, taskId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const composerSmileRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Dropdowns
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  // Checklist
  const [newChecklistTitle, setNewChecklistTitle] = useState("");

  // Attachments & Lightbox
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Comments & Reactions
  const [commentText, setCommentText] = useState("");
  const [stagedCommentImages, setStagedCommentImages] = useState<string[]>([]);
  const [uploadingCommentImage, setUploadingCommentImage] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "comments" | "checklist" | "attachments">("overview");

  // Floating Popovers with anchor element support
  const [composerEmojiAnchor, setComposerEmojiAnchor] = useState<HTMLElement | null>(null);
  const [activeReactionComment, setActiveReactionComment] = useState<{
    commentId: string;
    anchorEl: HTMLElement;
  } | null>(null);

  // Time logging modal
  const [showLogTimeModal, setShowLogTimeModal] = useState(false);
  const [logHoursInput, setLogHoursInput] = useState("");

  // Delete modal
  const [showDelete, setShowDelete] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const currentUser = (() => {
    try {
      const u = localStorage.getItem("otas_user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();

  const fetchData = useCallback(async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      const [taskData, commentData, userData] = await Promise.all([
        projectService.getTask(taskId),
        projectService.getTaskComments(taskId),
        userManagementService.getUsers(),
      ]);
      setTask(taskData);
      setComments(commentData);
      setUsers(userData);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error fetching task detail:", error);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
        setShowPriorityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Handle Save Task
  const handleSave = async (taskToSave?: Partial<Task>) => {
    if (!task || !taskId) return;
    try {
      setSaving(true);
      const payload: Partial<Task> = {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo:
          typeof task.assignedTo === "object"
            ? task.assignedTo._id
            : task.assignedTo,
        qaAssignedTo:
          typeof task.qaAssignedTo === "object"
            ? task.qaAssignedTo._id
            : task.qaAssignedTo,
        due_date: task.due_date,
        startDate: task.startDate,
        estimatedHours: Number(task.estimatedHours) || 0,
        actualHours: Number(task.actualHours) || 0,
        checklist: task.checklist || [],
        attachments: task.attachments || [],
        ...taskToSave,
      };

      const updated = await projectService.updateTask(taskId, payload);
      setTask(updated);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error saving task:", error);
    } finally {
      setSaving(false);
    }
  };

  // Quick Status change
  const handleStatusChange = async (newStatus: SDLCStatus) => {
    if (!task) return;
    const updated = { ...task, status: newStatus };
    setTask(updated);
    setShowStatusDropdown(false);
    await handleSave({ status: newStatus });
  };

  // Quick Priority change
  const handlePriorityChange = async (newPriority: TaskPriority) => {
    if (!task) return;
    const updated = { ...task, priority: newPriority };
    setTask(updated);
    setShowPriorityDropdown(false);
    await handleSave({ priority: newPriority });
  };

  // Checklist Actions
  const handleAddChecklistItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newChecklistTitle.trim() || !task) return;

    const newItem: TaskChecklistItem = {
      title: newChecklistTitle.trim(),
      completed: false,
    };
    const updatedChecklist = [...(task.checklist || []), newItem];
    setTask({ ...task, checklist: updatedChecklist });
    setNewChecklistTitle("");
    await handleSave({ checklist: updatedChecklist });
  };

  const handleToggleChecklist = async (index: number) => {
    if (!task || !task.checklist) return;
    const updated = [...task.checklist];
    updated[index] = {
      ...updated[index],
      completed: !updated[index].completed,
    };
    setTask({ ...task, checklist: updated });
    await handleSave({ checklist: updated });
  };

  const handleDeleteChecklistItem = async (index: number) => {
    if (!task || !task.checklist) return;
    const updated = task.checklist.filter((_, i) => i !== index);
    setTask({ ...task, checklist: updated });
    await handleSave({ checklist: updated });
  };

  // Attachment upload
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;

    try {
      setUploadingAttachment(true);
      const res = await projectService.uploadTaskAttachment(file);
      const newAttachment: TaskAttachment = {
        name: res.name,
        url: res.url,
        size: res.size,
        createdAt: new Date().toISOString(),
      };
      const updatedAttachments = [...(task.attachments || []), newAttachment];
      setTask({ ...task, attachments: updatedAttachments });
      await handleSave({ attachments: updatedAttachments });
    } catch (err) {
      console.error("Failed to upload attachment:", err);
    } finally {
      setUploadingAttachment(false);
      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
    }
  };

  const handleDeleteAttachment = async (index: number) => {
    if (!task || !task.attachments) return;
    const updated = task.attachments.filter((_, i) => i !== index);
    setTask({ ...task, attachments: updated });
    await handleSave({ attachments: updated });
  };

  // Comment Image Upload
  const handleCommentImageUpload = async (file: File) => {
    try {
      setUploadingCommentImage(true);
      const res = await projectService.uploadTaskAttachment(file);
      setStagedCommentImages((prev) => [...prev, res.url]);
    } catch (err) {
      console.error("Failed to upload comment image:", err);
    } finally {
      setUploadingCommentImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Clipboard Paste support on comment composer
  const handleCommentPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          handleCommentImageUpload(blob);
        }
      }
    }
  };

  // Send comment
  const handleAddComment = async () => {
    if ((!commentText.trim() && stagedCommentImages.length === 0) || !taskId) return;

    try {
      setSendingComment(true);
      const newComment = await projectService.addTaskComment(taskId, {
        message: commentText.trim(),
        images: stagedCommentImages,
      });
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
      setStagedCommentImages([]);
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSendingComment(false);
    }
  };

  // Toggle Emoji Reaction on Comment
  const handleToggleReaction = async (commentId: string, emoji: string) => {
    if (!taskId) return;
    try {
      const updated = await projectService.toggleTaskCommentReaction(taskId, commentId, emoji);
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? updated : c))
      );
      setActiveReactionComment(null);
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
    }
  };

  // Log Hours
  const handleLogHoursSubmit = async () => {
    const hours = parseFloat(logHoursInput);
    if (isNaN(hours) || hours <= 0 || !task) return;

    const currentActual = Number(task.actualHours) || 0;
    const newActual = Math.round((currentActual + hours) * 10) / 10;
    const updated = { ...task, actualHours: newActual };
    setTask(updated);
    setLogHoursInput("");
    setShowLogTimeModal(false);
    await handleSave({ actualHours: newActual });
  };

  const handleDeleteTask = async () => {
    if (!taskId) return;
    try {
      await projectService.deleteTask(taskId);
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const copyTaskLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-9 h-9 text-primary animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-500">Loading ClickUp Task Workspace...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-24 text-slate-400">
        <p className="text-lg font-bold">Task not found</p>
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90"
        >
          Back to board
        </button>
      </div>
    );
  }

  const projectInfo =
    typeof task.projectId === "object" ? task.projectId : { name: "Project", projectKey: "PRJ" };

  const currentDevId =
    typeof task.assignedTo === "object" ? task.assignedTo?._id : task.assignedTo || "";
  const currentDevName =
    typeof task.assignedTo === "object" ? task.assignedTo?.username : users.find((u) => u._id === task.assignedTo)?.username || "Unassigned";

  const currentQaId =
    typeof task.qaAssignedTo === "object" ? task.qaAssignedTo?._id : task.qaAssignedTo || "";
  const currentQaName =
    typeof task.qaAssignedTo === "object" ? task.qaAssignedTo?.username : users.find((u) => u._id === task.qaAssignedTo)?.username || "Unassigned";

  // Checklist completion stats
  const totalChecklist = task.checklist?.length || 0;
  const completedChecklist = task.checklist?.filter((item) => item.completed).length || 0;
  const checklistPercent = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

  // Time tracking stats
  const estHours = Number(task.estimatedHours) || 0;
  const actHours = Number(task.actualHours) || 0;
  const timePercent = estHours > 0 ? Math.min(100, Math.round((actHours / estHours) * 100)) : 0;

  const currentStatusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
  const currentPriorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.normal;

  // Overdue check
  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date(new Date().toDateString()) &&
    task.status !== "done";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 select-text">
      {/* ===== CLICKUP TOP BAR / BREADCRUMBS ===== */}
      <div className="relative z-30 bg-white rounded-2xl border border-slate-200/80 shadow-xs px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back + Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/projects/${projectId}`)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Back to board"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span
              onClick={() => navigate("/projects")}
              className="hover:text-primary cursor-pointer transition-colors"
            >
              Projects
            </span>
            <span>/</span>
            <span
              onClick={() => navigate(`/projects/${projectId}`)}
              className="font-bold text-slate-700 hover:text-primary cursor-pointer transition-colors flex items-center gap-1"
            >
              <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-primary text-[10px] font-black">
                {projectInfo.projectKey}
              </span>
              <span>{projectInfo.name}</span>
            </span>
            <span>/</span>
            <span className="text-slate-400 font-semibold">
              TASK-{taskId?.slice(-4).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Center/Right: ClickUp Status Pill, Priority Flag & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Dropdown Pill */}
          <div ref={statusRef} className="relative">
            <button
              type="button"
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 shadow-2xs transition-all cursor-pointer ${currentStatusConfig.bg} ${currentStatusConfig.text} ${currentStatusConfig.border}`}
            >
              <span className={`w-2 h-2 rounded-full ${currentStatusConfig.dot}`}></span>
              <span>{currentStatusConfig.label}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {showStatusDropdown && (
              <div className="absolute left-0 mt-1.5 w-44 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {(Object.keys(STATUS_CONFIG) as SDLCStatus[]).map((st) => {
                  const cfg = STATUS_CONFIG[st];
                  const isSelected = task.status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(st)}
                      className="w-full px-3.5 py-2 text-xs font-bold flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`}></span>
                        <span className={isSelected ? "text-primary" : "text-slate-700"}>
                          {cfg.label}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Priority Flag Dropdown */}
          <div ref={priorityRef} className="relative">
            <button
              type="button"
              onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer ${currentPriorityConfig.bg} ${currentPriorityConfig.text} ${currentPriorityConfig.border}`}
            >
              <Flag className={`w-3.5 h-3.5 ${currentPriorityConfig.color} fill-current`} />
              <span>{currentPriorityConfig.label}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showPriorityDropdown && (
              <div className="absolute left-0 mt-1.5 w-40 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((pr) => {
                  const pcfg = PRIORITY_CONFIG[pr];
                  const isSelected = task.priority === pr;
                  return (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => handlePriorityChange(pr)}
                      className="w-full px-3.5 py-2 text-xs font-bold flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Flag className={`w-3.5 h-3.5 ${pcfg.color} fill-current`} />
                        <span className={isSelected ? "text-primary" : "text-slate-700"}>
                          {pcfg.label}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={copyTaskLink}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Copy Task Link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Delete Task */}
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="Delete Task"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Manual Save Button */}
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              hasUnsavedChanges
                ? "bg-primary hover:bg-primary-600 shadow-primary/20 animate-pulse"
                : "bg-slate-700 hover:bg-slate-800 opacity-90"
            }`}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "Saved"}</span>
          </button>
        </div>
      </div>

      {/* ===== MAIN CLICKUP 2-COLUMN WORKSPACE ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT MAIN CANVAS (8 cols) ================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* ClickUp Main Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === "overview"
                  ? "bg-primary text-white shadow-xs shadow-primary/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Task Details & Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("comments")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === "comments"
                  ? "bg-primary text-white shadow-xs shadow-primary/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Comments & Discussion</span>
              <span
                className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                  activeTab === "comments"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {comments.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("checklist")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === "checklist"
                  ? "bg-primary text-white shadow-xs shadow-primary/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Subtasks & Checklist</span>
              {totalChecklist > 0 && (
                <span
                  className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                    activeTab === "checklist"
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {completedChecklist}/{totalChecklist}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("attachments")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === "attachments"
                  ? "bg-primary text-white shadow-xs shadow-primary/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attachments</span>
              <span
                className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                  activeTab === "attachments"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {task.attachments?.length || 0}
              </span>
            </button>
          </div>

          {/* Context Header for sub-tabs (Comments, Checklist, Attachments) */}
          {activeTab !== "overview" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-blue-50 px-2.5 py-1 rounded-lg">
                  TASK-{taskId?.slice(-4).toUpperCase()}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">{task.title}</h2>
              </div>
            </div>
          )}

          {/* Card 1: Large Editable Title & Rich Description (Overview Tab) */}
          {activeTab === "overview" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-5">
              {/* Title */}
              <div>
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) => {
                    setTask({ ...task, title: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  onBlur={() => handleSave()}
                  placeholder="Task title..."
                  className="w-full text-2xl sm:text-3xl font-black text-slate-900 border-none outline-none focus:outline-none bg-transparent placeholder-slate-300 leading-tight"
                />
              </div>

              {/* Description */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  value={task.description || ""}
                  onChange={(e) => {
                    setTask({ ...task, description: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  onBlur={() => handleSave()}
                  rows={5}
                  placeholder="Add a detailed description, acceptance criteria, steps to reproduce, or notes..."
                  className="w-full text-sm text-slate-700 bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 resize-y focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all leading-relaxed placeholder-slate-400 font-normal"
                />
              </div>
            </div>
          )}

          {/* Card 2: ClickUp Subtasks / Checklist */}
          {(activeTab === "overview" || activeTab === "checklist") && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-slate-800">Checklist & Subtasks</h3>
                {totalChecklist > 0 && (
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {completedChecklist}/{totalChecklist}
                  </span>
                )}
              </div>
              {totalChecklist > 0 && (
                <span className="text-xs font-extrabold text-primary">{checklistPercent}%</span>
              )}
            </div>

            {/* Progress Bar */}
            {totalChecklist > 0 && (
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${checklistPercent}%` }}
                ></div>
              </div>
            )}

            {/* Checklist items list */}
            <div className="space-y-1 pt-1">
              {task.checklist && task.checklist.length > 0 ? (
                task.checklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50/90 group transition-all"
                  >
                    <div
                      onClick={() => handleToggleChecklist(idx)}
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    >
                      <button
                        type="button"
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                          item.completed
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-slate-300 hover:border-primary bg-white"
                        }`}
                      >
                        {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <span
                        className={`text-sm transition-all truncate ${
                          item.completed
                            ? "line-through text-slate-400 font-medium"
                            : "text-slate-800 font-semibold"
                        }`}
                      >
                        {item.title}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteChecklistItem(idx)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-opacity cursor-pointer"
                      title="Delete item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-1">No checklist items yet.</p>
              )}
            </div>

            {/* Add Checklist Input */}
            <form onSubmit={handleAddChecklistItem} className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                placeholder="+ Add checklist item or subtask (press Enter)..."
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200/90 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-slate-400 font-medium"
              />
              <button
                type="submit"
                disabled={!newChecklistTitle.trim()}
                className="px-3.5 py-2 text-xs font-bold bg-primary text-white hover:bg-primary-600 disabled:opacity-40 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>
          )}

          {/* Card 3: ClickUp Attachments & Files */}
          {(activeTab === "overview" || activeTab === "attachments") && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Attachments ({task.attachments?.length || 0})
                </h3>
              </div>

              {/* Upload trigger button */}
              <label className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5">
                <input
                  type="file"
                  ref={attachmentInputRef}
                  onChange={handleAttachmentUpload}
                  disabled={uploadingAttachment}
                  className="hidden"
                />
                {uploadingAttachment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>{uploadingAttachment ? "Uploading..." : "Upload File"}</span>
              </label>
            </div>

            {/* Attachments List / Grid */}
            {task.attachments && task.attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {task.attachments.map((att, idx) => {
                  const isImage = att.url.match(/\.(jpeg|jpg|png|gif|webp)$/i);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 group transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isImage ? (
                          <div
                            onClick={() => setLightboxImage(att.url)}
                            className="w-11 h-11 rounded-xl overflow-hidden bg-slate-200 cursor-pointer shrink-0 border border-slate-200"
                          >
                            <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate" title={att.name}>
                            {att.name}
                          </p>
                          {att.size && (
                            <p className="text-[10px] text-slate-400">
                              {(att.size / 1024).toFixed(1)} KB
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isImage && (
                          <button
                            type="button"
                            onClick={() => setLightboxImage(att.url)}
                            className="p-1.5 text-slate-400 hover:text-primary rounded-lg transition-colors cursor-pointer"
                            title="View Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          download={att.name}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors cursor-pointer"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                          title="Remove Attachment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 border-2 border-dashed border-slate-200/80 rounded-2xl flex flex-col items-center justify-center text-center">
                <Paperclip className="w-6 h-6 text-slate-300 mb-1" />
                <p className="text-xs text-slate-400 font-medium">No files attached to this task</p>
              </div>
            )}
          </div>
          )}

          {/* Card 4: ClickUp Activity & Comments Stream */}
          {activeTab === "comments" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>Discussion & Activity</span>
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">
                  {comments.length}
                </span>
              </h3>
            </div>

            {/* Comment List (clean full view in dedicated tab) */}
            <div className="space-y-4 pr-1 min-h-[220px]">
              {comments.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <Smile className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                  <p className="text-xs font-medium">No comments yet. Be the first to share an update!</p>
                </div>
              ) : (
                comments.map((c) => {
                  const authorName = c.user_id?.username || "Unknown";
                  const initial = authorName.charAt(0).toUpperCase();

                  return (
                    <div
                      key={c._id}
                      className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100/90 space-y-2.5 group hover:bg-slate-50 transition-colors"
                    >
                      {/* Author Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs">
                            {initial}
                          </div>
                          <span className="text-xs font-bold text-slate-800">{authorName}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.createdAt).toLocaleDateString()} at{" "}
                            {new Date(c.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Quick Reaction Pill Bar on Comment */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {QUICK_REACTION_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleToggleReaction(c._id, emoji)}
                              className="text-xs hover:scale-125 transition-transform p-1 rounded-md hover:bg-slate-200/70 cursor-pointer"
                              title={`React ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}

                          {/* + Emoji picker trigger */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveReactionComment({
                                commentId: c._id,
                                anchorEl: e.currentTarget,
                              });
                            }}
                            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 p-1 rounded-md transition-colors cursor-pointer text-xs flex items-center gap-0.5"
                            title="More reactions"
                          >
                            <Smile className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black">+</span>
                          </button>
                        </div>
                      </div>

                      {/* Comment Body */}
                      {c.message && (
                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-medium pl-9">
                          {c.message}
                        </p>
                      )}

                      {/* Comment Attached Images */}
                      {c.images && c.images.length > 0 && (
                        <div className="pl-9 flex flex-wrap gap-2 pt-1">
                          {c.images.map((imgUrl, imgIdx) => (
                            <div
                              key={imgIdx}
                              onClick={() => setLightboxImage(imgUrl)}
                              className="relative h-28 w-40 rounded-xl overflow-hidden border border-slate-200/80 cursor-pointer shadow-2xs group/img"
                            >
                              <img src={imgUrl} alt="attachment" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye className="w-5 h-5" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reactions Pills Row */}
                      {c.reactions && c.reactions.length > 0 && (
                        <div className="pl-9 flex flex-wrap items-center gap-1.5 pt-1">
                          {c.reactions.map((react, rIdx) => {
                            const userHasReacted =
                              currentUser &&
                              react.users.some(
                                (u: any) =>
                                  (u._id || u).toString() === (currentUser._id || currentUser.id)
                              );

                            return (
                              <button
                                key={rIdx}
                                type="button"
                                onClick={() => handleToggleReaction(c._id, react.emoji)}
                                className={`px-2 py-0.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                                  userHasReacted
                                    ? "bg-blue-50 border-primary text-primary shadow-2xs"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                <span>{react.emoji}</span>
                                <span className="text-[11px] font-semibold">{react.users.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* ClickUp Rich Comment Composer */}
            <div className="pt-2 border-t border-slate-100">
              <div
                onPaste={handleCommentPaste}
                className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all space-y-2.5"
              >
                {/* Staged Comment Images Preview */}
                {stagedCommentImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-1">
                    {stagedCommentImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-300 shadow-2xs"
                      >
                        <img src={imgUrl} alt="staged" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setStagedCommentImages((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-rose-600 text-white rounded-full p-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Textarea */}
                <textarea
                  ref={commentTextareaRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  rows={2}
                  placeholder="Write a comment, paste screenshots (Ctrl+V), or add details..."
                  className="w-full text-xs font-medium text-slate-800 bg-transparent border-none outline-none resize-none placeholder-slate-400 leading-relaxed"
                />

                {/* Composer Toolbar */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <div className="flex items-center gap-1">
                    {/* Attach Image */}
                    <label
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                      title="Attach image"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleCommentImageUpload(f);
                        }}
                        disabled={uploadingCommentImage}
                        className="hidden"
                      />
                      {uploadingCommentImage ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      ) : (
                        <Paperclip className="w-4 h-4" />
                      )}
                    </label>

                    {/* Emoji Picker Button (Anchor for Portal Popover) */}
                    <button
                      ref={composerSmileRef}
                      type="button"
                      onClick={() =>
                        setComposerEmojiAnchor(
                          composerEmojiAnchor ? null : composerSmileRef.current
                        )
                      }
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                      title="Insert emoji"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Send Button */}
                  <button
                    type="button"
                    onClick={handleAddComment}
                    disabled={sendingComment || (!commentText.trim() && stagedCommentImages.length === 0)}
                    className="px-4 py-2 bg-primary hover:bg-primary-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    {sendingComment ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>Comment</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* ================= RIGHT DETAILS INSPECTOR PANEL (4 cols) ================= */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6 lg:self-start">
          {/* Inspector Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-100">
              Task Details
            </h3>

            {/* Assignees Section */}
            <div className="space-y-4">
              {/* Developer */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Assigned Developer
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-primary flex items-center justify-center text-xs font-black shrink-0">
                    {currentDevName.charAt(0).toUpperCase()}
                  </div>
                  <select
                    value={currentDevId}
                    onChange={(e) => {
                      const updated = {
                        ...task,
                        assignedTo: e.target.value || undefined,
                      } as Task;
                      setTask(updated);
                      handleSave({ assignedTo: e.target.value || undefined });
                    }}
                    className="flex-1 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* QA Tester */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  QA Tester
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-black shrink-0">
                    {currentQaName.charAt(0).toUpperCase()}
                  </div>
                  <select
                    value={currentQaId}
                    onChange={(e) => {
                      const updated = {
                        ...task,
                        qaAssignedTo: e.target.value || undefined,
                      } as Task;
                      setTask(updated);
                      handleSave({ qaAssignedTo: e.target.value || undefined });
                    }}
                    className="flex-1 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Dates Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              {/* Due Date */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Due Date
                  </label>
                  {isOverdue && (
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-md">
                      Overdue
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="date"
                    value={task.due_date ? task.due_date.split("T")[0] : ""}
                    onChange={(e) => {
                      const updated = { ...task, due_date: e.target.value || undefined };
                      setTask(updated);
                      handleSave({ due_date: e.target.value || undefined });
                    }}
                    className={`w-full px-3 py-2 text-xs font-semibold rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      isOverdue
                        ? "bg-rose-50/60 border-rose-300 text-rose-700"
                        : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={task.startDate ? task.startDate.split("T")[0] : ""}
                  onChange={(e) => {
                    const updated = { ...task, startDate: e.target.value || undefined };
                    setTask(updated);
                    handleSave({ startDate: e.target.value || undefined });
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* ClickUp Time Tracking Section */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-primary" />
                  <span>Time Tracking</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowLogTimeModal(true)}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  + Log Time
                </button>
              </div>

              {/* Time Numbers */}
              <div className="grid grid-cols-2 gap-2 text-center bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Logged</span>
                  <span className="text-sm font-black text-slate-800">{actHours} hrs</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Estimated</span>
                  <span className="text-sm font-black text-slate-800">{estHours} hrs</span>
                </div>
              </div>

              {/* Progress Bar */}
              {estHours > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span>Progress</span>
                    <span>{timePercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        actHours > estHours
                          ? "bg-rose-500"
                          : "bg-gradient-to-r from-blue-500 to-indigo-600"
                      }`}
                      style={{ width: `${timePercent}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Editable estimated hours */}
              <div className="pt-1">
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                  Set Estimated Total Hours:
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={task.estimatedHours ?? ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setTask({ ...task, estimatedHours: val });
                    setHasUnsavedChanges(true);
                  }}
                  onBlur={() => handleSave()}
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Project Info Card */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Project Information
              </span>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                  {projectInfo.projectKey}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{projectInfo.name}</p>
                  <button
                    type="button"
                    onClick={() => navigate(`/projects/${projectId}`)}
                    className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-0.5 cursor-pointer mt-0.5"
                  >
                    <span>Open Project Kanban Board</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PORTAL EMOJI PICKERS (Never clipped!) ===== */}
      {/* 1. Composer Emoji Picker */}
      {composerEmojiAnchor && (
        <EmojiPickerPopover
          anchorEl={composerEmojiAnchor}
          onSelect={(emoji) => {
            setCommentText((prev) => prev + emoji);
            setComposerEmojiAnchor(null);
            commentTextareaRef.current?.focus();
          }}
          onClose={() => setComposerEmojiAnchor(null)}
        />
      )}

      {/* 2. Comment Reaction Emoji Picker */}
      {activeReactionComment && (
        <EmojiPickerPopover
          anchorEl={activeReactionComment.anchorEl}
          onSelect={(emoji) => {
            handleToggleReaction(activeReactionComment.commentId, emoji);
          }}
          onClose={() => setActiveReactionComment(null)}
        />
      )}

      {/* ===== LOG TIME MODAL ===== */}
      {showLogTimeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="no-glass modal-box bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Timer className="w-4 h-4 text-primary" />
                <span>Log Time on Task</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowLogTimeModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Hours Spent (e.g. 1.5)
                </label>
                <input
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={logHoursInput}
                  onChange={(e) => setLogHoursInput(e.target.value)}
                  placeholder="e.g. 2"
                  autoFocus
                  className="w-full px-3 py-2 text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogTimeModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogHoursSubmit}
                  disabled={!logHoursInput || parseFloat(logHoursInput) <= 0}
                  className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-600 disabled:opacity-40 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  Add Hours
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== IMAGE LIGHTBOX MODAL ===== */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={lightboxImage}
              alt="lightbox preview"
              className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain"
            />
            <div className="mt-3 flex items-center gap-3">
              <a
                href={lightboxImage}
                target="_blank"
                rel="noreferrer"
                download
                className="px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold backdrop-blur-xs flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="px-4 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {showDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="no-glass modal-box bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="text-base font-bold text-slate-800 mb-2">Delete Task?</h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Are you sure you want to delete this task and all its comments? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTask}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
