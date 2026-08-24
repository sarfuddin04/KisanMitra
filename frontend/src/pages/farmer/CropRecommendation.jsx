import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Sparkles, FileDown, History, CheckCircle2, AlertCircle, Info, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const PRESETS = {
  "Paddy / Rice (Kharif Alluvial)": { n: 90, p: 42, k: 43, ph: 6.5, temperature: 25, humidity: 82, rainfall: 220 },
  "Wheat (Rabi Indo-Gangetic)": { n: 100, p: 48, k: 38, ph: 6.8, temperature: 18, humidity: 62, rainfall: 75 },
  "Cotton (Black Soil Vertisol)": { n: 120, p: 45, k: 20, ph: 7.2, temperature: 24, humidity: 80, rainfall: 85 },
  "Chickpea (Pulse Legume)": { n: 35, p: 68, k: 80, ph: 7.4, temperature: 20, humidity: 18, rainfall: 78 },
  "Mustard (Oilseed Cool Season)": { n: 75, p: 40, k: 30, ph: 6.9, temperature: 18, humidity: 65, rainfall: 45 },
  "Banana (Fruit / High Potash)": { n: 100, p: 80, k: 50, ph: 6.0, temperature: 28, humidity: 80, rainfall: 105 }
};

export const CropRecommendation = () => {
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    n: 90,
    p: 42,
    k: 43,
    ph: 6.5,
    temperature: 25.0,
    humidity: 80.0,
    rainfall: 200.0
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const applyPreset = (presetKey) => {
    if (PRESETS[presetKey]) {
      setFormData(PRESETS[presetKey]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.post('/recommendations/crop', formData);
      setResult(res.data);
      // Trigger festive confetti animation
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate recommendation. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
            <Sprout className="w-7 h-7 text-emerald-600" />
            <span>AI Crop Recommendation Advisory</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Machine learning soil NPK and micro-climate crop suitability model (ICAR validated)
          </p>
        </div>

        <Link
          to="/crop-history"
          className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5"
        >
          <History className="w-4 h-4" />
          <span>View Previous Soil Tests</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
          
          {/* Presets selector */}
          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/60 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-emerald-900 flex items-center">
              <Sparkles className="w-4 h-4 mr-1 text-emerald-600" />
              Quick Sample Presets:
            </span>
            <select
              onChange={(e) => applyPreset(e.target.value)}
              className="text-xs font-semibold bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-emerald-900 outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Choose Sample Soil Condition --</option>
              {Object.keys(PRESETS).map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs flex items-center space-x-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* NPK Row */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                1. Soil Chemical Macronutrients (NPK)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nitrogen (N)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="250"
                    required
                    value={formData.n}
                    onChange={(e) => setFormData({ ...formData, n: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-sm font-bold text-emerald-900 bg-white"
                  />
                  <span className="text-[10px] text-gray-400">kg / hectare</span>
                </div>

                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phosphorus (P)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="250"
                    required
                    value={formData.p}
                    onChange={(e) => setFormData({ ...formData, p: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-sm font-bold text-emerald-900 bg-white"
                  />
                  <span className="text-[10px] text-gray-400">kg / hectare</span>
                </div>

                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Potassium (K)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="250"
                    required
                    value={formData.k}
                    onChange={(e) => setFormData({ ...formData, k: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-sm font-bold text-emerald-900 bg-white"
                  />
                  <span className="text-[10px] text-gray-400">kg / hectare</span>
                </div>
              </div>
            </div>

            {/* Soil pH & Temp */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                2. Soil pH & Environmental Factors
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-700">Soil pH Level</label>
                    <span className="text-xs font-bold text-emerald-700">{formData.ph}</span>
                  </div>
                  <input
                    type="range"
                    step="0.1"
                    min="4.0"
                    max="9.5"
                    value={formData.ph}
                    onChange={(e) => setFormData({ ...formData, ph: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>Acidic (4.0)</span>
                    <span>Neutral (7.0)</span>
                    <span>Alkaline (9.5)</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-700">Temperature (°C)</label>
                    <span className="text-xs font-bold text-emerald-700">{formData.temperature}°C</span>
                  </div>
                  <input
                    type="range"
                    step="0.5"
                    min="5"
                    max="45"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>Cool (5°C)</span>
                    <span>Moderate (25°C)</span>
                    <span>Hot (45°C)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Humidity & Rainfall */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-700">Relative Humidity (%)</label>
                  <span className="text-xs font-bold text-emerald-700">{formData.humidity}%</span>
                </div>
                <input
                  type="range"
                  step="1"
                  min="10"
                  max="100"
                  value={formData.humidity}
                  onChange={(e) => setFormData({ ...formData, humidity: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-700">Annual Rainfall (mm)</label>
                  <span className="text-xs font-bold text-emerald-700">{formData.rainfall} mm</span>
                </div>
                <input
                  type="range"
                  step="5"
                  min="20"
                  max="400"
                  value={formData.rainfall}
                  onChange={(e) => setFormData({ ...formData, rainfall: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Random Forest Agro Model...</span>
                </>
              ) : (
                <>
                  <Sprout className="w-5 h-5" />
                  <span>Recommend Most Suitable Crop</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* Prediction Results Column */}
        <div className="lg:col-span-5 space-y-6">
          {result ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/80 shadow-xl space-y-5 animate-in fade-in slide-in-from-bottom-3">
              
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                  Verified Match
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  {(result.confidence * 100).toFixed(1)}% Confidence
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Top Recommended Crop</p>
                <h3 className="text-3xl font-black text-emerald-900 mt-1">
                  {result.recommended_crop}
                </h3>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-xs text-emerald-950 space-y-2">
                <p className="font-bold flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5 shrink-0" />
                  Cultivation Strategy & Soil Management:
                </p>
                <p className="text-emerald-800 leading-relaxed font-medium">
                  {result.cultivation_tips}
                </p>
              </div>

              {result.alternative_crops && result.alternative_crops.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-700 mb-1.5">Viable Alternative Crops:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.alternative_crops.map((alt, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-lg">
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* PDF Download Button */}
              {result.id && (
                <a
                  href={`/api/recommendations/${result.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-sm"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download Official PDF Agronomy Report</span>
                </a>
              )}

              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                Report includes ICAR benchmark comparisons, tested NPK ranges, and agronomist signature stamps.
              </p>

            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-gray-200/80 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
                <Sprout className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-gray-800">Ready for Soil Analysis</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                Adjust your soil NPK, pH, and climate parameters on the left and click <b>"Recommend Most Suitable Crop"</b> to run the ML classifier.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
