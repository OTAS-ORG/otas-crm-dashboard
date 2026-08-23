import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AIAssistant from './AIAssistant';
import { AnimatedOutlet } from './AnimatedOutlet';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    // Default to the slim icon rail; only stay expanded if the user chose it.
    return localStorage.getItem('otas_sidebar_collapsed') !== 'false';
  });
  const { user } = useAuth();

  useEffect(() => {
    localStorage.setItem('otas_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        // Desktop stays collapsed; opening the mobile drawer forces full labels.
        collapsed={collapsed && !isSidebarOpen}
      />
      {/* Single frosted panel wrapping topbar + page body */}
      <div className="flex-1 flex flex-col min-w-0 w-full p-3">
        <div className="relative flex-1 min-h-0 flex flex-col rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
          {/* Frosted tint lives on this layer (not the wrapper) so fixed-position modals are unaffected */}
          <div aria-hidden className="page-panel-glass" />
          <Topbar
            onSearch={setSearchQuery}
            onMenuToggle={() => setIsSidebarOpen(true)}
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((c) => !c)}
          />
          <main className="relative z-[1] flex-1 min-h-0 p-4 md:p-8 overflow-y-auto [scrollbar-gutter:stable]">
            <AnimatedOutlet context={{ searchQuery }} />
          </main>
        </div>
      </div>
      {user?.role === 'Admin' && <AIAssistant />}
    </div>
  );
};

export default Layout;
