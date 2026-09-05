import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  ScanEye,
  FlaskConical,
  CloudSun,
  TrendingUp,
  Bot,
  Lightbulb,
  ShoppingBag,
  Package,
  FileText,
  Bell,
  UserCheck,
  ChevronRight,
  X,
  Map
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const FarmerSidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { t } = useLanguage();

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/crop-recommendation", label: "Crop Advisory (ML)", icon: Sprout },
    { to: "/disease-detection", label: "Disease Detection (AI)", icon: ScanEye },
    { to: "/fertilizer-recommendation", label: "Fertilizer Calculator", icon: FlaskConical },
    { to: "/weather", label: "Weather Forecast", icon: CloudSun },
    { to: "/market-prices", label: "Mandi Market Prices", icon: TrendingUp },
    { to: "/mandi-map", label: "Mandi Map", icon: Map },
    { to: "/ai-assistant", label: "AI Farming Assistant", icon: Bot },
    { to: "/farming-tips", label: "Farming Practices", icon: Lightbulb },
    { to: "/marketplace", label: "Agri Marketplace", icon: ShoppingBag },
    { to: "/my-products", label: "My Produce Listings", icon: Package },
    { to: "/orders", label: "My Orders", icon: FileText },
    { to: "/notifications", label: "Notifications", icon: Bell },
    { to: "/profile", label: "Farm Profile", icon: UserCheck }
  ];

  const sidebarContent = (
    <div className="w-72 sm:w-64 bg-white border-r border-emerald-100 flex flex-col h-full shadow-lg lg:shadow-none">
      {/* Sidebar Header Brand */}
      <div className="p-4 sm:p-5 border-b border-emerald-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-emerald-950 block leading-tight">
              KisanMitra <span className="text-amber-500 text-sm font-black">AI</span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
              Farmer Portal
            </span>
          </div>
        </div>
        
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-emerald-50 lg:hidden"
          title="Close Navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/dashboard"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-700/20'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{link.label}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
            </NavLink>
          );
        })}
      </nav>

      {/* Advisory Badge */}
      <div className="p-3.5 m-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/60 text-xs">
        <p className="font-bold text-emerald-900 flex items-center space-x-1.5 text-[11px] sm:text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
          <span>Kisan Helpline</span>
        </p>
        <p className="text-emerald-700 mt-1 font-medium text-[11px]">Toll Free: 1800-180-1551</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex shrink-0 min-h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          {/* Drawer Content */}
          <div className="relative z-10 flex h-full animate-in slide-in-from-left duration-250">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

