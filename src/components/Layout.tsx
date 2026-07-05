import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AIAssistant from './AIAssistant';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Topbar 
          onSearch={setSearchQuery} 
          onMenuToggle={() => setIsSidebarOpen(true)} 
        />
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet context={{ searchQuery }} />
        </main>
      </div>
      {user?.role === 'Admin' && <AIAssistant />}
    </div>
  );
};

export default Layout;
