import React, { useState, useEffect } from 'react';
import { Sprout, Plus, Trash2, Edit3, X, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export const AdminCrops = () => {
  const [crops, setCrops] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    scientific_name: '',
    category: 'Cereal',
    season: 'Kharif',
    min_n: 60,
    max_n: 100,
    min_p: 35,
    max_p: 60,
    min_k: 35,
    max_k: 45,
    min_ph: 5.5,
    max_ph: 7.5,
    optimal_temp_c: '20-30',
    optimal_rainfall_mm: '100-200',
    duration_days: 120,
    description: '',
    cultivation_guide: '',
    is_active: true
  });

  const fetchCrops = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/crops');
      setCrops(res.data || []);
    } catch (err) {
      console.error("Failed to load crops:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  const openCreateModal = () => {
    setEditingCrop(null);
    setFormData({
      name: '',
      scientific_name: '',
      category: 'Cereal',
      season: 'Kharif',
      min_n: 60,
      max_n: 100,
      min_p: 35,
      max_p: 60,
      min_k: 35,
      max_k: 45,
      min_ph: 5.5,
      max_ph: 7.5,
      optimal_temp_c: '20-30',
      optimal_rainfall_mm: '100-200',
      duration_days: 120,
      description: '',
      cultivation_guide: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (crop) => {
    setEditingCrop(crop);
    setFormData({ ...crop });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCrop) {
        await api.put(`/admin/crops/${editingCrop.id}`, formData);
      } else {
        await api.post('/admin/crops', formData);
      }
      setIsModalOpen(false);
      fetchCrops();
    } catch (err) {
      alert("Failed to save crop.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this crop?")) {
      try {
        await api.delete(`/admin/crops/${id}`);
        fetchCrops();
      } catch (err) {
        alert("Failed to delete crop.");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Sprout className="w-7 h-7 text-emerald-400" />
            <span>Dynamic Crop Registry & Agronomy Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Add and update crops, soil NPK ranges, and cultivation guides that feed the ML recommendation models
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Crop</span>
        </button>
      </div>

      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading crops...</div>
        ) : crops.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-4 px-6">Crop Name</th>
                  <th className="py-4 px-6">Category & Season</th>
                  <th className="py-4 px-6">NPK Range (kg/ha)</th>
                  <th className="py-4 px-6">pH Range</th>
                  <th className="py-4 px-6">Duration</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {crops.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-white text-sm">
                      {c.name}
                      {c.scientific_name && <span className="text-[10px] text-slate-500 italic block font-normal">{c.scientific_name}</span>}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-md font-bold text-[10px]">
                        {c.category} • {c.season}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-400 text-[11px]">
                      N:{c.min_n}-{c.max_n} | P:{c.min_p}-{c.max_p} | K:{c.min_k}-{c.max_k}
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-mono">
                      {c.min_ph} - {c.max_ph}
                    </td>
                    <td className="py-4 px-6 text-slate-400">{c.duration_days} Days</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg"
                        title="Edit Crop"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg"
                        title="Delete Crop"
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
          <div className="p-12 text-center text-xs text-slate-500">No crops found.</div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[85vh] overflow-y-auto custom-scrollbar space-y-5 relative text-slate-200 animate-in fade-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white">
              {editingCrop ? `Edit Crop: ${editingCrop.name}` : 'Register New Crop'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Crop Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    placeholder="e.g. Soyabean"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Scientific Botanical Name</label>
                  <input
                    type="text"
                    value={formData.scientific_name}
                    onChange={(e) => setFormData({ ...formData, scientific_name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    placeholder="e.g. Glycine max"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="Cereal">Cereal</option>
                    <option value="Pulses">Pulses</option>
                    <option value="Oilseeds">Oilseeds</option>
                    <option value="Cash Crop">Cash Crop</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Vegetables">Vegetables</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Season</label>
                  <select
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="Kharif">Kharif (Monsoon)</option>
                    <option value="Rabi">Rabi (Winter)</option>
                    <option value="Zaid">Zaid (Summer)</option>
                    <option value="Year-round">Year-round</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Harvest Duration (Days)</label>
                  <input
                    type="number"
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 120 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">N Range (Min-Max)</label>
                  <div className="flex space-x-1">
                    <input type="number" value={formData.min_n} onChange={(e) => setFormData({ ...formData, min_n: parseFloat(e.target.value) })} className="w-1/2 p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs" />
                    <input type="number" value={formData.max_n} onChange={(e) => setFormData({ ...formData, max_n: parseFloat(e.target.value) })} className="w-1/2 p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">P Range (Min-Max)</label>
                  <div className="flex space-x-1">
                    <input type="number" value={formData.min_p} onChange={(e) => setFormData({ ...formData, min_p: parseFloat(e.target.value) })} className="w-1/2 p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs" />
                    <input type="number" value={formData.max_p} onChange={(e) => setFormData({ ...formData, max_p: parseFloat(e.target.value) })} className="w-1/2 p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">K Range (Min-Max)</label>
                  <div className="flex space-x-1">
                    <input type="number" value={formData.min_k} onChange={(e) => setFormData({ ...formData, min_k: parseFloat(e.target.value) })} className="w-1/2 p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs" />
                    <input type="number" value={formData.max_k} onChange={(e) => setFormData({ ...formData, max_k: parseFloat(e.target.value) })} className="w-1/2 p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Cultivation Guide & Agronomy Tips</label>
                <textarea
                  rows={3}
                  value={formData.cultivation_guide}
                  onChange={(e) => setFormData({ ...formData, cultivation_guide: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs resize-none"
                  placeholder="Sowing spacing, critical irrigation stages, and weed management..."
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  {editingCrop ? 'Save Changes' : 'Create Crop Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
