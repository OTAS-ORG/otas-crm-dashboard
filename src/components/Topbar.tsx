import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  LogOut,
  Ticket as TicketIcon,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/** Maps the first path segment to a human breadcrumb label. */
const PAGE_TITLES: Record<string, string> = {
  '': 'Pre-Sale Pipeline',
  'post-sale': 'Post-Sale',
  'invoices': 'Invoices',
  'analytics': 'Analytics',
  'expenses': 'Expenses',
  'projects': 'Projects',
  'tickets': 'Tickets',
  'salaries': 'Payroll',
  'vault': 'Vault',
  'blogs': 'Blog Management',
  'documents': 'Documents',
  'contacts': 'Contacts',
  'portal': 'Client Portal',
  'ai': 'AI Studio',
  'admin': 'Admin',
};

interface TopbarProps {
  onSearch?: (query: string) => void;
  onMenuToggle?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onMenuToggle, collapsed, onToggleCollapsed }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const segment = location.pathname.split('/')[1] || '';
  const pageTitle =
    PAGE_TITLES[segment] ?? (segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : 'Dashboard');

  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login');
  };

  const userInitials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'U';

  return (
    <div className="relative z-30 shrink-0 h-16 md:h-20 border-b border-slate-200/60 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 transition-all">
      {/* Left section */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-slate-400 hover:text-primary transition-colors focus:outline-none cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
        <button
          onClick={onToggleCollapsed}
          className="hidden lg:flex p-2 text-slate-400 hover:text-primary transition-colors focus:outline-none cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>

        {/* Breadcrumb */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] md:text-xs font-semibold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-primary hover:underline transition-colors cursor-pointer uppercase"
            title="Go Back"
          >
            Workspace
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <button
            type="button"
            onClick={() => {
              if (segment) {
                navigate(`/${segment}`);
              } else {
                navigate('/');
              }
            }}
            className="text-slate-700 hover:text-primary hover:underline transition-colors cursor-pointer font-bold uppercase"
          >
            {pageTitle}
          </button>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center">
        {/* Shadcn-style Profile Dropdown with Avatar */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-3 p-1 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer focus:outline-none group"
            aria-expanded={profileOpen}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">
                {user?.username}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {user?.role}
              </p>
            </div>

            {/* Avatar Pill / Circle */}
            <div
              className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-primary font-bold text-xs bg-primary/10 border transition-all shadow-xs ${profileOpen
                ? 'ring-2 ring-primary border-primary bg-primary/20 text-primary'
                : 'border-primary/20 group-hover:border-primary/50'
                }`}
            >
              <UserIcon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
          </button>

          {/* Dropdown Menu Modal/Card */}
          {profileOpen && (
            <div
              className="no-glass absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200/90 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
              style={{ backgroundColor: '#ffffff', opacity: 1 }}
            >
              {/* Header: User details */}
              <div className="px-3 py-2.5 flex items-center gap-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.username}</p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200/60">
                    {user?.role}
                  </span>
                </div>
              </div>

              {/* Menu Group 1 */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/tickets');
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <TicketIcon className="w-4 h-4 text-slate-400" />
                  <span>My Tickets</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/ai');
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>AI Assistant</span>
                </button>

              </div>

              <div className="border-t border-slate-100 my-1"></div>

              {/* Logout Option */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
                  <span>Log out</span>
                </div>
                <span className="text-[10px] text-rose-400 font-medium">Exit</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;
