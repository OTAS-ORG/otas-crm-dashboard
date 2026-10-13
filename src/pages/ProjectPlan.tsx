import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { projectService, projectPlanService } from '../services/api';
import RichTextEditor from '../components/RichTextEditor';
import type {
  Project,
  ProjectPlan as IProjectPlan,
  ProjectMilestone,
  MilestoneStatus,
} from '../types';
import {
  FileText,
  Save,
  Plus,
  Pencil,
  Trash2,
  Rocket,
  CheckCircle2,
  FolderOpen,
  ArrowLeft,
  X,
  Loader2,
  Check,
  Clock,
  Flag,
  Calendar,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  MilestoneStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  Completed: {
    label: 'Completed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  'In-Progress': {
    label: 'In-Progress',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  Pending: {
    label: 'Pending',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const calculateDuration = (startDateStr: string, endDateStr: string) => {
  const start = new Date(startDateStr).getTime();
  const end = new Date(endDateStr).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return '-';
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  if (days < 7) return `${days}d`;
  const weeks = Math.round(days / 7);
  return `${weeks}w (${days}d)`;
};

const DEFAULT_CHARTER_TEMPLATE = `<h2>🎯 Project Goals & Business Objectives</h2>
<p>State the fundamental mission and quantifiable goals for this project.</p>
<ul>
  <li>Deliver scalable, production-ready solution on schedule.</li>
  <li>Ensure 99.9% uptime with high client satisfaction and seamless UX.</li>
</ul>

<h2>📦 Scope of Work & Key Deliverables</h2>
<p>Define clear boundaries of what will be developed and delivered across release versions.</p>
<ul>
  <li><strong>In-Scope:</strong> Core module design, API integration, QA testing, and staging deployment.</li>
  <li><strong>Out-of-Scope:</strong> Third-party legacy integrations beyond agreed specs.</li>
</ul>

<h2>⚠️ Identified Risks & Mitigation Plan</h2>
<p>Document technical, timeline, and operational risks along with counter-measures.</p>
<ul>
  <li><strong>Scope Creep:</strong> Implement strict change-request review via Milestone backlog.</li>
  <li><strong>Third-party API dependencies:</strong> Provide mock fallback endpoints during development.</li>
</ul>`;

const ProjectPlanPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    searchParams.get('projectId') || ''
  );

  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [plan, setPlan] = useState<IProjectPlan | null>(null);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [charterContent, setCharterContent] = useState<string>('');

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [savingCharter, setSavingCharter] = useState(false);
  const [charterSavedNotice, setCharterSavedNotice] = useState(false);

  // Modal State for Milestones
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<ProjectMilestone | null>(null);
  const [milestoneForm, setMilestoneForm] = useState({
    phase_name: '',
    release_version: 'v1.0',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: 'Pending' as MilestoneStatus,
    notes: '',
  });
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [milestoneError, setMilestoneError] = useState('');

  // Delete Milestone Modal
  const [deletingMilestone, setDeletingMilestone] = useState<ProjectMilestone | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Hovered step for Milestone Progress Bar tooltip
  const [hoveredMilestoneId, setHoveredMilestoneId] = useState<string | null>(null);

  // 1. Fetch available projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const data = await projectService.getProjects();
        setProjects(data || []);

        const requestedId = searchParams.get('projectId');
        if (requestedId && data.some((p: Project) => p._id === requestedId)) {
          setSelectedProjectId(requestedId);
        } else if (data.length > 0) {
          setSelectedProjectId(data[0]._id);
          setSearchParams({ projectId: data[0]._id }, { replace: true });
        }
      } catch (err) {
        console.error('Error fetching projects list:', err);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  // 2. Fetch selected project plan and milestones
  const fetchPlanData = async (projectId: string) => {
    if (!projectId) return;
    try {
      setLoadingPlan(true);
      const res = await projectPlanService.getProjectPlan(projectId);
      setCurrentProject(res.project);
      setPlan(res.plan);
      setMilestones(res.milestones || []);
      setCharterContent(res.plan?.charterContent || DEFAULT_CHARTER_TEMPLATE);
    } catch (err) {
      console.error('Error loading project plan:', err);
    } finally {
      setLoadingPlan(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchPlanData(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSearchParams({ projectId }, { replace: true });
  };

  // 3. Save Project Charter
  const handleSaveCharter = async () => {
    if (!selectedProjectId) return;
    try {
      setSavingCharter(true);
      const updatedPlan = await projectPlanService.saveProjectCharter(selectedProjectId, {
        charterContent,
      });
      setPlan(updatedPlan);
      setCharterSavedNotice(true);
      setTimeout(() => setCharterSavedNotice(false), 3000);
    } catch (err) {
      console.error('Error saving project charter:', err);
    } finally {
      setSavingCharter(false);
    }
  };

  // 4. Milestone Modal Handlers
  const handleOpenCreateMilestone = () => {
    setEditingMilestone(null);
    setMilestoneError('');
    setMilestoneForm({
      phase_name: '',
      release_version: `v${milestones.length + 1}.0`,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'Pending',
      notes: '',
    });
    setShowMilestoneModal(true);
  };

  const handleOpenEditMilestone = (m: ProjectMilestone) => {
    setEditingMilestone(m);
    setMilestoneError('');
    setMilestoneForm({
      phase_name: m.phase_name,
      release_version: m.release_version || 'v1.0',
      start_date: m.start_date ? m.start_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      end_date: m.end_date ? m.end_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      status: m.status,
      notes: m.notes || '',
    });
    setShowMilestoneModal(true);
  };

  const handleSaveMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    if (!milestoneForm.phase_name.trim() || !milestoneForm.start_date || !milestoneForm.end_date) {
      setMilestoneError('Please complete all required fields.');
      return;
    }

    try {
      setSavingMilestone(true);
      setMilestoneError('');

      if (editingMilestone) {
        await projectPlanService.updateMilestone(selectedProjectId, editingMilestone._id, {
          ...milestoneForm,
          phase_name: milestoneForm.phase_name.trim(),
          release_version: milestoneForm.release_version.trim(),
          notes: milestoneForm.notes.trim(),
        });
      } else {
        await projectPlanService.createMilestone(selectedProjectId, {
          ...milestoneForm,
          phase_name: milestoneForm.phase_name.trim(),
          release_version: milestoneForm.release_version.trim(),
          notes: milestoneForm.notes.trim(),
        });
      }

      setShowMilestoneModal(false);
      fetchPlanData(selectedProjectId);
    } catch (err: any) {
      console.error('Error saving milestone:', err);
      setMilestoneError(err?.response?.data?.message || 'Failed to save milestone.');
    } finally {
      setSavingMilestone(false);
    }
  };

  const handleDeleteMilestone = async () => {
    if (!selectedProjectId || !deletingMilestone) return;
    try {
      setDeleting(true);
      await projectPlanService.deleteMilestone(selectedProjectId, deletingMilestone._id);
      setDeletingMilestone(null);
      fetchPlanData(selectedProjectId);
    } catch (err) {
      console.error('Error deleting milestone:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Quick Stats
  const completedCount = milestones.filter((m) => m.status === 'Completed').length;
  const inProgressCount = milestones.filter((m) => m.status === 'In-Progress').length;
  const pendingCount = milestones.filter((m) => m.status === 'Pending').length;
  const progressPct =
    milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  const overallStartDate = milestones.length > 0
    ? new Date(Math.min(...milestones.map((m) => new Date(m.start_date).getTime())))
    : null;
  const overallEndDate = milestones.length > 0
    ? new Date(Math.max(...milestones.map((m) => new Date(m.end_date).getTime())))
    : null;

  if (loadingProjects) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <FolderOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">No Projects Found</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Please create a project first before setting up the Project Charter and High-Level Roadmap.
        </p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-5 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm"
        >
          Go to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header & Project Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/projects')}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Back to Projects"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-primary bg-clip-text text-transparent tracking-tight">
              Project Plan & Overview
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium ml-9">
            High-level charter, strategic milestones, and release roadmap for Project Managers
          </p>
        </div>

        {/* Project Switcher */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
            Project:
          </span>
          <select
            value={selectedProjectId}
            onChange={(e) => handleSelectProject(e.target.value)}
            className="px-3.5 py-2 text-sm font-semibold border border-slate-200 rounded-xl bg-white text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer min-w-[200px]"
          >
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.projectKey})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Strip */}
      {currentProject && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project Key</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-lg font-black text-primary">{currentProject.projectKey}</span>
              <span className="text-xs font-medium text-slate-600 truncate">{currentProject.name}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Progress</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-extrabold text-slate-800">{progressPct}%</span>
                <span className="text-xs text-slate-400">({completedCount}/{milestones.length} phases)</span>
              </div>
            </div>
            {/* Mini Progress Bar Track */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden border border-slate-100">
              <div
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Phase</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-extrabold text-blue-600">{inProgressCount}</span>
              <span className="text-xs text-slate-500">in-progress now</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Releases</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-extrabold text-slate-700">{pendingCount}</span>
              <span className="text-xs text-slate-400">upcoming</span>
            </div>
          </div>
        </div>
      )}

      {loadingPlan ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs font-semibold text-slate-500">Loading plan and charter...</span>
          </div>
        </div>
      ) : (
        <>
          {/* ================= SECTION 1: PROJECT CHARTER (RICH TEXT) ================= */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">1. Project Charter & Scope</h2>
                  <p className="text-xs text-slate-500">
                    Draft, document and manage project goals, core scope boundaries, and risk mitigation
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {plan?.updatedAt && (
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline mr-1">
                    Last saved {new Date(plan.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                {charterSavedNotice && (
                  <span className="text-xs font-semibold text-emerald-600 animate-in fade-in flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setCharterContent(DEFAULT_CHARTER_TEMPLATE)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                  title="Insert starter template with Goals, Scope, and Risks"
                >
                  Insert Template
                </button>

                <button
                  type="button"
                  onClick={handleSaveCharter}
                  disabled={savingCharter}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-600 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingCharter ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Charter</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-5">
              <RichTextEditor
                value={charterContent}
                onChange={setCharterContent}
                placeholder="Draft scope, deliverables, goals and risks for this project..."
                minHeight="340px"
              />
            </div>
          </div>

          {/* ================= SECTION 2: HIGH-LEVEL ROADMAP (MILESTONES TABLE) ================= */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">2. High-Level Roadmap (Milestones)</h2>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {milestones.length} Phases
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    High-level release phases and delivery schedule (independent from sprint tickets)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenCreateMilestone}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-primary to-indigo-600 hover:shadow-md hover:shadow-primary/20 rounded-xl transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Milestone</span>
              </button>
            </div>

            {/* Visual Stepped Roadmap Progress Bar */}
            {milestones.length > 0 && (
              <div className="px-5 py-5 bg-slate-50/50 border-b border-slate-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <span>Roadmap Completion:</span>
                    <span className="font-bold px-2.5 py-0.5 rounded-full bg-white text-slate-800 border border-slate-200 shadow-2xs">
                      {progressPct}% Finished
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-medium text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-bold text-slate-700">{completedCount}</span> Done
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-bold text-slate-700">{inProgressCount}</span> In-Progress
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      <span className="font-bold text-slate-700">{pendingCount}</span> Pending
                    </span>
                  </div>
                </div>

                {/* Stepper with Progress Bar Track and Step Nodes */}
                <div className="relative pt-6 pb-2 px-3 sm:px-6">
                  {/* Background Progress Bar Line connecting the steps */}
                  <div className="absolute top-[44px] left-8 right-8 h-2.5 bg-slate-200/90 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-700 ease-out shadow-xs"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* Step Nodes Row */}
                  <div
                    className={`relative flex items-start ${
                      milestones.length === 1 ? 'justify-center' : 'justify-between'
                    } w-full`}
                  >
                    {milestones.map((m, idx) => {
                      const isCompleted = m.status === 'Completed';
                      const isInProgress = m.status === 'In-Progress';
                      const isHovered = hoveredMilestoneId === m._id;

                      return (
                        <div
                          key={m._id}
                          className="relative flex flex-col items-center group cursor-pointer"
                          onMouseEnter={() => setHoveredMilestoneId(m._id)}
                          onMouseLeave={() => setHoveredMilestoneId(null)}
                          onClick={() => handleOpenEditMilestone(m)}
                        >
                          {/* Step Icon Node */}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 shadow-sm z-10 ${
                              isCompleted
                                ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/25 group-hover:scale-115'
                                : isInProgress
                                ? 'bg-blue-600 border-blue-700 text-white shadow-blue-500/35 ring-4 ring-blue-100 group-hover:scale-115'
                                : 'bg-white border-slate-300 text-slate-400 group-hover:border-slate-400 group-hover:scale-110'
                            }`}
                            title={`Click to view or edit ${m.phase_name}`}
                          >
                            {isCompleted ? (
                              <Check className="w-5 h-5 text-white stroke-[2.5]" />
                            ) : isInProgress ? (
                              <Clock className="w-5 h-5 text-white stroke-[2.2] animate-pulse" />
                            ) : (
                              <Flag className="w-4 h-4 text-slate-400" />
                            )}
                          </div>

                          {/* Step Label below */}
                          <div className="mt-2 text-center flex flex-col items-center max-w-[100px] sm:max-w-[130px]">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200 shadow-2xs">
                              {m.release_version}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-800 mt-1 line-clamp-1 group-hover:text-primary transition-colors">
                              {m.phase_name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatDate(m.end_date)}
                            </span>
                          </div>

                          {/* Interactive Tooltip Card on Hover */}
                          {isHovered && (
                            <div
                              className={`absolute bottom-[calc(100%+10px)] z-50 w-64 p-3.5 bg-slate-900/95 text-white rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/80 animate-in fade-in zoom-in-95 duration-150 pointer-events-none ${
                                idx === 0
                                  ? 'left-0 sm:-left-3'
                                  : idx === milestones.length - 1
                                  ? 'right-0 sm:-right-3'
                                  : 'left-1/2 -translate-x-1/2'
                              }`}
                            >
                              {/* Tooltip Header */}
                              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-700/80">
                                <span className="font-mono text-xs font-black px-1.5 py-0.5 rounded bg-white/10 text-indigo-300 border border-white/10">
                                  {m.release_version}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isCompleted
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : isInProgress
                                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                      : 'bg-slate-700 text-slate-300 border border-slate-600'
                                  }`}
                                >
                                  {m.status}
                                </span>
                              </div>

                              {/* Tooltip Body */}
                              <div className="mt-2 space-y-1.5 text-left">
                                <p className="text-xs font-bold text-white leading-snug">
                                  {m.phase_name}
                                </p>

                                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>
                                    {formatDate(m.start_date)} – {formatDate(m.end_date)}
                                  </span>
                                </div>

                                {m.notes && (
                                  <p className="text-[11px] text-slate-300 line-clamp-2 pt-1 border-t border-slate-800">
                                    {m.notes}
                                  </p>
                                )}

                                <div className="pt-1 text-[10px] text-indigo-300 font-medium">
                                  💡 Click step to edit details
                                </div>
                              </div>

                              {/* Tooltip Arrow */}
                              <div
                                className={`absolute top-full w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-slate-900/95 ${
                                  idx === 0
                                    ? 'left-5'
                                    : idx === milestones.length - 1
                                    ? 'right-5'
                                    : 'left-1/2 -translate-x-1/2'
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Duration Footnotes */}
                {overallStartDate && overallEndDate && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-1 px-1 border-t border-slate-100">
                    <span>Roadmap Start: {formatDate(overallStartDate.toISOString())}</span>
                    <span>Target Release: {formatDate(overallEndDate.toISOString())}</span>
                  </div>
                )}
              </div>
            )}

            {/* Milestones CRUD Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Phase / Milestone Name
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Release Version
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {milestones.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                        <Rocket className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-600">No Milestones Defined Yet</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Click "Add Milestone" to schedule the first release phase for this project.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    milestones.map((milestone) => {
                      const badge = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.Pending;
                      return (
                        <tr
                          key={milestone._id}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          {/* Phase Name */}
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{milestone.phase_name}</p>
                              {milestone.notes && (
                                <p className="text-xs text-slate-400 mt-0.5 max-w-sm truncate">
                                  {milestone.notes}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Release Version */}
                          <td className="px-5 py-4">
                            <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                              {milestone.release_version}
                            </span>
                          </td>

                          {/* Start Date */}
                          <td className="px-5 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                            {formatDate(milestone.start_date)}
                          </td>

                          {/* End Date */}
                          <td className="px-5 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                            {formatDate(milestone.end_date)}
                          </td>

                          {/* Duration */}
                          <td className="px-5 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                            {calculateDuration(milestone.start_date, milestone.end_date)}
                          </td>

                          {/* Status Badge */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              {badge.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditMilestone(milestone)}
                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                                title="Edit Milestone"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingMilestone(milestone)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Milestone"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ================= MODAL: ADD / EDIT MILESTONE ================= */}
      {showMilestoneModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="no-glass modal-box bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
              style={{ backgroundColor: '#ffffff', opacity: 1 }}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingMilestone ? 'Edit Roadmap Milestone' : 'New Roadmap Milestone'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Schedule high-level release phase for {currentProject?.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMilestone} className="p-6 space-y-4">
                {milestoneError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
                    {milestoneError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phase / Milestone Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={milestoneForm.phase_name}
                    onChange={(e) =>
                      setMilestoneForm({ ...milestoneForm, phase_name: e.target.value })
                    }
                    placeholder="e.g. MVP Launch / Core Billing Release"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Release Version *
                    </label>
                    <input
                      type="text"
                      required
                      value={milestoneForm.release_version}
                      onChange={(e) =>
                        setMilestoneForm({ ...milestoneForm, release_version: e.target.value })
                      }
                      placeholder="e.g. v1.0.0"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status *
                    </label>
                    <select
                      value={milestoneForm.status}
                      onChange={(e) =>
                        setMilestoneForm({
                          ...milestoneForm,
                          status: e.target.value as MilestoneStatus,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In-Progress">In-Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={milestoneForm.start_date}
                      onChange={(e) =>
                        setMilestoneForm({ ...milestoneForm, start_date: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      End Date (Target Release) *
                    </label>
                    <input
                      type="date"
                      required
                      value={milestoneForm.end_date}
                      onChange={(e) =>
                        setMilestoneForm({ ...milestoneForm, end_date: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notes & Key Deliverables (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={milestoneForm.notes}
                    onChange={(e) =>
                      setMilestoneForm({ ...milestoneForm, notes: e.target.value })
                    }
                    placeholder="Short description of core release deliverables..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMilestoneModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingMilestone}
                    className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-600 rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {savingMilestone ? 'Saving...' : editingMilestone ? 'Update Milestone' : 'Create Milestone'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {deletingMilestone &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="no-glass modal-box bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150"
              style={{ backgroundColor: '#ffffff', opacity: 1 }}
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Delete Milestone?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete phase{' '}
                <strong className="text-slate-800">"{deletingMilestone.phase_name}"</strong> (
                {deletingMilestone.release_version})?
              </p>

              <div className="flex items-center justify-center gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setDeletingMilestone(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteMilestone}
                  disabled={deleting}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ProjectPlanPage;
