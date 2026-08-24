import React, { useState, useEffect } from 'react';
import { ShoppingBag, Trash2, Search, Star, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../services/api';

export const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = '/marketplace/products?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      const res = await api.get(url);
      setProducts(res.data || []);
    } catch (err) {
      console.error("Failed to load marketplace products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Remove this product listing from marketplace?")) {
      try {
        await api.delete(`/admin/products/${id}`);
        fetchProducts();
      } catch (err) {
        alert("Failed to delete product.");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <ShoppingBag className="w-7 h-7 text-emerald-400" />
            <span>Marketplace Listings & Moderation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review live seller produce, inventory stock, verified sellers, and remove non-compliant listings
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
            placeholder="Search products..."
            className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 text-xs rounded-xl text-white outline-hidden focus:ring-2 focus:ring-emerald-500 w-64"
          />
        </div>
      </div>

      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading products...</div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-4 px-6">Product / Commodity</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6">Stock</th>
                  <th className="py-4 px-6">Organic Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-white text-sm">
                      {p.name}
                      <span className="text-[10px] text-slate-500 block font-normal">{p.location || 'India'}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-300">{p.category_name}</td>
                    <td className="py-4 px-6 font-extrabold text-emerald-400">
                      ₹ {p.price} <span className="text-[10px] text-slate-500 font-normal">/ {p.unit}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">{p.stock_quantity} {p.unit}</td>
                    <td className="py-4 px-6">
                      {p.is_organic ? (
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-md font-bold text-[10px]">
                          🌱 Organic
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Standard</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg"
                        title="Remove Listing"
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
          <div className="p-12 text-center text-xs text-slate-500">No products found.</div>
        )}
      </div>

    </div>
  );
};
