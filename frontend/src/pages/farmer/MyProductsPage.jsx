import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit3, CheckCircle2, AlertCircle, X, ShoppingBag } from 'lucide-react';
import api from '../../services/api';

export const MyProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    price: 50.0,
    unit: 'kg',
    stock_quantity: 500.0,
    location: '',
    is_organic: false
  });

  const fetchMyProducts = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        api.get('/marketplace/my-products'),
        api.get('/marketplace/categories')
      ]);
      setProducts(pRes.data || []);
      setCategories(cRes.data || []);
      if (cRes.data && cRes.data.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: cRes.data[0].id }));
      }
    } catch (err) {
      console.error("Failed to load seller produce:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/marketplace/products', {
        ...formData,
        category_id: parseInt(formData.category_id)
      });
      setIsModalOpen(false);
      setFormData({
        name: '',
        category_id: categories[0]?.id || '',
        description: '',
        price: 50.0,
        unit: 'kg',
        stock_quantity: 500.0,
        location: '',
        is_organic: false
      });
      fetchMyProducts();
    } catch (err) {
      alert("Failed to list product. Please verify fields.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this product listing?")) {
      try {
        await api.delete(`/marketplace/products/${id}`);
        fetchMyProducts();
      } catch (err) {
        alert("Failed to delete product.");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
            <Package className="w-7 h-7 text-emerald-600" />
            <span>My Farm Produce & Product Listings</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Manage your harvest crops and agricultural supplies listed on the marketplace
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Produce Listing</span>
        </button>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading your produce listings...</div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-4 px-6">Product / Commodity</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6">Available Stock</th>
                  <th className="py-4 px-6">Organic Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-gray-900 text-sm block">{p.name}</span>
                      <span className="text-[10px] text-gray-400">{p.location}</span>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{p.category_name}</td>
                    <td className="py-4 px-6 font-extrabold text-emerald-800">
                      ₹ {p.price} <span className="text-[10px] text-gray-400 font-normal">/ {p.unit}</span>
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      {p.stock_quantity} {p.unit}
                    </td>
                    <td className="py-4 px-6">
                      {p.is_organic ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                          🌱 100% Organic
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[10px]">Standard</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete listing"
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
          <div className="p-12 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="font-bold text-gray-700">No Produce Listed Yet</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              List your farm harvest (grains, pulses, seeds, or compost) to connect directly with buyers.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-block px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md"
            >
              Create First Listing
            </button>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 relative animate-in fade-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-800 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">List Produce for Sale</h3>
              <p className="text-xs text-gray-500 mt-0.5">Publish your crop or farm supply to the KisanMitra Marketplace</p>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Produce / Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  placeholder="e.g. Sharbati Wheat (Grade-A)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Unit of Measure</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 bg-white"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="quintal">quintal (100 kg)</option>
                    <option value="ton">ton (1000 kg)</option>
                    <option value="bag">bag / sack</option>
                    <option value="packet">packet</option>
                    <option value="piece">piece</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Price per Unit (₹) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-emerald-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Available Quantity</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Farm Location / Mandi Center</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  placeholder="e.g. Bakshi Ka Talab, Lucknow, UP"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Produce Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none"
                  placeholder="Harvest date, moisture quality, or certification notes..."
                />
              </div>

              <label className="flex items-center space-x-2 text-xs font-bold text-emerald-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_organic}
                  onChange={(e) => setFormData({ ...formData, is_organic: e.target.checked })}
                  className="rounded-md text-emerald-600 focus:ring-emerald-500"
                />
                <span>🌱 100% Certified Organic Produce</span>
              </label>

              <div className="pt-3 border-t border-gray-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Publish Produce Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
