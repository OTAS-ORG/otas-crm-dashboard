import React, { useEffect, useState } from 'react';
import { userManagementService, ticketService } from '../services/api';
import type { UserInfo, Department } from '../types';
import { Users, Check, X, Loader2, MessageCircle, Pencil, Plus } from 'lucide-react';

const ROLES = ['Admin', 'User'];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingTelegramId, setEditingTelegramId] = useState<string | null>(null);
  const [telegramInput, setTelegramInput] = useState('');
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleInput, setRoleInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Create User modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('User');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userData, deptData] = await Promise.all([
        userManagementService.getUsers(),
        ticketService.getDepartments(),
      ]);
      setUsers(userData);
      setDepartments(deptData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const startEdit = (user: UserInfo) => {
    setEditingId(user._id);
    if (user.departments && Array.isArray(user.departments)) {
      setSelectedIds(user.departments.map((d) => (typeof d === 'object' ? d._id : d)));
    } else {
      setSelectedIds([]);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSelectedIds([]);
  };

  const toggleDept = (deptId: string) => {
    setSelectedIds((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const saveDepartments = async (userId: string) => {
    try {
      setSaving(true);
      await userManagementService.updateUserDepartments(userId, selectedIds);
      setEditingId(null);
      setSelectedIds([]);
      fetchData();
    } catch (error) {
      console.error('Error saving departments:', error);
    } finally {
      setSaving(false);
    }
  };

  const startEditTelegram = (user: UserInfo) => {
    setEditingTelegramId(user._id);
    setTelegramInput(user.telegramChatId || '');
  };

  const cancelEditTelegram = () => {
    setEditingTelegramId(null);
    setTelegramInput('');
  };

  const saveTelegramChatId = async (userId: string) => {
    try {
      setSaving(true);
      await userManagementService.updateUserTelegramChatId(userId, telegramInput);
      setEditingTelegramId(null);
      setTelegramInput('');
      fetchData();
    } catch (error) {
      console.error('Error saving Telegram chat ID:', error);
    } finally {
      setSaving(false);
    }
  };

  const startEditRole = (user: UserInfo) => {
    setEditingRoleId(user._id);
    setRoleInput(user.role);
  };

  const cancelEditRole = () => {
    setEditingRoleId(null);
    setRoleInput('');
  };

  const saveRole = async (userId: string) => {
    try {
      setSaving(true);
      await userManagementService.updateUserRole(userId, roleInput);
      setEditingRoleId(null);
      setRoleInput('');
      fetchData();
    } catch (error) {
      console.error('Error saving role:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUsername.trim() || !newPassword.trim()) return;
    try {
      setCreating(true);
      setCreateError('');
      await userManagementService.createUser({
        username: newUsername.trim(),
        password: newPassword.trim(),
        role: newRole,
      });
      setShowCreateModal(false);
      setNewUsername('');
      setNewPassword('');
      setNewRole('User');
      fetchData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to create user';
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  const getDeptNames = (user: UserInfo) => {
    if (!user.departments || !Array.isArray(user.departments) || user.departments.length === 0) return '-';
    return user.departments
      .map((d) => (typeof d === 'object' ? d.name : d))
      .join(', ');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">Assign departments and link Telegram for ticketing</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Username</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Departments</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Telegram</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{user.username.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-slate-800">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {editingRoleId === user._id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={roleInput}
                            onChange={(e) => setRoleInput(e.target.value)}
                            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => saveRole(user._id)}
                            disabled={saving}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Save"
                          >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={cancelEditRole}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {user.role}
                          </span>
                          <button
                            onClick={() => startEditRole(user)}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            title="Edit Role"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {editingId === user._id ? (
                        <div className="flex flex-wrap gap-2">
                          {departments.map((d) => (
                            <label
                              key={d._id}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer border transition-colors ${
                                selectedIds.includes(d._id)
                                  ? 'bg-primary/10 text-primary border-primary/30'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(d._id)}
                                onChange={() => toggleDept(d._id)}
                                className="sr-only"
                              />
                              {selectedIds.includes(d._id) && <Check className="w-3 h-3" />}
                              {d.name}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-600">{getDeptNames(user)}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {editingTelegramId === user._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={telegramInput}
                            onChange={(e) => setTelegramInput(e.target.value)}
                            placeholder="Chat ID"
                            className="w-36 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                          <button
                            onClick={() => saveTelegramChatId(user._id)}
                            disabled={saving}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Save"
                          >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={cancelEditTelegram}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {user.telegramChatId ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <MessageCircle className="w-3 h-3" />
                              {user.telegramChatId}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-400 border border-slate-200">
                              Not linked
                            </span>
                          )}
                          <button
                            onClick={() => startEditTelegram(user)}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            title="Edit Telegram Chat ID"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {editingId === user._id ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => saveDepartments(user._id)}
                            disabled={saving}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Save"
                          >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(user)}
                          className="px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                          Assign
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Create New User</h3>
              <p className="text-xs text-slate-500 mt-0.5">Fill in the details to create a new user account</p>
            </div>
            <div className="p-6 space-y-4">
              {createError && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                  {createError}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => { setShowCreateModal(false); setCreateError(''); setNewUsername(''); setNewPassword(''); setNewRole('User'); }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={creating || !newUsername.trim() || !newPassword.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
