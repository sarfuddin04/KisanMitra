import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Trash2, Edit3, X } from 'lucide-react';
import api from '../../services/api';

export const AdminFAQs = () => {
  const [faqs, setFaqs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'Crop Advisory',
    display_order: 1,
    is_active: true
  });

  const fetchFAQs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/faqs');
      setFaqs(res.data || []);
    } catch (err) {
      console.error("Failed to load FAQs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      question: '',
      answer: '',
      category: 'Crop Advisory',
      display_order: faqs.length + 1,
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
        await api.put(`/admin/faqs/${editingItem.id}`, formData);
      } else {
        await api.post('/admin/faqs', formData);
      }
      setIsModalOpen(false);
      fetchFAQs();
    } catch (err) {
      alert("Failed to save FAQ.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this FAQ entry?")) {
      try {
        await api.delete(`/admin/faqs/${id}`);
        fetchFAQs();
      } catch (err) {
        alert("Failed to delete FAQ.");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <HelpCircle className="w-7 h-7 text-indigo-400" />
            <span>Frequently Asked Questions (FAQ) Registry</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Maintain public and farmer knowledgebase questions and responses
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add FAQ Entry</span>
        </button>
      </div>

      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading FAQs...</div>
        ) : faqs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-4 px-6">Order</th>
                  <th className="py-4 px-6">Question</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {faqs.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-mono text-indigo-400 font-bold">{f.display_order}</td>
                    <td className="py-4 px-6 font-bold text-white text-sm max-w-sm truncate">{f.question}</td>
                    <td className="py-4 px-6 text-slate-400">{f.category}</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(f)}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
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
          <div className="p-12 text-center text-xs text-slate-500">No FAQs found.</div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 relative text-slate-200 animate-in fade-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white">
              {editingItem ? 'Edit FAQ' : 'Create FAQ'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Question *</label>
                <input
                  type="text"
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="Crop Advisory">Crop Advisory & ML</option>
                  <option value="Disease Detection">Plant Leaf Pathology</option>
                  <option value="Fertilizer">Fertilizers & Nutrients</option>
                  <option value="Marketplace">Marketplace & Orders</option>
                  <option value="General">General / Kisan Support</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Detailed Answer *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white resize-none"
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Save FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
