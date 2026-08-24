import React, { useState, useEffect } from 'react';
import { FlaskConical, Plus, Trash2, Edit3, X } from 'lucide-react';
import api from '../../services/api';

export const AdminFertilizers = () => {
  const [fertilizers, setFertilizers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Chemical',
    npk_ratio: '46:0:0',
    suitable_crops: 'Wheat, Rice, Maize, Mustard',
    dosage_guide: '50-100 kg / acre split in 2-3 top dressings',
    precautions: 'Do not apply on waterlogged fields.',
    is_active: true
  });

  const fetchFertilizers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/fertilizers');
      setFertilizers(res.data || []);
    } catch (err) {
      console.error("Failed to load fertilizers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFertilizers();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Chemical',
      npk_ratio: '46:0:0',
      suitable_crops: 'Wheat, Rice, Maize, Mustard',
      dosage_guide: '50-100 kg / acre split in 2-3 top dressings',
      precautions: 'Do not apply on waterlogged fields.',
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
        await api.put(`/admin/fertilizers/${editingItem.id}`, formData);
      } else {
        await api.post('/admin/fertilizers', formData);
      }
      setIsModalOpen(false);
      fetchFertilizers();
    } catch (err) {
      alert("Failed to save fertilizer.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this fertilizer?")) {
      try {
        await api.delete(`/admin/fertilizers/${id}`);
        fetchFertilizers();
      } catch (err) {
        alert("Failed to delete fertilizer.");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <FlaskConical className="w-7 h-7 text-amber-400" />
            <span>Fertilizer Master & Dosage Formulation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure chemical, organic, and bio-fertilizer catalogs and NPK application algorithms
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Fertilizer Product</span>
        </button>
      </div>

      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading fertilizers...</div>
        ) : fertilizers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-4 px-6">Fertilizer Name</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">NPK Ratio</th>
                  <th className="py-4 px-6">Suitable Crops</th>
                  <th className="py-4 px-6">Dosage Guide</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {fertilizers.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-white text-sm">{f.name}</td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded-md font-bold text-[10px]">
                        {f.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-amber-400 font-bold">{f.npk_ratio}</td>
                    <td className="py-4 px-6 text-slate-400 max-w-xs truncate">{f.suitable_crops}</td>
                    <td className="py-4 px-6 text-slate-400 max-w-xs truncate">{f.dosage_guide}</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(f)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
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
          <div className="p-12 text-center text-xs text-slate-500">No fertilizers registered.</div>
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
              {editingItem ? `Edit: ${editingItem.name}` : 'Add Fertilizer'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Fertilizer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    <option value="Chemical">Chemical / Synthetic</option>
                    <option value="Organic">Organic Compost / Manure</option>
                    <option value="Bio-Fertilizer">Bio-Fertilizer (Rhizobium, PSB)</option>
                    <option value="Micronutrient">Micronutrient (Zinc, Boron)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">NPK Ratio</label>
                  <input
                    type="text"
                    value={formData.npk_ratio}
                    onChange={(e) => setFormData({ ...formData, npk_ratio: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    placeholder="e.g. 19:19:19"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Suitable Crops</label>
                <input
                  type="text"
                  value={formData.suitable_crops}
                  onChange={(e) => setFormData({ ...formData, suitable_crops: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Dosage & Application Guide</label>
                <textarea
                  rows={2}
                  value={formData.dosage_guide}
                  onChange={(e) => setFormData({ ...formData, dosage_guide: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Safety Precautions</label>
                <textarea
                  rows={2}
                  value={formData.precautions}
                  onChange={(e) => setFormData({ ...formData, precautions: e.target.value })}
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
                  Save Fertilizer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
