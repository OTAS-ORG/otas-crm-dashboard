import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Client, AuditLog, ClientStatus } from "../types";
import { clientService } from "../services/api";
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  Maximize2,
  Trash2,
  Pencil,
  MessageSquare,
  History,
  CheckCircle,
  LayoutDashboard,
  Send,
  Sparkles,
} from "lucide-react";

export interface ClientDetailModalProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSave?: () => void;
}

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  clientId,
  isOpen,
  onClose,
  onEdit,
  onSave,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"details" | "logs" | "audit">("details");
  const [client, setClient] = useState<Client | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [newLog, setNewLog] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [showDesiredOutcomeModal, setShowDesiredOutcomeModal] = useState(false);

  useEffect(() => {
    if (clientId && isOpen) {
      fetchClientData();
    }
  }, [clientId, isOpen]);

  const fetchClientData = async () => {
    try {
      setIsFetching(true);
      const data = await clientService.getClient(clientId);
      setClient(data.client);
      setAuditLogs(data.auditLogs || []);
    } catch (error) {
      console.error("Error fetching client details:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddLog = async () => {
    if (!newLog.trim() || !clientId) return;
    try {
      await clientService.addLog(clientId, newLog);
      setNewLog("");
      fetchClientData();
      if (onSave) onSave();
    } catch (error) {
      console.error("Error adding log:", error);
    }
  };

  const confirmDelete = async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      await clientService.deleteClient(clientId);
      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Error deleting client:", error);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAdvanceStatus = async () => {
    if (!client) return;

    // Advance to next logical status
    const statusProgression: Record<string, ClientStatus> = {
      Inquiry: "Service Explained",
      "Service Explained": "Meeting Made",
      "Meeting Made": "Sent Proposal",
      "Sent Proposal": "Sent Contract",
      "Sent Contract": "Signed",
      "Ghosted": "Follow-up needed",
      "Follow-up needed": "Meeting Made",
    };

    const nextStatus = statusProgression[client.status];
    if (nextStatus) {
      try {
        setLoading(true);
        await clientService.updateClient(clientId, { status: nextStatus });
        fetchClientData();
        if (onSave) onSave();
      } catch (error) {
        console.error("Error advancing status:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to distinguish email vs phone from contactInfo
  const getContactInfoParts = (info?: string) => {
    if (!info) return { phone: "09964345334", email: "client@example.com" };
    const parts = info.split(/[\s,/|]+/);
    const emailMatch = info.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = info.match(/[\d+]{7,15}/);

    return {
      phone: phoneMatch ? phoneMatch[0] : parts[0] || "09964345334",
      email: emailMatch ? emailMatch[0] : (parts.length > 1 ? parts[1] : `${client?.contactPerson?.toLowerCase().replace(/\s+/g, ".") || "client"}@gmail.com`),
    };
  };

  const contactParts = getContactInfoParts(client?.contactInfo);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[86vh] min-h-[600px] max-h-[880px] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Client Details
              </h2>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                {isFetching ? (
                  <span className="w-44 h-3.5 bg-slate-200 rounded animate-pulse"></span>
                ) : (
                  <>
                    <span>{client?.isPostSale ? "Post-Sale Active" : "Pre-Sale Lead"}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-700 font-semibold">{client?.companyName}</span>
                    {client?.contactPerson && (
                      <>
                        <span className="text-slate-400">-</span>
                        <span className="text-slate-600">{client.contactPerson}</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {client?.isPostSale && (
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/portal/${clientId}`);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-200 text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-xs"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  View Portal
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "details"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "logs"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              Conversation Logs
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "audit"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              Audit Trail
            </button>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white">
          {isFetching || !client ? (
            <div className="flex flex-col items-center justify-center h-80 min-h-[350px]">
              <div className="w-10 h-10 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-3"></div>
              <p className="text-slate-500 font-medium text-xs animate-pulse">
                Loading client details...
              </p>
            </div>
          ) : (
            <>
              {activeTab === "details" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column (Profile & Primary Contact) - 4 cols */}
                  <div className="lg:col-span-4 space-y-6 lg:border-r lg:border-slate-100 lg:pr-6">
                    {/* Company Branding Icon */}
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs mb-3">
                        <Building2 className="w-9 h-9" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                        {client.companyName}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {client.industry || "Automotive Industry"}
                      </p>
                      <div className="mt-3">
                        <span className="inline-block px-3 py-1 bg-amber-50 border border-amber-200/80 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-2xs">
                          {client.isPostSale ? "Post-Sale Project" : "Pre-Sale Inquiry"}
                        </span>
                      </div>
                    </div>

                    {/* Primary Contact Section */}
                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                        Primary Contact
                      </span>

                      {/* Contact Card */}
                      <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-3.5 flex items-center gap-3.5 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
                          {client.contactPerson?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {client.contactPerson || "Aung Min"}
                          </h4>
                          <p className="text-xs text-slate-400 truncate">
                            {client.contactPersonPosition || "Business Owner"}
                          </p>
                        </div>
                      </div>

                      {/* Contact Info Rows */}
                      <div className="space-y-2.5">
                        {/* Phone */}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <Phone className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                              Phone
                            </span>
                            <span className="text-xs font-semibold text-slate-800 truncate block">
                              {contactParts.phone}
                            </span>
                          </div>
                        </div>

                        {/* Email */}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <Mail className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                              Email
                            </span>
                            <span className="text-xs font-semibold text-slate-800 truncate block">
                              {contactParts.email}
                            </span>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                              Location
                            </span>
                            <span className="text-xs font-semibold text-slate-800 truncate block">
                              Yangon, Myanmar
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (Sales Context, Client Background & Desired Outcome - Full Width 8 cols) */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* Sales Context Section (Upper / Top Full Width) */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-3.5 bg-blue-600 rounded-full" />
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Sales Context
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4.5 bg-slate-50/70 border border-slate-100 rounded-2xl w-full">
                        {/* Source Channel */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Source Channel
                          </span>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                            <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                              f
                            </div>
                            <span className="truncate">{client.sourceChannel || "Facebook"}</span>
                          </div>
                        </div>

                        {/* Inquiry Date */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Inquiry Date
                          </span>
                          <span className="text-xs font-semibold text-slate-800 block truncate">
                            {formatDate(client.inquiryDate)}
                          </span>
                        </div>

                        {/* Status / Stage */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Status / Stage
                          </span>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200/80 rounded-full text-xs font-bold text-slate-700 uppercase tracking-wider shadow-2xs">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                client.status === "Signed"
                                  ? "bg-emerald-500"
                                  : client.status === "Ghosted"
                                  ? "bg-slate-400"
                                  : client.status === "Follow-up needed"
                                  ? "bg-red-500"
                                  : "bg-blue-600"
                              }`}
                            />
                            {client.status || "Inquiry"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Client Background Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-3.5 bg-blue-600 rounded-full" />
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Client Background
                          </h4>
                        </div>
                        {client.backgroundNote && (
                          <button
                            type="button"
                            onClick={() => setShowBackgroundModal(true)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center gap-1 transition-colors"
                          >
                            <Maximize2 className="w-3 h-3" />
                            View Full
                          </button>
                        )}
                      </div>

                      <div
                        onClick={() => client.backgroundNote && setShowBackgroundModal(true)}
                        className={`p-5 bg-slate-50/70 border border-slate-100 rounded-2xl text-xs leading-relaxed text-slate-600 min-h-[120px] transition-all w-full ${
                          client.backgroundNote ? "cursor-pointer hover:bg-slate-100/70" : ""
                        }`}
                      >
                        {client.backgroundNote ? (
                          <p className="line-clamp-5 whitespace-pre-wrap">
                            {client.backgroundNote}
                          </p>
                        ) : (
                          <p className="text-slate-400 italic">No background notes provided.</p>
                        )}
                      </div>
                    </div>

                    {/* Desired Outcome Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-3.5 bg-blue-600 rounded-full" />
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Desired Outcome
                          </h4>
                        </div>
                        {client.desiredOutcome && (
                          <button
                            type="button"
                            onClick={() => setShowDesiredOutcomeModal(true)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center gap-1 transition-colors"
                          >
                            <Maximize2 className="w-3 h-3" />
                            View Full
                          </button>
                        )}
                      </div>

                      <div
                        onClick={() => client.desiredOutcome && setShowDesiredOutcomeModal(true)}
                        className={`p-5 bg-slate-50/70 border border-slate-100 rounded-2xl text-xs leading-relaxed text-slate-600 min-h-[120px] transition-all w-full ${
                          client.desiredOutcome ? "cursor-pointer hover:bg-slate-100/70" : ""
                        }`}
                      >
                        {client.desiredOutcome ? (
                          <p className="line-clamp-5 italic whitespace-pre-wrap">
                            "{client.desiredOutcome}"
                          </p>
                        ) : (
                          <p className="text-slate-400 italic">No desired outcomes specified.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Conversation Logs */}
              {activeTab === "logs" && (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Add New Note / Conversation Log
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs font-medium text-slate-800"
                        placeholder="Enter client discussion notes, call logs, or meeting summaries..."
                        value={newLog}
                        onChange={(e) => setNewLog(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddLog()}
                      />
                      <button
                        onClick={handleAddLog}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Add Log
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {client.conversationLogs && client.conversationLogs.length > 0 ? (
                      client.conversationLogs
                        .slice()
                        .reverse()
                        .map((log, i) => (
                          <div
                            key={i}
                            className="flex gap-3.5 p-4 bg-white border border-slate-100 rounded-2xl shadow-2xs"
                          >
                            <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                              <MessageSquare className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs leading-relaxed font-medium text-slate-800">
                                {log.text}
                              </p>
                              <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                                {new Date(log.date).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-12">
                        <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-medium">
                          No conversation logs recorded yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Audit Trail */}
              {activeTab === "audit" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <History className="w-4 h-4 text-blue-600" />
                      Activity Timeline
                    </h4>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                      {auditLogs.length} Events
                    </span>
                  </div>

                  <div className="space-y-3">
                    {auditLogs.length > 0 ? (
                      auditLogs.map((log) => (
                        <div
                          key={log._id}
                          className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-2xl flex items-start gap-3"
                        >
                          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                            {log.action === "CREATE" ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <History className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-900">
                                {log.action}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {log.action === "STATUS_CHANGE" && (
                                <>
                                  Status changed from{" "}
                                  <span className="font-semibold text-slate-800">
                                    {log.details.oldStatus}
                                  </span>{" "}
                                  to{" "}
                                  <span className="font-semibold text-blue-600">
                                    {log.details.newStatus}
                                  </span>
                                </>
                              )}
                              {log.action === "CREATE" && "Client inquiry created"}
                              {log.action === "UPDATE" && "Client details updated"}
                              {log.action === "LOG_ADDED" && `Note added: "${log.details.text}"`}
                            </p>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">
                              by {log.user}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-medium">
                          No audit activity recorded.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider"
          >
            <Trash2 className="w-4 h-4" />
            Archive Inquiry
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onEdit}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-2xs flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Details
            </button>

            {client && !client.isPostSale && client.status !== "Signed" && (
              <button
                type="button"
                onClick={handleAdvanceStatus}
                disabled={loading}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm shadow-blue-500/25 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Convert to Lead
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Background Modal */}
      {showBackgroundModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowBackgroundModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Client Background Information
              </h3>
              <button
                onClick={() => setShowBackgroundModal(false)}
                className="p-1.5 hover:bg-slate-200/60 rounded-full transition-colors text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {client?.backgroundNote || "No background information provided."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Desired Outcome Modal */}
      {showDesiredOutcomeModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowDesiredOutcomeModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Desired Outcome
              </h3>
              <button
                onClick={() => setShowDesiredOutcomeModal(false)}
                className="p-1.5 hover:bg-slate-200/60 rounded-full transition-colors text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {client?.desiredOutcome || "No desired outcome provided."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Archive / Delete Client
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium">
              Are you sure you want to delete this client? All associated logs, projects, and pipeline history will be permanently removed.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors shadow-xs"
              >
                {loading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetailModal;
