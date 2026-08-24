import React, { useState, useEffect } from 'react';
import { Lightbulb, Plus, Trash2, Edit3, X, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export const AdminTips = () => {
  const [tips, setTips] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Crop Management',
    summary: '',
    detailed_content: '',
    season: 'All Seasons',
    author: 'ICAR Agronomy Cell',
    is_published: true
  });

  const fetchTips = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/tips');
      setTips(res.data || []);
    } catch (err) {
      console.error("Failed to load tips:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTips();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'Crop Management',
      summary: '',
      detailed_content: '',
      season: 'All Seasons',
      author: 'ICAR Agronomy Cell',
      is_published: true
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
        await api.put(`/admin/tips/${editingItem.id}`, formData);
      } else {
        await api.post('/admin/tips', formData);
      }
      setIsModalOpen(false);
      fetchTips();
    } catch (err) {
      alert("Failed to save farming tip.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this farming tip?")) {
      try {
        await api.delete(`/admin/tips/${id}`);
        fetchTips();
      } catch (err) {
        alert("Failed to delete tip.");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Lightbulb className="w-7 h-7 text-amber-400" />
            <span>Farming Tips & Agronomic Advisory Guides</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Publish and manage seasonal Good Agricultural Practices (GAP) for farmer portals
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Tip</span>
        </button>
      </div>

      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading tips...</div>
        ) : tips.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-4 px-6">Tip Title</th>
                  <th className="py-4 px-6">Category & Season</th>
                  <th className="py-4 px-6">Author</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {tips.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-white text-sm max-w-sm truncate">{t.title}</td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded-md font-bold text-[10px]">
                        {t.category} • {t.season}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">{t.author}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        t.is_published ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {t.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
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
          <div className="p-12 text-center text-xs text-slate-500">No tips created.</div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 relative text-slate-200 animate-in fade-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white">
              {editingItem ? `Edit Tip: ${editingItem.title}` : 'Publish Farming Guide'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="Crop Management">Crop Management</option>
                    <option value="Irrigation">Irrigation</option>
                    <option value="Fertilizer">Fertilizer</option>
                    <option value="Pest Management">Pest Management</option>
                    <option value="Harvesting">Harvesting</option>
                    <option value="Soil Management">Soil Management</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Season</label>
                  <input
                    type="text"
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Summary (1-2 lines)</label>
                <textarea
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Detailed Content Guide</label>
                <textarea
                  rows={4}
                  value={formData.detailed_content}
                  onChange={(e) => setFormData({ ...formData, detailed_content: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs resize-none"
                />
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
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Save Guide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
