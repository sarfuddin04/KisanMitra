import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Sun,
  Globe,
  User,
  LogOut,
  ChevronDown,
  Shield,
  Search,
  CheckCircle2,
  Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

export const Topbar = ({ title, subtitle, isAdmin = false, onMenuClick = () => {} }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [notifs, setNotifs] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifs(res.data || []);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    };
    fetchNotifs();
  }, []);

  const unreadCount = notifs.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifs(notifs.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Error marking notifications read:", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="h-16 sm:h-18 bg-white border-b border-gray-100 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      
      {/* Mobile Menu Button + Title */}
      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl lg:hidden shrink-0"
          title="Open Menu"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-bold text-gray-900 tracking-tight truncate leading-tight">
            {title || "Farmer Overview"}
          </h1>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium truncate hidden xs:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3.5">
        
        {/* Language selector */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-bold">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-0.5 rounded-lg transition-all ${language === 'en' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500'}`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-2 py-0.5 rounded-lg transition-all ${language === 'hi' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500'}`}
          >
            हिन्दी
          </button>
        </div>

        {/* Notifications Icon & Drawer */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-xl text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Notifications ({unreadCount})</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[11px] text-emerald-600 font-semibold hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-gray-50">
                {notifs.length > 0 ? (
                  notifs.slice(0, 8).map(n => (
                    <div key={n.id} className={`p-3 text-xs ${n.is_read ? 'opacity-70' : 'bg-emerald-50/40 font-semibold'}`}>
                      <p className="text-gray-900 font-bold">{n.title}</p>
                      <p className="text-gray-600 mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-gray-400">No new notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2.5 bg-gray-50 hover:bg-emerald-50/60 p-1.5 pr-3 rounded-2xl border border-gray-200/80 transition-all"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-xs ${isAdmin ? 'bg-purple-600' : 'bg-emerald-600'}`}>
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-gray-800 truncate max-w-[110px]">{user?.full_name || "User"}</p>
              <p className="text-[10px] text-gray-500 font-medium">{user?.role_name || (isAdmin ? "Admin" : "Farmer")}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-800">{user?.full_name}</p>
                <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
              </div>

              {!isAdmin && (
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <User className="w-3.5 h-3.5 mr-2" />
                  Farm Profile
                </Link>
              )}

              <Link
                to="/"
                onClick={() => setProfileOpen(false)}
                className="flex items-center px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Globe className="w-3.5 h-3.5 mr-2" />
                Public Website
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-xs text-red-600 hover:bg-red-50 border-t border-gray-100 text-left font-semibold"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
