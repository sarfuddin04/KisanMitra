import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Search, Filter, MapPin, Tag, Package, Plus, Eye, Heart, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const PRODUCT_FALLBACK = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80';

export const MarketplacePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, requireAuth } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Location filters (from DB)
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [mandis, setMandis] = useState([]);
  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [mandiId, setMandiId] = useState('');

  // Load initial data
  useEffect(() => {
    api.get('/marketplace/categories').then(r => setCategories(r.data || [])).catch(() => {});
    api.get('/states').then(r => setStates(r.data || [])).catch(() => {});
  }, []);

  // Dependent dropdowns
  useEffect(() => {
    setDistricts([]); setMandis([]); setDistrictId(''); setMandiId('');
    if (stateId) {
      api.get(`/states/${stateId}/districts`).then(r => setDistricts(r.data || [])).catch(() => {});
    }
  }, [stateId]);

  useEffect(() => {
    setMandis([]); setMandiId('');
    if (districtId) {
      api.get(`/districts/${districtId}/mandis`).then(r => setMandis(r.data || [])).catch(() => {});
    }
  }, [districtId]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryId) params.append('category_id', categoryId);
      if (sortBy) params.append('sort_by', sortBy);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (stateId) params.append('state_id', stateId);
      if (districtId) params.append('district_id', districtId);
      if (mandiId) params.append('mandi_id', mandiId);
      const res = await api.get(`/marketplace/products?${params.toString()}`);
      setProducts(res.data || []);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, sortBy, minPrice, maxPrice, stateId, districtId, mandiId]);

  useEffect(() => { fetchProducts(); }, [categoryId, sortBy, stateId, districtId, mandiId]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleAddToCart = (product) => {
    if (!requireAuth('Please login to add items to your cart.')) return;
    // Cart logic would go here
    alert(`"${product.name}" added to cart!`);
  };

  const handleBuyNow = (product) => {
    if (!requireAuth('Please login to buy this product.')) return;
    navigate('/checkout', { state: { product } });
  };

  const handleSellProduct = () => {
    if (!requireAuth('Please login to sell your products.')) return;
    navigate('/my-products');
  };

  const getImageUrl = (product) => {
    if (product.image_url) {
      return product.image_url.startsWith('http') ? product.image_url : `/api/static/${product.image_url}`;
    }
    return PRODUCT_FALLBACK;
  };

  const formatPrice = (price) => {
    return `₹${(price || 0).toLocaleString('en-IN')}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
            <Package className="w-7 h-7 text-emerald-600" />
            <span>Agriculture Marketplace</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">Buy & sell agricultural products directly</p>
        </div>
        <button onClick={handleSellProduct}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5">
          <Plus className="w-4 h-4" />
          <span>Sell Your Product</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-xs">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, crops, fertilizers, mandis..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden" />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all">
            Search
          </button>
          <button type="button" onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2.5 border border-gray-300 text-gray-600 font-bold text-xs rounded-xl flex items-center space-x-1.5 hover:bg-gray-50">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </form>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Category */}
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 bg-white">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {/* State */}
            <select value={stateId} onChange={(e) => setStateId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 bg-white">
              <option value="">All States</option>
              {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            {/* District */}
            <select value={districtId} onChange={(e) => setDistrictId(e.target.value)} disabled={!stateId}
              className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 bg-white disabled:opacity-50">
              <option value="">All Districts</option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>

            {/* Mandi */}
            <select value={mandiId} onChange={(e) => setMandiId(e.target.value)} disabled={!districtId}
              className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 bg-white disabled:opacity-50">
              <option value="">All Mandis</option>
              {mandis.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>

            {/* Price Range */}
            <input type="number" placeholder="Min Price" value={minPrice} onChange={e => setMinPrice(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold" />
            <input type="number" placeholder="Max Price" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold" />

            {/* Sort */}
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 bg-white">
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        )}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400">Loading marketplace...</div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all overflow-hidden group">
              {/* Image */}
              <div className="h-44 overflow-hidden relative cursor-pointer" onClick={() => navigate(`/marketplace/products/${p.id}`)}>
                <img
                  src={getImageUrl(p)}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.target.src = PRODUCT_FALLBACK; }}
                />
                {p.is_organic && (
                  <span className="absolute top-3 left-3 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full">
                    🌿 Organic
                  </span>
                )}
                <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  p.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {p.is_available ? '✓ Available' : 'Out of Stock'}
                </span>
              </div>

              {/* Content */}
              <div className="p-4 space-y-2.5">
                <h3 className="font-extrabold text-gray-900 text-sm cursor-pointer hover:text-emerald-700 transition-colors" onClick={() => navigate(`/marketplace/products/${p.id}`)}>{p.name}</h3>

                {/* Price */}
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xl font-black text-emerald-700">{formatPrice(p.price)}</span>
                  <span className="text-[11px] text-gray-400 font-semibold">/ {p.unit || 'kg'}</span>
                </div>

                {/* Details */}
                <div className="space-y-1 text-[11px] text-gray-500">
                  <p><span className="font-bold text-gray-600">Quantity:</span> {p.stock_quantity || '—'} {p.unit || 'kg'}</p>
                  {p.category_name && <p><Tag className="w-3 h-3 inline mr-1" />{p.category_name}</p>}
                  {p.seller_name && <p><span className="font-bold text-gray-600">Seller:</span> {p.seller_name}</p>}
                </div>

                {/* Location */}
                {(p.state_name || p.mandi_name) && (
                  <div className="flex items-start space-x-1.5 text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg">
                    <MapPin className="w-3 h-3 mt-0.5 text-emerald-500 shrink-0" />
                    <div>
                      {p.mandi_name && <span className="font-semibold text-gray-700 block">{p.mandi_name}</span>}
                      <span>{[p.district_name, p.state_name].filter(Boolean).join(', ')}</span>
                    </div>
                  </div>
                )}

                {/* Price type label */}
                <p className="text-[10px] text-gray-400 italic">
                  Marketplace Selling Price • Updated: {p.updated_at ? new Date(p.updated_at).toLocaleDateString('en-IN') : '—'}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => navigate(`/marketplace/products/${p.id}`)}
                    className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] rounded-lg transition-all flex items-center justify-center space-x-1 border border-blue-200"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Details</span>
                  </button>
                  <button
                    onClick={() => handleAddToCart(p)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-all flex items-center justify-center space-x-1"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    <span>Cart</span>
                  </button>
                  <button
                    onClick={() => handleBuyNow(p)}
                    className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] rounded-lg transition-all"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-xs text-gray-400">
          <Package className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-500">No products found.</p>
          <p className="mt-1">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
};
