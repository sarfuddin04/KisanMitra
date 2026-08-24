import React, { useState, useEffect } from 'react';
import { Bug, Plus, Trash2, Edit3, X, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

export const AdminDiseases = () => {
  const [diseases, setDiseases] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    crop_name: 'Tomato',
    scientific_name: '',
    pathogen_type: 'Fungal',
    symptoms: '',
    causes: '',
    prevention: '',
    chemical_treatment: '',
    organic_treatment: '',
    severity_level: 'High',
    is_active: true
  });

  const fetchDiseases = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/diseases');
      setDiseases(res.data || []);
    } catch (err) {
      console.error("Failed to load diseases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiseases();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      crop_name: 'Tomato',
      scientific_name: '',
      pathogen_type: 'Fungal',
      symptoms: '',
      causes: '',
      prevention: '',
      chemical_treatment: '',
      organic_treatment: '',
      severity_level: 'High',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/admin/diseases/${editingItem.id}`, formData);
      } else {
        await api.post('/admin/diseases', formData);
      }
      setIsModalOpen(false);
      fetchDiseases();
    } catch (err) {
      alert("Failed to save disease.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this disease record?")) {
      try {
        await api.delete(`/admin/diseases/${id}`);
        fetchDiseases();
      } catch (err) {
        alert("Failed to delete disease.");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Bug className="w-7 h-7 text-teal-400" />
            <span>Plant Pathology Master & Disease Knowledge Base</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Maintain symptoms, fungal/bacterial pathogens, and organic + chemical remedies for the AI vision scanner
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Disease Pathology</span>
        </button>
      </div>

      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading pathology records...</div>
        ) : diseases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-4 px-6">Disease Pathology</th>
                  <th className="py-4 px-6">Target Crop</th>
                  <th className="py-4 px-6">Pathogen & Severity</th>
                  <th className="py-4 px-6">Remedy Overview</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {diseases.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-white text-sm block">{d.name}</span>
                      <span className="text-[10px] text-slate-500 italic">{d.scientific_name}</span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-300">{d.crop_name}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        d.severity_level === 'Critical' || d.severity_level === 'High'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {d.severity_level} • {d.pathogen_type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 max-w-xs truncate">{d.chemical_treatment || d.organic_treatment}</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(d)}
                        className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">No disease records found.</div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[85vh] overflow-y-auto custom-scrollbar space-y-5 relative text-slate-200 animate-in fade-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white">
              {editingItem ? `Edit Pathology: ${editingItem.name}` : 'Register New Crop Disease'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Disease Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Target Crop *</label>
                  <input
                    type="text"
                    required
                    value={formData.crop_name}
                    onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Scientific Name</label>
                  <input
                    type="text"
                    value={formData.scientific_name}
                    onChange={(e) => setFormData({ ...formData, scientific_name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Pathogen Type</label>
                  <select
                    value={formData.pathogen_type}
                    onChange={(e) => setFormData({ ...formData, pathogen_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="Fungal">Fungal</option>
                    <option value="Bacterial">Bacterial</option>
                    <option value="Viral">Viral</option>
                    <option value="Insect Pest">Insect Pest</option>
                    <option value="Nutrient Deficiency">Nutrient Deficiency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Severity Level</label>
                  <select
                    value={formData.severity_level}
                    onChange={(e) => setFormData({ ...formData, severity_level: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Visual Symptoms</label>
                <textarea
                  rows={2}
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Chemical Fungicide / Spray Treatment</label>
                <textarea
                  rows={2}
                  value={formData.chemical_treatment}
                  onChange={(e) => setFormData({ ...formData, chemical_treatment: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Organic & Bio-Remediation</label>
                <textarea
                  rows={2}
                  value={formData.organic_treatment}
                  onChange={(e) => setFormData({ ...formData, organic_treatment: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-400 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Save Pathology Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
