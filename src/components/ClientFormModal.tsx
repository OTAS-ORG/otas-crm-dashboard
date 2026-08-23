import React, { useState, useEffect } from "react";
import type { Client, ClientStatus, AuditLog } from "../types";
import { clientService } from "../services/api";
import CalendarModal from "./CalendarModal";
import {
  X,
  Save,
  User,
  Phone,
  Building2,
  Calendar,
  FileText,
  ChevronDown,
  MessageSquare,
  History,
  CheckCircle,
  Send,
} from "lucide-react";

export interface ClientFormModalProps {
  clientId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: Partial<Client>;
}

const ClientFormModal: React.FC<ClientFormModalProps> = ({
  clientId,
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [activeTab, setActiveTab] = useState<"details" | "logs" | "audit">("details");
  const [client, setClient] = useState<Partial<Client>>({
    companyName: "",
    contactPerson: "",
    contactPersonPosition: "",
    contactInfo: "",
    industry: "Other",
    inquiryDate: new Date().toISOString().split("T")[0],
    sourceChannel: "Client Reference",
    status: "Inquiry" as ClientStatus,
    backgroundNote: "",
    desiredOutcome: "",
    conversationLogs: [],
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [newLog, setNewLog] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [activeCalendar, setActiveCalendar] = useState<"inquiryDate" | "nextActionDate" | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab("details");
      if (clientId) {
        fetchClientData();
      } else if (initialData) {
        setClient({
          companyName: "",
          contactPerson: "",
          contactPersonPosition: "",
          contactInfo: "",
          industry: "Other",
          inquiryDate: new Date().toISOString().split("T")[0],
          sourceChannel: "Client Reference",
          status: "Inquiry" as ClientStatus,
          backgroundNote: "",
          desiredOutcome: "",
          conversationLogs: [],
          ...initialData,
        });
      } else {
        setClient({
          companyName: "",
          contactPerson: "",
          contactPersonPosition: "",
          contactInfo: "",
          industry: "Other",
          inquiryDate: new Date().toISOString().split("T")[0],
          sourceChannel: "Client Reference",
          status: "Inquiry" as ClientStatus,
          backgroundNote: "",
          desiredOutcome: "",
          conversationLogs: [],
        });
      }
    }
  }, [clientId, isOpen, initialData]);

  const fetchClientData = async () => {
    try {
      setIsFetching(true);
      const data = await clientService.getClient(clientId!);
      setClient(data.client);
      setAuditLogs(data.auditLogs || []);
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

  const handleAddLog = async () => {
    if (!newLog.trim() || !clientId) return;
    try {
      await clientService.addLog(clientId, newLog);
      setNewLog("");
      fetchClientData();
      onSave();
    } catch (error) {
      console.error("Error adding log:", error);
    }
  };

  const formatDisplayDate = (dStr?: string) => {
    if (!dStr) return "";
    const parts = dStr.split("T")[0].split("-");
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    return dStr;
  };

  if (!isOpen) return null;

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
    "Automotive Industry",
    "Technology",
    "E-commerce",
    "Real Estate",
    "Education",
    "Healthcare",
    "Finance",
    "Food & Beverage",
    "Manufacturing",
    "Logistics",
    "Retail",
    "Other",
  ];

  const sourceChannels = [
    "Client Reference",
    "Facebook Inbound",
    "Facebook",
    "TikTok",
    "Social Media Groups",
    "Direct Call / Walk-in",
    "Website Inquiry",
    "Other",
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#F8FAFC] rounded-3xl shadow-2xl w-full max-w-5xl h-[86vh] min-h-[600px] max-h-[880px] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {clientId ? "Client Details" : "New Client Inquiry"}
              </h2>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                {isFetching ? (
                  <span className="w-44 h-3.5 bg-slate-200 rounded animate-pulse"></span>
                ) : (
                  <>
                    <span>{client?.isPostSale ? "Post-Sale Active" : "Pre-Sale Lead"}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-700 font-semibold">
                      {client?.companyName || (clientId ? "Client" : "Draft Inquiry")}
                    </span>
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

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs (Shown when viewing/editing existing client) */}
          {clientId && (
            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
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
                type="button"
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
                type="button"
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
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F8FAFC]">
          {isFetching ? (
            <div className="flex flex-col items-center justify-center h-80 min-h-[350px]">
              <div className="w-10 h-10 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-3"></div>
              <p className="text-slate-500 font-medium text-xs animate-pulse">
                Loading client data...
              </p>
            </div>
          ) : (
            <>
              {activeTab === "details" && (
                <form id="client-form-layout" onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Left Column: Basic Information */}
                    <div className="space-y-5">
                      {/* Section Title */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-blue-100 shadow-2xs flex items-center justify-center text-blue-500 shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Basic Information
                          </h3>
                          <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                            COMPANY & PRIMARY CONTACT DETAILS
                          </p>
                        </div>
                      </div>

                      {/* COMPANY NAME */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          COMPANY NAME <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="form-input-pill w-full rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xs cursor-text">
                            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                            <input
                              required
                              type="text"
                              placeholder="e.g. High School Alumni Community"
                              className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none"
                              value={client.companyName || ""}
                              onChange={(e) =>
                                setClient({ ...client, companyName: e.target.value })
                              }
                            />
                            {client.companyName && (
                              <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 text-xs font-bold shrink-0">
                                •••
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* INDUSTRY */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          INDUSTRY
                        </label>
                        <div className="relative">
                          <select
                            className="form-input-pill w-full rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-none pr-10 cursor-pointer"
                            value={client.industry || "Other"}
                            onChange={(e) =>
                              setClient({ ...client, industry: e.target.value })
                            }
                          >
                            {industries.map((ind) => (
                              <option key={ind} value={ind}>
                                {ind}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      {/* CONTACT PERSON & POSITION / TITLE */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            CONTACT PERSON <span className="text-red-500">*</span>
                          </label>
                          <div className="form-input-pill w-full rounded-2xl px-4 py-3 flex items-center gap-2.5 shadow-2xs cursor-text">
                            <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                              <User className="w-2.5 h-2.5 text-slate-400" />
                            </div>
                            <input
                              required
                              type="text"
                              placeholder="e.g. Ko Kyaw Kyaw Mi"
                              className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none"
                              value={client.contactPerson || ""}
                              onChange={(e) =>
                                setClient({ ...client, contactPerson: e.target.value })
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            POSITION / TITLE
                          </label>
                          <div className="form-input-pill w-full rounded-2xl px-4 py-3 shadow-2xs cursor-text">
                            <input
                              type="text"
                              placeholder="e.g. Director"
                              className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none"
                              value={client.contactPersonPosition || ""}
                              onChange={(e) =>
                                setClient({
                                  ...client,
                                  contactPersonPosition: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* CONTACT INFO (PHONE / EMAIL) */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          CONTACT INFO (PHONE / EMAIL) <span className="text-red-500">*</span>
                        </label>
                        <div className="form-input-pill w-full rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xs cursor-text">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <input
                            required
                            type="text"
                            placeholder="+959955255972"
                            className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none"
                            value={client.contactInfo || ""}
                            onChange={(e) =>
                              setClient({ ...client, contactInfo: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      {/* CLIENT BACKGROUND */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          CLIENT BACKGROUND
                        </label>
                        <textarea
                          rows={4}
                          placeholder="အသင်းအဖွဲ့ သို့မဟုတ် လုပ်ငန်းနောက်ခံ အချက်အလက်များ..."
                          className="form-input-pill w-full rounded-2xl p-4 text-xs font-medium text-slate-800 leading-relaxed shadow-2xs resize-none focus:outline-none"
                          value={client.backgroundNote || ""}
                          onChange={(e) =>
                            setClient({
                              ...client,
                              backgroundNote: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Right Column: Sales Context */}
                    <div className="space-y-5">
                      {/* Section Title */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-blue-100 shadow-2xs flex items-center justify-center text-blue-500 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Sales Context
                          </h3>
                          <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                            PIPELINE STAGE & ACQUISITION CHANNEL
                          </p>
                        </div>
                      </div>

                      {/* SOURCE CHANNEL & INQUIRY DATE */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            SOURCE CHANNEL
                          </label>
                          <div className="relative">
                            <select
                              className="form-input-pill w-full rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 shadow-2xs appearance-none focus:outline-none pr-10 cursor-pointer"
                              value={client.sourceChannel || "Client Reference"}
                              onChange={(e) =>
                                setClient({
                                  ...client,
                                  sourceChannel: e.target.value,
                                })
                              }
                            >
                              {sourceChannels.map((src) => (
                                <option key={src} value={src}>
                                  {src}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            INQUIRY DATE
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveCalendar("inquiryDate")}
                              className="form-input-pill w-full rounded-2xl px-4 py-3 flex items-center justify-between shadow-2xs cursor-pointer text-left"
                            >
                              <div className="flex items-center gap-2.5">
                                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                                <span className="text-xs font-semibold text-slate-800">
                                  {formatDisplayDate(client.inquiryDate) || "08/14/2026"}
                                </span>
                              </div>
                              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* STATUS / STAGE */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          STATUS / STAGE
                        </label>
                        <div className="relative">
                          <select
                            className={`form-input-pill w-full rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 shadow-2xs appearance-none focus:outline-none pr-10 cursor-pointer ${
                              client.status === "Signed"
                                ? "text-emerald-700 bg-emerald-50/50 border-emerald-300"
                                : ""
                            }`}
                            value={client.status || "Inquiry"}
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
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      {/* Follow-up needed: Next Action Date */}
                      {client.status === "Follow-up needed" && (
                        <div className="p-4 bg-red-50/60 border border-red-200/90 rounded-2xl shadow-2xs">
                          <label className="block text-[10px] font-bold text-red-600 uppercase tracking-wider mb-2">
                            NEXT ACTION DATE <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setActiveCalendar("nextActionDate")}
                            className="form-input-pill w-full rounded-xl px-4 py-2.5 flex items-center justify-between shadow-2xs cursor-pointer text-left bg-white"
                          >
                            <div className="flex items-center gap-2.5">
                              <Calendar className="w-4 h-4 text-red-500 shrink-0" />
                              <span className="text-xs font-bold text-red-700">
                                {formatDisplayDate(client.nextActionDate) || "Select Next Action Date"}
                              </span>
                            </div>
                            <Calendar className="w-4 h-4 text-red-400 shrink-0" />
                          </button>
                        </div>
                      )}

                      {/* DESIRED OUTCOME */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          DESIRED OUTCOME
                        </label>
                        <textarea
                          rows={6}
                          placeholder='"ကျောင်းသားဟောင်းများ၏ ကိုယ်ရေးအချက်အလက်များ Account များကို စနစ်တကျ စီမံခန့်ခွဲရန်..."'
                          className="form-input-pill w-full rounded-2xl p-4 text-xs font-medium text-slate-800 italic leading-relaxed shadow-2xs resize-none focus:outline-none min-h-[160px]"
                          value={client.desiredOutcome || ""}
                          onChange={(e) =>
                            setClient({
                              ...client,
                              desiredOutcome: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* Conversation Logs Tab */}
              {activeTab === "logs" && (
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Add New Note / Conversation Log
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs font-medium text-slate-800"
                        placeholder="Enter client discussion notes, call logs, or meeting summaries..."
                        value={newLog}
                        onChange={(e) => setNewLog(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddLog()}
                      />
                      <button
                        type="button"
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

              {/* Audit Trail Tab */}
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
                          className="p-3.5 bg-white border border-slate-100 rounded-2xl flex items-start gap-3 shadow-2xs"
                        >
                          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
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
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="client-form-layout"
            disabled={loading}
            className="px-7 py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-bold hover:bg-blue-700 shadow-sm shadow-blue-500/25 hover:shadow-md hover:shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            {loading ? "Saving..." : clientId ? "Save Changes" : "Create Client"}
          </button>
        </div>
      </div>

      {/* Centered Calendar Modal */}
      <CalendarModal
        isOpen={!!activeCalendar}
        onClose={() => setActiveCalendar(null)}
        value={activeCalendar === "inquiryDate" ? client.inquiryDate : client.nextActionDate}
        onChange={(dateStr) => {
          if (activeCalendar === "inquiryDate") {
            setClient({ ...client, inquiryDate: dateStr });
          } else if (activeCalendar === "nextActionDate") {
            setClient({ ...client, nextActionDate: dateStr });
          }
        }}
        title={activeCalendar === "inquiryDate" ? "Select Inquiry Date" : "Select Next Action Date"}
      />
    </div>
  );
};

export default ClientFormModal;
