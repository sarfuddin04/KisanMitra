import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, Trash2, Clock, MessageSquare, X } from 'lucide-react';
import api from '../../services/api';

export const AdminContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/contacts');
      setContacts(res.data || []);
    } catch (err) {
      console.error("Failed to load contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const markResolved = async (id) => {
    try {
      await api.put(`/admin/contacts/${id}/resolve`);
      setContacts(contacts.map(c => c.id === id ? { ...c, is_resolved: true } : c));
    } catch (err) {
      alert("Failed to resolve contact message.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this inquiry record?")) {
      try {
        await api.delete(`/admin/contacts/${id}`);
        setContacts(contacts.filter(c => c.id !== id));
      } catch (err) {
        alert("Failed to delete inquiry.");
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <Mail className="w-7 h-7 text-teal-400" />
          <span>Farmer Inquiries & Support Messages</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Review feedback, partnerships, agronomy questions, and contact submissions
        </p>
      </div>

      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading inquiries...</div>
        ) : contacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-4 px-6">Sender / Farmer</th>
                  <th className="py-4 px-6">Subject & Email</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-white text-sm">
                      {c.name}
                      <span className="text-[10px] text-slate-500 block font-normal">{c.phone || 'No phone'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-200 block">{c.subject}</span>
                      <span className="text-[10px] text-slate-400">{c.email}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        c.is_resolved ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {c.is_resolved ? 'Resolved' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => setSelectedMsg(c)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg border border-slate-700"
                      >
                        Read
                      </button>
                      {!c.is_resolved && (
                        <button
                          onClick={() => markResolved(c.id)}
                          className="p-1.5 text-emerald-400 hover:bg-slate-800 rounded-lg"
                          title="Mark Resolved"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg"
                        title="Delete inquiry"
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
          <div className="p-12 text-center text-xs text-slate-500">No contact messages received.</div>
        )}
      </div>

      {/* Message Reader Modal */}
      {selectedMsg && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 relative text-slate-200 animate-in fade-in">
            <button
              onClick={() => setSelectedMsg(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Inquiry Details</span>
              <h3 className="text-xl font-black text-white mt-1">{selectedMsg.subject}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                From: <b>{selectedMsg.name}</b> ({selectedMsg.email}) • Phone: {selectedMsg.phone || 'N/A'}
              </p>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-2xl text-xs text-slate-200 whitespace-pre-line leading-relaxed border border-slate-700">
              {selectedMsg.message}
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              {!selectedMsg.is_resolved && (
                <button
                  onClick={() => { markResolved(selectedMsg.id); setSelectedMsg(null); }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                >
                  Mark as Resolved
                </button>
              )}
              <button
                onClick={() => setSelectedMsg(null)}
                className="px-4 py-2 bg-slate-800 text-slate-400 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
