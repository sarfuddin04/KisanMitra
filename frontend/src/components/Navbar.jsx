import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sprout, Globe, ShoppingCart, User, LogOut, Menu, X, ShieldCheck, ChevronDown, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

export const Navbar = () => {
  const { user, isAuthenticated, isFarmer, isAdmin, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { totalItemsCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { name: t('nav_home'), path: '/' },
    { name: t('nav_features'), path: '/features' },
    { name: t('nav_services'), path: '/services' },
    { name: t('nav_marketplace'), path: '/marketplace' },
    { name: t('nav_about'), path: '/about' },
    { name: t('nav_contact'), path: '/contact' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 bg-clip-text text-transparent tracking-tight">
                KisanMitra <span className="text-amber-500 text-lg font-black uppercase tracking-widest ml-0.5">AI</span>
              </span>
              <p className="text-[10px] text-emerald-600/80 font-medium tracking-wide uppercase">
                Intelligent Farming Companion
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-bold shadow-xs'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Right Action Bar */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* Language Switcher */}
            <div className="flex items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  language === 'en'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  language === 'hi'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                हिन्दी
              </button>
            </div>

            {/* Marketplace Cart */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
              title="View Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                  {totalItemsCount}
                </span>
              )}
            </Link>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 px-3.5 py-2 rounded-xl border border-emerald-200 font-semibold text-sm transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <span className="max-w-[120px] truncate">{user?.full_name}</span>
                  <ChevronDown className="w-4 h-4 text-emerald-600" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-bold text-gray-800 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                        {user?.role_name || user?.role || 'FARMER'}
                      </span>
                    </div>

                    {isAdmin ? (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-50"
                      >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    ) : (
                      <Link
                        to="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Farmer Dashboard
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      My Farm Profile
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100 text-left"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('nav_logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  {t('nav_login')}
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all"
                >
                  {t('nav_register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-6 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 font-semibold">Language:</span>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-xs font-bold rounded-lg ${language === 'en' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1 text-xs font-bold rounded-lg ${language === 'hi' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                हिन्दी
              </button>
            </div>
            <Link to="/cart" className="flex items-center text-sm font-semibold text-emerald-700">
              <ShoppingCart className="w-4 h-4 mr-1" />
              Cart ({totalItemsCount})
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-100 flex flex-col space-y-2">
            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 bg-purple-600 text-white text-center font-bold rounded-xl text-sm"
                  >
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 bg-emerald-600 text-white text-center font-bold rounded-xl text-sm"
                  >
                    Farmer Dashboard
                  </Link>
                )}
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full py-2 text-red-600 text-center font-semibold text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2.5 text-center text-sm font-bold border border-emerald-600 text-emerald-700 rounded-xl"
                >
                  {t('nav_login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2.5 text-center text-sm font-bold bg-emerald-600 text-white rounded-xl shadow-md"
                >
                  {t('nav_register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
