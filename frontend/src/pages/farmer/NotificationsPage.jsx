import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, AlertCircle, Sparkles, ShoppingBag, Lightbulb } from 'lucide-react';
import api from '../../services/api';

export const NotificationsPage = () => {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifs(res.data || []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifs(notifs.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifs(notifs.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'ORDER': return <ShoppingBag className="w-5 h-5 text-emerald-600" />;
      case 'TIP': return <Lightbulb className="w-5 h-5 text-amber-600" />;
      case 'ALERT': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Bell className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
            <Bell className="w-7 h-7 text-emerald-600" />
            <span>Farm Notifications & Agricultural Alerts</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Real-time harvest updates, market price alerts, order statuses, and pest advisories
          </p>
        </div>

        {notifs.some(n => !n.is_read) && (
          <button
            onClick={markAllRead}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition-all flex items-center space-x-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400 bg-white rounded-3xl border border-gray-200">
            Loading notifications...
          </div>
        ) : notifs.length > 0 ? (
          notifs.map((notif) => (
            <div
              key={notif.id}
              className={`p-5 rounded-3xl border transition-all flex items-start justify-between gap-4 ${
                notif.is_read
                  ? 'bg-white border-gray-200/80 shadow-2xs opacity-85'
                  : 'bg-emerald-50/40 border-emerald-300 shadow-xs'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 rounded-2xl bg-white border border-gray-100 shadow-2xs shrink-0">
                  {getIcon(notif.notification_type)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-gray-900 text-sm">{notif.title}</h4>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
                  <span className="text-[10px] text-gray-400 mt-2 block">
                    {new Date(notif.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {!notif.is_read && (
                <button
                  onClick={() => markRead(notif.id)}
                  className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200 shrink-0"
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 space-y-3 shadow-xs">
            <Bell className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="font-bold text-gray-700">No Notifications</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              You are all caught up! New agricultural advisories and order updates will appear here.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
