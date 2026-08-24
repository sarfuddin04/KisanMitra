import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, AlertCircle, Shield, Sliders } from 'lucide-react';
import api from '../../services/api';

export const AdminSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data || {});
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      await api.put('/admin/settings', settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save system settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <Settings className="w-7 h-7 text-purple-400" />
          <span>System Settings & Operational Configurations</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure dynamic application metadata, farmer helpline numbers, and platform feature flags
        </p>
      </div>

      <div className="bg-slate-900/80 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-md space-y-6">
        
        {success && (
          <div className="p-4 bg-emerald-950/80 text-emerald-300 rounded-2xl text-xs flex items-center space-x-2 border border-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>System configurations updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-950/80 text-red-300 rounded-2xl text-xs flex items-center space-x-2 border border-red-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider pb-2 border-b border-slate-800">
              General Application Metadata
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Platform Name</label>
                <input
                  type="text"
                  value={settings.app_name || 'KisanMitra AI'}
                  onChange={(e) => handleChange('app_name', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Official Tagline</label>
                <input
                  type="text"
                  value={settings.app_tagline || 'Your Intelligent Farming Companion'}
                  onChange={(e) => handleChange('app_tagline', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Support Contact Email</label>
                <input
                  type="email"
                  value={settings.contact_email || 'support@kisanmitra.ai'}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Farmer Toll-Free Helpline</label>
                <input
                  type="text"
                  value={settings.helpline_number || '1800-180-1551'}
                  onChange={(e) => handleChange('helpline_number', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider pb-2 border-b border-slate-800">
              Feature Flags & Platform Controls
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-4 bg-slate-800/60 rounded-2xl border border-slate-700/80 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-white">Enable AI Agronomist Chat</p>
                  <p className="text-[11px] text-slate-400">Allows farmers to interact with the LLM conversational assistant</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enable_ai_assistant !== false}
                  onChange={(e) => handleChange('enable_ai_assistant', e.target.checked)}
                  className="rounded-md text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-800/60 rounded-2xl border border-slate-700/80 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-white">Enable Farmer Marketplace</p>
                  <p className="text-[11px] text-slate-400">Allows trade and ordering of seeds, produce, and tools</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enable_marketplace !== false}
                  onChange={(e) => handleChange('enable_marketplace', e.target.checked)}
                  className="rounded-md text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save System Configurations'}</span>
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};
