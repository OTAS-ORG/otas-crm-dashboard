import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Lock, AlertCircle, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import logo from '../assets/otas.png';
import PixelBlast from '../components/PixelBlast';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const response = await axios.post(`${API_BASE}/api/auth/login`, {
        username,
        password,
      });
      // response.data is the wrapper { success, message, statusCode, data }
      login(response.data.data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-h-screen w-full flex bg-slate-950">
      {/* ===== LEFT: Pixel Blast Interactive Background Panel (White & Primary) ===== */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-white border-r border-slate-200">
        {/* PixelBlast WebGL Canvas Layer */}
        <div className="absolute inset-0 z-0 bg-white">
          <PixelBlast
            color="#3B82F6"
            pixelSize={3.5}
            patternScale={3.0}
            patternDensity={2.2}
            pixelSizeJitter={0.3}
            enableRipples={true}
            rippleIntensityScale={2.5}
            rippleThickness={0.14}
            rippleSpeed={0.45}
            speed={0.55}
            edgeFade={0.15}
            variant="square"
          />
        </div>

        {/* Ambient Subtle Glow & Readability Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-white/30 pointer-events-none z-1" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none z-1" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100/60 rounded-full blur-3xl pointer-events-none z-1" />

        {/* Content on top of Pixel Blast */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 h-full pointer-events-none">
          {/* Top Logo */}
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-center p-2 shadow-lg shadow-blue-500/10">
              <img src={logo} alt="OTAS Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">
                OTAS<span className="text-primary">CRM</span>
              </h1>
              <p className="text-[11px] uppercase font-black tracking-[0.25em] text-slate-700">
                Enterprise Edition
              </p>
            </div>
          </div>

          {/* Middle Typography */}
          <div className="my-auto py-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/90 border border-blue-300 text-blue-800 text-xs font-black mb-6 shadow-xs backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Interactive Next-Gen Workspace</span>
            </div>

            <h2 className="text-4xl xl:text-5xl font-black leading-tight mb-6 tracking-tight text-slate-950">
              Manage your entire
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-primary to-indigo-600 bg-clip-text text-transparent">
                client lifecycle
              </span>{' '}
              in one place.
            </h2>
            <p className="text-slate-800 text-base xl:text-lg max-w-md leading-relaxed font-semibold drop-shadow-2xs">
              Track leads, close deals, manage tickets, invoices, and support — all from a single high-performance platform.
            </p>
          </div>

          {/* Bottom Features Row */}
          <div className="space-y-3 pt-6 border-t border-slate-200/80">
            <div className="flex items-center gap-3.5 p-2 rounded-2xl bg-white/75 backdrop-blur-md border border-slate-200/80 shadow-2xs max-w-md">
              <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 shadow-2xs">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <p className="text-xs font-bold text-slate-900">Secure JWT Authentication & Audit Logs</p>
            </div>
            <div className="flex items-center gap-3.5 p-2 rounded-2xl bg-white/75 backdrop-blur-md border border-slate-200/80 shadow-2xs max-w-md">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0 shadow-2xs">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <p className="text-xs font-bold text-slate-900">Telegram Bot Notifications & Real-time Reminders</p>
            </div>
            <div className="flex items-center gap-3.5 p-2 rounded-2xl bg-white/75 backdrop-blur-md border border-slate-200/80 shadow-2xs max-w-md">
              <div className="w-9 h-9 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0 shadow-2xs">
                <ArrowRight className="w-4.5 h-4.5" />
              </div>
              <p className="text-xs font-bold text-slate-900">Role-based Access & Department Routing</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== RIGHT: Sign-in form panel ===== */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[#3B82F6] relative">
        {/* Subtle decorative background blur orbs for depth */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-white p-1.5 shadow-md flex items-center justify-center">
              <img src={logo} alt="OTAS Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">OTAS<span className="text-blue-100">CRM</span></h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">Welcome back 👋</h2>
            <p className="text-blue-100 text-sm font-medium">Sign in to access your dashboard.</p>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/20 border border-rose-200/40 rounded-2xl flex items-center text-white text-sm mb-6 backdrop-blur-sm shadow-sm">
              <AlertCircle className="w-5 h-5 mr-3 shrink-0 text-white" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Sign-in form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white mb-2">Username</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-200 pointer-events-none" />
                <input
                  required
                  type="text"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 text-white placeholder-blue-100/70 focus:outline-none focus:bg-white/25 focus:border-white focus:ring-4 focus:ring-white/20 transition-all font-medium text-sm shadow-sm"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white mb-2">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-200 pointer-events-none" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-11 pr-16 py-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 text-white placeholder-blue-100/70 focus:outline-none focus:bg-white/25 focus:border-white focus:ring-4 focus:ring-white/20 transition-all font-medium text-sm shadow-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-white hover:text-blue-100 transition-colors px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full mt-2 bg-white hover:bg-blue-50 active:scale-[0.99] text-blue-600 font-black text-sm py-3.5 px-4 rounded-2xl shadow-xl shadow-blue-900/20 hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-blue-100/80 font-medium mt-8">
            Contact system administrator if you lost your access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
