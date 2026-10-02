import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { userManagementService, ticketService } from "../services/api";
import type { UserInfo, Department } from "../types";
import {
  Check,
  X,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  UserCheck,
} from "lucide-react";

const ROLES = ["Admin", "User"];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingTelegramId, setEditingTelegramId] = useState<string | null>(
    null,
  );
  const [telegramInput, setTelegramInput] = useState("");
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleInput, setRoleInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit Employee Info modal state
  const [editingEmployeeUser, setEditingEmployeeUser] = useState<UserInfo | null>(null);
  const [employeeForm, setEmployeeForm] = useState({
    fullName: '',
    employeeId: '',
    position: '',
    department: '',
    dateOfJoining: '',
    baseSalary: 0,
    fullDayDeduction: 0,
    halfDayDeduction: 0,
  });
  const [savingEmployeeInfo, setSavingEmployeeInfo] = useState(false);

  // Create User modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState("User");
  const [newEmployeeId, setNewEmployeeId] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newDateOfJoining, setNewDateOfJoining] = useState("");
  const [newBaseSalary, setNewBaseSalary] = useState(0);
  const [newFullDayDeduction, setNewFullDayDeduction] = useState(0);
  const [newHalfDayDeduction, setNewHalfDayDeduction] = useState(0);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

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
      console.error("Error fetching users:", error);
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
      setSelectedIds(
        user.departments.map((d) => (typeof d === "object" ? d._id : d)),
      );
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
      prev.includes(deptId)
        ? prev.filter((id) => id !== deptId)
        : [...prev, deptId],
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
      console.error("Error saving departments:", error);
    } finally {
      setSaving(false);
    }
  };

  const startEditTelegram = (user: UserInfo) => {
    setEditingTelegramId(user._id);
    setTelegramInput(user.telegramChatId || "");
  };

  const cancelEditTelegram = () => {
    setEditingTelegramId(null);
    setTelegramInput("");
  };

  const saveTelegramChatId = async (userId: string) => {
    try {
      setSaving(true);
      await userManagementService.updateUserTelegramChatId(
        userId,
        telegramInput,
      );
      setEditingTelegramId(null);
      setTelegramInput("");
      fetchData();
    } catch (error) {
      console.error("Error saving Telegram chat ID:", error);
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
    setRoleInput("");
  };

  const saveRole = async (userId: string) => {
    try {
      setSaving(true);
      await userManagementService.updateUserRole(userId, roleInput);
      setEditingRoleId(null);
      setRoleInput("");
      fetchData();
    } catch (error) {
      console.error("Error saving role:", error);
    } finally {
      setSaving(false);
    }
  };

  const openEditEmployee = (user: UserInfo) => {
    setEditingEmployeeUser(user);
    const defaultDept = user.department || (user.departments && user.departments.length > 0
      ? (typeof user.departments[0] === 'object' ? (user.departments[0] as any).name : user.departments[0])
      : '');
    setEmployeeForm({
      fullName: user.fullName || '',
      employeeId: user.employeeId || '',
      position: user.position || '',
      department: defaultDept || '',
      dateOfJoining: user.dateOfJoining ? user.dateOfJoining.slice(0, 10) : '',
      baseSalary: user.baseSalary || 0,
      fullDayDeduction: user.fullDayDeduction || 0,
      halfDayDeduction: user.halfDayDeduction || 0,
    });
  };

  const handleSaveEmployeeInfo = async () => {
    if (!editingEmployeeUser) return;
    try {
      setSavingEmployeeInfo(true);
      await userManagementService.updateEmployeeInfo(editingEmployeeUser._id, {
        ...employeeForm,
        fullName: employeeForm.fullName.trim(),
      });
      setEditingEmployeeUser(null);
      fetchData();
    } catch (error) {
      console.error("Error saving employee info:", error);
    } finally {
      setSavingEmployeeInfo(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUsername.trim() || !newPassword.trim()) return;
    try {
      setCreating(true);
      setCreateError("");
      await userManagementService.createUser({
        username: newUsername.trim(),
        password: newPassword.trim(),
        fullName: newFullName.trim(),
        role: newRole,
        employeeId: newEmployeeId.trim(),
        position: newPosition.trim(),
        department: newDepartment.trim(),
        dateOfJoining: newDateOfJoining ? newDateOfJoining : undefined,
        baseSalary: Number(newBaseSalary) || 0,
        fullDayDeduction: Number(newFullDayDeduction) || 0,
        halfDayDeduction: Number(newHalfDayDeduction) || 0,
      });
      setShowCreateModal(false);
      setNewUsername("");
      setNewPassword("");
      setNewFullName("");
      setNewRole("User");
      setNewEmployeeId("");
      setNewPosition("");
      setNewDepartment("");
      setNewDateOfJoining("");
      setNewBaseSalary(0);
      setNewFullDayDeduction(0);
      setNewHalfDayDeduction(0);
      fetchData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to create user";
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  const getDeptNames = (user: UserInfo) => {
    if (
      !user.departments ||
      !Array.isArray(user.departments) ||
      user.departments.length === 0
    )
      return "-";
    return user.departments
      .map((d) => (typeof d === "object" ? d.name : d))
      .join(", ");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div className="relative z-10 mb-4 sm:mb-0">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-indigo-500 to-blue-600 bg-clip-text text-transparent tracking-tight">User Management</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Assign departments and link Telegram for ticketing</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="relative z-10 flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-primary to-indigo-500 text-white text-sm rounded-xl hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 font-semibold"
        >
          <Plus className="w-5 h-5 mr-2" />
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
            <table className="w-full min-w-[960px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Position & Dept
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Ticket Depts
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Telegram
                  </th>
                  <th className="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary">
                            {(user.fullName || user.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 text-sm whitespace-nowrap">
                              {user.fullName || user.username}
                            </span>
                            {user.employeeId && (
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                {user.employeeId}
                              </span>
                            )}
                          </div>
                          {user.fullName && (
                            <span className="text-xs text-slate-400 font-normal block whitespace-nowrap mt-0.5">
                              @{user.username}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <span className="text-xs font-semibold text-slate-700 block whitespace-nowrap">
                          {user.position || <span className="text-slate-400 font-normal italic text-[11px]">No position</span>}
                        </span>
                        {user.department && (
                          <span className="text-[11px] text-slate-500 block whitespace-nowrap mt-0.5">
                            {user.department}
                          </span>
                        )}
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
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => saveRole(user._id)}
                            disabled={saving}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Save"
                          >
                            {saving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
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
                                  ? "bg-primary/10 text-primary border-primary/30"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(d._id)}
                                onChange={() => toggleDept(d._id)}
                                className="sr-only"
                              />
                              {selectedIds.includes(d._id) && (
                                <Check className="w-3 h-3" />
                              )}
                              {d.name}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-600">
                          {getDeptNames(user)}
                        </span>
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
                            {saving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditEmployee(user)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Employee Info"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Employee Info
                        </button>
                        {editingId === user._id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => saveDepartments(user._id)}
                              disabled={saving}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Save"
                            >
                              {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(user)}
                            className="px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                          >
                            Assign Dept
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm text-slate-400"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm overflow-y-auto"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="no-glass modal-box bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
            style={{ backgroundColor: '#ffffff', opacity: 1, backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Create New User
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fill in credentials and optional employee information
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError("");
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {createError && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                  {createError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Employee Details (Auto-fills into Payroll)
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Full Name (for Payroll / Documents)
                    </label>
                    <input
                      type="text"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="e.g. John Doe / U Kyaw Kyaw"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Employee ID
                      </label>
                      <input
                        type="text"
                        value={newEmployeeId}
                        onChange={(e) => setNewEmployeeId(e.target.value)}
                        placeholder="e.g. EMP-001"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Position / Job Title
                      </label>
                      <input
                        type="text"
                        value={newPosition}
                        onChange={(e) => setNewPosition(e.target.value)}
                        placeholder="e.g. Senior Sales Executive"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        placeholder="e.g. Sales / Tech"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Date of Joining
                      </label>
                      <input
                        type="date"
                        value={newDateOfJoining}
                        onChange={(e) => setNewDateOfJoining(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Base Salary (MMK)
                    </label>
                    <input
                      type="number"
                      value={newBaseSalary || ""}
                      onChange={(e) => setNewBaseSalary(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Full-Day Leave Deduction (MMK)
                      </label>
                      <input
                        type="number"
                        value={newFullDayDeduction || ""}
                        onChange={(e) => setNewFullDayDeduction(parseFloat(e.target.value) || 0)}
                        placeholder="Auto: Base Salary / 30"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Half-Day Leave Deduction (MMK)
                      </label>
                      <input
                        type="number"
                        value={newHalfDayDeduction || ""}
                        onChange={(e) => setNewHalfDayDeduction(parseFloat(e.target.value) || 0)}
                        placeholder="Auto: (Base / 30) / 2"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError("");
                  setNewUsername("");
                  setNewPassword("");
                  setNewFullName("");
                  setNewRole("User");
                  setNewEmployeeId("");
                  setNewPosition("");
                  setNewDepartment("");
                  setNewDateOfJoining("");
                  setNewBaseSalary(0);
                  setNewFullDayDeduction(0);
                  setNewHalfDayDeduction(0);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateUser}
                disabled={
                  creating || !newUsername.trim() || !newPassword.trim()
                }
                className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                {creating ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Employee Info Modal */}
      {editingEmployeeUser && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm overflow-y-auto"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="no-glass modal-box bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
            style={{ backgroundColor: '#ffffff', opacity: 1, backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Employee Information
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update employee details for <strong className="text-primary">{editingEmployeeUser.username}</strong>
                </p>
              </div>
              <button
                onClick={() => setEditingEmployeeUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700 leading-relaxed">
                These employee details (Full Name, Employee ID, Position, Department, Joining Date, and Base Salary) will be automatically populated when selecting this user in <strong>Salary / Payroll</strong>.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (for Payroll / Documents)
                </label>
                <input
                  type="text"
                  value={employeeForm.fullName}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, fullName: e.target.value })}
                  placeholder="e.g. John Doe / U Kyaw Kyaw"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-slate-800"
                />
                <p className="text-[10px] text-slate-400 mt-1">Full legal or professional name displayed on payslips and payroll</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={employeeForm.employeeId}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, employeeId: e.target.value })}
                    placeholder="e.g. EMP-001"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Position / Job Title
                  </label>
                  <input
                    type="text"
                    value={employeeForm.position}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                    placeholder="e.g. Senior Sales Executive"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                    placeholder="e.g. Sales / Development"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Joining
                  </label>
                  <input
                    type="date"
                    value={employeeForm.dateOfJoining}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, dateOfJoining: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Base Salary (MMK)
                </label>
                <input
                  type="number"
                  value={employeeForm.baseSalary || ""}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, baseSalary: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full-Day Leave Deduction (MMK)
                  </label>
                  <input
                    type="number"
                    value={employeeForm.fullDayDeduction || ""}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, fullDayDeduction: parseFloat(e.target.value) || 0 })}
                    placeholder="Auto: Base Salary / 30"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Deduction amount per 1 full-day leave</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Half-Day Leave Deduction (MMK)
                  </label>
                  <input
                    type="number"
                    value={employeeForm.halfDayDeduction || ""}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, halfDayDeduction: parseFloat(e.target.value) || 0 })}
                    placeholder="Auto: (Base / 30) / 2"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Deduction amount per half-day leave</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setEditingEmployeeUser(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEmployeeInfo}
                disabled={savingEmployeeInfo}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                {savingEmployeeInfo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UserManagement;
