import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, UserCheck, FileText, Lock, Settings2, ClipboardList, X, Receipt, BarChart3, LifeBuoy, Wallet, FolderOpen, Calendar, BookOpen, Layers, CalendarOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/otas.png';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose, collapsed = false }) => {
  const { user } = useAuth();

  const allNavItems = [
    { name: 'Pre-Sale', path: '/', icon: Users },
    { name: 'Post-Sale', path: '/post-sale', icon: UserCheck },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Invoices', path: '/invoices', icon: FileText },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Projects', path: '/projects', icon: Layers },
    { name: 'Tickets', path: '/tickets', icon: LifeBuoy },
    { name: 'Payroll', path: '/salaries', icon: Wallet },
    { name: 'Leaves', path: '/leaves', icon: CalendarOff },
    { name: 'Vault', path: '/vault', icon: Lock },
    { name: 'Blogs', path: '/blogs', icon: BookOpen },
    { name: 'Form Builder', path: '/admin/form-builder', icon: Settings2 },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Submissions', path: '/admin/submissions', icon: ClipboardList },
    // { name: 'Contacts', path: '/contacts', icon: Mail },
    { name: 'Documents', path: '/documents', icon: FolderOpen },
    // { name: 'AI', path: '/ai', icon: Sparkles },
  ];

  const userOnlyPaths = ['/', '/post-sale', '/calendar', '/admin/submissions', '/blogs', '/projects'];
  const financePaths = ['/invoices', '/analytics', '/salaries'];

  const isMasterAdmin = user?.role === 'Admin' && (!user.departments || user.departments.length === 0);
  const isSales = user?.role === 'Sales' || (user?.departments && user.departments.includes('Sales') && user?.role !== 'Admin');

  const navItems = allNavItems.filter((item) => {
    // 0. Hide Projects for Sales department users
    if (item.path === '/projects' && isSales && !isMasterAdmin) {
      return false;
    }

    // 1. Standard user path restrictions
    if (user?.role === 'User') {
      if (!userOnlyPaths.includes(item.path)) return false;
    }

    // 2. Finance path restrictions
    if (financePaths.includes(item.path)) {
      const isFinance = user?.departments && user.departments.includes('Finance');
      return !!(isMasterAdmin || isFinance);
    }

    return true;
  });

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container — floating dark-glass rail on desktop, drawer on mobile */}
      <div className={`fixed pb-5 inset-y-0 left-0 z-40 flex flex-col min-h-screen overflow-hidden bg-[#0A0F1C]/80 backdrop-blur-2xl text-slate-300 border-r border-white/10 shadow-2xl transition-[width,transform] duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-3 lg:my-3 lg:ml-3 lg:h-[calc(100vh-1.5rem)] lg:min-h-0 lg:rounded-3xl lg:border lg:border-white/10 lg:shadow-xl ${collapsed ? 'w-[68px]' : 'w-52'} ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`py-6 px-3 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {collapsed ? (
            <div className="h-10 flex items-center justify-center">
              <img src={logo} alt="OTAS Logo" className="w-8 h-8 object-cover" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 h-10">
                <img src={logo} alt="OTAS Logo" className="w-8 h-8 object-contain" />
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">OTAS<span className="text-primary">CRM</span></h1>
                  {/* <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Enterprise Edition</p> */}
                </div>
              </div>
              {/* Close button for mobile */}
              <button
                onClick={onClose}
                className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        <nav className="flex-1 mt-1 px-3 space-y-1 overflow-y-auto sidebar-scroll">

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              title={item.name}
              className={({ isActive }) =>
                `flex items-center rounded-xl transition-all duration-300 group relative ${collapsed ? 'justify-center px-0 py-3' : 'px-1 py-3'} ${isActive
                  ? collapsed
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-primary/10 text-primary font-medium'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && !collapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_8px_rgba(0,82,255,0.6)]" />
                  )}
                  <item.icon className={`w-5 h-5 transition-colors duration-300 ${collapsed ? '' : 'mr-3'} ${isActive ? (collapsed ? 'text-white' : 'text-primary') : 'text-slate-500 group-hover:text-slate-300'}`} />
                  {!collapsed && <span className="whitespace-nowrap overflow-hidden">{item.name}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
