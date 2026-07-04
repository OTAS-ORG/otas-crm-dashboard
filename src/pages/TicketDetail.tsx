import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ticketService } from '../services/api';
import type { Ticket, TicketComment, TicketHistory as TicketHistoryType, Department } from '../types';
import { ArrowLeft, Send, Clock, User, AlertCircle, ArrowUp, ArrowDown, MessageSquare, History } from 'lucide-react';

const priorityIcon = (p: string) => {
  if (p === 'High') return <ArrowUp className="w-4 h-4 text-red-500" />;
  if (p === 'Low') return <ArrowDown className="w-4 h-4 text-slate-400" />;
  return <AlertCircle className="w-4 h-4 text-amber-500" />;
};

const statusColors: Record<string, string> = {
  'Open': 'bg-blue-100 text-blue-700 border-blue-200',
  'In Progress': 'bg-amber-100 text-amber-700 border-amber-200',
  'Pending': 'bg-purple-100 text-purple-700 border-purple-200',
  'Resolved': 'bg-emerald-100 text-emerald-700 border-emerald-200',
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
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [assignDept, setAssignDept] = useState('');
  const [assignUser, setAssignUser] = useState('');

  const storedUser = (() => {
    try {
      const u = localStorage.getItem('otas_user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  })();

  const isAdmin = storedUser?.role === 'Admin';

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

      const deptId = typeof data.ticket.department_id === 'object' ? data.ticket.department_id?._id : data.ticket.department_id;
      setAssignDept(deptId || '');
      setAssignUser(typeof data.ticket.assigned_to === 'object' ? data.ticket.assigned_to?._id : (data.ticket.assigned_to as string) || '');
    } catch (error) {
      console.error('Error fetching ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  useEffect(() => {
    if (assignDept) {
      ticketService.getUsersByDepartment(assignDept).then(setUsers).catch(() => {});
    } else {
      setUsers([]);
    }
  }, [assignDept]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !id) return;
    try {
      setSendingComment(true);
      const comment = await ticketService.addComment(id, newComment);
      setComments([...comments, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
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
      console.error('Error updating status:', error);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAssign = async () => {
    if (!id) return;
    try {
      setAssigning(true);
      const data: any = {};
      if (assignDept) data.department_id = assignDept;
      if (assignUser) data.assigned_to = assignUser;
      await ticketService.assignTicket(id, data);
      await fetchTicket();
    } catch (error) {
      console.error('Error assigning ticket:', error);
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="text-lg font-medium">Ticket not found</p>
        <button onClick={() => navigate('/tickets')} className="mt-4 text-primary hover:underline text-sm">Back to tickets</button>
      </div>
    );
  }

  const deptName = typeof ticket.department_id === 'object' ? ticket.department_id?.name : '-';
  const assignedName = typeof ticket.assigned_to === 'object' ? ticket.assigned_to?.username : '-';
  const createdByName = typeof ticket.created_by === 'object' ? ticket.created_by?.username : '-';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/tickets')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tickets
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-xl font-bold text-slate-800">{ticket.title}</h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[ticket.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {ticket.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                {priorityIcon(ticket.priority)}
                <span>{ticket.priority} Priority</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <User className="w-4 h-4 text-slate-400" />
                <span>by {createdByName}</span>
              </div>
            </div>
          </div>

          {/* Comments Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-800">Comments ({comments.length})</h2>
            </div>
            <div className="p-5 space-y-4 max-h-80 overflow-y-auto">
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
            <div className="p-5 border-t border-slate-100">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  onClick={handleAddComment}
                  disabled={sendingComment || !newComment.trim()}
                  className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Control */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Update Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {['Open', 'In Progress', 'Pending', 'Resolved'].map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={statusUpdating || s === ticket.status}
                  className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors ${
                    s === ticket.status
                      ? 'bg-primary/10 text-primary border-primary/30 cursor-default'
                      : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Assignment (Admin only) */}
          {isAdmin && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-3">Assignment</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Department</label>
                  <select
                    value={assignDept}
                    onChange={(e) => { setAssignDept(e.target.value); setAssignUser(''); }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Assign To</label>
                  <select
                    value={assignUser}
                    onChange={(e) => setAssignUser(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Select user</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>{u.username} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAssign}
                  disabled={assigning}
                  className="w-full px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  {assigning ? 'Saving...' : 'Save Assignment'}
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-sm text-slate-500">
                <p><span className="font-medium text-slate-600">Department:</span> {deptName}</p>
                <p><span className="font-medium text-slate-600">Assigned:</span> {assignedName}</p>
              </div>
            </div>
          )}

          {/* History Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-slate-800">Activity History</h3>
            </div>
            <div className="p-5 max-h-72 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No activity recorded</p>
              ) : (
                <div className="space-y-4">
                  {history.map((h, i) => (
                    <div key={h._id} className="relative pl-6">
                      {i < history.length - 1 && (
                        <div className="absolute left-[7px] top-3 bottom-0 w-px bg-slate-200" />
                      )}
                      <div className="absolute left-0 top-1.5 w-[14px] h-[14px] rounded-full border-2 border-primary bg-white" />
                      <div>
                        <p className="text-sm text-slate-700">{h.action_performed}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <span>{h.user_id?.username || 'Unknown'}</span>
                          <span>{new Date(h.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
