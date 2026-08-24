import React, { useState, useEffect } from 'react';
import { ShoppingBag, Package, Truck, CheckCircle2, Clock, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data || []);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
          <ShoppingBag className="w-7 h-7 text-emerald-600" />
          <span>My Orders & Harvest Deliveries</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Track placed orders, shipping statuses, and produce dispatch notes
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400">Loading your orders...</div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4 hover:border-emerald-200 transition-all"
            >
              {/* Order Header */}
              <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-gray-100 text-xs">
                <div>
                  <span className="font-extrabold text-gray-900 text-sm">{order.order_number}</span>
                  <span className="text-gray-400 ml-3">
                    Placed on: {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
                    {order.order_status}
                  </span>
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full font-medium text-[11px]">
                    {order.payment_method}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-gray-50 text-xs">
                {order.items && order.items.map((item, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800">{item.product_name}</p>
                      <p className="text-[11px] text-gray-400">
                        {item.quantity} {item.unit} @ ₹{item.unit_price} / {item.unit}
                      </p>
                    </div>
                    <span className="font-bold text-gray-900">₹ {item.subtotal.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Order Footer & Notes */}
              <div className="pt-3 border-t border-gray-100 flex flex-wrap justify-between items-center gap-3 text-xs">
                <div className="text-gray-500 flex items-center space-x-1">
                  <Truck className="w-4 h-4 text-emerald-600 mr-1" />
                  <span><b>Tracking Notes:</b> {order.tracking_notes || "Processing order"}</span>
                </div>

                <div>
                  <span className="text-gray-500 font-medium">Total Paid: </span>
                  <span className="text-base font-black text-emerald-800">₹ {order.total_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 space-y-4 shadow-xs">
          <Package className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800">No Orders Yet</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            You haven't placed any agricultural orders yet. Browse our marketplace to purchase verified seeds and bio-nutrients.
          </p>
          <Link
            to="/marketplace"
            className="inline-block px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md"
          >
            Explore Marketplace
          </Link>
        </div>
      )}

    </div>
  );
};
