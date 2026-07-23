import React, { useState, useEffect } from 'react';
import { Search, Bell, User, Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TopbarProps {
  onSearch?: (query: string) => void;
  onMenuToggle?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onSearch, onMenuToggle }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('otas_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('otas_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="h-16 md:h-20 bg-white/80 topbar-bg backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 shadow-sm transition-all">
      <div className="flex items-center gap-3 md:gap-4">
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-slate-400 hover:text-primary transition-colors focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="p-2 md:p-2.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-full transition-all"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        <button className="p-2 md:p-2.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-full transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 md:top-2.5 md:right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950 shadow-sm"></span>
        </button>
        
        <div className="flex items-center space-x-4 pl-3 md:pl-6 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-200">{user?.username}</p>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{user?.role}</p>
          </div>
          <button className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 hover:bg-primary/20 rounded-full flex items-center justify-center text-primary transition-colors border border-primary/30 shadow-sm">
            <User className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
