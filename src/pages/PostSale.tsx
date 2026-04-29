import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { clientService } from '../services/api';
import type { Client } from '../types';
import ClientCard from '../components/ClientCard';
import ClientModal from '../components/ClientModal';
import { Briefcase } from 'lucide-react';

const PostSale: React.FC = () => {
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await clientService.getClients({ 
        isPostSale: true,
        search: searchQuery 
      });
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [searchQuery]);

  const handleOpenModal = (id?: string) => {
    setSelectedClientId(id);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 bg-white p-5 md:px-6 md:py-5 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Active Projects</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage ongoing projects and execution for active clients.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {clients.map((client) => (
            <ClientCard key={client._id} client={client} onClick={(c) => handleOpenModal(c._id)} />
          ))}
        </div>
      ) : (
        <div className="bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300 p-16 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
            <Briefcase className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">No active projects</h3>
          <p className="text-slate-500 max-w-sm">When a contract is signed, clients will appear here for project execution.</p>
        </div>
      )}

      <ClientModal 
        clientId={selectedClientId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchClients}
      />
    </div>
  );
};

export default PostSale;
