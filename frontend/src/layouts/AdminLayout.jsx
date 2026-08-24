import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from '../components/AdminSidebar';
import { Topbar } from '../components/Topbar';

const adminTitles = {
  "/admin/dashboard": { title: "System Analytics Dashboard", subtitle: "Platform metrics, user activity, and prediction stats" },
  "/admin/users": { title: "User Management", subtitle: "View, activate, and manage platform farmers and admins" },
  "/admin/crops": { title: "Crops Management", subtitle: "Configure dynamic crop parameters and cultivation guides" },
  "/admin/fertilizers": { title: "Fertilizer Directory", subtitle: "Manage fertilizers, NPK formulas, and crop suitability" },
  "/admin/diseases": { title: "Disease Pathology Database", subtitle: "Add and edit plant diseases, symptoms, and treatments" },
  "/admin/farming-tips": { title: "Farming Tips / GAP", subtitle: "Publish expert agronomy tips and best practices" },
  "/admin/market-prices": { title: "Mandi Price Feeds", subtitle: "Update daily mandi commodity prices and trends" },
  "/admin/markets": { title: "Markets & APMCs", subtitle: "Manage APMC mandis and trading locations" },
  "/admin/products": { title: "Marketplace Products", subtitle: "Inspect and moderate listed farm produce and supplies" },
  "/admin/categories": { title: "Product Categories", subtitle: "Manage product classification taxonomy" },
  "/admin/orders": { title: "Customer Orders", subtitle: "Track and update dispatch/delivery statuses" },
  "/admin/notifications": { title: "Broadcast Notifications", subtitle: "Send targeted or nationwide agricultural alerts" },
  "/admin/banners": { title: "Hero Banners", subtitle: "Customize promotional banners on the homepage" },
  "/admin/faqs": { title: "FAQ Knowledgebase", subtitle: "Manage public frequently asked questions" },
  "/admin/contacts": { title: "Inquiries & Contact Requests", subtitle: "Review farmer messages and inquiries" },
  "/admin/settings": { title: "System Settings", subtitle: "Configure platform parameters and feature flags" }
};

export const AdminLayout = () => {
  const location = useLocation();
  const meta = adminTitles[location.pathname] || { title: "Admin Management", subtitle: "Control Panel" };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-900/50">
        <Topbar title={meta.title} subtitle={meta.subtitle} isAdmin={true} />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
