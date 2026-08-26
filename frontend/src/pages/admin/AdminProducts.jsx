import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Trash2, Search, CheckCircle2, XCircle,
  Edit3, X, MapPin, Upload, Image as ImageIcon, Plus,
  Eye, RefreshCw, Filter
} from 'lucide-react';
import api from '../../services/api';

const PRODUCT_FALLBACK = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80';
const inputClass = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500";

// ── Dependent location selector ────────────────────────────────
const LocationDropdowns = ({ form, setForm }) => {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [mandis, setMandis] = useState([]);

  useEffect(() => { api.get('/states').then(r => setStates(r.data || [])).catch(() => {}); }, []);
  useEffect(() => {
    setDistricts([]); setMandis([]);
    if (form.state_id) api.get(`/states/${form.state_id}/districts`).then(r => setDistricts(r.data || [])).catch(() => {});
  }, [form.state_id]);
  useEffect(() => {
    setMandis([]);
    if (form.district_id) api.get(`/districts/${form.district_id}/mandis`).then(r => setMandis(r.data || [])).catch(() => {});
  }, [form.district_id]);

  return (
    <div className="grid grid-cols-3 gap-2">
      <select value={form.state_id || ''} onChange={e => setForm(p => ({ ...p, state_id: e.target.value, district_id: '', mandi_id: '' }))} className={inputClass}>
        <option value="">State</option>
        {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <select value={form.district_id || ''} onChange={e => setForm(p => ({ ...p, district_id: e.target.value, mandi_id: '' }))} disabled={!form.state_id} className={`${inputClass} disabled:opacity-40`}>
        <option value="">District</option>
        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      <select value={form.mandi_id || ''} onChange={e => setForm(p => ({ ...p, mandi_id: e.target.value }))} disabled={!form.district_id} className={`${inputClass} disabled:opacity-40`}>
        <option value="">Mandi</option>
        {mandis.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
    </div>
  );
};

export const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      // Admin gets all products regardless of status
      const [pRes, cRes] = await Promise.all([
        api.get(`/admin/products?${params.toString()}`).catch(() => api.get(`/marketplace/products?limit=500&${params.toString()}`)),
        api.get('/marketplace/categories')
      ]);
      setProducts(pRes.data || []);
      setCategories(cRes.data || []);
    } catch (err) {
      console.error("Failed to load:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleApprove = async (id) => {
    try { await api.put(`/admin/products/${id}/approve`); fetchProducts(); }
    catch { alert('Approve failed.'); }
  };

  const handleReject = async (id) => {
    try { await api.put(`/admin/products/${id}/reject`); fetchProducts(); }
    catch { alert('Reject failed.'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Permanently delete this product?")) {
      try { await api.delete(`/admin/products/${id}`); fetchProducts(); }
      catch { alert("Delete failed."); }
    }
  };

  const openEdit = (p) => {
    setEditItem(p);
    setForm({
      name: p.name, description: p.description, price: p.price,
      unit: p.unit, stock_quantity: p.stock_quantity, location: p.location,
      image_url: p.image_url, is_available: p.is_available, is_organic: p.is_organic,
      category_id: p.category_id,
      state_id: p.state_id || '', district_id: p.district_id || '', mandi_id: p.mandi_id || '',
    });
    setEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/products/${editItem.id}`, {
        ...form,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        price: parseFloat(form.price),
        stock_quantity: parseFloat(form.stock_quantity),
        state_id: form.state_id ? parseInt(form.state_id) : null,
        district_id: form.district_id ? parseInt(form.district_id) : null,
        mandi_id: form.mandi_id ? parseInt(form.mandi_id) : null,
      });
      setEditModal(false);
      fetchProducts();
    } catch (err) {
      alert(err?.response?.data?.detail || 'Update failed.');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB.'); return; }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_type', 'products');
    try {
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(p => ({ ...p, image_url: res.data.file_path || res.data.url }));
    } catch { alert('Upload failed.'); }
  };

  const getImg = (url) => {
    if (!url) return PRODUCT_FALLBACK;
    return url.startsWith('http') ? url : `/api/static/${url}`;
  };

  const filtered = statusFilter ? products.filter(p => (p.status || 'PENDING') === statusFilter) : products;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <ShoppingBag className="w-7 h-7 text-emerald-400" />
            <span>Marketplace Products & Moderation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Approve, edit, reject or delete farmer product listings</p>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchProducts()}
            placeholder="Search products, sellers, mandi..."
            className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 text-xs rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500 w-full" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700 text-xs rounded-xl text-slate-300">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button onClick={fetchProducts} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-xl flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading products...</div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-4 px-4">Image</th>
                  <th className="py-4 px-4">Product</th>
                  <th className="py-4 px-4">Seller</th>
                  <th className="py-4 px-4">Price</th>
                  <th className="py-4 px-4">Location / Mandi</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <img src={getImg(p.image_url)} alt={p.name}
                        className="w-14 h-14 object-cover rounded-xl border border-slate-700"
                        onError={e => { e.target.src = PRODUCT_FALLBACK; }} />
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-white block text-sm">{p.name}</span>
                      <span className="text-[10px] text-slate-500">{p.category_name} • {p.unit}</span>
                      {p.is_organic && <span className="ml-1 text-[10px] text-emerald-400">🌱 Organic</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{p.seller_name || '—'}</td>
                    <td className="py-3 px-4 font-extrabold text-emerald-400 text-sm">
                      ₹{(p.price || 0).toLocaleString('en-IN')}
                      <span className="text-[10px] text-slate-500 font-normal ml-1">/{p.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400">
                      {p.mandi_name && <div className="font-semibold text-slate-300">{p.mandi_name}</div>}
                      {[p.district_name, p.state_name].filter(Boolean).join(', ') || p.location || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-400' :
                        p.status === 'REJECTED' ? 'bg-red-950 text-red-400' :
                        'bg-amber-950 text-amber-400'
                      }`}>
                        {p.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.status !== 'APPROVED' && (
                          <button onClick={() => handleApprove(p.id)}
                            className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/50 rounded-lg" title="Approve">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {p.status !== 'REJECTED' && (
                          <button onClick={() => handleReject(p.id)}
                            className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-amber-950/50 rounded-lg" title="Reject">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => openEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-950/50 rounded-lg" title="Edit">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/50 rounded-lg" title="Delete">
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
          <div className="p-12 text-center text-xs text-slate-500">No products found.</div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && editItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-700 max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 relative">
            <button onClick={() => setEditModal(false)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-black text-white">Edit Product: {editItem.name}</h3>

            <form onSubmit={handleEdit} className="space-y-4">
              {/* Product Image */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Product Image</label>
                <div className="flex items-center gap-3">
                  {form.image_url && (
                    <img src={getImg(form.image_url)} alt="Preview"
                      className="w-16 h-16 object-cover rounded-xl border border-slate-700"
                      onError={e => { e.target.src = PRODUCT_FALLBACK; }} />
                  )}
                  <label className="cursor-pointer px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Upload New Image
                    <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {form.image_url && (
                    <button type="button" onClick={() => setForm(p => ({ ...p, image_url: '' }))}
                      className="text-[10px] text-red-400 hover:underline">Remove</button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Product Name *</label>
                <input required value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <select value={form.category_id || ''} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} className={inputClass}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Price (₹)</label>
                  <input type="number" step="0.5" value={form.price || ''} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Unit</label>
                  <select value={form.unit || 'kg'} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} className={inputClass}>
                    <option value="kg">kg</option><option value="quintal">Quintal</option>
                    <option value="ton">Ton</option><option value="bag">Bag</option><option value="piece">Piece</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Stock Quantity</label>
                  <input type="number" value={form.stock_quantity || ''} onChange={e => setForm(p => ({ ...p, stock_quantity: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Location (text)</label>
                  <input value={form.location || ''} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className={inputClass} />
                </div>
              </div>

              {/* Location dropdowns */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">State / District / Mandi</label>
                <LocationDropdowns form={form} setForm={setForm} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
                <textarea rows={2} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={`${inputClass} resize-none`} />
              </div>

              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 text-slate-300 font-bold cursor-pointer">
                  <input type="checkbox" checked={!!form.is_available} onChange={e => setForm(p => ({ ...p, is_available: e.target.checked }))} />
                  Available
                </label>
                <label className="flex items-center gap-1.5 text-emerald-400 font-bold cursor-pointer">
                  <input type="checkbox" checked={!!form.is_organic} onChange={e => setForm(p => ({ ...p, is_organic: e.target.checked }))} />
                  🌱 Organic
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setEditModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
