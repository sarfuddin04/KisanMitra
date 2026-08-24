import React, { useState } from 'react';
import { UserCheck, MapPin, Layers, Phone, Mail, Globe, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

export const ProfilePage = () => {
  const { user, updateUserData } = useAuth();
  const { language, setLanguage } = useLanguage();

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    farm_location: user?.profile?.farm_location || '',
    farm_size_acres: user?.profile?.farm_size_acres || 2.5,
    primary_crops: user?.profile?.primary_crops || '',
    soil_type: user?.profile?.soil_type || 'Alluvial Loam',
    irrigation_source: user?.profile?.irrigation_source || 'Borewell / Drip',
    state: user?.profile?.state || 'Uttar Pradesh',
    district: user?.profile?.district || 'Lucknow',
    preferred_language: user?.preferred_language || language,
    bio: user?.profile?.bio || ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await api.put('/auth/profile', formData);
      updateUserData(res.data);
      if (formData.preferred_language) {
        setLanguage(formData.preferred_language);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
          <UserCheck className="w-7 h-7 text-emerald-600" />
          <span>Farm Profile & Agronomic Parameters</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Keep your farm location, soil profile, and crop parameters updated for accurate AI recommendations
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
        
        {success && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Farm profile parameters updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs flex items-center space-x-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Farmer Full Name</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Farm Location / Mandi</label>
              <input
                type="text"
                value={formData.farm_location}
                onChange={(e) => setFormData({ ...formData, farm_location: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                placeholder="e.g. Bakshi Ka Talab"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">District</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                placeholder="Lucknow"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                placeholder="Uttar Pradesh"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Farm Size (Acres)</label>
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={formData.farm_size_acres}
                onChange={(e) => setFormData({ ...formData, farm_size_acres: parseFloat(e.target.value) || 1.0 })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Soil Type</label>
              <select
                value={formData.soil_type}
                onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-800 bg-white"
              >
                <option value="Alluvial Loam">Alluvial Loam</option>
                <option value="Black Cotton (Vertisol)">Black Cotton (Vertisol)</option>
                <option value="Red Sandy Soil">Red Sandy Soil</option>
                <option value="Clay Loam">Clay Loam</option>
                <option value="Laterite Soil">Laterite Soil</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Irrigation Source</label>
              <select
                value={formData.irrigation_source}
                onChange={(e) => setFormData({ ...formData, irrigation_source: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-800 bg-white"
              >
                <option value="Borewell & Drip">Borewell & Drip Irrigation</option>
                <option value="Canal Irrigation">Canal Irrigation</option>
                <option value="Tube-well">Tube-well</option>
                <option value="Rainfed Only">Rainfed Only (Monsoon)</option>
                <option value="Sprinkler">Sprinkler System</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Primary Crops Cultivated</label>
            <input
              type="text"
              value={formData.primary_crops}
              onChange={(e) => setFormData({ ...formData, primary_crops: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
              placeholder="e.g. Rice, Wheat, Mustard, Tomato"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Farm Bio / Farmer Notes</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none"
              placeholder="Tell us about your farming practices, organic certifications, or goals..."
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
