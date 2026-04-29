import React from 'react';
import type { Client } from '../types';
import { Calendar, Phone, Building2, User, ChevronRight } from 'lucide-react';

interface ClientCardProps {
  client: Client;
  onClick: (client: Client) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Inquiry': return 'bg-primary/10 text-primary border border-primary/20';
      case 'Service Explained': return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'Meeting Made': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'Sent Proposal': return 'bg-orange-100 text-orange-700 border border-orange-200';
      case 'Sent Contract': return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      case 'Signed': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'Ghosted': return 'bg-slate-100 text-slate-700 border border-slate-200';
      case 'Follow-up needed': return 'bg-red-100 text-red-700 border border-red-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
      onClick={() => onClick(client)}
    >
      <div className="flex justify-between items-start mb-4">
        <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${getStatusColor(client.status)}`}>
          {client.status}
        </span>
        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center group-hover:text-primary transition-colors">
        <Building2 className="w-5 h-5 mr-2 text-slate-400 group-hover:text-primary/70 transition-colors" />
        {client.companyName}
      </h3>
      
      <div className="space-y-3 mt-5 text-sm text-slate-600">
        <div className="flex items-center bg-slate-50 p-2 rounded-lg">
          <div className="w-8 h-8 rounded-md bg-white shadow-sm flex items-center justify-center mr-3">
            <User className="w-4 h-4 text-slate-500" />
          </div>
          <span className="font-medium text-slate-700">{client.contactPerson}</span>
        </div>
        <div className="flex items-center">
          <Phone className="w-4 h-4 mr-3 text-slate-400" />
          {client.contactInfo}
        </div>
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-3 text-slate-400" />
          {new Date(client.inquiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
      </div>
      
      {client.isPostSale && client.projectId && (
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500">Project ID</span>
          <span className="text-primary bg-primary/5 px-2 py-1 rounded-md">{client.projectId}</span>
        </div>
      )}
    </div>
  );
};

export default ClientCard;
