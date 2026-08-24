import React, { useState, useEffect } from 'react';
import { Users, Search, Trash2, Shield, UserCheck, CheckCircle2, XCircle, UserPlus, X, Lock, Mail, Phone, MapPin, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role_name: 'ADMIN',
    farm_location: 'Central Administration Hub'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = '/admin/users?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      const res = await api.get(url);
      setUsers(res.data || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleStatus = async (id) => {
    try {
      await api.put(`/admin/users/${id}/status`);
      setUsers(users.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
    } catch (err) {
      alert("Failed to update user status.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this user?")) {
      try {
        await api.delete(`/admin/users/${id}`);
        setUsers(users.filter(u => u.id !== id));
      } catch (err) {
        alert("Failed to delete user.");
      }
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setModalError('');
    setSuccessMsg('');

    if (formData.password.length < 6) {
      setModalError('Password must be at least 6 characters long.');
      return;
    }

    setModalLoading(true);
    try {
      await api.post('/admin/users', {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
        role_name: formData.role_name,
        farm_location: formData.farm_location.trim()
      });

      setSuccessMsg(`Account created successfully for ${formData.full_name} (${formData.role_name})`);
      setIsModalOpen(false);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role_name: 'ADMIN',
        farm_location: 'Central Administration Hub'
      });
      fetchUsers();
    } catch (err) {
      console.error("Failed to create admin:", err);
      const detail = err.response?.data?.detail;
      let msg = 'Failed to create user account. Please check the inputs.';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map(d => d.msg || d.detail || JSON.stringify(d)).join(', ');
      } else if (detail && typeof detail === 'object') {
        msg = Object.values(detail).join(', ') || JSON.stringify(detail);
      }
      setModalError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Users className="w-7 h-7 text-purple-400" />
            <span>User Management & Authorization</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            View registered farmers, administrators, account statuses, and create new admin users
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 text-xs rounded-xl text-white outline-hidden focus:ring-2 focus:ring-purple-500 w-56"
            />
          </div>

          <button
            onClick={() => {
              setModalError('');
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-purple-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Create New Admin</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/80 text-emerald-300 rounded-2xl text-xs flex items-center justify-between border border-emerald-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading user records...</div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-4 px-6">User / Admin Name</th>
                  <th className="py-4 px-6">Email & Phone</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Department / Location</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-white text-sm block">{u.full_name}</span>
                      <span className="text-[10px] text-slate-500">Joined: {new Date(u.created_at).toLocaleDateString()}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="block text-slate-300 font-semibold">{u.email}</span>
                      <span className="text-[10px] text-slate-500">{u.phone || 'No phone'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md flex items-center space-x-1 w-fit ${
                        u.role_name === 'ADMIN' ? 'bg-purple-900/60 text-purple-300 border border-purple-700' : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                      }`}>
                        {u.role_name === 'ADMIN' && <Shield className="w-3 h-3 text-purple-400 mr-1" />}
                        <span>{u.role_name || 'FARMER'}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {u.profile?.farm_location || 'Not Specified'}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleStatus(u.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 ${
                          u.is_active ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                        }`}
                      >
                        {u.is_active ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-red-400" />}
                        <span>{u.is_active ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {u.role_name !== 'ADMIN' && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">No users found.</div>
        )}
      </div>

      {/* Modal: Create New Admin / User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 text-slate-100 animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Create New Administrator</h3>
                  <p className="text-[11px] text-slate-400">Add an administrator with management privileges</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-950/70 border border-red-800 text-red-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Role Type</label>
                  <select
                    value={formData.role_name}
                    onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                  >
                    <option value="ADMIN">ADMIN (Full Control)</option>
                    <option value="FARMER">FARMER (Standard User)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin.rahul@kisanmitra.ai"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Mobile Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 9811002233"
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Department / Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={formData.farm_location}
                      onChange={(e) => setFormData({ ...formData, farm_location: e.target.value })}
                      placeholder="e.g. HQ Agronomy Dept"
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Password * (Min 6 characters)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter secure password"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5"
                >
                  <span>{modalLoading ? 'Creating...' : 'Create Account'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

