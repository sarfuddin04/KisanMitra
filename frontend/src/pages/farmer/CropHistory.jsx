import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, FileDown, ArrowLeft, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export const CropHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/recommendations/history');
        setHistory(res.data || []);
      } catch (err) {
        console.error("Failed to load crop history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/crop-recommendation" className="text-xs font-bold text-emerald-700 hover:underline flex items-center mb-1">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Crop Advisory
          </Link>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            Soil Test & Crop Recommendation History
          </h2>
          <p className="text-xs text-gray-500">
            Archive of all machine learning soil evaluations performed for your farm
          </p>
        </div>

        <Link
          to="/crop-recommendation"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
        >
          <Sprout className="w-4 h-4" />
          <span>New Soil Test</span>
        </Link>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading history records...</div>
        ) : history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Recommended Crop</th>
                  <th className="py-4 px-6">Confidence</th>
                  <th className="py-4 px-6">Soil Parameters (N-P-K-pH)</th>
                  <th className="py-4 px-6">Climate (Temp / Rain)</th>
                  <th className="py-4 px-6 text-right">PDF Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {history.map((row) => (
                  <tr key={row.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-4 px-6 text-gray-500">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-emerald-900 text-sm">{row.recommended_crop}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[10px]">
                        {(row.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600 font-mono text-[11px]">
                      N:{row.suitable_conditions?.n || row.suitable_conditions?.nitrogen_input} | 
                      P:{row.suitable_conditions?.p || row.suitable_conditions?.phosphorus_input} | 
                      K:{row.suitable_conditions?.k || row.suitable_conditions?.potassium_input} | 
                      pH:{row.suitable_conditions?.ph || row.suitable_conditions?.soil_ph}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {row.suitable_conditions?.temperature || row.suitable_conditions?.temperature_c}°C • 
                      {row.suitable_conditions?.rainfall || row.suitable_conditions?.rainfall_mm}mm
                    </td>
                    <td className="py-4 px-6 text-right">
                      <a
                        href={`/api/recommendations/${row.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 transition-all"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <Sprout className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="font-bold text-gray-700">No Soil Test Records Found</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Run your first agronomic soil assessment to get crop recommendations and generate official PDF reports.
            </p>
            <Link
              to="/crop-recommendation"
              className="inline-block px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md"
            >
              Start Soil Assessment
            </Link>
          </div>
        )}
      </div>

    </div>
  );
};
