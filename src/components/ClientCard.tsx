import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SuccessModal from "./SuccessModal";
import type { Client } from "../types";
import {
  ArrowRight,
  Phone,
  Building2,
  ChevronRight,
  LayoutDashboard,
  Mail,
  Globe,
  Repeat2,
  Calendar,
} from "lucide-react";

interface ClientCardProps {
  client: Client;
  onClick: (client: Client) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onClick }) => {
  const navigate = useNavigate();

  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const flipInTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const flipOutTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    // Clear any pending flip-back timer
    if (flipOutTimerRef.current) {
      clearTimeout(flipOutTimerRef.current);
      flipOutTimerRef.current = null;
    }
    // Wait 3 seconds of continuous hover before flipping
    if (!flipInTimerRef.current) {
      flipInTimerRef.current = setTimeout(() => {
        setIsFlipped(true);
        flipInTimerRef.current = null;
      }, 3000);
    }
  };

  const handleMouseLeave = () => {
    // Cancel the pending flip if the user leaves before 3 seconds
    if (flipInTimerRef.current) {
      clearTimeout(flipInTimerRef.current);
      flipInTimerRef.current = null;
    }
    // Once flipped, flip back after a short delay
    if (isFlipped) {
      flipOutTimerRef.current = setTimeout(() => {
        setIsFlipped(false);
        flipOutTimerRef.current = null;
      }, 300);
    }
  };

  React.useEffect(() => {
    return () => {
      if (flipInTimerRef.current) clearTimeout(flipInTimerRef.current);
      if (flipOutTimerRef.current) clearTimeout(flipOutTimerRef.current);
    };
  }, []);

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

  const features: string[] = [];
  if (client.industry) features.push(client.industry);
  if (client.sourceChannel) features.push(`Via ${client.sourceChannel}`);
  if (client.isPostSale && client.projectId) features.push(`Project ${client.projectId}`);
  if (client.purchasedServices?.length) {
    client.purchasedServices.forEach((s) => features.push(s.name || s.type));
  }

  return (
    <div
      className="group relative h-[320px] w-full [perspective:2000px]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onClick(client)}
    >
      <div
        className="relative h-full w-full [transform-style:preserve-3d] transition-[transform] duration-500 ease-[cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none"
        style={{
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ===== FRONT ===== */}
        <div className="absolute inset-0 h-full w-full overflow-hidden rounded-2xl bg-white/70 border border-slate-200/60 shadow-sm transition-shadow duration-500 group-hover:shadow-xl group-hover:shadow-primary/10 [backface-visibility:hidden] [transform:rotateY(0deg)]">
          <div className="relative h-full flex flex-col p-5">
            <div className="flex justify-between items-center mb-4">
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

            <div className="flex-1 flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-800 truncate group-hover:text-primary transition-colors">
                    {client.companyName}
                  </h3>
                  <p className="line-clamp-2 text-sm text-slate-500 truncate">
                    {client.contactPerson}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{client.contactInfo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {new Date(client.inquiryDate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-400">Flip for details</span>
              <Repeat2 className="w-3.5 h-3.5 text-primary transition-transform duration-300 group-hover:rotate-180" />
            </div>
          </div>
        </div>

        {/* ===== BACK ===== */}
        <div className="absolute inset-0 h-full w-full rounded-2xl p-5 border border-blue-200/90 bg-gradient-to-br from-blue-50/95 via-sky-50/90 to-blue-100/70 shadow-sm transition-shadow duration-500 group-hover:shadow-xl group-hover:shadow-primary/20 flex flex-col [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="flex-1 space-y-4 overflow-hidden">
            <div className="space-y-2">
              <h3 className="font-bold text-base text-slate-900 leading-snug tracking-tight truncate">
                {client.companyName}
              </h3>
              <p className="line-clamp-2 text-sm text-slate-600 tracking-tight">
                {client.backgroundNote ||
                  client.desiredOutcome ||
                  `A ${client.status.toLowerCase()} lead from ${client.sourceChannel}.`}
              </p>
            </div>

            {features.length > 0 && (
              <div className="space-y-1.5">
                {features.map((feature, index) => (
                  <div
                    className="flex items-center gap-2 text-sm text-slate-700 font-medium transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                    key={feature}
                    style={{
                      transform: isFlipped ? "translateX(0)" : "translateX(-10px)",
                      opacity: isFlipped ? 1 : 0,
                      transitionDelay: `${index * 50 + 100}ms`,
                    }}
                  >
                    <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                    <span className="truncate">{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={(e) => copyLink(e, "email")}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all text-[9px] font-bold uppercase tracking-tight border border-blue-200/80 shadow-2xs"
                title="Copy Email Form Link"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </button>
              <button
                onClick={(e) => copyLink(e, "website")}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all text-[9px] font-bold uppercase tracking-tight border border-blue-200/80 shadow-2xs"
                title="Copy Website Brief Link"
              >
                <Globe className="w-3.5 h-3.5" />
                Web
              </button>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/portal/${client._id}`);
              }}
              className="w-full flex items-center justify-between rounded-xl p-3 bg-white/90 border border-blue-200/80 hover:bg-blue-600 hover:text-white group/portal transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-2xs"
            >
              <span className="font-semibold text-sm text-blue-900 group-hover/portal:text-white transition-colors">
                View Portal
              </span>
              <ArrowRight className="h-4 w-4 text-blue-600 group-hover/portal:text-white transition-all duration-300 group-hover/portal:translate-x-0.5" />
            </button>
          </div>
        </div>
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
