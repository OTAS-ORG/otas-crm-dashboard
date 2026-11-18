import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { projectService } from "../services/api";
import type { Project } from "../types";
import { FolderOpen, Rocket } from "lucide-react";
import { ProjectPlanWidget } from "../components/ProjectPlanWidget";
import { useAuth } from "../context/AuthContext";

const formatCreatedDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCeo = user?.roles.includes('ceo_bd') === true;
  const hasProjectText = isCeo;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div className="relative z-10 mb-4 sm:mb-0">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-violet-500 to-indigo-600 bg-clip-text text-transparent tracking-tight">Projects</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage SDLC projects and tasks</p>
        </div>
        {isCeo && <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/project-plan')}
            className="relative z-10 flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold shadow-xs"
          >
            <Rocket className="w-4 h-4 mr-2 text-primary" />
            Project Plan & Charter
          </button>
        </div>}
      </div>

      {!hasProjectText && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">ငွေကြေးအချက်အလက် မပါစေရန် project အမည်များကို ယာယီအစားထိုးပြထားပါသည်။</p>}

      {/* Dashboard Widget: Upcoming Release & Roadmap Timeline */}
      {isCeo && <ProjectPlanWidget />}

      {/* Project Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : loadError ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Project စာရင်းကို ဖွင့်မရပါ။ ခဏအကြာ ထပ်စမ်းပါ။</p>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <FolderOpen className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium">No projects yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div
              key={project._id}
              onClick={() => navigate(`/projects/${project._id}`)}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-lg font-bold text-primary">
                    {project.projectKey}
                  </span>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-500">
                  {project.projectKey}
                </span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">
                {project.name}
              </h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                {project.description || "No description"}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">
                  Created {formatCreatedDate(project.createdAt)}
                </span>
                <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Board →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Projects;
