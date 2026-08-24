import React, { useState } from 'react';
import { FlaskConical, CheckCircle2, AlertCircle, Sparkles, RefreshCw, Leaf } from 'lucide-react';
import api from '../../services/api';

export const FertilizerRecommendation = () => {
  const [formData, setFormData] = useState({
    crop_name: 'Wheat',
    soil_n: 45.0,
    soil_p: 18.0,
    soil_k: 25.0,
    soil_ph: 6.5,
    soil_condition: 'Normal'
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/fertilizer/recommend', formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to compute fertilizer recommendation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
          <FlaskConical className="w-7 h-7 text-amber-600" />
          <span>Fertilizer Advisory & Nutrient Gap Calculator</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Calculate exact soil nutrient deficiencies and match optimal fertilizers from the dynamic database
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Input Form */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Target Crop *</label>
              <select
                value={formData.crop_name}
                onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
              >
                <option value="Wheat">Wheat (Rabi Cereal)</option>
                <option value="Rice">Rice / Paddy (Kharif Cereal)</option>
                <option value="Maize">Maize (Cereal)</option>
                <option value="Chickpea">Chickpea / Chana (Pulse)</option>
                <option value="Cotton">Cotton (Cash Crop)</option>
                <option value="Mustard">Mustard (Oilseed)</option>
                <option value="Banana">Banana (Fruit)</option>
                <option value="Potato">Potato (Tuber)</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Soil N (kg/ha)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={formData.soil_n}
                  onChange={(e) => setFormData({ ...formData, soil_n: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-amber-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Soil P (kg/ha)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={formData.soil_p}
                  onChange={(e) => setFormData({ ...formData, soil_p: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-amber-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Soil K (kg/ha)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={formData.soil_k}
                  onChange={(e) => setFormData({ ...formData, soil_k: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-amber-900 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Soil pH</label>
                <input
                  type="number"
                  step="0.1"
                  min="4.0"
                  max="9.5"
                  required
                  value={formData.soil_ph}
                  onChange={(e) => setFormData({ ...formData, soil_ph: parseFloat(e.target.value) || 7.0 })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-amber-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Soil Moisture / Condition</label>
                <select
                  value={formData.soil_condition}
                  onChange={(e) => setFormData({ ...formData, soil_condition: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-800 bg-white"
                >
                  <option value="Normal">Normal Moisture</option>
                  <option value="Dry">Dry / Arid Soil</option>
                  <option value="Moist">Adequately Moist</option>
                  <option value="Waterlogged">Saturated / Wet</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center space-x-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-700 hover:to-emerald-700 text-white font-bold rounded-2xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Calculating Nutrient Balance...</span>
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4" />
                  <span>Recommend Optimal Fertilizer</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Result Column */}
        <div className="lg:col-span-6 space-y-6">
          {result ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-400 shadow-xl space-y-5 animate-in fade-in slide-in-from-bottom-3">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                  Nutrient Status: {result.npk_deficiency}
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  Dosage: {result.dosage_kg_per_acre} kg / Acre
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Recommended Fertilizer Product</p>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
                  {result.recommended_fertilizer}
                </h3>
              </div>

              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1.5">
                <p className="font-bold text-amber-900 flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 mr-1.5 shrink-0" />
                  Application Schedule & Timing:
                </p>
                <p className="leading-relaxed text-amber-800 font-medium">
                  {result.application_schedule}
                </p>
              </div>

              {result.precautions && (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-700 space-y-1">
                  <p className="font-bold text-gray-900">Safety & Field Precautions:</p>
                  <p className="leading-relaxed">{result.precautions}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-gray-200/80 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto">
                <FlaskConical className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-gray-800">Nutrient Gap Calculator</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                Provide your crop and soil test numbers to determine the exact fertilizer formula and application schedule needed.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
