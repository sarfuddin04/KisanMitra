import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { FarmerSidebar } from '../components/FarmerSidebar';
import { Topbar } from '../components/Topbar';

const pageTitles = {
  "/dashboard": { title: "Farmer Dashboard", subtitle: "Real-time agro-climatic analytics & farm tools" },
  "/crop-recommendation": { title: "Crop Suitability Advisory", subtitle: "Machine learning soil NPK & climate suitability analysis" },
  "/crop-history": { title: "Crop Prediction History", subtitle: "Archive of previously evaluated soil tests" },
  "/disease-detection": { title: "Plant Pathology & Disease Detection", subtitle: "AI vision leaf pathology scanner & treatment guidance" },
  "/disease-history": { title: "Disease Diagnosis History", subtitle: "Archive of scanned leaf diagnoses" },
  "/fertilizer-recommendation": { title: "Fertilizer Advisory Calculator", subtitle: "NPK deficiency correction & dosage scheduling" },
  "/weather": { title: "Hyperlocal Weather Forecast", subtitle: "Real-time radar, rain probabilities, and farming advisories" },
  "/market-prices": { title: "Live Mandi Commodity Prices", subtitle: "Real-time market rates across APMCs in India" },
  "/farming-tips": { title: "Good Agricultural Practices (GAP)", subtitle: "Expert advice on irrigation, IPM, and soil fertility" },
  "/ai-assistant": { title: "AI Expert Agronomist", subtitle: "24/7 agricultural question-answering assistant" },
  "/marketplace": { title: "Agricultural Marketplace", subtitle: "Direct farm-to-table trading & certified farm supplies" },
  "/my-products": { title: "My Produce Listings", subtitle: "Manage your farm products listed on the marketplace" },
  "/orders": { title: "My Orders", subtitle: "Track placed produce & agricultural equipment orders" },
  "/notifications": { title: "Notifications & Alerts", subtitle: "Important agricultural alerts, tips, and updates" },
  "/profile": { title: "Farm Profile & Settings", subtitle: "Manage your location, farm size, and soil parameters" }
};

export const FarmerLayout = () => {
  const location = useLocation();
  const meta = pageTitles[location.pathname] || { title: "Farmer Portal", subtitle: "Intelligent Agriculture Management" };

  return (
    <div className="flex h-screen bg-[#f8faf9] overflow-hidden">
      <FarmerSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={meta.title} subtitle={meta.subtitle} isAdmin={false} />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
