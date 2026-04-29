import React from 'react';
import { Search, Bell, User, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TopbarProps {
  onSearch: (query: string) => void;
  onMenuToggle?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onSearch, onMenuToggle }) => {
  const { user } = useAuth();

  return (
    <div className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 shadow-sm transition-all">
      <div className="flex items-center gap-3 md:gap-4 flex-1">
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-slate-400 hover:text-primary transition-colors focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="max-w-xl w-full relative group">
          <Search className="w-4 h-4 md:w-5 md:h-5 absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-2.5 bg-slate-100/80 border border-transparent rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 focus:bg-white transition-all text-sm text-slate-700 shadow-inner"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-3 md:space-x-6">
        <button className="p-2 md:p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 md:top-2.5 md:right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
        </button>
        
        <div className="flex items-center space-x-4 pl-3 md:pl-6 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-700">{user?.username}</p>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{user?.role}</p>
          </div>
          <button className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 hover:bg-primary/20 rounded-full flex items-center justify-center text-primary transition-colors border border-primary/20 shadow-sm">
            <User className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
