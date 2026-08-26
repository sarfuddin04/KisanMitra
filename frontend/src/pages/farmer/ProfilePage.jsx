import React, { useState, useEffect } from 'react';
import { UserCheck, MapPin, Layers, Phone, Mail, Globe, Save, CheckCircle2, AlertCircle, Sprout } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { CropSelector } from '../../components/CropSelector';
import api from '../../services/api';

export const ProfilePage = () => {
  const { user, updateUserData } = useAuth();
  const { language, setLanguage } = useLanguage();

  const getInitialCropIds = () => {
    if (Array.isArray(user?.crop_ids) && user.crop_ids.length > 0) {
      return user.crop_ids;
    }
    if (Array.isArray(user?.crops) && user.crops.length > 0) {
      return user.crops.map((c) => c.id);
    }
    return [];
  };

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    gender: user?.gender || user?.profile?.gender || 'male',
    farm_location: user?.profile?.farm_location || '',
    farm_size_acres: user?.profile?.farm_size_acres || 2.5,
    primary_crops: user?.profile?.primary_crops || '',
    crop_ids: getInitialCropIds(),
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

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        full_name: user.full_name || prev.full_name,
        phone: user.phone || prev.phone,
        gender: user.gender || user.profile?.gender || prev.gender,
        farm_location: user.profile?.farm_location || prev.farm_location,
        farm_size_acres: user.profile?.farm_size_acres ?? prev.farm_size_acres,
        primary_crops: user.profile?.primary_crops || prev.primary_crops,
        crop_ids: user.crop_ids || (user.crops ? user.crops.map((c) => c.id) : prev.crop_ids),
        soil_type: user.profile?.soil_type || prev.soil_type,
        irrigation_source: user.profile?.irrigation_source || prev.irrigation_source,
        state: user.profile?.state || prev.state,
        district: user.profile?.district || prev.district,
        preferred_language: user.preferred_language || prev.preferred_language,
        bio: user.profile?.bio || prev.bio
      }));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const payload = {
        ...formData,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || undefined,
        farm_location: formData.farm_location.trim(),
        farm_size_acres: Number(formData.farm_size_acres) || 1.0,
        crop_ids: formData.crop_ids
      };

      const res = await api.put('/auth/profile', payload);
      updateUserData(res.data);
      if (formData.preferred_language) {
        setLanguage(formData.preferred_language);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      console.error("Profile update error:", err);
      const detail = err.response?.data?.detail;
      let msg = 'Failed to update farm profile.';
      if (typeof detail === 'string') msg = detail;
      else if (detail && typeof detail === 'object') msg = Object.values(detail).join(', ');
      setError(msg);
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
          Keep your farm location, cultivated crops, and soil profile updated for accurate AI advisories and commodity predictions.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
        
        {success && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl text-xs flex items-center space-x-2.5 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">Farm profile and cultivated crops updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-50 text-red-700 rounded-2xl text-xs flex items-center space-x-2.5 border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Personal & Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Farmer Full Name *</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Contact Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                placeholder="e.g. 9811002233"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Gender</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'male', label: 'Male' },
                  { key: 'female', label: 'Female' },
                  { key: 'other', label: 'Other' }
                ].map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: g.key })}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border text-center transition-all ${
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

          {/* Location Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Farm Location / Mandi</label>
              <input
                type="text"
                value={formData.farm_location}
                onChange={(e) => setFormData({ ...formData, farm_location: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                placeholder="e.g. Bakshi Ka Talab"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">District</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                placeholder="Lucknow"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                placeholder="Uttar Pradesh"
              />
            </div>
          </div>

          {/* Agronomic Conditions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Farm Size (Acres)</label>
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={formData.farm_size_acres}
                onChange={(e) =>
                  setFormData({ ...formData, farm_size_acres: parseFloat(e.target.value) || 1.0 })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Soil Type</label>
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
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Irrigation Source</label>
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

          {/* MULTI-CROP MANAGEMENT SELECTOR (Requirement 8) */}
          <div className="pt-4 border-t border-gray-100">
            <CropSelector
              selectedCropIds={formData.crop_ids}
              onChange={(newIds) => setFormData({ ...formData, crop_ids: newIds })}
              label="Cultivated Crops (Manage Farm Crops)"
              helperText="Add or remove crops from your farm profile. Changes update your dashboard advisories and marketplace notifications."
            />
          </div>

          {/* Farm Bio / Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Farm Bio / Farmer Notes</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none bg-white"
              placeholder="Tell us about your farming practices, organic certifications, or goals..."
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Farm Profile Changes</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};

export default ProfilePage;
