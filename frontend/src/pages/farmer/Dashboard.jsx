import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  ScanEye,
  FlaskConical,
  CloudSun,
  TrendingUp,
  Bot,
  ShoppingBag,
  FileText,
  Sparkles,
  ArrowRight,
  MapPin,
  Layers,
  Thermometer,
  Droplets,
  Wind,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

export const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [weather, setWeather] = useState(null);
  const [marketHighlights, setMarketHighlights] = useState([]);
  const [recentCropRecs, setRecentCropRecs] = useState([]);
  const [recentDiseases, setRecentDiseases] = useState([]);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const userLoc = user?.profile?.district || user?.profile?.farm_location || "Lucknow";
        
        const [wRes, mRes, cRes, dRes, tRes] = await Promise.allSettled([
          api.get(`/weather?location=${encodeURIComponent(userLoc)}`),
          api.get('/market-prices'),
          api.get('/recommendations/history'),
          api.get('/disease/history'),
          api.get('/farming-tips')
        ]);

        if (wRes.status === 'fulfilled') setWeather(wRes.value.data);
        if (mRes.status === 'fulfilled') setMarketHighlights(mRes.value.data.slice(0, 4));
        if (cRes.status === 'fulfilled') setRecentCropRecs(cRes.value.data.slice(0, 3));
        if (dRes.status === 'fulfilled') setRecentDiseases(dRes.value.data.slice(0, 3));
        if (tRes.status === 'fulfilled') setTips(tRes.value.data.slice(0, 3));
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user]);

  const quickActions = [
    { to: "/crop-recommendation", label: "Crop Advisory", icon: Sprout, color: "from-emerald-500 to-emerald-700", desc: "Evaluate soil NPK & climate suitability" },
    { to: "/disease-detection", label: "Disease Scanner", icon: ScanEye, color: "from-teal-500 to-teal-700", desc: "Instant leaf pathology detection" },
    { to: "/fertilizer-recommendation", label: "Fertilizer Advisory", icon: FlaskConical, color: "from-amber-500 to-amber-700", desc: "Nutrient gap analysis & dosing" },
    { to: "/weather", label: "Weather Radar", icon: CloudSun, color: "from-sky-500 to-sky-700", desc: "7-day rain probability & forecast" },
    { to: "/market-prices", label: "Mandi Rates", icon: TrendingUp, color: "from-emerald-600 to-teal-800", desc: "Live prices across APMCs" },
    { to: "/ai-assistant", label: "AI Agronomist", icon: Bot, color: "from-purple-500 to-purple-700", desc: "24/7 farming question support" },
    { to: "/marketplace", label: "Agri Market", icon: ShoppingBag, color: "from-rose-500 to-rose-700", desc: "Buy seeds & sell farm produce" },
    { to: "/crop-history", label: "PDF Reports", icon: FileText, color: "from-slate-600 to-slate-800", desc: "View & download test certificates" }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* 1. WELCOME & FARM STATUS BANNER */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold text-emerald-100 mb-2 border border-white/10">
                <Sparkles className="w-3.5 h-3.5" />
                <span>KisanMitra AI Active Farm Node</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {t('welcome_back')}, {user?.full_name || 'Farmer'}! 🌾
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-100 font-medium mt-1">
                <span className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  {user?.profile?.farm_location || 'Lucknow, Uttar Pradesh'}
                </span>
                <span className="flex items-center">
                  <Layers className="w-3.5 h-3.5 mr-1" />
                  {user?.profile?.farm_size_acres || '2.5'} Acres • {user?.profile?.primary_crops || 'Rice, Wheat'}
                </span>
              </div>
            </div>

            {/* Quick Action Button */}
            <Link
              to="/crop-recommendation"
              className="px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
            >
              <Sprout className="w-4 h-4 text-emerald-600" />
              <span>New Soil Test</span>
            </Link>
          </div>

          {/* Agricultural Weather Warning / Advisory */}
          {weather?.advisory && (
            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/15 text-xs text-emerald-50 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <span><b>Field Advisory:</b> {weather.advisory}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. LIVE WEATHER & QUICK METRICS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Weather Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{t('latest_weather')}</h3>
              <p className="text-[11px] text-gray-500">{weather?.location || 'Lucknow, Uttar Pradesh'}</p>
            </div>
            <Link to="/weather" className="text-xs font-bold text-emerald-700 hover:underline">
              Details →
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-black text-gray-900">{weather?.temperature || 28}°C</p>
              <p className="text-xs font-semibold text-emerald-700 mt-0.5">{weather?.condition || 'Mainly Clear'}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <CloudSun className="w-10 h-10" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
            <div className="bg-gray-50 p-2 rounded-xl">
              <span className="text-gray-400 block text-[10px]">Humidity</span>
              <span className="font-bold text-gray-800">{weather?.humidity || 65}%</span>
            </div>
            <div className="bg-gray-50 p-2 rounded-xl">
              <span className="text-gray-400 block text-[10px]">Rain Chance</span>
              <span className="font-bold text-gray-800">{weather?.forecast_daily?.[0]?.rain_probability || 10}%</span>
            </div>
            <div className="bg-gray-50 p-2 rounded-xl">
              <span className="text-gray-400 block text-[10px]">Wind</span>
              <span className="font-bold text-gray-800">{weather?.wind_speed || 12} km/h</span>
            </div>
          </div>
        </div>

        {/* Quick Mandi Rates Highlight */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{t('market_ticker')}</h3>
              <p className="text-[11px] text-gray-500">Live commodity prices across mandis</p>
            </div>
            <Link to="/market-prices" className="text-xs font-bold text-emerald-700 hover:underline">
              View All Rates →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {marketHighlights.map((m, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-200/80 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-xs">{m.crop_name}</h4>
                  <p className="text-[10px] text-gray-500">{m.market_name} ({m.state})</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-emerald-800">₹ {m.modal_price.toLocaleString()}</p>
                  <span className={`text-[10px] font-bold ${m.trend === 'UP' ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {m.trend} ({m.unit})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. QUICK ACTIONS GRID (8 Cards) */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">{t('quick_actions')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link
                key={idx}
                to={action.to}
                className="group bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs hover:shadow-xl hover:border-emerald-200 transition-all space-y-3"
              >
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${action.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm group-hover:text-emerald-700 transition-colors">
                    {action.label}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    {action.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4. RECENT PREDICTIONS & FARMING TIPS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Crop Recommendations */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm">Recent Crop Recommendations</h3>
            <Link to="/crop-history" className="text-xs font-bold text-emerald-700 hover:underline">
              History →
            </Link>
          </div>

          <div className="space-y-3">
            {recentCropRecs.length > 0 ? (
              recentCropRecs.map((rec, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      <Sprout className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-gray-900">{rec.recommended_crop}</p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(rec.created_at).toLocaleDateString()} • Confidence: {(rec.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  <Link to={`/crop-recommendation`} className="text-xs font-bold text-emerald-700 hover:underline">
                    View
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-gray-400 space-y-2">
                <Sprout className="w-8 h-8 mx-auto text-gray-300" />
                <p>No previous crop recommendations yet.</p>
                <Link to="/crop-recommendation" className="text-emerald-700 font-bold hover:underline inline-block">
                  Run your first soil test →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Featured Farming Practices */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm">Farming Tips & Practices (GAP)</h3>
            <Link to="/farming-tips" className="text-xs font-bold text-emerald-700 hover:underline">
              All Tips →
            </Link>
          </div>

          <div className="space-y-3">
            {tips.map((tip, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                    {tip.category}
                  </span>
                  <span className="text-[10px] text-gray-400">{tip.season}</span>
                </div>
                <h4 className="font-bold text-xs text-gray-900">{tip.title}</h4>
                <p className="text-[11px] text-gray-600 line-clamp-1">{tip.summary}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
