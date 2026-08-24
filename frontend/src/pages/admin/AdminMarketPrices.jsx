import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Trash2, Edit3, X, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import api from '../../services/api';

export const AdminMarketPrices = () => {
  const [prices, setPrices] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    market_id: '',
    crop_name: 'Wheat',
    variety: 'Standard FAQ',
    min_price: 2200.0,
    max_price: 2450.0,
    modal_price: 2350.0,
    unit: 'quintal',
    trend: 'UP',
    change_percent: 2.5
  });

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const [pRes, mRes] = await Promise.all([
        api.get('/admin/market-prices'),
        api.get('/admin/markets')
      ]);
      setPrices(pRes.data || []);
      setMarkets(mRes.data || []);
      if (mRes.data && mRes.data.length > 0 && !formData.market_id) {
        setFormData(prev => ({ ...prev, market_id: mRes.data[0].id }));
      }
    } catch (err) {
      console.error("Failed to load prices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      market_id: markets[0]?.id || '',
      crop_name: 'Wheat',
      variety: 'Standard FAQ',
      min_price: 2200.0,
      max_price: 2450.0,
      modal_price: 2350.0,
      unit: 'quintal',
      trend: 'UP',
      change_percent: 2.5
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
      const payload = {
        ...formData,
        market_id: parseInt(formData.market_id)
      };
      if (editingItem) {
        await api.put(`/admin/market-prices/${editingItem.id}`, payload);
      } else {
        await api.post('/admin/market-prices', payload);
      }
      setIsModalOpen(false);
      fetchPrices();
    } catch (err) {
      alert("Failed to save market price entry.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this price rate?")) {
      try {
        await api.delete(`/admin/market-prices/${id}`);
        fetchPrices();
      } catch (err) {
        alert("Failed to delete price entry.");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <TrendingUp className="w-7 h-7 text-emerald-400" />
            <span>Mandi Rates & Commodity Ticker Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Update daily APMC market prices, modal rates, and market trends across Indian states
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Mandi Price Entry</span>
        </button>
      </div>

      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading mandi rates...</div>
        ) : prices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-4 px-6">Commodity</th>
                  <th className="py-4 px-6">Mandi & State</th>
                  <th className="py-4 px-6">Price Range</th>
                  <th className="py-4 px-6">Modal Rate</th>
                  <th className="py-4 px-6">Trend</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {prices.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-white text-sm">
                      {p.crop_name} <span className="text-[10px] text-slate-500 block font-normal">{p.variety}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      {p.market_name} <span className="text-[10px] text-slate-500 block">{p.state}</span>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-400">₹{p.min_price} - ₹{p.max_price}</td>
                    <td className="py-4 px-6 font-extrabold text-emerald-400 text-sm">
                      ₹ {p.modal_price} <span className="text-[10px] text-slate-500 font-normal">/ {p.unit}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        p.trend === 'UP' ? 'bg-emerald-950 text-emerald-300' : p.trend === 'DOWN' ? 'bg-red-950 text-red-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {p.trend} ({p.change_percent}%)
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
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
          <div className="p-12 text-center text-xs text-slate-500">No prices registered.</div>
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
              {editingItem ? 'Edit Mandi Rate' : 'New Mandi Rate Entry'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Mandi Market *</label>
                  <select
                    value={formData.market_id}
                    onChange={(e) => setFormData({ ...formData, market_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    {markets.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.state})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Crop Commodity *</label>
                  <input
                    type="text"
                    required
                    value={formData.crop_name}
                    onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Min Price (₹)</label>
                  <input
                    type="number"
                    value={formData.min_price}
                    onChange={(e) => setFormData({ ...formData, min_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Max Price (₹)</label>
                  <input
                    type="number"
                    value={formData.max_price}
                    onChange={(e) => setFormData({ ...formData, max_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Modal Price (₹)</label>
                  <input
                    type="number"
                    value={formData.modal_price}
                    onChange={(e) => setFormData({ ...formData, modal_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Market Trend</label>
                  <select
                    value={formData.trend}
                    onChange={(e) => setFormData({ ...formData, trend: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="UP">UP (Bullish)</option>
                    <option value="DOWN">DOWN (Bearish)</option>
                    <option value="STABLE">STABLE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Change Percent (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.change_percent}
                    onChange={(e) => setFormData({ ...formData, change_percent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Save Mandi Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
