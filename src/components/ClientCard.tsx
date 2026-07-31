import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SuccessModal from "./SuccessModal";
import type { Client } from "../types";
import {
  Building2,
  ChevronRight,
  LayoutDashboard,
  Mail,
  Globe,
} from "lucide-react";

interface ClientCardProps {
  client: Client;
  onClick: (client: Client) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onClick }) => {
  const navigate = useNavigate();

  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState("");

  const copyLink = (e: React.MouseEvent, type: "email" | "website") => {
    e.stopPropagation();
    const link = `${window.location.origin}/public/form/${type}/${client._id}`;
    navigator.clipboard.writeText(link);
    setSuccessType(type === "email" ? "Business Email" : "Website Brief");
    setShowSuccess(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Inquiry":
        return "bg-primary/10 text-primary border border-primary/20";
      case "Service Explained":
        return "bg-purple-100 text-purple-700 border border-purple-200";
      case "Meeting Made":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "Sent Proposal":
        return "bg-orange-100 text-orange-700 border border-orange-200";
      case "Sent Contract":
        return "bg-indigo-100 text-indigo-700 border border-indigo-200";
      case "Signed":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "Ghosted":
        return "bg-slate-100 text-slate-700 border border-slate-200";
      case "Follow-up needed":
        return "bg-red-100 text-red-700 border border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
      onClick={() => onClick(client)}
    >
      <div className="flex justify-between items-center mb-3">
        <span
          className={`text-[8px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${getStatusColor(client.status)}`}
        >
          {client.status}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/portal/${client._id}`);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-primary/10 hover:text-primary transition-all text-[7px] font-bold uppercase tracking-wider border border-slate-100"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Portal
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>

      <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2 group-hover:text-primary transition-colors">
        <Building2 className="w-5 h-5 text-slate-400 group-hover:text-primary/70 transition-colors shrink-0" />
        <span className="truncate">{client.companyName}</span>
      </h3>

      <div className="space-y-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="text-slate-300">📞</span>
          <span>{client.contactInfo}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-300">📅</span>
          <span>{new Date(client.inquiryDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
        </div>
      </div>

      {client.isPostSale && client.projectId && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-400">Project</span>
          <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
            {client.projectId}
          </span>
        </div>
      )}

      {/* Quick Public Links */}
      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
        <button
          onClick={(e) => copyLink(e, "email")}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all text-[9px] font-bold uppercase tracking-tight border border-slate-100"
          title="Copy Email Form Link"
        >
          <Mail className="w-3.5 h-3.5" />
          Email Link
        </button>
        <button
          onClick={(e) => copyLink(e, "website")}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all text-[9px] font-bold uppercase tracking-tight border border-slate-100"
          title="Copy Website Brief Link"
        >
          <Globe className="w-3.5 h-3.5" />
          Web Link
        </button>
      </div>

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Link Copied!"
        message={`${successType} form link has been copied to your clipboard.`}
      />
    </div>
  );
};

export default ClientCard;
