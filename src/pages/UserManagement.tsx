import React, { useEffect, useState } from 'react';
import { userManagementService, ticketService } from '../services/api';
import type { UserInfo, Department } from '../types';
import { Users, Check, X, Loader2 } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const getDeptNames = (user: UserInfo) => {
    if (!user.departments || !Array.isArray(user.departments) || user.departments.length === 0) return '-';
    return user.departments
      .map((d) => (typeof d === 'object' ? d.name : d))
      .join(', ');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-primary/10">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Assign departments to users for ticketing</p>
        </div>
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
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {user.role}
                      </span>
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
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
