import React from 'react';
import { Sprout, ShoppingBag, ShieldCheck, Users, Truck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Services = () => {
  return (
    <div className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Agricultural Services
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
          Services for Farmers, FPOs & Agri-Buyers
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          From soil to sale, KisanMitra AI provides dedicated digital infrastructure for the agricultural value chain.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <Sprout className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">For Individual Farmers</h3>
          <ul className="text-sm text-gray-600 space-y-2.5">
            <li>✓ Free AI soil & crop suitability evaluations</li>
            <li>✓ Instant plant disease identification from leaf photos</li>
            <li>✓ Live district mandi price trends & price notifications</li>
            <li>✓ Direct produce listing to buyers with no middleman</li>
          </ul>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-teal-100 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">For FPOs & Cooperatives</h3>
          <ul className="text-sm text-gray-600 space-y-2.5">
            <li>✓ Bulk crop health monitoring & harvest advisory</li>
            <li>✓ Consolidated grain & seed catalog management</li>
            <li>✓ Real-time multi-mandi arbitrage analytics</li>
            <li>✓ Official PDF agronomic certification for members</li>
          </ul>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-amber-100 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">For Agri-Buyers & Processors</h3>
          <ul className="text-sm text-gray-600 space-y-2.5">
            <li>✓ Direct farm-gate sourcing of organic produce</li>
            <li>✓ Verified quality ratings and seller contact</li>
            <li>✓ Transparent order fulfillment and tracking</li>
            <li>✓ Access to certified seed and input manufacturers</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
