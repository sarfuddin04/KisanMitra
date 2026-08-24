import React from 'react';
import { Sprout, ShieldCheck, Award, Cpu, Users, Target, HeartHandshake, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

export const About = () => {
  return (
    <div className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          About KisanMitra AI
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
          Transforming Indian Agriculture Through Artificial Intelligence
        </h1>
        <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
          KisanMitra AI is an advanced Agronomy Intelligence and Market Network platform designed as a Major B.Tech CSE Project to bridge the gap between computer science innovation and smallholder farming.
        </p>
      </div>

      {/* Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Machine Learning Grounding</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Our crop recommendation engine utilizes Random Forest classifiers trained on multi-parameter agro-climatic datasets verified by Indian Council of Agricultural Research (ICAR) benchmarks.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
            <Leaf className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Sustainable & Eco-Friendly</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            We prioritize organic Integrated Pest Management (IPM), bio-fertilizers, water-saving micro-irrigation, and balanced soil remediation practices.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Direct Farmer Prosperity</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            By eliminating middlemen and offering real-time mandi rate tracking alongside a direct producer marketplace, we help farmers achieve fair crop pricing.
          </p>
        </div>
      </div>

      {/* Tech Stack Breakdown */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-3xl p-8 sm:p-12 space-y-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold">System Architecture & Technology Stack</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 text-xs font-semibold">
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
            <p className="text-emerald-300 font-bold uppercase text-[10px]">Frontend UI</p>
            <p className="text-base font-extrabold text-white mt-1">React 19 + Vite + Tailwind</p>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
            <p className="text-emerald-300 font-bold uppercase text-[10px]">Backend Server</p>
            <p className="text-base font-extrabold text-white mt-1">FastAPI + Python</p>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
            <p className="text-emerald-300 font-bold uppercase text-[10px]">Database</p>
            <p className="text-base font-extrabold text-white mt-1">PostgreSQL + SQLAlchemy</p>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
            <p className="text-emerald-300 font-bold uppercase text-[10px]">AI / ML Engines</p>
            <p className="text-base font-extrabold text-white mt-1">Scikit-Learn + ReportLab</p>
          </div>
        </div>
      </div>

    </div>
  );
};
