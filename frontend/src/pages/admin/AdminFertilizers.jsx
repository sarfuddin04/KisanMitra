import React, { useState, useEffect } from 'react';
import { FlaskConical, Plus, Trash2, Edit3, X, IndianRupee, Upload, Image as ImageIcon, Clock, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const inputClass = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-amber-500";
const FERTILIZER_FALLBACK = 'https://images.unsplash.com/photo-1592022359155-a27d6c3d07e6?w=400&q=80';

export const AdminFertilizers = () => {
  const [fertilizers, setFertilizers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [priceModal, setPriceModal] = useState(null); // fertilizer object for price modal
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const emptyForm = {
    name: '', brand: '', category: 'Chemical',
    formula_or_ratio: '', nitrogen_pct: 0, phosphorus_pct: 0, potassium_pct: 0,
    suitable_crops: '', application_guidance: '', precautions: '',
    image_url: '', is_active: true
  };
  const [formData, setFormData] = useState(emptyForm);

  const [priceForm, setPriceForm] = useState({ price: '', unit: '50kg bag', notes: '', state: '', district: '' });
  const [priceLoading, setPriceLoading] = useState(false);

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

  useEffect(() => { fetchFertilizers(); }, []);

  const openCreate = () => { setEditingItem(null); setFormData(emptyForm); setIsModalOpen(true); };
  const openEdit = (item) => { setEditingItem(item); setFormData({ ...emptyForm, ...item }); setIsModalOpen(true); };
  const openPriceModal = (f) => { setPriceModal(f); setPriceForm({ price: f.current_price || '', unit: f.price_unit || '50kg bag', notes: '', state: '', district: '' }); };

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
      alert(err?.response?.data?.detail || "Failed to save fertilizer.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this fertilizer?")) {
      try { await api.delete(`/admin/fertilizers/${id}`); fetchFertilizers(); }
      catch { alert("Delete failed."); }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB.'); return; }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_type', 'fertilizers');
    try {
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData(p => ({ ...p, image_url: res.data.file_path || res.data.url }));
    } catch { alert('Upload failed.'); }
  };

  const handlePriceUpdate = async (e) => {
    e.preventDefault();
    if (!priceForm.price || parseFloat(priceForm.price) <= 0) { alert('Enter a valid price.'); return; }
    setPriceLoading(true);
    try {
      await api.put(`/admin/fertilizers/${priceModal.id}/price`, {
        price: parseFloat(priceForm.price),
        unit: priceForm.unit,
        notes: priceForm.notes,
        state: priceForm.state || null,
        district: priceForm.district || null,
      });
      setPriceModal(null);
      fetchFertilizers();
    } catch (err) {
      alert(err?.response?.data?.detail || 'Price update failed.');
    } finally {
      setPriceLoading(false);
    }
  };

  const getImg = (url) => {
    if (!url) return FERTILIZER_FALLBACK;
    return url.startsWith('http') ? url : `/api/static/${url}`;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <FlaskConical className="w-7 h-7 text-amber-400" />
            <span>Fertilizer Catalog & Pricing</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage fertilizers, NPK, images and manually enter retail prices</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5">
          <Plus className="w-4 h-4" /> <span>Add Fertilizer</span>
        </button>
      </div>

      {/* Price disclaimer banner */}
      <div className="bg-amber-950/40 border border-amber-900/60 rounded-2xl p-3 flex items-start gap-2.5 text-[11px] text-amber-300">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          <strong>Fertilizer prices are manually entered by Admin.</strong> No official live API exists for fertilizer retail pricing in India.
          All prices will be displayed to users as <em>"Price updated on: DATE"</em> — never as "LIVE".
        </span>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading fertilizers...</div>
        ) : fertilizers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-4 px-4">Image</th>
                  <th className="py-4 px-4">Fertilizer</th>
                  <th className="py-4 px-4">NPK</th>
                  <th className="py-4 px-4">Current Price</th>
                  <th className="py-4 px-4">Price Updated</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {fertilizers.map(f => (
                  <tr key={f.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <img src={getImg(f.image_url)} alt={f.name}
                        className="w-12 h-12 object-cover rounded-xl border border-slate-700"
                        onError={e => { e.target.src = FERTILIZER_FALLBACK; }} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{f.name}</div>
                      {f.brand && <div className="text-[10px] text-slate-500">{f.brand}</div>}
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-950 text-amber-400 rounded-md">{f.category}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-400 font-bold">
                      {f.formula_or_ratio || `${f.nitrogen_pct}-${f.phosphorus_pct}-${f.potassium_pct}`}
                    </td>
                    <td className="py-3 px-4">
                      {f.current_price ? (
                        <div>
                          <span className="font-extrabold text-emerald-400 text-sm">₹{f.current_price.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-slate-500 ml-1">/{f.price_unit || 'unit'}</span>
                          <div className="text-[10px] text-amber-600 mt-0.5">Admin Entry • Not Official</div>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Not set</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400">
                      {f.price_updated_at ? (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(f.price_updated_at)}</span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openPriceModal(f)}
                          className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/50 rounded-lg" title="Update Price">
                          <IndianRupee className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(f)}
                          className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-slate-800 rounded-lg" title="Edit">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(f.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 relative text-slate-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-black text-white">{editingItem ? `Edit: ${editingItem.name}` : 'Add Fertilizer'}</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Image</label>
                <div className="flex items-center gap-3">
                  {formData.image_url && (
                    <img src={getImg(formData.image_url)} alt="Preview" className="w-14 h-14 object-cover rounded-xl border border-slate-700"
                      onError={e => { e.target.src = FERTILIZER_FALLBACK; }} />
                  )}
                  <label className="cursor-pointer px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Upload Image
                    <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Name *</label>
                  <input required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Brand</label>
                  <input value={formData.brand || ''} onChange={e => setFormData(p => ({ ...p, brand: e.target.value }))} className={inputClass} placeholder="IFFCO, Coromandel..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} className={inputClass}>
                    <option value="Chemical">Chemical / Synthetic</option>
                    <option value="Organic">Organic / Compost</option>
                    <option value="Bio-Fertilizer">Bio-Fertilizer</option>
                    <option value="Micronutrient">Micronutrient</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">NPK Formula</label>
                  <input value={formData.formula_or_ratio || ''} onChange={e => setFormData(p => ({ ...p, formula_or_ratio: e.target.value }))} className={inputClass} placeholder="46-0-0" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">N%</label>
                  <input type="number" step="0.1" value={formData.nitrogen_pct} onChange={e => setFormData(p => ({ ...p, nitrogen_pct: parseFloat(e.target.value) || 0 }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">P%</label>
                  <input type="number" step="0.1" value={formData.phosphorus_pct} onChange={e => setFormData(p => ({ ...p, phosphorus_pct: parseFloat(e.target.value) || 0 }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">K%</label>
                  <input type="number" step="0.1" value={formData.potassium_pct} onChange={e => setFormData(p => ({ ...p, potassium_pct: parseFloat(e.target.value) || 0 }))} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Suitable Crops</label>
                <input value={formData.suitable_crops || ''} onChange={e => setFormData(p => ({ ...p, suitable_crops: e.target.value }))} className={inputClass} placeholder="Wheat, Rice, Maize..." />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Application Guidance</label>
                <textarea rows={2} value={formData.application_guidance || ''} onChange={e => setFormData(p => ({ ...p, application_guidance: e.target.value }))} className={`${inputClass} resize-none`} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Safety Precautions</label>
                <textarea rows={2} value={formData.precautions || ''} onChange={e => setFormData(p => ({ ...p, precautions: e.target.value }))} className={`${inputClass} resize-none`} />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 font-bold cursor-pointer">
                <input type="checkbox" checked={!!formData.is_active} onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))} />
                Active / Visible to Farmers
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-400 font-bold rounded-xl text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs">Save Fertilizer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Price Update Modal */}
      {priceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 relative">
            <button onClick={() => setPriceModal(null)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
              <X className="w-4 h-4" />
            </button>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-400" /> Update Price: {priceModal.name}
              </h3>
              <div className="mt-2 bg-amber-950/40 border border-amber-900/40 rounded-xl p-2.5 text-[11px] text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>This price will be shown as <strong>"Price updated on: DATE (Admin Entry)"</strong> — not as live or official data.</span>
              </div>
            </div>

            <form onSubmit={handlePriceUpdate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Price (₹) *</label>
                  <input required type="number" step="0.5" value={priceForm.price}
                    onChange={e => setPriceForm(p => ({ ...p, price: e.target.value }))} className={inputClass} placeholder="e.g. 1200" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Per Unit</label>
                  <select value={priceForm.unit} onChange={e => setPriceForm(p => ({ ...p, unit: e.target.value }))} className={inputClass}>
                    <option value="50kg bag">50kg bag</option>
                    <option value="kg">per kg</option>
                    <option value="liter">per liter</option>
                    <option value="25kg bag">25kg bag</option>
                    <option value="45kg bag">45kg bag</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">State (Optional)</label>
                <input value={priceForm.state} onChange={e => setPriceForm(p => ({ ...p, state: e.target.value }))} className={inputClass} placeholder="e.g. Uttar Pradesh" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Notes (Optional)</label>
                <input value={priceForm.notes} onChange={e => setPriceForm(p => ({ ...p, notes: e.target.value }))} className={inputClass} placeholder="e.g. MRP as of August 2026" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setPriceModal(null)} className="px-4 py-2 bg-slate-800 text-slate-400 font-bold rounded-xl text-xs">Cancel</button>
                <button type="submit" disabled={priceLoading} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs disabled:opacity-50">
                  {priceLoading ? 'Saving...' : 'Update Price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
