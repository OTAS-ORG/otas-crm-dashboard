import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectPlanService } from '../services/api';
import type { ProjectPlanWidgetData, MilestoneStatus } from '../types';
import {
  Rocket,
  Calendar,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface ProjectPlanWidgetProps {
  initialProjectId?: string;
  className?: string;
}

const STATUS_BADGE_CONFIG: Record<
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

export const ProjectPlanWidget: React.FC<ProjectPlanWidgetProps> = ({
  initialProjectId,
  className = '',
}) => {
  const navigate = useNavigate();
  const [data, setData] = useState<ProjectPlanWidgetData | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '');
  const [loading, setLoading] = useState(true);

  const fetchWidgetData = async (projectId?: string) => {
    try {
      setLoading(true);
      const res = await projectPlanService.getDashboardWidgetSummary(projectId || undefined);
      setData(res);
      if (res.selectedProject && !selectedProjectId) {
        setSelectedProjectId(res.selectedProject._id);
      }
    } catch (err) {
      console.error('Failed to load project plan widget data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWidgetData(selectedProjectId);
  }, [selectedProjectId]);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
  };

  if (loading && !data) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-xs animate-pulse ${className}`}>
        <div className="h-5 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-slate-100 rounded-xl mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-full"></div>
      </div>
    );
  }

  if (!data || data.projects.length === 0) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-xs ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Project Plan & Roadmap</h3>
              <p className="text-xs text-slate-400">High-level milestones and release timeline</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Create Project <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="py-6 text-center text-slate-400 text-xs">
          No projects found. Create a project to start planning milestones and releases.
        </div>
      </div>
    );
  }

  const { selectedProject, upcomingRelease, timeline, projects } = data;
  const progressPct = timeline?.progressPercentage ?? 0;
  const upcomingConfig = upcomingRelease
    ? STATUS_BADGE_CONFIG[upcomingRelease.status]
    : null;

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 transition-all hover:border-slate-300 ${className}`}>
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/10 to-primary/20 text-primary flex items-center justify-center font-bold border border-primary/20 shadow-2xs">
            <Rocket className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">Project Roadmap & Release</h3>
              {selectedProject && (
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {selectedProject.projectKey}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">High-level milestones and progress tracking</p>
          </div>
        </div>

        {/* Project Selector & Direct Link */}
        <div className="flex items-center gap-2">
          {projects.length > 1 && (
            <select
              value={selectedProject?._id || ''}
              onChange={handleProjectChange}
              className="px-2.5 py-1 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary max-w-[150px] truncate"
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.projectKey})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() =>
              navigate(`/project-plan?projectId=${selectedProject?._id || ''}`)
            }
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Open complete Project Plan and Roadmap"
          >
            <span>Full Plan</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Upcoming Release Highlight Card */}
      {upcomingRelease ? (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-slate-50/60 border border-indigo-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase text-indigo-700">
                <Sparkles className="w-3 h-3" /> Upcoming Release
              </span>
              <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-white text-indigo-900 border border-indigo-200 shadow-2xs">
                {upcomingRelease.release_version}
              </span>
              {upcomingConfig && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${upcomingConfig.bg} ${upcomingConfig.text} ${upcomingConfig.border}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${upcomingConfig.dot}`} />
                  {upcomingConfig.label}
                </span>
              )}
            </div>

            <p className="text-sm font-bold text-slate-800 tracking-tight">
              {upcomingRelease.phase_name}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Target: {formatDate(upcomingRelease.end_date)}</span>
            </div>

            {upcomingRelease.daysRemaining !== null && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                  upcomingRelease.daysRemaining < 0
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : upcomingRelease.daysRemaining <= 7
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {upcomingRelease.daysRemaining < 0
                  ? `Overdue by ${Math.abs(upcomingRelease.daysRemaining)}d`
                  : upcomingRelease.daysRemaining === 0
                  ? 'Due Today'
                  : `${upcomingRelease.daysRemaining} days left`}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center text-xs text-slate-500">
          No upcoming milestone release scheduled. Add milestones to track release targets.
        </div>
      )}

      {/* Horizontal Visual Timeline & Progress Section */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <span>Overall Roadmap Progress</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {progressPct}% Completed
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {timeline?.completedMilestones || 0} Done
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {timeline?.inProgressMilestones || 0} In-Progress
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              {timeline?.pendingMilestones || 0} Pending
            </span>
          </div>
        </div>

        {/* Visual Progress Bar Track */}
        <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Start and End Duration Footnotes */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-0.5">
          <span>Start: {formatDate(timeline?.overallStartDate)}</span>
          <span>Target End: {formatDate(timeline?.overallEndDate)}</span>
        </div>

        {/* Visual Milestone Checkpoints on Horizontal Timeline */}
        {timeline?.milestones && timeline.milestones.length > 0 && (
          <div className="pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {timeline.milestones.slice(0, 4).map((m) => {
                const badge = STATUS_BADGE_CONFIG[m.status];
                return (
                  <div
                    key={m._id}
                    onClick={() =>
                      navigate(`/project-plan?projectId=${selectedProject?._id || ''}`)
                    }
                    className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-100/80 transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-extrabold text-slate-700">
                        {m.release_version}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`} title={badge.label} />
                    </div>
                    <p className="text-xs font-semibold text-slate-800 truncate" title={m.phase_name}>
                      {m.phase_name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatDate(m.end_date)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectPlanWidget;
