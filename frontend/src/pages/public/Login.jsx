import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const Login = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
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
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-emerald-100 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-600/20">
            <Sprout className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Sign In to KisanMitra AI</h2>
          <p className="text-xs text-gray-500">Access your intelligent farming portal & AI advisory</p>
        </div>

        {/* Demo Login Shortcuts */}
        <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/80 space-y-2">
          <p className="text-[11px] font-bold text-emerald-900 text-center uppercase tracking-wider">
            Quick One-Click Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('farmer@kisanmitra.ai', 'Farmer@123')}
              className="px-2.5 py-1.5 bg-white hover:bg-emerald-100/70 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Farmer Demo</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@kisanmitra.ai', 'Admin@123')}
              className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100/70 text-purple-900 border border-purple-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Admin Demo</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs flex items-center space-x-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                placeholder="farmer@kisanmitra.ai"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100 text-xs text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-emerald-700 hover:underline">
            Register as a Farmer
          </Link>
        </div>

      </div>
    </div>
  );
};
