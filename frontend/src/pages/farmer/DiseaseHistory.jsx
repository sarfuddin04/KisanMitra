import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ScanEye, FileDown, ArrowLeft, Bug, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

export const DiseaseHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/disease/history');
        setHistory(res.data || []);
      } catch (err) {
        console.error("Failed to load disease scan history:", err);
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
          <Link to="/disease-detection" className="text-xs font-bold text-teal-700 hover:underline flex items-center mb-1">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Leaf Scanner
          </Link>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            Leaf Pathology & Disease Scan History
          </h2>
          <p className="text-xs text-gray-500">
            Archive of all AI leaf scans and pathology diagnostic records
          </p>
        </div>

        <Link
          to="/disease-detection"
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
        >
          <ScanEye className="w-4 h-4" />
          <span>New Leaf Scan</span>
        </Link>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading scan records...</div>
        ) : history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Crop</th>
                  <th className="py-4 px-6">Diagnosed Pathology</th>
                  <th className="py-4 px-6">Severity</th>
                  <th className="py-4 px-6">Confidence</th>
                  <th className="py-4 px-6 text-right">PDF Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {history.map((row) => (
                  <tr key={row.id} className="hover:bg-teal-50/30 transition-colors">
                    <td className="py-4 px-6 text-gray-500">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900">
                      {row.crop_selected || "General"}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-teal-950 block">{row.predicted_disease}</span>
                      <span className="text-[10px] text-gray-400">{row.pathogen_type || "Fungal"}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        row.severity === 'Critical' || row.severity === 'High'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {row.severity || "Moderate"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-teal-700 font-bold">
                        {(row.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <a
                        href={`/api/disease/${row.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold border border-teal-200 transition-all"
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
            <Bug className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="font-bold text-gray-700">No Leaf Scans Found</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Scan your first diseased leaf photograph to identify crop pathogens and access instant remediation plans.
            </p>
            <Link
              to="/disease-detection"
              className="inline-block px-5 py-2.5 bg-teal-600 text-white font-bold rounded-xl text-xs shadow-md"
            >
              Start Leaf Scan
            </Link>
          </div>
        )}
      </div>

    </div>
  );
};
