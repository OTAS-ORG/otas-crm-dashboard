import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectService, userManagementService } from '../services/api';
import type { Project, Task, SDLCStatus, TaskPriority, UserInfo } from '../types';
import { ArrowLeft, Plus, Trash2, Calendar, Check } from 'lucide-react';

const COLUMNS: { key: SDLCStatus; label: string; color: string }[] = [
  { key: 'backlog', label: 'Backlog', color: 'bg-slate-400' },
  { key: 'todo', label: 'To Do', color: 'bg-blue-500' },
  { key: 'in-progress', label: 'In Progress', color: 'bg-amber-500' },
  { key: 'code-review', label: 'Code Review', color: 'bg-purple-500' },
  { key: 'qa-testing', label: 'QA Testing', color: 'bg-pink-500' },
  { key: 'done', label: 'Done', color: 'bg-emerald-500' },
];

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  normal: 'bg-blue-100 text-blue-700 border-blue-200',
  low: 'bg-slate-100 text-slate-500 border-slate-200',
};

const getInitials = (obj: any): string => {
  if (!obj) return '?';
  const name = typeof obj === 'object' ? obj.username : obj;
  return name ? name.charAt(0).toUpperCase() : '?';
};

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const isOverdue = (dateStr: string): boolean => {
  return new Date(dateStr) < new Date(new Date().toDateString());
};

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Create task modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'normal' as TaskPriority, assignedTo: '', qaAssignedTo: '', due_date: '', estimatedHours: '' });

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Status change dropdown
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [projectData, taskData, userData] = await Promise.all([
        projectService.getProject(id),
        projectService.getTasks(id),
        userManagementService.getUsers(),
      ]);
      setProject(projectData);
      setTasks(taskData);
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Group tasks by status
  const groupedTasks = COLUMNS.reduce((acc, col) => {
    acc[col.key] = tasks.filter(t => t.status === col.key);
    return acc;
  }, {} as Record<SDLCStatus, Task[]>);

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !id) return;
    try {
      setCreating(true);
      await projectService.createTask(id, {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        priority: newTask.priority,
        assignedTo: newTask.assignedTo || undefined,
        qaAssignedTo: newTask.qaAssignedTo || undefined,
        due_date: newTask.due_date || undefined,
        estimatedHours: newTask.estimatedHours ? Number(newTask.estimatedHours) : undefined,
      });
      setShowCreateModal(false);
      setNewTask({ title: '', description: '', priority: 'normal', assignedTo: '', qaAssignedTo: '', due_date: '', estimatedHours: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (taskId: string, status: SDLCStatus) => {
    try {
      setStatusDropdown(null);
      // Optimistic update
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status } : t));
      await projectService.updateTaskStatus(taskId, status);
    } catch (error) {
      console.error('Error updating task status:', error);
      fetchData(); // Rollback on error
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await projectService.deleteTask(deleteTarget);
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="text-lg font-medium">Project not found</p>
        <button onClick={() => navigate('/projects')} className="mt-4 text-primary hover:underline text-sm">Back to projects</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">{project.name}</h1>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {project.projectKey}
              </span>
            </div>
            {project.description && (
              <p className="text-sm text-slate-500 mt-0.5">{project.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {COLUMNS.map((column) => {
          const columnTasks = groupedTasks[column.key];
          return (
            <div key={column.key} className="bg-slate-50/70 rounded-2xl border border-slate-200 p-4">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
                  <h3 className="font-semibold text-sm text-slate-700">{column.label}</h3>
                  <span className="text-xs text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded-full font-medium">
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              {/* Task Cards */}
              <div className="space-y-3 min-h-[100px]">
                {columnTasks.length === 0 && (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-xs text-slate-400">No tasks</p>
                  </div>
                )}
                {columnTasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => navigate(`/projects/${id}/tasks/${task._id}`)}
                    className="group relative bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
                  >
                    {/* Delete button (top-right, visible on hover) */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(task._id); }}
                      className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Title + Priority */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h4 className="text-sm font-medium text-slate-800 leading-snug flex-1">{task.title}</h4>
                      {task.priority !== 'normal' && (
                        <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${PRIORITY_STYLES[task.priority]}`}>
                          {task.priority}
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      {/* Due date */}
                      {task.due_date && (
                        <div className={`flex items-center gap-1 text-xs ${isOverdue(task.due_date) && task.status !== 'done' ? 'text-red-500' : 'text-slate-400'}`}>
                          <Calendar className="w-3 h-3" />
                          {formatDate(task.due_date)}
                        </div>
                      )}

                      {/* Status badge (clickable dropdown) */}
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setStatusDropdown(statusDropdown === task._id ? null : task._id); }}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
                            column.color.replace('bg-', 'bg-').replace('500', '100').replace('400', '100') + ' text-' + column.color.replace('bg-', '').replace('500', '700').replace('400', '600')
                          }`}
                        >
                          {column.label}
                        </button>
                        {statusDropdown === task._id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setStatusDropdown(null)} />
                            <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 min-w-[140px]">
                              {COLUMNS.map((col) => (
                                <button
                                  key={col.key}
                                  onClick={() => handleStatusChange(task._id, col.key)}
                                  className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 flex items-center gap-2 transition-colors ${
                                    task.status === col.key ? 'text-primary bg-primary/5' : 'text-slate-600'
                                  }`}
                                >
                                  <div className={`w-2 h-2 rounded-full ${col.color}`} />
                                  {col.label}
                                  {task.status === col.key && <Check className="w-3 h-3 ml-auto text-primary" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Assignees */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                      {task.assignedTo && (
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-primary">{getInitials(task.assignedTo)}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {typeof task.assignedTo === 'object' ? task.assignedTo.username : ''}
                          </span>
                        </div>
                      )}
                      {task.qaAssignedTo && (
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-emerald-600">{getInitials(task.qaAssignedTo)}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {typeof task.qaAssignedTo === 'object' ? task.qaAssignedTo.username : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Add Task</h3>
              <p className="text-xs text-slate-500 mt-0.5">Create a new task in {project.name}</p>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g. Design login page"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Task details..."
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Developer</label>
                  <select
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Not assigned</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>{u.username}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">QA Tester</label>
                  <select
                    value={newTask.qaAssignedTo}
                    onChange={(e) => setNewTask({ ...newTask, qaAssignedTo: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Not assigned</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>{u.username}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Est. Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask({ ...newTask, estimatedHours: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                disabled={creating || !newTask.title.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Task?</h3>
              <p className="text-sm text-slate-500">This action cannot be undone.</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
