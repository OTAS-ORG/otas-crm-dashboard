import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Client, AuditLog, ClientStatus, OnboardingFormConfig } from "../types";
import { clientService, onboardingService } from "../services/api";
import {
  X,
  Save,
  MessageSquare,
  History,
  User,
  Phone,
  Building2,
  Calendar,
  FileText,
  CheckCircle,
  Trash2,
  Pencil,
  Maximize2,
  LayoutDashboard,
} from "lucide-react";

interface ClientModalProps {
  clientId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const ClientModal: React.FC<ClientModalProps> = ({
  clientId,
  isOpen,
  onClose,
  onSave,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"details" | "logs" | "audit">(
    "details",
  );
  const [client, setClient] = useState<Partial<Client>>({
    companyName: "",
    contactPerson: "",
    contactInfo: "",
    inquiryDate: new Date().toISOString().split("T")[0],
    sourceChannel: "Facebook",
    status: "Inquiry" as ClientStatus,
    conversationLogs: [],
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [newLog, setNewLog] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalClient, setOriginalClient] = useState<Partial<Client> | null>(
    null,
  );
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [showDesiredOutcomeModal, setShowDesiredOutcomeModal] = useState(false);
  const [serviceOptions, setServiceOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    onboardingService.getConfigs()
      .then((configs: OnboardingFormConfig[]) => {
        const options = configs
          .filter((c) => c.serviceType !== "general")
          .map((c) => ({ value: c.serviceType, label: c.serviceName }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setServiceOptions(options);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (clientId && isOpen) {
      fetchClientData();
    } else {
      const emptyClient = {
        companyName: "",
        contactPerson: "",
        contactInfo: "",
        inquiryDate: new Date().toISOString().split("T")[0],
        sourceChannel: "Facebook",
        status: "Inquiry" as ClientStatus,
        conversationLogs: [],
      };
      setClient(emptyClient);
      setOriginalClient(null);
      setIsEditing(true);
      setAuditLogs([]);
    }
  }, [clientId, isOpen]);

  const fetchClientData = async () => {
    try {
      setIsFetching(true);
      const data = await clientService.getClient(clientId!);
      setClient(data.client);
      setOriginalClient({ ...data.client });
      setIsEditing(false);
      setAuditLogs(data.auditLogs);
    } catch (error) {
      console.error("Error fetching client data:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (clientId) {
        await clientService.updateClient(clientId, client);
      } else {
        await clientService.createClient(client);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving client:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      await clientService.deleteClient(clientId);
      onSave();
      onClose();
    } catch (error) {
      console.error("Error deleting client:", error);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancel = () => {
    if (originalClient) {
      setClient({ ...originalClient });
    }
    setIsEditing(false);
  };

  const handleAddLog = async () => {
    if (!newLog.trim() || !clientId) return;
    try {
      await clientService.addLog(clientId, newLog);
      setNewLog("");
      fetchClientData();
    } catch (error) {
      console.error("Error adding log:", error);
    }
  };

  if (!isOpen) return null;

  const isViewMode = !!clientId && !isEditing;

  const preSaleStatuses: ClientStatus[] = [
    "Inquiry",
    "Service Explained",
    "Meeting Made",
    "Sent Proposal",
    "Sent Contract",
    "Signed",
    "Ghosted",
    "Follow-up needed",
  ];

  const postSaleStatuses: ClientStatus[] = [
    "Signed",
    "In-Development",
    "Delivered",
  ];

  const currentStatuses =
    client.isPostSale || client.status === "Signed"
      ? postSaleStatuses
      : preSaleStatuses;

  const industries = [
    "Technology",
    "E-commerce",
    "Real Estate",
    "Education",
    "Healthcare",
    "Finance",
    "Food & Beverage",
    "Manufacturing",
    "Logistics",
    "Other",
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {clientId ? "Client Details" : "New Client Inquiry"}
            </h2>
            {clientId && (
              <div className="text-sm text-gray-500 mt-1 h-5 flex items-center">
                {isFetching ? (
                  <span className="w-48 h-4 bg-gray-200 rounded animate-pulse"></span>
                ) : (
                  <>
                    {client.isPostSale ? "Post-Sale Active" : "Pre-Sale Lead"} •{" "}
                    {client.companyName}
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {clientId && client.isPostSale && (
              <button
                onClick={() => {
                  onClose();
                  navigate(`/portal/${clientId}`);
                }}
                className="flex items-center gap-1.5 px-3 py-2 border border-indigo-200 text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-50 transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                View Portal
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        {clientId && (
          <div className="flex border-b border-gray-100 px-6">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "details" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "logs" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Conversation Logs ({client.conversationLogs?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "audit" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Audit Trail
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {isFetching ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium animate-pulse">
                Loading client details...
              </p>
            </div>
          ) : (
            <>
              {activeTab === "details" && (
                <form onSubmit={handleSave} className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
                    {/* Basic Info */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900">
                            Basic Information
                          </h3>
                          <p className="text-xs text-gray-500">
                            Essential client details
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                            Company Name
                          </label>
                          <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <input
                              required
                              type="text"
                              disabled={isViewMode}
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 font-medium disabled:bg-white disabled:border-transparent disabled:cursor-default disabled:opacity-100"
                              value={client.companyName}
                              onChange={(e) =>
                                setClient({
                                  ...client,
                                  companyName: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                            Industry
                          </label>
                          <select
                            disabled={isViewMode}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 font-medium disabled:bg-white disabled:border-transparent disabled:cursor-default disabled:opacity-100"
                            value={client.industry || ""}
                            onChange={(e) =>
                              setClient({ ...client, industry: e.target.value })
                            }
                          >
                            <option value="">Select Industry</option>
                            {industries.map((ind) => (
                              <option key={ind} value={ind}>
                                {ind}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                            Contact Person
                          </label>
                          <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                              <User className="w-4 h-4" />
                            </div>
                            <input
                              required
                              type="text"
                              disabled={isViewMode}
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 font-medium disabled:bg-white disabled:border-transparent disabled:cursor-default disabled:opacity-100"
                              value={client.contactPerson}
                              onChange={(e) =>
                                setClient({
                                  ...client,
                                  contactPerson: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                            Position
                          </label>
                          <input
                            type="text"
                            disabled={isViewMode}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 font-medium disabled:bg-white disabled:border-transparent disabled:cursor-default disabled:opacity-100"
                            value={client.contactPersonPosition}
                            onChange={(e) =>
                              setClient({
                                ...client,
                                contactPersonPosition: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                          Contact Info
                        </label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                            <Phone className="w-4 h-4" />
                          </div>
                          <input
                            required
                            type="text"
                            disabled={isViewMode}
                            placeholder="Phone or Email"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 font-medium disabled:bg-white disabled:border-transparent disabled:cursor-default disabled:opacity-100"
                            value={client.contactInfo}
                            onChange={(e) =>
                              setClient({
                                ...client,
                                contactInfo: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                            Client Background
                          </label>
                          {client.backgroundNote && (
                            <button
                              type="button"
                              onClick={() => setShowBackgroundModal(true)}
                              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              View Full
                            </button>
                          )}
                        </div>
                        <div
                          className="relative"
                          onClick={() =>
                            client.backgroundNote &&
                            setShowBackgroundModal(true)
                          }
                        >
                          <textarea
                            rows={3}
                            disabled={isViewMode}
                            placeholder="Key info about the client, business, or previous interactions..."
                            className={`w-full px-4 py-3 rounded-xl transition-all text-gray-800 font-medium resize-none ${isViewMode ? "bg-white border-transparent cursor-pointer" : "bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"}`}
                            value={client.backgroundNote}
                            onChange={(e) =>
                              setClient({
                                ...client,
                                backgroundNote: e.target.value,
                              })
                            }
                          />
                          {client.backgroundNote && (
                            <div className="absolute inset-0 rounded-xl cursor-pointer" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sales Context */}
                    <div className="space-y-5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900">
                            Sales Context
                          </h3>
                          <p className="text-xs text-gray-500">
                            Pipeline & status tracking
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                            Source Channel
                          </label>
                          <select
                            disabled={isViewMode}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 font-medium disabled:bg-white disabled:border-transparent disabled:cursor-default disabled:opacity-100"
                            value={client.sourceChannel}
                            onChange={(e) =>
                              setClient({
                                ...client,
                                sourceChannel: e.target.value,
                              })
                            }
                          >
                            <option>Facebook</option>
                            <option>TikTok</option>
                            <option>Client Reference</option>
                            <option>Social Media Groups</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                            Inquiry Date
                          </label>
                          <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <input
                              required
                              type="date"
                              disabled={isViewMode}
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 font-medium disabled:bg-white disabled:border-transparent disabled:cursor-default disabled:opacity-100"
                              value={client.inquiryDate?.split("T")[0]}
                              onChange={(e) =>
                                setClient({
                                  ...client,
                                  inquiryDate: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                          Status / Stage
                        </label>
                        <select
                          disabled={isViewMode}
                          className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 font-bold disabled:bg-white disabled:border-transparent disabled:cursor-default disabled:opacity-100 ${client.status === "Signed" ? "text-emerald-700 bg-emerald-50 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20" : ""}`}
                          value={client.status}
                          onChange={(e) =>
                            setClient({
                              ...client,
                              status: e.target.value as ClientStatus,
                            })
                          }
                        >
                          {currentStatuses.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      {client.status === "Follow-up needed" && (
                        <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl">
                          <label className="block text-xs font-bold text-red-600 uppercase tracking-wide mb-2">
                            Next Action Date *
                          </label>
                          <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-400">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <input
                              required
                              type="date"
                              disabled={isViewMode}
                              className="w-full pl-10 pr-4 py-2.5 bg-white border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-red-700 font-bold shadow-sm disabled:bg-white disabled:border-transparent disabled:cursor-default disabled:opacity-100"
                              value={client.nextActionDate?.split("T")[0]}
                              onChange={(e) =>
                                setClient({
                                  ...client,
                                  nextActionDate: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                            Desired Outcome
                          </label>
                          {client.desiredOutcome && (
                            <button
                              type="button"
                              onClick={() => setShowDesiredOutcomeModal(true)}
                              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              View Full
                            </button>
                          )}
                        </div>
                        <div
                          className="relative"
                          onClick={() =>
                            client.desiredOutcome &&
                            setShowDesiredOutcomeModal(true)
                          }
                        >
                          <textarea
                            rows={4}
                            disabled={isViewMode}
                            placeholder="What is the client trying to achieve?"
                            className={`w-full px-4 py-3 rounded-xl transition-all text-gray-800 font-medium resize-none ${isViewMode ? "bg-white border-transparent cursor-pointer" : "bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"}`}
                            value={client.desiredOutcome}
                            onChange={(e) =>
                              setClient({
                                ...client,
                                desiredOutcome: e.target.value,
                              })
                            }
                          />
                          {client.desiredOutcome && (
                            <div className="absolute inset-0 rounded-xl cursor-pointer" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post-Sale Section */}
                  {/* {(client.isPostSale || client.status === "Signed") && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-gray-900">
                              Post-Sale Project Details
                            </h3>
                            <p className="text-xs text-gray-500">
                              Active development tracking
                            </p>
                          </div>
                        </div>

                        <div className="mb-6">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                            Purchased Services
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {serviceOptions.map((opt) => {
                              const checked = (client.purchasedServices || []).some(s => s.type === opt.value);
                              return (
                                <label
                                  key={opt.value}
                                  className={`inline-flex items-center gap-2 px-3 py-2 border rounded-xl cursor-pointer transition-all text-xs font-semibold ${
                                    checked
                                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={isViewMode}
                                    onChange={() => {
                                      const current = client.purchasedServices || [];
                                      if (checked) {
                                        setClient({
                                          ...client,
                                          purchasedServices: current.filter(s => s.type !== opt.value),
                                        });
                                      } else {
                                        setClient({
                                          ...client,
                                          purchasedServices: [...current, { type: opt.value, name: opt.label, status: 'pending' }],
                                        });
                                      }
                                    }}
                                    className="sr-only"
                                  />
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                    checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                                  }`}>
                                    {checked && (
                                      <CheckCircle className="w-3 h-3 text-white" />
                                    )}
                                  </div>
                                  {opt.label}
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-5">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                Project ID *
                              </label>
                              <input
                                required={client.isPostSale}
                                type="text"
                                disabled={isViewMode}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-gray-800 font-medium shadow-sm disabled:bg-white disabled:border-transparent disabled:cursor-default disabled:opacity-100"
                                value={client.projectId}
                                onChange={(e) =>
                                  setClient({
                                    ...client,
                                    projectId: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                  Start Date
                                </label>
                                <input
                                  type="date"
                                  disabled={isViewMode}
                                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-gray-800 font-medium shadow-sm disabled:bg-white disabled:border-transparent disabled:cursor-default disabled:opacity-100"
                                  value={client.projectStartDate?.split("T")[0]}
                                  onChange={(e) =>
                                    setClient({
                                      ...client,
                                      projectStartDate: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                  Delivery Date
                                </label>
                                <input
                                  type="date"
                                  disabled={isViewMode}
                                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-gray-800 font-medium shadow-sm disabled:bg-white disabled:border-transparent disabled:cursor-default disabled:opacity-100"
                                  value={
                                    client.projectDeliveryDate?.split("T")[0]
                                  }
                                  onChange={(e) =>
                                    setClient({
                                      ...client,
                                      projectDeliveryDate: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                              Deliverables Summary
                            </label>
                            <textarea
                              rows={5}
                              disabled={isViewMode}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-gray-800 font-medium resize-none shadow-sm disabled:bg-white disabled:border-transparent disabled:cursor-default disabled:opacity-100"
                              value={client.deliverablesSummary}
                              onChange={(e) =>
                                setClient({
                                  ...client,
                                  deliverablesSummary: e.target.value,
                                })
                              }
                              placeholder="Project milestones, handover notes, specific feature requests..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )} */}

                  <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                    <div>
                      {clientId && (
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={loading}
                          className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center"
                        >
                          <Trash2 className="w-5 h-5 mr-2" />
                          Delete
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3">
                      {isViewMode ? (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all active:scale-95 flex items-center"
                        >
                          <Pencil className="w-5 h-5 mr-2" />
                          Edit
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleCancel}
                            disabled={loading}
                            className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 hover:text-gray-900 transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all active:scale-95 flex items-center"
                          >
                            <Save className="w-5 h-5 mr-2" />
                            {loading ? "Saving..." : "Save Client"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </form>
              )}

              {activeTab === "logs" && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Add New Log
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-700"
                        placeholder="Enter discussion notes or updates..."
                        value={newLog}
                        onChange={(e) => setNewLog(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddLog()}
                      />
                      <button
                        onClick={handleAddLog}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {client.conversationLogs?.length ? (
                      client.conversationLogs
                        .slice()
                        .reverse()
                        .map((log, i) => (
                          <div
                            key={i}
                            className="flex gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm"
                          >
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                              <MessageSquare className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-gray-800">{log.text}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(log.date).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-center text-gray-500 py-12">
                        No logs recorded yet.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "audit" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                      <History className="w-5 h-5 mr-2 text-blue-600" />
                      Activity History
                    </h3>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">
                      Total Events: {auditLogs.length}
                    </span>
                  </div>

                  <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                    {auditLogs.map((log) => (
                      <div
                        key={log._id}
                        className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active pb-8 last:pb-0"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-blue-500 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                          {log.action === "CREATE" ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <History className="w-5 h-5" />
                          )}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 bg-white shadow">
                          <div className="flex items-center justify-between space-x-2 mb-1">
                            <div className="font-bold text-slate-900">
                              {log.action}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                by{" "}
                                <span className="text-slate-600">
                                  {log.user}
                                </span>
                              </span>
                              <time className="font-medium text-blue-500 text-xs">
                                {new Date(log.timestamp).toLocaleString()}
                              </time>
                            </div>
                          </div>
                          <div className="text-slate-500 text-sm">
                            {log.action === "STATUS_CHANGE" && (
                              <p>
                                Status changed from{" "}
                                <span className="font-bold">
                                  {log.details.oldStatus}
                                </span>{" "}
                                to{" "}
                                <span className="font-bold text-blue-600">
                                  {log.details.newStatus}
                                </span>
                              </p>
                            )}
                            {log.action === "CREATE" && (
                              <p>New client lead created</p>
                            )}
                            {log.action === "LOG_ADDED" && (
                              <p>Note added: "{log.details.text}"</p>
                            )}
                            {log.action === "UPDATE" && (
                              <p>Client information updated</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showBackgroundModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowBackgroundModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                Client Background
              </h3>
              <button
                onClick={() => setShowBackgroundModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
                {client.backgroundNote || "No background information provided."}
              </p>
            </div>
          </div>
        </div>
      )}

      {showDesiredOutcomeModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowDesiredOutcomeModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                Desired Outcome
              </h3>
              <button
                onClick={() => setShowDesiredOutcomeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
                {client.desiredOutcome || "No desired outcome provided."}
              </p>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Delete Client
              </h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete this client? This action cannot
                be undone and all associated data will be lost.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center"
                >
                  {loading ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientModal;
