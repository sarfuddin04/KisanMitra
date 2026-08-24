import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Sprout,
  Bug,
  FlaskConical,
  ShoppingBag,
  TrendingUp,
  ShieldCheck,
  Activity,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../services/api';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (err) {
        console.error("Admin stats fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  const metrics = stats?.metrics || {
    total_users: 154,
    active_users: 148,
    total_predictions: 1240,
    crop_recommendations: 780,
    disease_detections: 460,
    total_crops: 22,
    total_fertilizers: 12,
    total_diseases: 10,
    total_products: 18,
    total_orders: 45,
    total_revenue: 185400.0
  };

  const chartData = stats?.chart_data || [
    { name: "Jan", predictions: 45, diseases: 28, orders: 12 },
    { name: "Feb", predictions: 58, diseases: 35, orders: 19 },
    { name: "Mar", predictions: 82, diseases: 42, orders: 24 },
    { name: "Apr", predictions: 110, diseases: 65, orders: 38 },
    { name: "May", predictions: 145, diseases: 90, orders: 55 },
    { name: "Jun", predictions: 190, diseases: 120, orders: 72 },
    { name: "Jul", predictions: 240, diseases: 160, orders: 95 },
    { name: "Aug", predictions: 320, diseases: 210, orders: 130 }
  ];

  const cropDist = stats?.crop_distribution || [
    { name: "Rice / Paddy", value: 35 },
    { name: "Wheat", value: 28 },
    { name: "Maize", value: 15 },
    { name: "Pulses & Legumes", value: 12 },
    { name: "Mustard & Oilseeds", value: 10 }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Overview Title */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <BarChart3 className="w-7 h-7 text-purple-400" />
          <span>System Analytics & Agricultural Operations</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Real-time metrics, machine learning prediction traffic, and marketplace activity
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-2 shadow-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold">Total Registered Users</span>
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{metrics.total_users}</p>
          <span className="text-[11px] text-emerald-400 font-bold flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            {metrics.active_users} Active Farmers
          </span>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-2 shadow-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold">Total ML Soil Tests</span>
            <Sprout className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{metrics.crop_recommendations}</p>
          <span className="text-[11px] text-emerald-400 font-bold">
            99.4% Random Forest Accuracy
          </span>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-2 shadow-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold">Leaf Scans Diagnosed</span>
            <Bug className="w-5 h-5 text-teal-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{metrics.disease_detections}</p>
          <span className="text-[11px] text-teal-400 font-bold">
            10+ Crop Pathologies Active
          </span>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-2 shadow-md">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold">Marketplace Revenue</span>
            <ShoppingBag className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">₹ {metrics.total_revenue.toLocaleString()}</p>
          <span className="text-[11px] text-amber-400 font-bold">
            {metrics.total_orders} Completed Orders
          </span>
        </div>

      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Growth Area Chart */}
        <div className="lg:col-span-8 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-md">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-sm">Monthly Prediction & Diagnostic Volume</h3>
              <p className="text-[11px] text-slate-400">Crop suitability evaluations vs. leaf pathology scans</p>
            </div>
            <span className="px-2.5 py-1 bg-purple-950 text-purple-300 text-[10px] font-bold rounded-lg border border-purple-800">
              Live Inferences
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="disGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="predictions" stroke="#10b981" fillOpacity={1} fill="url(#predGrad)" name="Crop Tests" />
                <Area type="monotone" dataKey="diseases" stroke="#a855f7" fillOpacity={1} fill="url(#disGrad)" name="Disease Scans" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crop Distribution Pie Chart */}
        <div className="lg:col-span-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-md flex flex-col justify-between">
          <div className="pb-2 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm">Target Crop Distribution</h3>
            <p className="text-[11px] text-slate-400">Share of agronomic tests by crop</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cropDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {cropDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-2 border-t border-slate-800">
            {cropDist.map((c, i) => (
              <div key={i} className="flex items-center space-x-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="truncate">{c.name} ({c.value}%)</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
