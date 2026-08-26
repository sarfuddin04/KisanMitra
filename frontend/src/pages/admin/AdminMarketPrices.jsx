import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Trash2, Edit3, X, ArrowUpRight, ArrowDownRight, Minus, Building2, Globe, Map } from 'lucide-react';
import api from '../../services/api';

const inputClass = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500";

const TrendBadge = ({ trend, change }) => {
  const map = {
    UP: { cls: 'bg-emerald-950 text-emerald-300', icon: <ArrowUpRight className="w-3 h-3" /> },
    DOWN: { cls: 'bg-red-950 text-red-300', icon: <ArrowDownRight className="w-3 h-3" /> },
    STABLE: { cls: 'bg-slate-800 text-slate-400', icon: <Minus className="w-3 h-3" /> },
  };
  const t = map[trend] || map.STABLE;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${t.cls}`}>
      {t.icon} {trend} {change !== undefined && `(${change}%)`}
    </span>
  );
};

// Dependent dropdown component for mandi selection
const MandiSelector = ({ form, setForm }) => {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [mandis, setMandis] = useState([]);

  useEffect(() => {
    api.get('/states').then(r => setStates(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (form._state_id) {
      api.get(`/states/${form._state_id}/districts`).then(r => setDistricts(r.data || [])).catch(() => setDistricts([]));
      setForm(prev => ({ ...prev, _district_id: '', mandi_id: '' }));
    }
  }, [form._state_id]);

  useEffect(() => {
    if (form._district_id) {
      api.get(`/districts/${form._district_id}/mandis`).then(r => setMandis(r.data || [])).catch(() => setMandis([]));
      setForm(prev => ({ ...prev, mandi_id: '' }));
    }
  }, [form._district_id]);

  return (
    <div className="col-span-2 grid grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1">State *</label>
        <select className={inputClass} value={form._state_id || ''} onChange={e => setForm(prev => ({ ...prev, _state_id: e.target.value }))}>
          <option value="">Select State...</option>
          {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1">District *</label>
        <select className={inputClass} value={form._district_id || ''} onChange={e => setForm(prev => ({ ...prev, _district_id: e.target.value }))} disabled={!form._state_id}>
          <option value="">Select District...</option>
          {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1">Mandi *</label>
        <select className={inputClass} value={form.mandi_id || ''} onChange={e => setForm(prev => ({ ...prev, mandi_id: e.target.value }))} disabled={!form._district_id}>
          <option value="">Select Mandi...</option>
          {mandis.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
    </div>
  );
};

// Crop selector from database
const CropSelector = ({ form, setForm, crops }) => (
  <div>
    <label className="block text-xs font-bold text-slate-300 mb-1">Crop / Commodity *</label>
    <select className={inputClass} value={form.crop_id || ''} onChange={e => {
      const crop = crops.find(c => String(c.id) === String(e.target.value));
      setForm(prev => ({ ...prev, crop_id: e.target.value, crop_name: crop?.name || '' }));
    }}>
      <option value="">Select Crop...</option>
      {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
    {/* Manual override */}
    <input className={`${inputClass} mt-2`} value={form.crop_name || ''} placeholder="Or type crop name manually..."
      onChange={e => setForm(prev => ({ ...prev, crop_name: e.target.value, crop_id: '' }))} />
  </div>
);


export const AdminMarketPrices = () => {
  const [prices, setPrices] = useState([]);
  const [crops, setCrops] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const emptyForm = () => ({
    _state_id: '', _district_id: '',
    mandi_id: '', crop_id: '', crop_name: 'Wheat',
    variety: 'Standard FAQ',
    min_price: 2200.0, max_price: 2450.0, modal_price: 2350.0,
    unit: '₹/Quintal', trend: 'UP', change_percent: 2.5
  });

  const [formData, setFormData] = useState(emptyForm());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        api.get('/admin/market-prices'),
        api.get('/crops')
      ]);
      setPrices(pRes.data || []);
      setCrops(cRes.data || []);
    } catch (err) {
      console.error("Failed to load:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData(emptyForm());
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      ...item,
      _state_id: '',
      _district_id: '',
      crop_id: item.crop_id || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mandi_id && !formData.market_id) {
      alert('Please select a Mandi.');
      return;
    }
    try {
      const payload = {
        crop_name: formData.crop_name,
        crop_id: formData.crop_id ? parseInt(formData.crop_id) : null,
        mandi_id: formData.mandi_id ? parseInt(formData.mandi_id) : null,
        variety: formData.variety,
        min_price: parseFloat(formData.min_price),
        max_price: parseFloat(formData.max_price),
        modal_price: parseFloat(formData.modal_price),
        unit: formData.unit,
        trend: formData.trend,
        change_percent: parseFloat(formData.change_percent) || 0,
      };
      if (editingItem) {
        await api.put(`/admin/market-prices/${editingItem.id}`, payload);
      } else {
        await api.post('/admin/market-prices', payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to save market price entry.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this price entry?')) {
      try { await api.delete(`/admin/market-prices/${id}`); fetchData(); } catch {
        alert('Failed to delete.');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-emerald-400" />
            Mandi Rates & Commodity Prices
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Daily APMC mandi prices linked to State → District → Mandi hierarchy
          </p>
        </div>
        <button onClick={openCreateModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Price Entry
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
                  <th className="py-4 px-4">Commodity</th>
                  <th className="py-4 px-4">Mandi</th>
                  <th className="py-4 px-4">District / State</th>
                  <th className="py-4 px-4">Price Range</th>
                  <th className="py-4 px-4">Modal Rate</th>
                  <th className="py-4 px-4">Trend</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {prices.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white text-sm">
                      {p.crop_name || p.crop_display_name}
                      <span className="text-[10px] text-slate-500 block font-normal">{p.variety}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-semibold">
                      {p.mandi_name || p.market_name || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      <span>{p.district_name || p.district}</span>
                      {(p.state_name || p.state) && <span className="block text-slate-500">{p.state_name || p.state}</span>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">₹{p.min_price} – ₹{p.max_price}</td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-400 text-sm">
                      ₹{p.modal_price} <span className="text-[10px] text-slate-500 font-normal">/ {p.unit}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <TrendBadge trend={p.trend} change={p.change_percent} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button onClick={() => openEditModal(p)} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">
            No prices registered. Add your first mandi price entry.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 relative text-slate-200 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white">
              {editingItem ? 'Edit Price Entry' : 'New Mandi Price Entry'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Location dropdowns */}
              <MandiSelector form={formData} setForm={setFormData} />

              {/* Fallback mandi name for existing records */}
              {(editingItem?.market_name || editingItem?.mandi_name) && (
                <div className="bg-slate-800/50 rounded-xl px-3 py-2 text-[11px] text-slate-400">
                  <span className="text-slate-300 font-semibold">Current mandi:</span> {editingItem.mandi_name || editingItem.market_name}
                  {(editingItem.state_name || editingItem.state) && ` — ${editingItem.state_name || editingItem.state}`}
                  <span className="text-slate-500 ml-2">(Use dropdowns above to change)</span>
                </div>
              )}

              {/* Crop */}
              <CropSelector form={formData} setForm={setFormData} crops={crops} />

              {/* Variety */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Variety</label>
                <input type="text" className={inputClass} value={formData.variety || ''} placeholder="e.g. HD-2967, Standard FAQ..."
                  onChange={e => setFormData(prev => ({ ...prev, variety: e.target.value }))} />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Min Price (₹)</label>
                  <input type="number" className={inputClass} value={formData.min_price}
                    onChange={e => setFormData(prev => ({ ...prev, min_price: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Max Price (₹)</label>
                  <input type="number" className={inputClass} value={formData.max_price}
                    onChange={e => setFormData(prev => ({ ...prev, max_price: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Modal Price (₹)</label>
                  <input type="number" className={`${inputClass} font-bold text-emerald-400`} value={formData.modal_price}
                    onChange={e => setFormData(prev => ({ ...prev, modal_price: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>

              {/* Unit, Trend, Change% */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Unit</label>
                  <select className={inputClass} value={formData.unit}
                    onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}>
                    <option>₹/Quintal</option>
                    <option>₹/Kg</option>
                    <option>₹/Tonne</option>
                    <option>₹/Dozen</option>
                    <option>₹/Bag</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Market Trend</label>
                  <select className={inputClass} value={formData.trend}
                    onChange={e => setFormData(prev => ({ ...prev, trend: e.target.value }))}>
                    <option value="UP">UP (Bullish)</option>
                    <option value="DOWN">DOWN (Bearish)</option>
                    <option value="STABLE">STABLE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Change %</label>
                  <input type="number" step="0.1" className={inputClass} value={formData.change_percent}
                    onChange={e => setFormData(prev => ({ ...prev, change_percent: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 font-bold rounded-xl text-xs">Cancel</button>
                <button type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md">
                  Save Price Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
