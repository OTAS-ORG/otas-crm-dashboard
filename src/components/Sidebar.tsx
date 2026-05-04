import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Users, UserCheck, LayoutDashboard, LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/otas.png';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Pre-Sale', path: '/', icon: Users },
    { name: 'Post-Sale', path: '/post-sale', icon: UserCheck },
    // { name: 'Client Portal', path: '/portal', icon: LayoutDashboard },
  ];

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0A0F1C] text-slate-300 flex flex-col border-r border-slate-800/50 shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:shadow-xl min-h-screen ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="OTAS Logo" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">OTAS<span className="text-primary">CRM</span></h1>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Enterprise Edition</p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Main Menu</p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl transition-all duration-300 group relative ${isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_8px_rgba(0,82,255,0.6)]" />
                  )}
                  <item.icon className={`w-5 h-5 mr-3 transition-colors duration-300 ${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mx-3 mb-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
              <span className="font-bold">{user?.username.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.username}</p>
              <p className="text-xs text-slate-400">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-2 text-sm text-slate-300 bg-white/5 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all duration-300"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
