import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Phone, Mail, MapPin, Heart, Shield, Cpu, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                KisanMitra <span className="text-amber-400 text-lg font-black uppercase">AI</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Empowering India's agricultural ecosystem with artificial intelligence, soil science, pathology detection, live mandi trading, and precision meteorological advisories.
            </p>
            <div className="pt-2 flex items-center space-x-3 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/50 px-3.5 py-2 rounded-xl w-fit">
              <Sparkles className="w-4 h-4" />
              <span>National B.Tech CSE Major Project Innovation</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Agriculture</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/crop-recommendation" className="hover:text-emerald-400 transition-colors">Crop Suitability ML</Link></li>
              <li><Link to="/disease-detection" className="hover:text-emerald-400 transition-colors">Plant Pathology Vision</Link></li>
              <li><Link to="/fertilizer-recommendation" className="hover:text-emerald-400 transition-colors">Fertilizer Advisory</Link></li>
              <li><Link to="/ai-assistant" className="hover:text-emerald-400 transition-colors">AI Agronomist Chat</Link></li>
            </ul>
          </div>

          {/* Platform Services */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Market & Data</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/market-prices" className="hover:text-emerald-400 transition-colors">Live Mandi Prices</Link></li>
              <li><Link to="/weather" className="hover:text-emerald-400 transition-colors">Weather Radar & Alerts</Link></li>
              <li><Link to="/marketplace" className="hover:text-emerald-400 transition-colors">Agri Marketplace</Link></li>
              <li><Link to="/farming-tips" className="hover:text-emerald-400 transition-colors">Good Agricultural Practices</Link></li>
            </ul>
          </div>

          {/* Contact & Helpline */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Support & Help</h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-start space-x-2">
                <Phone className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>1800-180-1551 (Kisan Call Center)</span>
              </li>
              <li className="flex items-start space-x-2">
                <Mail className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>support@kisanmitra.ai</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>New Delhi / Lucknow, India</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright & disclaimer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-3 sm:space-y-0">
          <p>© {new Date().getFullYear()} KisanMitra AI. Built for Indian Agriculture & Sustainable Farming.</p>
          <div className="flex items-center space-x-6">
            <Link to="/about" className="hover:text-slate-400">About Platform</Link>
            <Link to="/contact" className="hover:text-slate-400">Contact Us</Link>
            <Link to="/admin/login" className="text-slate-600 hover:text-purple-400">Admin Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
