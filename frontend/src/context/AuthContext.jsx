import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kisanmitra_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('kisanmitra_token'));
  const [loading, setLoading] = useState(true);

  // Login Required Modal state (global)
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginModalMessage, setLoginModalMessage] = useState('');
  const [loginModalReturnTo, setLoginModalReturnTo] = useState('');

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('kisanmitra_user', JSON.stringify(res.data));
        } catch (err) {
          console.error("Auth check failed:", err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('kisanmitra_token', access_token);
    localStorage.setItem('kisanmitra_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { access_token, user: userData } = res.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('kisanmitra_token', access_token);
    localStorage.setItem('kisanmitra_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('kisanmitra_token');
    localStorage.removeItem('kisanmitra_user');
  };

  const updateUserData = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('kisanmitra_user', JSON.stringify(updatedUser));
  };

  /**
   * requireAuth - Call this before any action that needs login.
   * If user is logged in, returns true immediately.
   * If not, opens the Login Required modal and returns false.
   * 
   * Usage:
   *   const { requireAuth } = useAuth();
   *   const handleAddToCart = () => {
   *     if (!requireAuth('Please login to add items to cart.')) return;
   *     // ... proceed with add to cart
   *   };
   */
  const requireAuth = useCallback((message, returnTo) => {
    if (token && user) return true;
    setLoginModalMessage(message || 'Please login or create an account to continue.');
    setLoginModalReturnTo(returnTo || window.location.pathname);
    setLoginModalOpen(true);
    return false;
  }, [token, user]);

  const closeLoginModal = useCallback(() => {
    setLoginModalOpen(false);
    setLoginModalMessage('');
    setLoginModalReturnTo('');
  }, []);

  const isAuthenticated = !!token && !!user;
  const isFarmer = isAuthenticated && (user?.role_name === 'FARMER' || user?.role === 'FARMER');
  const isAdmin = isAuthenticated && (user?.role_name === 'ADMIN' || user?.role === 'ADMIN');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUserData,
        isAuthenticated,
        isFarmer,
        isAdmin,
        // Guest auth helpers
        requireAuth,
        loginModalOpen,
        loginModalMessage,
        loginModalReturnTo,
        closeLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
