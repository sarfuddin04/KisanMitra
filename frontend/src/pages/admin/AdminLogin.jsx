import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN' || user.role_name === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        setError("Access denied: You do not have administrative privileges.");
      }
    } catch (err) {
      console.error('Admin login error:', err);
      const detail = err.response?.data?.detail;
      let msg = 'Invalid administrative credentials.';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map((d) => d.msg || d.detail || JSON.stringify(d)).join(', ');
      } else if (detail && typeof detail === 'object') {
        msg = Object.values(detail).join(', ') || JSON.stringify(detail);
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdmin = () => {
    setEmail('admin@kisanmitra.ai');
    setPassword('Admin@123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-2xl space-y-6 text-slate-100">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-purple-600/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">KisanMitra Admin Portal</h2>
          <p className="text-xs text-slate-400">Restricted administrative access & system control</p>
        </div>

        {/* Demo Quick Button */}
        <div className="bg-purple-950/60 p-3.5 rounded-2xl border border-purple-800/60 space-y-2">
          <p className="text-[11px] font-bold text-purple-300 text-center uppercase tracking-wider">
            Quick One-Click Admin Demo
          </p>
          <button
            type="button"
            onClick={handleQuickAdmin}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            Prefill Admin Credentials (admin@kisanmitra.ai)
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-950/60 text-red-300 rounded-xl text-xs flex items-center space-x-2 border border-red-800/80">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                placeholder="admin@kisanmitra.ai"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Admin Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Authenticating...' : 'Enter Admin Control Panel'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800 text-xs text-slate-500">
          <Link to="/" className="text-purple-400 hover:underline">
            ← Return to KisanMitra Public Website
          </Link>
        </div>

      </div>
    </div>
  );
};
