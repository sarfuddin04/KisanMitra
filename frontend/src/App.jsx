import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LoginRequiredModal } from './components/LoginRequiredModal';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { FarmerLayout } from './layouts/FarmerLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { Home } from './pages/public/Home';
import { About } from './pages/public/About';
import { Features } from './pages/public/Features';
import { Services } from './pages/public/Services';
import { Contact } from './pages/public/Contact';
import { Login } from './pages/public/Login';
import { Register } from './pages/public/Register';
import { MandiMapPage } from './pages/public/MandiMapPage';

// Farmer Pages
import { Dashboard } from './pages/farmer/Dashboard';
import { CropRecommendation } from './pages/farmer/CropRecommendation';
import { CropHistory } from './pages/farmer/CropHistory';
import { DiseaseDetection } from './pages/farmer/DiseaseDetection';
import { DiseaseHistory } from './pages/farmer/DiseaseHistory';
import { FertilizerRecommendation } from './pages/farmer/FertilizerRecommendation';
import { WeatherPage } from './pages/farmer/WeatherPage';
import { MarketPricesPage } from './pages/farmer/MarketPricesPage';
import { FarmingTipsPage } from './pages/farmer/FarmingTipsPage';
import { AIAssistantPage } from './pages/farmer/AIAssistantPage';
import { MarketplacePage } from './pages/farmer/MarketplacePage';
import { CartPage } from './pages/farmer/CartPage';
import { CheckoutPage } from './pages/farmer/CheckoutPage';
import { OrdersPage } from './pages/farmer/OrdersPage';
import { MyProductsPage } from './pages/farmer/MyProductsPage';
import { ProductDetailPage } from './pages/farmer/ProductDetailPage';
import { NotificationsPage } from './pages/farmer/NotificationsPage';
import { ProfilePage } from './pages/farmer/ProfilePage';
import { MandiDetailPage } from './pages/farmer/MandiDetailPage';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminCrops } from './pages/admin/AdminCrops';
import { AdminFertilizers } from './pages/admin/AdminFertilizers';
import { AdminDiseases } from './pages/admin/AdminDiseases';
import { AdminTips } from './pages/admin/AdminTips';
import { AdminMarketPrices } from './pages/admin/AdminMarketPrices';
import { AdminMarkets } from './pages/admin/AdminMarkets';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { AdminBanners } from './pages/admin/AdminBanners';
import { AdminFAQs } from './pages/admin/AdminFAQs';
import { AdminContacts } from './pages/admin/AdminContacts';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminLocations } from './pages/admin/AdminLocations';

// Route Guards
const FarmerRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs text-gray-500 font-bold">Verifying Session...</div>;
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-400 font-bold">Verifying Administrative Privileges...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  if (user?.role !== 'ADMIN' && user?.role_name !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

/**
 * OptionalAuthLayout — Pages that can be viewed without login
 * but still show the FarmerLayout if logged in, or PublicLayout if guest.
 */
const BrowseLayout = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <FarmerLayout /> : <PublicLayout />;
};

export function App() {
  const { loginModalOpen, loginModalMessage, loginModalReturnTo, closeLoginModal } = useAuth();

  return (
    <>
      {/* Global Login Required Modal */}
      <LoginRequiredModal
        isOpen={loginModalOpen}
        onClose={closeLoginModal}
        message={loginModalMessage}
        returnTo={loginModalReturnTo}
      />

      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* ===== GUEST-BROWSABLE ROUTES ===== */}
        {/* These pages can be viewed without login. */}
        {/* Shows FarmerLayout if logged in, PublicLayout if guest. */}
        <Route element={<BrowseLayout />}>
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/marketplace/products/:id" element={<ProductDetailPage />} />
          <Route path="/market-prices" element={<MarketPricesPage />} />
          <Route path="/mandis/:id" element={<MandiDetailPage />} />
          <Route path="/mandi-map" element={<MandiMapPage />} />
        </Route>

        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Farmer Protected Routes — require login */}
        <Route
          element={
            <FarmerRoute>
              <FarmerLayout />
            </FarmerRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/crop-recommendation" element={<CropRecommendation />} />
          <Route path="/crop-history" element={<CropHistory />} />
          <Route path="/disease-detection" element={<DiseaseDetection />} />
          <Route path="/disease-history" element={<DiseaseHistory />} />
          <Route path="/fertilizer-recommendation" element={<FertilizerRecommendation />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="/farming-tips" element={<FarmingTipsPage />} />
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/my-products" element={<MyProductsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Admin Protected Routes */}
        <Route
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/crops" element={<AdminCrops />} />
          <Route path="/admin/fertilizers" element={<AdminFertilizers />} />
          <Route path="/admin/diseases" element={<AdminDiseases />} />
          <Route path="/admin/tips" element={<AdminTips />} />
          <Route path="/admin/market-prices" element={<AdminMarketPrices />} />
          <Route path="/admin/markets" element={<AdminMarkets />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/banners" element={<AdminBanners />} />
          <Route path="/admin/faqs" element={<AdminFAQs />} />
          <Route path="/admin/contacts" element={<AdminContacts />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/locations" element={<AdminLocations />} />
        </Route>

        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
