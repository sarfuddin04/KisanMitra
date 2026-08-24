import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, ShoppingCart, Check, Star, MapPin, Tag, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export const MarketplacePage = () => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [search, setSearch] = useState('');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [addedItem, setAddedItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      let url = '/marketplace/products?';
      if (selectedCat) url += `category_id=${selectedCat}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (organicOnly) url += `is_organic=true&`;

      const [pRes, cRes] = await Promise.all([
        api.get(url),
        api.get('/marketplace/categories')
      ]);

      setProducts(pRes.data || []);
      setCategories(cRes.data || []);
    } catch (err) {
      console.error("Marketplace fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedCat, organicOnly]);

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product.id, 1);
      setAddedItem(product.id);
      setTimeout(() => setAddedItem(null), 2000);
    } catch (err) {
      alert("Please login to add products to your cart.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Header & Seller CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
            <ShoppingBag className="w-7 h-7 text-emerald-600" />
            <span>Agricultural Marketplace & Produce Network</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Direct farmer-to-buyer trade for certified seeds, organic grains, bio-fertilizers, and farm tools
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/my-products"
            className="px-4 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl hover:bg-emerald-100 transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Sell Your Farm Produce</span>
          </Link>
          <Link
            to="/cart"
            className="px-4 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-emerald-700 transition-all flex items-center space-x-1.5"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>View Cart</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Row */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-emerald-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name, crop, or location..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          <button
            onClick={fetchCatalog}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Search
          </button>
        </div>

        {/* Category Pills & Organic Checkbox */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 custom-scrollbar">
            <button
              onClick={() => setSelectedCat('')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCat === ''
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCat === cat.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <label className="flex items-center space-x-2 text-xs font-bold text-emerald-800 cursor-pointer bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <input
              type="checkbox"
              checked={organicOnly}
              onChange={(e) => setOrganicOnly(e.target.checked)}
              className="rounded-md text-emerald-600 focus:ring-emerald-500"
            />
            <span>🌱 100% Certified Organic Only</span>
          </label>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-3xl border border-gray-200/80 shadow-xs hover:shadow-xl hover:border-emerald-200 transition-all flex flex-col justify-between overflow-hidden group"
          >
            {/* Header Image / Badge */}
            <div className="relative bg-gradient-to-tr from-emerald-50 to-teal-50 p-6 flex items-center justify-center border-b border-gray-100 min-h-[160px]">
              <ShoppingBag className="w-16 h-16 text-emerald-300/80 group-hover:scale-110 transition-transform" />
              {product.is_organic && (
                <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                  🌱 Organic
                </span>
              )}
              <span className="absolute bottom-3 right-3 bg-white/90 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-gray-200 flex items-center">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500 mr-1" />
                {product.rating || 4.8}
              </span>
            </div>

            {/* Product Meta */}
            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide block">
                  {product.category_name}
                </span>
                <h3 className="font-bold text-gray-900 text-sm mt-0.5 leading-snug">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
                <div className="flex items-center space-x-1 text-[11px] text-gray-400 mt-2">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span className="truncate">{product.location || 'India'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-lg font-black text-gray-900">₹ {product.price}</span>
                  <span className="text-xs text-gray-500"> / {product.unit}</span>
                </div>

                <button
                  onClick={() => handleAddToCart(product)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all ${
                    addedItem === product.id
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white'
                  }`}
                >
                  {addedItem === product.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
