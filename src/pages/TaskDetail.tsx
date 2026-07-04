import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectService, userManagementService } from '../services/api';
import type { Task, TaskComment, UserInfo, SDLCStatus, TaskPriority } from '../types';
import { ArrowLeft, Send, Save, Trash2, Clock } from 'lucide-react';

const STATUS_OPTIONS: { key: SDLCStatus; label: string; color: string }[] = [
  { key: 'backlog', label: 'Backlog', color: 'bg-slate-400' },
  { key: 'todo', label: 'To Do', color: 'bg-blue-500' },
  { key: 'in-progress', label: 'In Progress', color: 'bg-amber-500' },
  { key: 'code-review', label: 'Code Review', color: 'bg-purple-500' },
  { key: 'qa-testing', label: 'QA Testing', color: 'bg-pink-500' },
  { key: 'done', label: 'Done', color: 'bg-emerald-500' },
];

const PRIORITY_OPTIONS: { key: TaskPriority; label: string }[] = [
  { key: 'urgent', label: 'Urgent' },
  { key: 'high', label: 'High' },
  { key: 'normal', label: 'Normal' },
  { key: 'low', label: 'Low' },
];

const TaskDetail: React.FC = () => {
  const { id: projectId, taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

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
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!task || !taskId) return;
    try {
      setSaving(true);
      const updated = await projectService.updateTask(taskId, {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo,
        qaAssignedTo: typeof task.qaAssignedTo === 'object' ? task.qaAssignedTo._id : task.qaAssignedTo,
        due_date: task.due_date,
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
      });
      setTask(updated);
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!taskId) return;
    try {
      await projectService.deleteTask(taskId);
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !taskId) return;
    try {
      setSendingComment(true);
      const comment = await projectService.addTaskComment(taskId, commentText);
      setComments([...comments, comment]);
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSendingComment(false);
    }
  };

  const getUserName = (id?: string | { _id: string; username: string }) => {
    if (!id) return '';
    if (typeof id === 'object') return id._id;
    return id;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="text-lg font-medium">Task not found</p>
        <button onClick={() => navigate(`/projects/${projectId}`)} className="mt-4 text-primary hover:underline text-sm">Back to board</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Board</span>
              <span>/</span>
              <span className="text-slate-600 font-medium">{task.projectId}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Title + Description + Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <input
              type="text"
              value={task.title}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
              className="w-full text-xl font-bold text-slate-800 border-none outline-none focus:outline-none bg-transparent placeholder-slate-300"
              placeholder="Task title"
            />
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Description</h3>
            <textarea
              value={task.description || ''}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              rows={5}
              className="w-full text-sm text-slate-600 border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Add description..."
            />
          </div>

          {/* Comments */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">Comments ({comments.length})</h3>
            </div>
            <div className="px-6 py-4 space-y-4 max-h-80 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No comments yet</p>
              ) : (
                comments.map((c) => (
                  <div key={c._id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{c.user_id?.username?.charAt(0).toUpperCase() || '?'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-700">{c.user_id?.username || 'Unknown'}</span>
                        <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">{c.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
                  placeholder="Write a comment..."
                  className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  onClick={handleAddComment}
                  disabled={sendingComment || !commentText.trim()}
                  className="px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Status</h3>
            <select
              value={task.status}
              onChange={(e) => setTask({ ...task, status: e.target.value as SDLCStatus })}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Priority</h3>
            <select
              value={task.priority}
              onChange={(e) => setTask({ ...task, priority: e.target.value as TaskPriority })}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Assignment */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Assignment</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Developer</label>
                <select
                  value={getUserName(task.assignedTo)}
                  onChange={(e) => setTask({ ...task, assignedTo: e.target.value || undefined } as Task)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Not assigned</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>{u.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">QA Tester</label>
                <select
                  value={getUserName(task.qaAssignedTo)}
                  onChange={(e) => setTask({ ...task, qaAssignedTo: e.target.value || undefined } as Task)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Not assigned</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>{u.username}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Due Date</label>
                <input
                  type="date"
                  value={task.due_date ? task.due_date.slice(0, 10) : ''}
                  onChange={(e) => setTask({ ...task, due_date: e.target.value || undefined } as Task)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Estimated Hours</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={task.estimatedHours ?? ''}
                  onChange={(e) => setTask({ ...task, estimatedHours: e.target.value ? Number(e.target.value) : undefined } as Task)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Actual Hours</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={task.actualHours ?? ''}
                  onChange={(e) => setTask({ ...task, actualHours: e.target.value ? Number(e.target.value) : undefined } as Task)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="space-y-2 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Updated {new Date(task.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Task?</h3>
              <p className="text-sm text-slate-500">This action cannot be undone.</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button onClick={() => setShowDelete(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
