import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, MapPin, Phone, User } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export const CheckoutPage = () => {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    shipping_name: user?.full_name || '',
    shipping_phone: user?.phone || '',
    shipping_address: user?.profile?.farm_location || '',
    payment_method: 'Cash on Delivery / UPI'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!cart.items || cart.items.length === 0) {
      alert("Cart is empty.");
      navigate('/marketplace');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/orders', formData);
      await fetchCart();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
          Checkout & Farm Delivery
        </h2>
        <p className="text-xs text-gray-500">
          Provide your delivery address and preferred agricultural payment mode
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
          
          {error && (
            <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs flex items-center space-x-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePlaceOrder} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Recipient / Farmer Name *</label>
              <input
                type="text"
                required
                value={formData.shipping_name}
                onChange={(e) => setFormData({ ...formData, shipping_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                placeholder="Rameshwar Singh"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Contact Phone Number *</label>
              <input
                type="tel"
                required
                value={formData.shipping_phone}
                onChange={(e) => setFormData({ ...formData, shipping_phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                placeholder="9876543210"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Delivery Address / Mandi Hub *</label>
              <textarea
                rows={3}
                required
                value={formData.shipping_address}
                onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium resize-none"
                placeholder="Village, Post Office, District, Pincode, State"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-800 bg-white"
              >
                <option value="Cash on Delivery / UPI">Cash on Delivery / Direct UPI at Harvest</option>
                <option value="Direct Bank Transfer">Direct Bank Transfer (NEFT/RTGS)</option>
                <option value="Kisan Credit Card (KCC)">Kisan Credit Card (KCC Settlement)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{loading ? 'Confirming Order...' : `Confirm & Place Order (₹ ${cart.total_amount.toLocaleString()})`}</span>
            </button>
          </form>

        </div>

        {/* Items Summary */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs space-y-4 h-fit">
          <h3 className="font-bold text-gray-900 text-sm pb-2 border-b border-gray-100">
            Order Items ({cart.items?.length || 0})
          </h3>

          <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto custom-scrollbar">
            {cart.items && cart.items.map((item) => (
              <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-gray-900">{item.product.name}</p>
                  <p className="text-[11px] text-gray-400">Qty: {item.quantity} {item.product.unit}</p>
                </div>
                <span className="font-extrabold text-emerald-900">₹ {item.subtotal.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-sm font-black text-gray-900">
            <span>Total Payable:</span>
            <span className="text-emerald-800 text-xl">₹ {cart.total_amount.toLocaleString()}</span>
          </div>

          <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200/80 text-[11px] text-emerald-900 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Direct producer guarantee. Protected by KisanMitra verification.</span>
          </div>
        </div>

      </div>

    </div>
  );
};
