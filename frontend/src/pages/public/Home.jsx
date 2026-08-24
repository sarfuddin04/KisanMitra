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
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users,
  Award,
  ChevronDown,
  HelpCircle,
  PhoneCall,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

export const Home = () => {
  const { t } = useLanguage();
  const [publicData, setPublicData] = useState(null);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/public/summary');
        setPublicData(res.data);
      } catch (err) {
        console.error("Failed to load public summary:", err);
      }
    };
    fetchSummary();
  }, []);

  const stats = publicData?.stats || {
    total_farmers: "15,400+",
    total_predictions: "125,000+",
    ai_accuracy_rate: 99.4,
    states_covered: 18
  };

  const marketHighlights = publicData?.market_highlights || [
    { crop_name: "Wheat (Sharbati)", market_name: "Lucknow Mandi", modal_price: 2580, unit: "₹ / Qtl", trend: "UP" },
    { crop_name: "Basmati Paddy", market_name: "Karnal Mandi", modal_price: 4050, unit: "₹ / Qtl", trend: "UP" },
    { crop_name: "Mustard Seed", market_name: "Jaipur Mandi", modal_price: 5650, unit: "₹ / Qtl", trend: "STABLE" },
    { crop_name: "Nashik Onion", market_name: "Pune APMC", modal_price: 2500, unit: "₹ / Qtl", trend: "UP" }
  ];

  const faqs = publicData?.faqs || [
    { id: 1, question: "How does the Crop Recommendation model work?", answer: "Our system runs a Scikit-learn Random Forest model trained on ICAR soil and micro-climatic parameters (NPK, pH, temperature, humidity, rainfall) with 99.4% accuracy." },
    { id: 2, question: "Can I detect plant leaf diseases with my smartphone?", answer: "Yes! Take a photo of an infected leaf, upload it to the Disease Detection module, and receive immediate diagnosis with organic and chemical treatment advice." },
    { id: 3, question: "Is KisanMitra AI completely free for farmers?", answer: "Yes, all AI diagnostic tools, weather radars, and market prices are 100% accessible to registered farmers." },
    { id: 4, question: "Does the platform support Hindi and regional languages?", answer: "Yes! You can toggle between English and Hindi at any time using the language switcher in the navbar." }
  ];

  return (
    <div className="overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 green-gradient-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-emerald-100/80 border border-emerald-300 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-bold shadow-xs">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>{t('hero_badge')}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Intelligent Farming Companion for <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Every Indian Farmer</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                {t('hero_subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/crop-recommendation"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-base shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2"
                >
                  <Sprout className="w-5 h-5" />
                  <span>Start Crop Advisory</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>

                <Link
                  to="/disease-detection"
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white hover:bg-emerald-50/60 text-emerald-800 border-2 border-emerald-200 font-bold text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <ScanEye className="w-5 h-5 text-emerald-600" />
                  <span>Scan Plant Disease</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-semibold">
                <div className="flex items-center space-x-1.5 text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>ICAR Agronomy Grounded</span>
                </div>
                <div className="flex items-center space-x-1.5 text-emerald-800">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>99.4% Model Accuracy</span>
                </div>
                <div className="flex items-center space-x-1.5 text-emerald-800">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Bilingual (EN & हिन्दी)</span>
                </div>
              </div>
            </div>

            {/* Right Visual Interactive Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-emerald-100/80 space-y-5">
                
                {/* Header widget */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                      <Sprout className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Live Soil Health Analysis</h4>
                      <p className="text-[11px] text-emerald-600 font-medium">Machine Learning Inference</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    Active ML
                  </span>
                </div>

                {/* Sample Metrics grid */}
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                    <p className="text-[10px] font-semibold text-gray-500">Nitrogen (N)</p>
                    <p className="text-sm font-bold text-emerald-800">90 kg/ha</p>
                  </div>
                  <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-100">
                    <p className="text-[10px] font-semibold text-gray-500">Phosphorus (P)</p>
                    <p className="text-sm font-bold text-amber-800">42 kg/ha</p>
                  </div>
                  <div className="bg-teal-50/70 p-2.5 rounded-xl border border-teal-100">
                    <p className="text-[10px] font-semibold text-gray-500">Potassium (K)</p>
                    <p className="text-sm font-bold text-teal-800">43 kg/ha</p>
                  </div>
                </div>

                {/* AI Result Box */}
                <div className="p-4 bg-gradient-to-tr from-emerald-600 to-teal-700 rounded-2xl text-white shadow-md">
                  <div className="flex justify-between items-center text-xs font-semibold text-emerald-100">
                    <span>AI Predicted Match</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px]">99.4% Match</span>
                  </div>
                  <p className="text-2xl font-black mt-1">Paddy / Rice (Oryza sativa)</p>
                  <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                    Optimal for current high humidity (80%) and rainfall (202mm) conditions.
                  </p>
                </div>

                {/* Ticker snippet */}
                <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Lucknow Mandi Rate</span>
                  <span className="font-bold text-emerald-700 flex items-center">
                    ₹ 4,050 / Quintal <TrendingUp className="w-3.5 h-3.5 ml-1 text-emerald-600" />
                  </span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. STATS COUNTER BAR */}
      <section className="bg-emerald-900 text-white py-10 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-amber-400">{stats.total_farmers || "15,400+"}</p>
              <p className="text-xs text-emerald-200 uppercase font-semibold mt-1">Registered Farmers</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-white">{stats.total_predictions || "125,000+"}</p>
              <p className="text-xs text-emerald-200 uppercase font-semibold mt-1">AI Soil & Disease Tests</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-300">{stats.ai_accuracy_rate || 99.4}%</p>
              <p className="text-xs text-emerald-200 uppercase font-semibold mt-1">ML Model Accuracy</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-white">{stats.states_covered || 18}+</p>
              <p className="text-xs text-emerald-200 uppercase font-semibold mt-1">Indian States Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE AI AGRICULTURE MODULES */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Complete Agricultural Intelligence
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Powerful AI Tools Built for Real Field Farming
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Every tool communicates with high-performance machine learning models and dynamic PostgreSQL agricultural databases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Tool 1: Crop Recommendation */}
            <div className="group bg-white rounded-3xl p-7 border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-5 group-hover:scale-110 transition-transform">
                <Sprout className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('crop_rec_title')}</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-6">
                {t('crop_rec_desc')}
              </p>
              <Link to="/crop-recommendation" className="inline-flex items-center text-sm font-bold text-emerald-700 hover:text-emerald-800">
                Run Soil Test <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Tool 2: Disease Detection */}
            <div className="group bg-white rounded-3xl p-7 border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold mb-5 group-hover:scale-110 transition-transform">
                <ScanEye className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('disease_title')}</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-6">
                {t('disease_desc')}
              </p>
              <Link to="/disease-detection" className="inline-flex items-center text-sm font-bold text-teal-700 hover:text-teal-800">
                Upload Leaf Photo <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Tool 3: Fertilizer Advisory */}
            <div className="group bg-white rounded-3xl p-7 border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-5 group-hover:scale-110 transition-transform">
                <FlaskConical className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('fertilizer_title')}</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-6">
                {t('fertilizer_desc')}
              </p>
              <Link to="/fertilizer-recommendation" className="inline-flex items-center text-sm font-bold text-amber-700 hover:text-amber-800">
                Calculate Dosage <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Tool 4: Live Weather */}
            <div className="group bg-white rounded-3xl p-7 border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold mb-5 group-hover:scale-110 transition-transform">
                <CloudSun className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('weather_title')}</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-6">
                {t('weather_desc')}
              </p>
              <Link to="/weather" className="inline-flex items-center text-sm font-bold text-sky-700 hover:text-sky-800">
                Check District Forecast <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Tool 5: Market Prices */}
            <div className="group bg-white rounded-3xl p-7 border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-5 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('market_title')}</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-6">
                {t('market_desc')}
              </p>
              <Link to="/market-prices" className="inline-flex items-center text-sm font-bold text-emerald-700 hover:text-emerald-800">
                Explore Mandi Rates <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Tool 6: AI Agronomist */}
            <div className="group bg-white rounded-3xl p-7 border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-5 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('ai_bot_title')}</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-6">
                {t('ai_bot_desc')}
              </p>
              <Link to="/ai-assistant" className="inline-flex items-center text-sm font-bold text-purple-700 hover:text-purple-800">
                Chat with Agronomist <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 4. LIVE MANDI PRICES TICKER SECTION */}
      <section className="py-14 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Today's Mandi Market Highlights</h3>
              <p className="text-xs text-gray-500 mt-0.5">Real-time commodity modal rates from APMC Mandis</p>
            </div>
            <Link to="/market-prices" className="mt-3 md:mt-0 text-xs font-bold text-emerald-700 hover:underline flex items-center">
              View All Mandi Rates <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {marketHighlights.map((m, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-emerald-300 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{m.crop_name}</h4>
                    <p className="text-xs text-gray-500">{m.market_name}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${m.trend === 'UP' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                    {m.trend}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-baseline justify-between">
                  <span className="text-lg font-extrabold text-emerald-800">₹ {m.modal_price.toLocaleString()}</span>
                  <span className="text-xs text-gray-400 font-medium">{m.unit || '₹ / Quintal'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Questions & Answers</span>
            <h2 className="text-3xl font-extrabold text-gray-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={faq.id || index}
                className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between font-bold text-gray-900 hover:text-emerald-700 text-sm sm:text-base"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${activeFaq === index ? 'rotate-180 text-emerald-600' : ''}`} />
                </button>
                {activeFaq === index && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="py-16 bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight max-w-2xl mx-auto">
            Empower Your Farm With AI Intelligence Today
          </h2>
          <p className="text-emerald-100 text-sm sm:text-base max-w-xl mx-auto">
            Join thousands of progressive farmers optimizing their crop yield and selling direct on KisanMitra AI.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 bg-white text-emerald-800 font-bold rounded-xl shadow-lg hover:bg-emerald-50 transition-all"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="px-8 py-3.5 bg-emerald-600/60 border border-white/30 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all"
            >
              Farmer Login
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
