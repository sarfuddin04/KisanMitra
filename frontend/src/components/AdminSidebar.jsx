import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  BarChart3,
  Users,
  Sprout,
  FlaskConical,
  Bug,
  Lightbulb,
  TrendingUp,
  Store,
  Package,
  FolderTree,
  ShoppingBag,
  Bell,
  Image,
  HelpCircle,
  Mail,
  Settings,
  ChevronRight,
  X
} from 'lucide-react';

export const AdminSidebar = ({ isOpen = false, onClose = () => {} }) => {
  const adminLinks = [
    { to: "/admin/dashboard", label: "Overview & Analytics", icon: BarChart3 },
    { to: "/admin/users", label: "User Management", icon: Users },
    { to: "/admin/crops", label: "Crops Management", icon: Sprout },
    { to: "/admin/fertilizers", label: "Fertilizer Directory", icon: FlaskConical },
    { to: "/admin/diseases", label: "Disease Pathology", icon: Bug },
    { to: "/admin/farming-tips", label: "Farming Tips / GAP", icon: Lightbulb },
    { to: "/admin/market-prices", label: "Mandi Price Feed", icon: TrendingUp },
    { to: "/admin/markets", label: "Markets / APMCs", icon: Store },
    { to: "/admin/products", label: "Marketplace Products", icon: Package },
    { to: "/admin/categories", label: "Product Categories", icon: FolderTree },
    { to: "/admin/orders", label: "Customer Orders", icon: ShoppingBag },
    { to: "/admin/notifications", label: "Broadcast Alerts", icon: Bell },
    { to: "/admin/banners", label: "Hero Banners", icon: Image },
    { to: "/admin/faqs", label: "FAQ Knowledgebase", icon: HelpCircle },
    { to: "/admin/contacts", label: "Inquiries & Contact", icon: Mail },
    { to: "/admin/settings", label: "System Settings", icon: Settings }
  ];

  const sidebarContent = (
    <div className="w-72 sm:w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col h-full shadow-2xl lg:shadow-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-white block leading-tight">
              KisanMitra <span className="text-purple-400 text-xs font-black">ADMIN</span>
            </span>
            <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-widest">
              Control Center
            </span>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          title="Close Navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto custom-scrollbar">
        {adminLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/admin/dashboard"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2 rounded-xl font-semibold text-xs transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-700/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <div className="flex items-center space-x-2.5">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{link.label}</span>
              </div>
              <ChevronRight className="w-3 h-3 opacity-40 shrink-0" />
            </NavLink>
          );
        })}
      </nav>

      {/* Status footer */}
      <div className="p-3.5 border-t border-slate-800 text-[11px] text-slate-500">
        <p className="flex items-center space-x-1.5 font-medium text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          <span>System Healthy • DB Live</span>
        </p>
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
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
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

