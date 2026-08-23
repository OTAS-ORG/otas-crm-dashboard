import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { clientService, onboardingService } from "../services/api";
import type { ClientDashboardData, Submission } from "../types";
import OnboardingLinkModal from "../components/OnboardingLinkModal";
import SuccessModal from "../components/SuccessModal";
import {
  ArrowLeft,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Link2,
  Copy,
  AlertCircle,
  XCircle,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  User,
  Check,
  X,
  Eye,
  Calendar,
} from "lucide-react";

const ClientPortal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<ClientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState("");
  const [onboardingTokens, setOnboardingTokens] = useState<any[]>([]);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"links" | "submissions">("links");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedSubmissions, setExpandedSubmissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) {
      fetchDashboardData(id);
      checkOnboardingStatus(id);
    }
  }, [id]);

  const fetchDashboardData = async (clientId: string) => {
    setLoading(true);
    try {
      const data = await clientService.getClientDashboardData(clientId);
      setDashboardData(data);
      if (data?.submissions?.length) {
        const initialExpanded: Record<string, boolean> = {};
        data.submissions.forEach((s, idx) => {
          if (s._id) initialExpanded[s._id] = idx === 0;
        });
        setExpandedSubmissions(initialExpanded);
      }
    } catch (err: any) {
      console.error("Error fetching dashboard data", err);
      setError(err.response?.data?.message || "Failed to load client data");
    } finally {
      setLoading(false);
    }
  };

  const checkOnboardingStatus = async (clientId: string) => {
    try {
      const tokens = await onboardingService.getStatus(clientId);
      setOnboardingTokens(Array.isArray(tokens) ? tokens : []);
    } catch {
      setOnboardingTokens([]);
    }
  };

  const toggleExpand = (submissionId: string) => {
    setExpandedSubmissions((prev) => ({
      ...prev,
      [submissionId]: !prev[submissionId],
    }));
  };

  const getTokenStatus = (token: any): "active" | "completed" | "expired" => {
    if (token.isCompleted) return "completed";
    if (new Date(token.expiresAt) < new Date()) return "expired";
    return "active";
  };

  const buildLink = (tokenStr: string) => {
    return `${import.meta.env.VITE_PUBLIC_URL || window.location.origin}/onboarding/${tokenStr}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessType("Onboarding Link");
    setShowSuccess(true);
  };

  const SERVICE_LABELS: Record<string, string> = {
    general: "General",
    pos: "POS",
    ai_agent: "AI Agent",
    erp: "ERP",
    ecommerce: "E-commerce",
    software: "Software",
  };

  const handleDeleteToken = async (tokenId: string) => {
    try {
      await onboardingService.deleteToken(tokenId, id!);
      setOnboardingTokens((prev) => prev.filter((t) => t._id !== tokenId));
    } catch (err) {
      console.error("Failed to delete token", err);
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    }
  };

  const handleUpdateStatus = async (submissionId: string, newStatus: "Verified" | "Rejected" | "Pending") => {
    try {
      await onboardingService.updateSubmissionStatus(submissionId, newStatus);
      if (id) fetchDashboardData(id);
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const formatFormTypeName = (type: string) => {
    switch (type) {
      case "onboarding":
        return "Client Onboarding Form";
      case "business_email":
        return "Business Email Setup";
      case "website_requirements":
        return "Website Requirements Brief";
      default:
        return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  const renderFormDataDetails = (formData: any, formType: string) => {
    if (!formData || typeof formData !== "object") {
      return <p className="text-xs text-slate-500 italic">No structured data available.</p>;
    }

    if (formType === "business_email" && Array.isArray(formData.emails)) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="pb-3">No.</th>
                <th className="pb-3">Email Address</th>
                <th className="pb-3">Password</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {formData.emails.map((pair: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-3 font-semibold text-slate-400">{idx + 1}</td>
                  <td className="py-3 font-bold text-slate-800">{pair.email}</td>
                  <td className="py-3 font-mono text-slate-600 bg-slate-50 px-2.5 rounded-lg inline-block my-1">
                    {pair.password}
                  </td>
                  <td className="py-3 text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(formData).map(([key, val]) => {
          if (typeof val === "object" && val !== null && !Array.isArray(val)) {
            return (
              <div
                key={key}
                className="sm:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2"
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {key.replace(/_/g, " ")}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(val).map(([subKey, subVal]) => (
                    <div key={subKey} className="bg-white p-3 rounded-xl border border-slate-200/80">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        {subKey.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 break-words mt-0.5 block">
                        {String(subVal || "-")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (Array.isArray(val)) {
            return (
              <div
                key={key}
                className="sm:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2"
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {key.replace(/_/g, " ")} ({val.length} items)
                </span>
                <div className="flex flex-wrap gap-2">
                  {val.map((item: any, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs"
                    >
                      {typeof item === "object" ? JSON.stringify(item) : String(item)}
                    </span>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div
              key={key}
              className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {key.replace(/_/g, " ")}
              </span>
              <span className="text-xs font-semibold text-slate-800 break-words block">
                {String(val || "-")}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
        <p className="text-slate-600 mb-6">{error || "Client not found"}</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-slate-800 text-white px-6 py-2 rounded-xl hover:bg-slate-700 transition font-semibold text-xs"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { profile, submissions = [] } = dashboardData;

  // Filtered links
  const filteredTokens = onboardingTokens.filter((tok) => {
    const status = getTokenStatus(tok);
    if (statusFilter && status !== statusFilter) return false;
    if (searchQuery) {
      const matchService = tok.serviceTypes?.some((s: string) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchToken = tok.token?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchService || matchToken;
    }
    return true;
  });

  // Filtered submissions
  const filteredSubmissions = submissions.filter((sub: Submission) => {
    if (statusFilter && sub.status !== statusFilter) return false;
    if (searchQuery) {
      const matchType = sub.formType?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchName = sub.submittedBy?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType || matchName;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header matching Tickets Page Layout */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div className="relative z-10 mb-4 sm:mb-0 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-blue-500 to-cyan-600 bg-clip-text text-transparent tracking-tight">
                {profile.companyName}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  profile.isPostSale
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {profile.isPostSale ? "Active Project" : "Pre-Sale Phase"}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Manage client onboarding links, requirement forms and submissions
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowOnboardingModal(true)}
          className="relative z-10 flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-primary to-indigo-500 text-white text-sm rounded-xl hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 font-semibold cursor-pointer"
        >
          <Plus className="w-5 h-5 mr-2" />
          Generate Onboarding Link
        </button>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => {
              setActiveTab("links");
              setStatusFilter("");
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "links"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Onboarding Links</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] text-slate-600 font-bold">
              {onboardingTokens.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("submissions");
              setStatusFilter("");
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "submissions"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Submitted Forms</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] text-slate-600 font-bold">
              {submissions.length}
            </span>
          </button>
        </div>

        {/* Filters (Search + Status Dropdown) */}
        <div className="flex items-center gap-3 flex-1 sm:max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === "links" ? "Search links, services..." : "Search submissions..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white shadow-2xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white shadow-2xs cursor-pointer"
          >
            <option value="">All Status</option>
            {activeTab === "links" ? (
              <>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
              </>
            ) : (
              <>
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Rejected">Rejected</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Main Content Area (Tickets-style Table / Card Layout) */}
      {activeTab === "links" ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {filteredTokens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Link2 className="w-12 h-12 mb-3 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">No onboarding links found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Click the "Generate Onboarding Link" button above to create one.
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                      Onboarding Link
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                      Services
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                      Expires / Completed
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                      Created
                    </th>
                    <th className="text-right px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTokens.map((tok) => {
                    const status = getTokenStatus(tok);
                    const link = buildLink(tok.token);
                    const statusConfig = {
                      active: {
                        label: "Active",
                        color: "text-emerald-700",
                        bg: "bg-emerald-50 border-emerald-200",
                        icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />,
                      },
                      completed: {
                        label: "Completed",
                        color: "text-blue-700",
                        bg: "bg-blue-50 border-blue-200",
                        icon: <CheckCircle className="w-3.5 h-3.5 text-blue-600" />,
                      },
                      expired: {
                        label: "Expired",
                        color: "text-slate-500",
                        bg: "bg-slate-50 border-slate-200",
                        icon: <XCircle className="w-3.5 h-3.5 text-slate-400" />,
                      },
                    }[status];

                    return (
                      <tr key={tok._id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Link column */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 max-w-xs">
                            <code className="text-xs text-slate-700 font-mono truncate bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                              {link}
                            </code>
                          </div>
                        </td>

                        {/* Services column */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                            {tok.serviceTypes && tok.serviceTypes.length > 0 ? (
                              tok.serviceTypes.map((svc: string) => (
                                <span
                                  key={svc}
                                  className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold text-slate-700 uppercase"
                                >
                                  {SERVICE_LABELS[svc] || svc}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </div>
                        </td>

                        {/* Status column */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${statusConfig.bg} ${statusConfig.color}`}
                          >
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </td>

                        {/* Expiry column */}
                        <td className="px-5 py-4 text-xs text-slate-600">
                          {status === "completed" ? (
                            <span className="text-blue-600 font-medium flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {tok.completedAt ? new Date(tok.completedAt).toLocaleDateString() : "Done"}
                            </span>
                          ) : status === "expired" ? (
                            <span className="text-slate-400 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {new Date(tok.expiresAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(tok.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </td>

                        {/* Created Date */}
                        <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(tok.createdAt).toLocaleDateString()}
                        </td>

                        {/* Action buttons */}
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {status === "active" && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(link)}
                                className="px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-1.5 shadow-2xs"
                                title="Copy Link"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                Copy
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteTargetId(tok._id);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              title="Delete Link"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* Submissions Table / Cards */
        <div className="space-y-4">
          {filteredSubmissions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 py-20 text-center shadow-sm">
              <FileText className="w-12 h-12 mb-3 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No form submissions found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                When this client fills out and submits their Onboarding Link or Requirement Form, their responses will appear here.
              </p>
            </div>
          ) : (
            filteredSubmissions.map((sub: Submission) => {
              const subId = sub._id || "";
              const isExpanded = expandedSubmissions[subId] ?? false;

              const statusBadge = {
                Verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
                Pending: "bg-amber-50 text-amber-700 border-amber-200",
                Rejected: "bg-rose-50 text-rose-700 border-rose-200",
              }[sub.status || "Pending"];

              return (
                <div
                  key={subId}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
                >
                  <div
                    onClick={() => toggleExpand(subId)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="font-bold text-sm text-slate-800">
                            {formatFormTypeName(sub.formType)}
                          </h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadge}`}
                          >
                            {sub.status || "Pending"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            Submitted by: <strong className="text-slate-600">{sub.submittedBy?.name || "Client"}</strong>
                            {sub.submittedBy?.position && ` (${sub.submittedBy.position})`}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(sub.createdAt).toLocaleDateString()} {new Date(sub.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(subId);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isExpanded ? "Hide Details" : "View Details"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 md:px-8 pb-6 pt-2 border-t border-slate-100 space-y-6 animate-in fade-in duration-150">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                          Submitted Form Payload & Answers
                        </p>
                        {renderFormDataDetails(sub.formData, sub.formType)}
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">Update Status:</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(subId, "Verified")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                              sub.status === "Verified"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            Verify Form
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(subId, "Rejected")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                              sub.status === "Rejected"
                                ? "bg-rose-600 text-white shadow-xs"
                                : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Subcomponents Modals */}
      <OnboardingLinkModal
        isOpen={showOnboardingModal}
        onClose={() => {
          setShowOnboardingModal(false);
          if (id) {
            checkOnboardingStatus(id);
            fetchDashboardData(id);
          }
        }}
        clientId={id || ""}
        clientName={dashboardData?.profile?.companyName || "Client"}
      />

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Link Copied!"
        message={`${successType} form link has been copied to your clipboard.`}
      />

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Delete Onboarding Link
              </h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete this link? This action cannot be
                undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTargetId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    deleteTargetId && handleDeleteToken(deleteTargetId)
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
