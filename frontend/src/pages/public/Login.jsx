import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sprout,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Cpu,
  HelpCircle,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const Login = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => {
    return localStorage.getItem('kisanmitra_remembered_email') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return Boolean(localStorage.getItem('kisanmitra_remembered_email'));
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const userData = await login(cleanEmail, password);

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('kisanmitra_remembered_email', cleanEmail);
      } else {
        localStorage.removeItem('kisanmitra_remembered_email');
      }

      setSuccessMsg('Authentication successful! Directing to your portal...');

      setTimeout(() => {
        if (userData.role === 'ADMIN' || userData.role_name === 'ADMIN') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }, 700);
    } catch (err) {
      console.error('Login error:', err);
      const detail = err.response?.data?.detail;
      let msg = 'Invalid email or password. Please verify your credentials and try again.';
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

  return (
    <div className="min-h-[88vh] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white rounded-3xl border border-emerald-100 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* LEFT COLUMN: KisanMitra AI Brand & Feature Showcase (Split-screen on desktop) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle decorative background circles */}
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand */}
          <div className="space-y-4 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center text-emerald-950 shadow-lg shadow-emerald-500/20">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white">KisanMitra AI</h1>
                <p className="text-[11px] font-semibold text-emerald-300 tracking-wide">
                  Your Intelligent Farming Companion
                </p>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <span className="inline-flex items-center space-x-1.5 bg-emerald-700/50 border border-emerald-500/30 text-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs">
                <Sparkles className="w-3 h-3 text-emerald-300" />
                <span>Next-Gen Agricultural Intelligence</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                Empowering Indian Farmers with Real-Time AI.
              </h2>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                Log in to access precision crop analytics, instant disease diagnosis, APMC mandi rates, and specialized advisory services.
              </p>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="my-6 space-y-2.5 relative z-10">
            <div className="flex items-start space-x-3 bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xs">
              <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-white">Multi-Crop Machine Learning</h3>
                <p className="text-[11px] text-emerald-200/70">ICAR agronomic parameters tailored to your soil</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xs">
              <TrendingUp className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-white">Live Mandi Market Intelligence</h3>
                <p className="text-[11px] text-emerald-200/70">Real-time daily arrival prices across major APMC hubs</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-white">PostgreSQL & JWT Secured</h3>
                <p className="text-[11px] text-emerald-200/70">Encrypted farm parameters and authenticated access</p>
              </div>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="pt-4 border-t border-white/10 text-[11px] text-emerald-300/80 flex items-center justify-between relative z-10">
            <span>Verified Agro-AI Portal</span>
            <span className="font-semibold text-white">Version 2.0</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Professional Login Form */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center space-y-6">
          
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Enter your registered farmer or administrator credentials to proceed.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-red-50 text-red-700 rounded-2xl text-xs flex items-center space-x-2.5 border border-red-200 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl text-xs flex items-center space-x-2.5 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all bg-white hover:border-gray-400"
                  placeholder="name@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all bg-white hover:border-gray-400"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-hidden p-0.5"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md text-emerald-600 border-gray-300 focus:ring-emerald-500 focus:ring-offset-0"
                />
                <span className="font-semibold text-gray-600">Remember my email</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || Boolean(successMsg)}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : successMsg ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Success! Redirecting...</span>
                </>
              ) : (
                <>
                  <span>Sign In to KisanMitra</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Prompt */}
          <div className="text-center pt-4 border-t border-gray-100 text-xs text-gray-600">
            Don't have a KisanMitra account?{' '}
            <Link
              to="/register"
              className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center space-x-1"
            >
              <span>Register as a Farmer</span>
              <ArrowRight className="w-3 h-3 inline" />
            </Link>
          </div>

        </div>

      </div>

      {/* Forgot Password Helper Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 border border-emerald-100 shadow-2xl relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-gray-900">Password Recovery</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                For security and verified farmer account protection, password resets are processed via your registered phone number or administrative support desk.
              </p>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <p className="font-bold">National Kisan Helpline Support:</p>
              <p className="text-[11px] text-emerald-800">Toll-Free: 1800-180-1551</p>
              <p className="text-[11px] text-emerald-800">Support Desk: support@kisanmitra.ai</p>
            </div>

            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all"
            >
              Understood, Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
