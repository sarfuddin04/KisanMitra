import React, { useState, useEffect } from 'react';
import { Image, Plus, Trash2, Edit3, X, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    cta_text: 'Explore Features',
    cta_link: '/crop-recommendation',
    display_order: 1,
    is_active: true
  });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/banners');
      setBanners(res.data || []);
    } catch (err) {
      console.error("Failed to load banners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      cta_text: 'Explore Features',
      cta_link: '/crop-recommendation',
      display_order: banners.length + 1,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/admin/banners/${editingItem.id}`, formData);
      } else {
        await api.post('/admin/banners', formData);
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (err) {
      alert("Failed to save banner.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this homepage banner?")) {
      try {
        await api.delete(`/admin/banners/${id}`);
        fetchBanners();
      } catch (err) {
        alert("Failed to delete banner.");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Image className="w-7 h-7 text-pink-400" />
            <span>Homepage Banners & Seasonal Hero Promos</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Customize announcements, hero banners, and seasonal call-to-actions on the public homepage
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Hero Banner</span>
        </button>
      </div>

      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading banners...</div>
        ) : banners.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-4 px-6">Order</th>
                  <th className="py-4 px-6">Headline Title</th>
                  <th className="py-4 px-6">Button CTA</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {banners.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-mono text-pink-400 font-bold">{b.display_order}</td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-white text-sm block">{b.title}</span>
                      <span className="text-[10px] text-slate-500">{b.subtitle}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      <span className="px-2 py-0.5 bg-slate-800 rounded-md text-[10px]">{b.cta_text} → {b.cta_link}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        b.is_active ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {b.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(b)}
                        className="p-1.5 text-slate-400 hover:text-pink-400 hover:bg-slate-800 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">No banners configured.</div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 relative text-slate-200 animate-in fade-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white">
              {editingItem ? 'Edit Banner' : 'Create Banner'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Headline Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Target Link</label>
                  <input
                    type="text"
                    value={formData.cta_link}
                    onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
