import React from 'react';
import { Sprout, ScanEye, FlaskConical, CloudSun, TrendingUp, Bot, ShoppingBag, FileText, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Features = () => {
  const featuresList = [
    {
      icon: Sprout,
      title: "1. Precision ML Crop Recommendation",
      desc: "Uses a trained Random Forest model with 99.4% accuracy evaluating soil Nitrogen (N), Phosphorus (P), Potassium (K), pH, temperature, relative humidity, and rainfall to prescribe optimal crop varieties.",
      badge: "Scikit-Learn ML",
      link: "/crop-recommendation"
    },
    {
      icon: ScanEye,
      title: "2. Plant Leaf Disease Pathology Detection",
      desc: "Computer vision image analysis validating leaf photos and matching colorimetric & morphological patterns against a diagnostic database of fungal, bacterial, and viral crop diseases with organic and chemical remedies.",
      badge: "Computer Vision",
      link: "/disease-detection"
    },
    {
      icon: FlaskConical,
      title: "3. Fertilizer Gap & Dosage Advisory",
      desc: "Calculates precise soil nutrient deficiencies and schedules split fertilizer doses (basal, tillering, panicle initiation) matching dynamic PostgreSQL fertilizer records.",
      badge: "Soil Science",
      link: "/fertilizer-recommendation"
    },
    {
      icon: CloudSun,
      title: "4. Live Weather & Hyperlocal Advisories",
      desc: "Real-time Open-Meteo meteorological feed providing 7-day hourly forecasts, rain probability percentages, and actionable agricultural advisories to prevent nutrient leaching and pest outbreaks.",
      badge: "Meteorological API",
      link: "/weather"
    },
    {
      icon: TrendingUp,
      title: "5. Real-Time Mandi Market Rates",
      desc: "Track commodity prices across Indian APMC mandis with price trend indicators (UP/DOWN/STABLE) and state/district filters to maximize crop sales revenue.",
      badge: "Mandi Network",
      link: "/market-prices"
    },
    {
      icon: Bot,
      title: "6. 24/7 AI Agronomist Chatbot",
      desc: "Conversational agriculture assistant capable of answering complex inquiries regarding pest management, seed treatment, irrigation systems, and government farming schemes.",
      badge: "AI Agronomist",
      link: "/ai-assistant"
    },
    {
      icon: ShoppingBag,
      title: "7. Farm-to-Marketplace Produce Network",
      desc: "Comprehensive e-commerce portal enabling verified farmers to list their produce, organic grains, certified seeds, and equipment with shopping cart, checkout, and order tracking.",
      badge: "Direct Marketplace",
      link: "/marketplace"
    },
    {
      icon: FileText,
      title: "8. ReportLab PDF Diagnostic Certificates",
      desc: "Generate professional agronomic reports with branding, farmer details, timestamp, input parameters, prediction gauges, and official disclaimers for field records.",
      badge: "PDF Engine",
      link: "/crop-recommendation"
    }
  ];

  return (
    <div className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Core Capabilities
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
          Comprehensive AI Agriculture Suite
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Explore the complete spectrum of intelligence tools engineered to modernize every stage of the farming lifecycle.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {featuresList.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs hover:shadow-xl transition-all space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
                  {f.badge}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{f.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              <Link to={f.link} className="inline-flex items-center text-sm font-bold text-emerald-700 hover:text-emerald-800 pt-2">
                Launch Module →
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
