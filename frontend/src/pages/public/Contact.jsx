import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/public/contact', formData);
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Get in Touch
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
          We're Here to Support Your Farming Journey
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Have questions regarding our AI models, marketplace integration, or agricultural research partnerships? Send us a message!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Info Col */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-tr from-emerald-800 to-teal-800 text-white p-8 rounded-3xl space-y-6 shadow-xl">
            <h3 className="text-2xl font-bold">Contact Information</h3>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Reach out to our agronomy support desk or visit our regional knowledge demonstration centers.
            </p>

            <div className="space-y-4 text-sm">
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-emerald-300 mt-0.5" />
                <div>
                  <p className="font-bold">National Kisan Helpline</p>
                  <p className="text-emerald-100">1800-180-1551 (Toll-Free, 24/7)</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-emerald-300 mt-0.5" />
                <div>
                  <p className="font-bold">Email Support</p>
                  <p className="text-emerald-100">support@kisanmitra.ai</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-emerald-300 mt-0.5" />
                <div>
                  <p className="font-bold">Agronomy Research Center</p>
                  <p className="text-emerald-100">Central Agronomy Hub, New Delhi / Lucknow Mandi Complex, UP</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Col */}
        <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-gray-200/80 shadow-xs">
          {success ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Message Received!</h3>
              <p className="text-gray-600 text-sm max-w-md mx-auto">
                Thank you for contacting KisanMitra AI. Our agronomy support team will review your inquiry and get back to you shortly.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition-all"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Send an Inquiry</h3>

              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-xs flex items-center space-x-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                    placeholder="e.g. Rameshwar Singh"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                    placeholder="farmer@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                    placeholder="e.g. Soil testing inquiry / Produce bulk sale"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Detailed Message *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden resize-none"
                  placeholder="How can our agronomy team help you?"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Submitting Message...' : 'Submit Inquiry'}</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
