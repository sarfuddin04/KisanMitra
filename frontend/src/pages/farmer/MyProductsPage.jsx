import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit3, X, ShoppingBag, MapPin, Upload, Image as ImageIcon } from 'lucide-react';
import api from '../../services/api';

const PRODUCT_FALLBACK = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80';

export const MyProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Location hierarchy from DB
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [mandis, setMandis] = useState([]);

  const emptyForm = () => ({
    name: '', category_id: '', description: '', price: '',
    unit: 'kg', stock_quantity: '', location: '',
    is_organic: false, image_url: '',
    state_id: '', district_id: '', mandi_id: '',
  });

  const [formData, setFormData] = useState(emptyForm());

  // Load location data
  useEffect(() => {
    api.get('/states').then(r => setStates(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setDistricts([]); setMandis([]);
    setFormData(p => ({ ...p, district_id: '', mandi_id: '' }));
    if (formData.state_id) {
      api.get(`/states/${formData.state_id}/districts`).then(r => setDistricts(r.data || [])).catch(() => {});
    }
  }, [formData.state_id]);

  useEffect(() => {
    setMandis([]);
    setFormData(p => ({ ...p, mandi_id: '' }));
    if (formData.district_id) {
      api.get(`/districts/${formData.district_id}/mandis`).then(r => setMandis(r.data || [])).catch(() => {});
    }
  }, [formData.district_id]);

  const fetchMyProducts = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        api.get('/marketplace/my-products'),
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

  useEffect(() => { fetchMyProducts(); }, []);

  const openCreate = () => {
    setEditingProduct(null);
    setFormData(emptyForm());
    setIsModalOpen(true);
  };

  const openEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name || '', category_id: p.category_id || '',
      description: p.description || '', price: p.price || '',
      unit: p.unit || 'kg', stock_quantity: p.stock_quantity || '',
      location: p.location || '', is_organic: p.is_organic || false,
      image_url: p.image_url || '',
      state_id: p.state_id || '', district_id: p.district_id || '', mandi_id: p.mandi_id || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        price: parseFloat(formData.price) || 0,
        stock_quantity: parseFloat(formData.stock_quantity) || 0,
        state_id: formData.state_id ? parseInt(formData.state_id) : null,
        district_id: formData.district_id ? parseInt(formData.district_id) : null,
        mandi_id: formData.mandi_id ? parseInt(formData.mandi_id) : null,
      };
      if (editingProduct) {
        await api.put(`/marketplace/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/marketplace/products', payload);
      }
      setIsModalOpen(false);
      fetchMyProducts();
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to save product.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Remove this product listing?")) {
      try { await api.delete(`/marketplace/products/${id}`); fetchMyProducts(); }
      catch { alert("Failed to delete."); }
    }
  };

  // Image upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, PNG, WEBP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB.');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_type', 'products');
    try {
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData(p => ({ ...p, image_url: res.data.file_path || res.data.url }));
    } catch (err) {
      alert('Image upload failed.');
    }
  };

  const getImageUrl = (url) => {
    if (!url) return PRODUCT_FALLBACK;
    return url.startsWith('http') ? url : `/api/static/${url}`;
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
            <Package className="w-7 h-7 text-emerald-600" />
            <span>My Farm Produce & Listings</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">Manage your harvest crops listed on the marketplace</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5">
          <Plus className="w-4 h-4" /> <span>Sell New Product</span>
        </button>
      </div>

      {/* Products Grid */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading your listings...</div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {products.map(p => (
              <div key={p.id} className="rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-36 overflow-hidden relative">
                  <img src={getImageUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = PRODUCT_FALLBACK; }} />
                  <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    p.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                    p.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {p.status || 'PENDING'}
                  </span>
                </div>
                <div className="p-3.5 space-y-1.5">
                  <h3 className="font-bold text-sm text-gray-900">{p.name}</h3>
                  <p className="text-lg font-black text-emerald-700">₹{(p.price || 0).toLocaleString('en-IN')} <span className="text-[10px] text-gray-400 font-normal">/{p.unit}</span></p>
                  <p className="text-[11px] text-gray-500">Qty: {p.stock_quantity} {p.unit} • {p.category_name || 'General'}</p>
                  {(p.state_name || p.mandi_name) && (
                    <p className="text-[10px] text-gray-400 flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{[p.mandi_name, p.district_name, p.state_name].filter(Boolean).join(', ')}</span>
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <button onClick={() => openEdit(p)} className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] rounded-lg flex items-center justify-center space-x-1">
                      <Edit3 className="w-3 h-3" /> <span>Edit</span>
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="font-bold text-gray-700">No Produce Listed Yet</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">List your harvest to connect directly with buyers.</p>
            <button onClick={openCreate} className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md">
              Create First Listing
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-800 hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-xl font-black text-gray-900">{editingProduct ? 'Edit Product' : 'Sell New Product'}</h3>
              <p className="text-xs text-gray-500 mt-0.5">Fill in product details and select your mandi location</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Product Name *</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className={inputClass} placeholder="e.g. Sharbati Wheat (Grade-A)" />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                  <select value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} className={inputClass}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Unit</label>
                  <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className={inputClass}>
                    <option value="kg">kg</option><option value="quintal">Quintal</option>
                    <option value="ton">Ton</option><option value="bag">Bag</option>
                    <option value="packet">Packet</option><option value="piece">Piece</option>
                  </select>
                </div>
              </div>

              {/* Price & Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Price per Unit (₹) *</label>
                  <input required type="number" step="0.5" value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Available Quantity *</label>
                  <input required type="number" value={formData.stock_quantity}
                    onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})} className={inputClass} />
                </div>
              </div>

              {/* Location Dropdowns — from DB */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                  <select value={formData.state_id} onChange={(e) => setFormData({...formData, state_id: e.target.value})} className={inputClass}>
                    <option value="">Select State</option>
                    {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">District</label>
                  <select value={formData.district_id} onChange={(e) => setFormData({...formData, district_id: e.target.value})}
                    disabled={!formData.state_id} className={`${inputClass} disabled:opacity-50`}>
                    <option value="">Select District</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mandi</label>
                  <select value={formData.mandi_id} onChange={(e) => setFormData({...formData, mandi_id: e.target.value})}
                    disabled={!formData.district_id} className={`${inputClass} disabled:opacity-50`}>
                    <option value="">Select Mandi</option>
                    {mandis.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Product Image Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Product Image</label>
                <div className="flex items-center space-x-3">
                  {formData.image_url && (
                    <img src={getImageUrl(formData.image_url)} alt="Preview" className="w-16 h-16 object-cover rounded-xl border"
                      onError={(e) => { e.target.src = PRODUCT_FALLBACK; }} />
                  )}
                  <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                    <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={`${inputClass} resize-none`} placeholder="Quality, harvest date, notes..." />
              </div>

              {/* Organic */}
              <label className="flex items-center space-x-2 text-xs font-bold text-emerald-800 cursor-pointer">
                <input type="checkbox" checked={formData.is_organic}
                  onChange={(e) => setFormData({...formData, is_organic: e.target.checked})}
                  className="rounded-md text-emerald-600 focus:ring-emerald-500" />
                <span>🌱 100% Certified Organic Produce</span>
              </label>

              <p className="text-[10px] text-gray-400 italic">
                Note: This is a Marketplace Selling Price set by you. It is NOT an official mandi price.
              </p>

              <div className="pt-3 border-t border-gray-100 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md">
                  {editingProduct ? 'Update Listing' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
