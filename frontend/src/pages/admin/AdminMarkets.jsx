import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit3, X } from 'lucide-react';
import api from '../../services/api';

export const AdminMarkets = () => {
  const [markets, setMarkets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    market_code: 'UP-LKO-01',
    is_active: true
  });

  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/markets');
      setMarkets(res.data || []);
    } catch (err) {
      console.error("Failed to load markets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      market_code: 'UP-LKO-01',
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
        await api.put(`/admin/markets/${editingItem.id}`, formData);
      } else {
        await api.post('/admin/markets', formData);
      }
      setIsModalOpen(false);
      fetchMarkets();
    } catch (err) {
      alert("Failed to save APMC market.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this APMC Mandi?")) {
      try {
        await api.delete(`/admin/markets/${id}`);
        fetchMarkets();
      } catch (err) {
        alert("Failed to delete market.");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <MapPin className="w-7 h-7 text-sky-400" />
            <span>APMC Mandi & Regional Market Registry</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Register and manage APMC agricultural produce market centers across states
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Register New APMC Mandi</span>
        </button>
      </div>

      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading APMC mandis...</div>
        ) : markets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-4 px-6">Mandi Name</th>
                  <th className="py-4 px-6">Market Code</th>
                  <th className="py-4 px-6">District & State</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {markets.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-white text-sm">{m.name}</td>
                    <td className="py-4 px-6 font-mono text-sky-400">{m.market_code}</td>
                    <td className="py-4 px-6 text-slate-300">{m.district}, {m.state}</td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-300">
                        Active
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(m)}
                        className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
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
          <div className="p-12 text-center text-xs text-slate-500">No markets registered.</div>
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
              {editingItem ? 'Edit Mandi' : 'Register New Mandi'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mandi Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  placeholder="e.g. Lucknow Mandi Samiti"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Market Code</label>
                <input
                  type="text"
                  value={formData.market_code}
                  onChange={(e) => setFormData({ ...formData, market_code: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">District</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
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
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Save Mandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
