import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ShoppingCart, Star, MapPin, Leaf, Package, User, Phone,
  Tag, Box, TrendingUp, Shield, ChevronRight, AlertTriangle, Loader2
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23f0fdf4'/%3E%3Ctext x='300' y='200' text-anchor='middle' font-family='Inter,Arial,sans-serif' font-size='18' fill='%2322c55e'%3E🌾 Product Image%3C/text%3E%3C/svg%3E";

const getImageUrl = (url) => {
  if (!url) return FALLBACK_IMAGE;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace('/api', '');
  return `${base}${url}`;
};

export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, requireLogin } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/marketplace/products/${id}`);
      setProduct(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Product not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      requireLogin?.('Please log in to add items to your cart.', `/marketplace/products/${id}`);
      return;
    }
    setAddingToCart(true);
    setCartSuccess('');
    try {
      await api.post('/marketplace/cart', { product_id: product.id, quantity: 1 });
      setCartSuccess('Added to cart!');
      setTimeout(() => setCartSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to add to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      requireLogin?.('Please log in to buy products.', `/marketplace/products/${id}`);
      return;
    }
    try {
      await api.post('/marketplace/cart', { product_id: product.id, quantity: 1 });
      navigate('/checkout');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to proceed.');
    }
  };

  // Build image gallery
  const getGalleryImages = () => {
    if (!product) return [];
    const imgs = [];
    if (product.image_url) imgs.push(product.image_url);
    if (product.images && product.images.length > 0) {
      product.images.forEach(img => {
        if (img.image_url && !imgs.includes(img.image_url)) {
          imgs.push(img.image_url);
        }
      });
    }
    return imgs.length > 0 ? imgs : [FALLBACK_IMAGE];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-lime-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
          <span className="text-sm font-medium text-gray-500">Loading product details...</span>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-14 h-14 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button onClick={() => navigate('/marketplace')} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all">
            ← Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const gallery = getGalleryImages();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/60 via-white to-lime-50/40">
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/marketplace" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Marketplace
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          {product.category_name && (
            <>
              <span className="text-gray-400">{product.category_name}</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </>
          )}
          <span className="text-emerald-700 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

            {/* Left — Image Gallery */}
            <div className="p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-emerald-50/30">
              {/* Main image */}
              <div className="relative rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 aspect-[4/3]">
                <img
                  src={getImageUrl(gallery[selectedImage])}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                />
                {product.is_organic && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/90 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow">
                    <Leaf className="w-3.5 h-3.5" /> Organic
                  </div>
                )}
                {product.status === 'PENDING' && (
                  <div className="absolute top-3 right-3 px-3 py-1.5 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow">
                    Pending Approval
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {gallery.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImage === idx ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={getImageUrl(img)}
                        alt={`View ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right — Product Details */}
            <div className="p-6 lg:p-8 flex flex-col">
              {/* Category badge */}
              {product.category_name && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full w-fit mb-3">
                  <Tag className="w-3.5 h-3.5" /> {product.category_name}
                </span>
              )}

              {/* Product name */}
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mb-3">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-lg">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-amber-700">{product.rating?.toFixed(1) || '4.5'}</span>
                </div>
                <span className="text-xs text-gray-400">Marketplace Rating</span>
              </div>

              {/* Price */}
              <div className="bg-gradient-to-r from-emerald-50 to-lime-50 rounded-2xl p-5 mb-5 border border-emerald-100">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-700">₹{product.price?.toLocaleString('en-IN')}</span>
                  <span className="text-base text-gray-500 font-medium">/ {product.unit || 'kg'}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Marketplace selling price — not official mandi rate
                </p>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl">
                  <Box className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Stock</p>
                    <p className="text-sm font-bold text-gray-800">{product.stock_quantity > 0 ? `${product.stock_quantity} ${product.unit || 'units'}` : 'Out of Stock'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-rose-500 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Location</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{product.location || product.state_name || product.district_name || 'India'}</p>
                  </div>
                </div>
              </div>

              {/* Seller info */}
              <div className="flex items-center gap-3 p-3 bg-blue-50/60 rounded-xl mb-5 border border-blue-100/50">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Sold by</p>
                  <p className="text-sm font-bold text-gray-800 truncate">{product.seller_name || 'Farmer Seller'}</p>
                </div>
                {product.seller_phone && (
                  <a href={`tel:${product.seller_phone}`} className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-semibold rounded-lg transition-colors">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-2">Description</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-auto pt-4 flex flex-col gap-3">
                {cartSuccess && (
                  <div className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl text-center border border-emerald-200">
                    ✓ {cartSuccess}
                  </div>
                )}
                {error && (
                  <div className="text-sm font-semibold text-red-600 bg-red-50 px-4 py-2 rounded-xl text-center border border-red-200">
                    {error}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart || product.stock_quantity <= 0}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white border-2 border-emerald-600 text-emerald-700 font-bold rounded-2xl hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={product.stock_quantity <= 0}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200 text-sm"
                  >
                    <TrendingUp className="w-5 h-5" /> Buy Now
                  </button>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Shield className="w-4 h-4 text-emerald-500" /> Secure Purchase
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Package className="w-4 h-4 text-blue-500" /> Verified Seller
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
