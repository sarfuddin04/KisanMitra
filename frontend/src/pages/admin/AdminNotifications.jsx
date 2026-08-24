import React, { useState } from 'react';
import { Bell, Send, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import api from '../../services/api';

export const AdminNotifications = () => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    notification_type: 'BROADCAST',
    link: '/crop-recommendation'
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await api.post('/admin/notifications/broadcast', formData);
      setSuccess(true);
      setFormData({
        title: '',
        message: '',
        notification_type: 'BROADCAST',
        link: '/crop-recommendation'
      });
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to broadcast notification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <Bell className="w-7 h-7 text-purple-400" />
          <span>Broadcast Farmer Alerts & Advisories</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Send real-time alerts, seasonal pest warnings, or market updates to all registered farmers
        </p>
      </div>

      <div className="bg-slate-900/80 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-md space-y-6">
        
        {success && (
          <div className="p-4 bg-emerald-950/80 text-emerald-300 rounded-2xl text-xs flex items-center space-x-2 border border-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Broadcast sent successfully to all active farmers!</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-950/80 text-red-300 rounded-2xl text-xs flex items-center space-x-2 border border-red-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleBroadcast} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Broadcast Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-hidden font-semibold"
              placeholder="e.g. ⚠️ Urgent: Kharif Rice Stem Borer Advisory for North India"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Notification Category</label>
              <select
                value={formData.notification_type}
                onChange={(e) => setFormData({ ...formData, notification_type: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="BROADCAST">BROADCAST (General Announcement)</option>
                <option value="ALERT">ALERT (Pest / Severe Weather Warning)</option>
                <option value="TIP">TIP (Agricultural Best Practice)</option>
                <option value="ORDER">MARKET (Mandi / Trade Update)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">In-App Target Route</label>
              <input
                type="text"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                placeholder="/crop-recommendation"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Advisory Message Content *</label>
            <textarea
              rows={4}
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-hidden resize-none leading-relaxed"
              placeholder="Provide clear agricultural context, preventive spray dosages, or market opportunities..."
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Transmitting Broadcast...' : 'Broadcast to All Farmers'}</span>
            </button>
          </div>
        </form>

      </div>

    </div>
  );
};
