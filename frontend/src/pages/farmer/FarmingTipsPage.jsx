import React, { useState, useEffect } from 'react';
import { Lightbulb, Search, BookOpen, User, Calendar, X } from 'lucide-react';
import api from '../../services/api';

const CATEGORIES = [
  "All",
  "Crop Management",
  "Irrigation",
  "Fertilizer",
  "Pest Management",
  "Harvesting",
  "Soil Management",
  "Seasonal Tips"
];

export const FarmingTipsPage = () => {
  const [tips, setTips] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedTip, setSelectedTip] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTips = async () => {
    setLoading(true);
    try {
      let url = '/farming-tips?';
      if (activeCategory !== 'All') url += `category=${encodeURIComponent(activeCategory)}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await api.get(url);
      setTips(res.data || []);
    } catch (err) {
      console.error("Failed to load farming tips:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTips();
  }, [activeCategory]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
          <Lightbulb className="w-7 h-7 text-amber-500" />
          <span>Good Agricultural Practices (GAP) & Farming Tips</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Scientifically verified agronomy techniques for soil health, micro-irrigation, IPM, and post-harvest care
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 custom-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tips Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tips.map((tip) => (
          <div
            key={tip.id}
            onClick={() => setSelectedTip(tip)}
            className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                  {tip.category}
                </span>
                <span className="text-gray-400">{tip.season}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-base leading-snug">{tip.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                {tip.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs font-bold text-emerald-700">
              <span className="text-[11px] text-gray-400 font-normal">By {tip.author}</span>
              <span className="flex items-center">Read Full Guide →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedTip && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[85vh] overflow-y-auto custom-scrollbar space-y-5 relative animate-in fade-in">
            <button
              onClick={() => setSelectedTip(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-800 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-bold">
                {selectedTip.category} • {selectedTip.season}
              </span>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">{selectedTip.title}</h3>
              <p className="text-xs text-gray-400">Author: {selectedTip.author}</p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl text-xs text-emerald-950 font-medium leading-relaxed border border-emerald-200/80">
              <b>Summary:</b> {selectedTip.summary}
            </div>

            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line space-y-3">
              {selectedTip.detailed_content}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedTip(null)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
