import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowRight, ArrowLeft, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const CartPage = () => {
  const { cart, removeFromCart, clearCart, addToCart } = useCart();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
            <ShoppingCart className="w-7 h-7 text-emerald-600" />
            <span>Shopping Cart</span>
          </h2>
          <p className="text-xs text-gray-500">Review selected seeds, produce, and agricultural inputs</p>
        </div>

        {cart.items && cart.items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center space-x-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Cart</span>
          </button>
        )}
      </div>

      {cart.items && cart.items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Items List */}
          <div className="lg:col-span-8 space-y-3">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{item.product.name}</h4>
                    <p className="text-xs text-gray-400">
                      ₹ {item.product.price} / {item.product.unit}
                    </p>
                    <p className="text-xs font-bold text-emerald-700 mt-1">
                      Qty: {item.quantity} {item.product.unit}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-2">
                  <p className="text-base font-black text-gray-900">₹ {item.subtotal.toLocaleString()}</p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Box */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs space-y-5 h-fit">
            <h3 className="font-bold text-gray-900 text-base pb-3 border-b border-gray-100">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-bold text-gray-800">₹ {cart.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Shipping:</span>
                <span className="font-bold text-emerald-700">FREE / Direct Farm</span>
              </div>
              <div className="flex justify-between">
                <span>GST / Agri Cess:</span>
                <span className="font-bold text-emerald-700">₹ 0 (Exempt)</span>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-between text-sm font-black text-gray-900">
                <span>Total Amount:</span>
                <span className="text-emerald-800 text-lg">₹ {cart.total_amount.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              to="/marketplace"
              className="block text-center text-xs text-emerald-700 font-bold hover:underline"
            >
              ← Continue Shopping
            </Link>
          </div>

        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Your Cart is Empty</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Explore verified certified seeds, farm produce, bio-fertilizers, and machinery on our marketplace.
          </p>
          <Link
            to="/marketplace"
            className="inline-block px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl text-xs shadow-md"
          >
            Explore Marketplace
          </Link>
        </div>
      )}

    </div>
  );
};
