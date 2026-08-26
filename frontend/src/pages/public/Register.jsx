import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sprout,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Layers,
  Globe,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { CropSelector } from '../../components/CropSelector';

export const Register = () => {
  const { register } = useAuth();
  const { t, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    gender: 'male',
    farm_location: '',
    farm_size: 2.5,
    preferred_language: 'en',
    crop_ids: [2, 1] // Default selection: Wheat & Rice
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password strength calculation
  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score === 2 || score === 3) return { score: 2, label: 'Medium', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Validations
    if (!formData.full_name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    if (!formData.crop_ids || formData.crop_ids.length === 0) {
      setError('Please select at least one crop cultivated on your farm.');
      return;
    }

    const payload = {
      full_name: formData.full_name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim() || undefined,
      password: formData.password,
      confirm_password: formData.confirm_password,
      gender: formData.gender,
      farm_location: formData.farm_location.trim() || 'Not specified',
      farm_size: Number(formData.farm_size) || 1.0,
      preferred_language: formData.preferred_language,
      role_name: 'FARMER',
      crop_ids: formData.crop_ids
    };

    setLoading(true);
    try {
      await register(payload);
      if (formData.preferred_language) {
        setLanguage(formData.preferred_language);
      }
      setSuccessMsg('Registration successful! Setting up your farmer portal...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } catch (err) {
      console.error('Registration error:', err);
      const detail = err.response?.data?.detail;
      let msg = 'Registration failed. Please review the highlighted details and try again.';

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
    <div className="min-h-[90vh] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full bg-white rounded-3xl border border-emerald-100 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* LEFT COLUMN: KisanMitra AI Brand & Farmer Value Prop (Desktop Split-screen) */}
        <div className="lg:col-span-4 bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
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

            <div className="pt-2 space-y-2">
              <span className="inline-flex items-center space-x-1.5 bg-emerald-700/50 border border-emerald-500/30 text-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs">
                <Sparkles className="w-3 h-3 text-emerald-300" />
                <span>Free Farmer Registration</span>
              </span>
              <h2 className="text-xl font-extrabold text-white leading-tight">
                Unlock High-Yield AI Agricultural Intelligence.
              </h2>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                Join thousands of progressive Indian farmers utilizing precision agronomy, automated crop diagnosis, and real-time APMC mandi market prices.
              </p>
            </div>
          </div>

          {/* Farmer Benefits Checklist */}
          <div className="my-6 space-y-3 relative z-10 text-xs">
            <div className="flex items-center space-x-2.5 text-emerald-100">
              <div className="w-5 h-5 rounded-full bg-emerald-700/60 flex items-center justify-center text-emerald-300 shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span>Multi-crop recommendation engine</span>
            </div>

            <div className="flex items-center space-x-2.5 text-emerald-100">
              <div className="w-5 h-5 rounded-full bg-emerald-700/60 flex items-center justify-center text-emerald-300 shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span>Instant leaf photo disease detection</span>
            </div>

            <div className="flex items-center space-x-2.5 text-emerald-100">
              <div className="w-5 h-5 rounded-full bg-emerald-700/60 flex items-center justify-center text-emerald-300 shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span>Soil NPK fertilizer dosage scheduler</span>
            </div>

            <div className="flex items-center space-x-2.5 text-emerald-100">
              <div className="w-5 h-5 rounded-full bg-emerald-700/60 flex items-center justify-center text-emerald-300 shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span>Direct farmer-to-buyer marketplace</span>
            </div>
          </div>

          {/* Bottom Security Assurance */}
          <div className="pt-4 border-t border-white/10 text-[11px] text-emerald-300/80 flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Secure & Confidential</span>
            </div>
            <span>ICAR Grounded</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Full Farmer Registration Form */}
        <div className="lg:col-span-8 p-8 sm:p-10 flex flex-col justify-center space-y-6">
          
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Create Farmer Account
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Fill in your farm details and select your crops to customize your KisanMitra dashboard.
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
            
            {/* 1. Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all bg-white hover:border-gray-400"
                    placeholder="e.g. Rameshwar Singh"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all bg-white hover:border-gray-400"
                    placeholder="farmer@example.com"
                  />
                </div>
              </div>
            </div>

            {/* 2. Phone Number & Gender Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Mobile Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all bg-white hover:border-gray-400"
                    placeholder="e.g. 9811002233"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'male', label: 'Male' },
                    { key: 'female', label: 'Female' },
                    { key: 'other', label: 'Other' }
                  ].map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: g.key })}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border text-center ${
                        formData.gender === g.key
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Password & Confirm Password with Strength Indicator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all bg-white hover:border-gray-400"
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-hidden p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Bar */}
                {formData.password && (
                  <div className="mt-1.5 flex items-center space-x-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden flex space-x-0.5">
                      <div
                        className={`h-full ${
                          passwordStrength.score >= 1 ? passwordStrength.color : 'bg-transparent'
                        } transition-all duration-300`}
                        style={{ width: '33.3%' }}
                      />
                      <div
                        className={`h-full ${
                          passwordStrength.score >= 2 ? passwordStrength.color : 'bg-transparent'
                        } transition-all duration-300`}
                        style={{ width: '33.3%' }}
                      />
                      <div
                        className={`h-full ${
                          passwordStrength.score >= 3 ? passwordStrength.color : 'bg-transparent'
                        } transition-all duration-300`}
                        style={{ width: '33.3%' }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500">{passwordStrength.label}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all bg-white ${
                      formData.confirm_password && formData.password !== formData.confirm_password
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-gray-300 focus:border-emerald-500 hover:border-gray-400'
                    }`}
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-hidden p-0.5"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.confirm_password && formData.password === formData.confirm_password && (
                  <p className="text-[10px] font-semibold text-emerald-600 mt-1 flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Passwords match</span>
                  </p>
                )}
              </div>
            </div>

            {/* 4. Farm Location, Farm Size & Preferred Language */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Farm Location / District <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.farm_location}
                    onChange={(e) => setFormData({ ...formData, farm_location: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all bg-white hover:border-gray-400"
                    placeholder="e.g. Lucknow, UP"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Farm Size (Acres)
                </label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    value={formData.farm_size}
                    onChange={(e) =>
                      setFormData({ ...formData, farm_size: parseFloat(e.target.value) || 1.0 })
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all bg-white hover:border-gray-400"
                    placeholder="2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Preferred Language
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, preferred_language: 'en' })}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all ${
                      formData.preferred_language === 'en'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, preferred_language: 'hi' })}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all ${
                      formData.preferred_language === 'hi'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    हिन्दी
                  </button>
                </div>
              </div>
            </div>

            {/* 5. MULTI-CROP SELECTION (Image-based cards + removable tags) */}
            <div className="pt-2 border-t border-gray-100">
              <CropSelector
                selectedCropIds={formData.crop_ids}
                onChange={(newIds) => setFormData({ ...formData, crop_ids: newIds })}
                label="Select Your Cultivated Crops *"
                helperText="Select one or more crops cultivated on your farm to personalize agronomic recommendations and market prices."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || Boolean(successMsg)}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-4"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Your Account...</span>
                </>
              ) : successMsg ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{successMsg}</span>
                </>
              ) : (
                <>
                  <span>Complete Farmer Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Prompt */}
          <div className="text-center pt-3 border-t border-gray-100 text-xs text-gray-600">
            Already have a registered account?{' '}
            <Link
              to="/login"
              className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center space-x-1"
            >
              <span>Sign In Here</span>
              <ArrowRight className="w-3 h-3 inline" />
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Register;
