import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle2, Search, Edit3, X, Eye } from 'lucide-react';
import api from '../../services/api';

export const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const [statusUpdate, setStatusUpdate] = useState({
    order_status: 'CONFIRMED',
    tracking_notes: ''
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/orders');
      setOrders(res.data || []);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setStatusUpdate({
      order_status: order.order_status,
      tracking_notes: order.tracking_notes || ''
    });
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/orders/${selectedOrder.id}/status`, statusUpdate);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      alert("Failed to update order status.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <Package className="w-7 h-7 text-emerald-400" />
          <span>Fulfillment & Marketplace Orders</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Monitor direct farmer-buyer orders, update delivery tracking notes, and handle dispatch statuses
        </p>
      </div>

      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading orders...</div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-4 px-6">Order ID</th>
                  <th className="py-4 px-6">Recipient & Contact</th>
                  <th className="py-4 px-6">Total Amount</th>
                  <th className="py-4 px-6">Payment Mode</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-white text-sm">
                      {o.order_number}
                      <span className="text-[10px] text-slate-500 block font-normal">{new Date(o.created_at).toLocaleDateString()}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-200 block">{o.shipping_name}</span>
                      <span className="text-[10px] text-slate-400">{o.shipping_phone}</span>
                    </td>
                    <td className="py-4 px-6 font-black text-emerald-400 text-sm">
                      ₹ {o.total_amount.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-slate-400">{o.payment_method}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        o.order_status === 'DELIVERED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : o.order_status === 'SHIPPED'
                          ? 'bg-sky-950 text-sky-300 border border-sky-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {o.order_status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => openStatusModal(o)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-all inline-flex items-center space-x-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Update Status</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">No orders placed yet.</div>
        )}
      </div>

      {/* Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 relative text-slate-200 animate-in fade-in">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white">
              Update Order: {selectedOrder.order_number}
            </h3>

            <div className="p-4 bg-slate-800/80 rounded-2xl text-xs space-y-1 text-slate-300">
              <p><b>Recipient:</b> {selectedOrder.shipping_name} ({selectedOrder.shipping_phone})</p>
              <p><b>Address:</b> {selectedOrder.shipping_address}</p>
              <p><b>Amount:</b> ₹ {selectedOrder.total_amount.toLocaleString()}</p>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Fulfillment Status</label>
                <select
                  value={statusUpdate.order_status}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, order_status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="PLACED">PLACED (Pending Verification)</option>
                  <option value="CONFIRMED">CONFIRMED (Accepted by Producer)</option>
                  <option value="SHIPPED">SHIPPED (In Transit / Dispatched)</option>
                  <option value="DELIVERED">DELIVERED (Completed)</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tracking Notes / Dispatch Info</label>
                <textarea
                  rows={3}
                  value={statusUpdate.tracking_notes}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, tracking_notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white resize-none"
                  placeholder="e.g. Dispatched via Krishi Express Van (Vehicle #UP32-AB-1234). ETA tomorrow afternoon."
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
