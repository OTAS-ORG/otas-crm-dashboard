import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ticketService } from "../services/api";
import type { Ticket, Department } from "../types";
import {
  Plus,
  Search,
  LifeBuoy,
  AlertCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const priorityIcon = (p: string) => {
  if (p === "High") return <ArrowUp className="w-3.5 h-3.5 text-red-500" />;
  if (p === "Low") return <ArrowDown className="w-3.5 h-3.5 text-slate-400" />;
  return <AlertCircle className="w-3.5 h-3.5 text-amber-500" />;
};

const statusColor = (s: string) => {
  switch (s) {
    case "Open":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "In Progress":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Pending":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "Resolved":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const Tickets: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    department_id: "",
  });
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      const [ticketData, deptData] = await Promise.all([
        ticketService.getTickets(params),
        ticketService.getDepartments(),
      ]);
      setTickets(ticketData);
      setDepartments(deptData);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, statusFilter]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    try {
      setCreating(true);
      await ticketService.createTicket({
        title: form.title,
        description: form.description,
        priority: form.priority,
        department_id: form.department_id || undefined,
      });
      setShowCreateModal(false);
      setForm({
        title: "",
        description: "",
        priority: "Medium",
        department_id: "",
      });
      fetchData();
    } catch (error) {
      console.error("Error creating ticket:", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10">
            <LifeBuoy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Tickets</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage support tickets across departments
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:block">New Ticket</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">All Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Pending">Pending</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <LifeBuoy className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">No tickets found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Department
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/tickets/${ticket._id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium text-slate-800">
                          {ticket.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[250px]">
                          {ticket.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {typeof ticket.department_id === "object"
                        ? ticket.department_id.name
                        : "-"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex w-[100px] items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor(ticket.status)}`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                        {priorityIcon(ticket.priority)}
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {typeof ticket.assigned_to === "object"
                        ? ticket.assigned_to.username
                        : "-"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-sm whitespace-nowrap">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">New Ticket</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Brief summary of the issue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="Detailed description of the issue"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Department
                  </label>
                  <select
                    value={form.department_id}
                    onChange={(e) =>
                      setForm({ ...form, department_id: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={
                  creating || !form.title.trim() || !form.description.trim()
                }
                className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {creating ? "Creating..." : "Create Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
