import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Trash2, Shield, UserCheck, CheckCircle2, XCircle, 
  UserPlus, X, Lock, Mail, Phone, MapPin, AlertCircle, Edit, Sprout, ShieldCheck, Key
} from 'lucide-react';
import api from '../../services/api';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State: Create Admin
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

  // Modal State: Edit User
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editFormData, setEditFormData] = useState({
    id: null,
    full_name: '',
    email: '',
    phone: '',
    role_name: 'ADMIN',
    farm_location: '',
    password: ''
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

  const handleRoleChange = async (user, newRole) => {
    const actionText = newRole === 'ADMIN' ? 'promote this user to ADMIN' : 'change this user to FARMER';
    const confirmMsg = `Are you sure you want to ${actionText}?\n\nNOTE: All existing products, crops, profile, and account data will be 100% saved and intact.`;
    
    if (window.confirm(confirmMsg)) {
      try {
        await api.put(`/admin/users/${user.id}/role`, { role_name: newRole });
        setUsers(users.map(u => u.id === user.id ? { ...u, role_name: newRole } : u));
        setSuccessMsg(`User '${user.full_name}' successfully updated to ${newRole}. All data preserved.`);
      } catch (err) {
        console.error("Failed to update role:", err);
        alert(err.response?.data?.detail || "Failed to update user role.");
      }
    }
  };

  const openEditModal = (user) => {
    setEditError('');
    setEditFormData({
      id: user.id,
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      role_name: user.role_name || 'FARMER',
      farm_location: user.profile?.farm_location || '',
      password: ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);

    try {
      const payload = {
        full_name: editFormData.full_name.trim(),
        phone: editFormData.phone.trim() || undefined,
        role_name: editFormData.role_name,
        farm_location: editFormData.farm_location.trim()
      };
      if (editFormData.password.trim()) {
        if (editFormData.password.length < 6) {
          setEditError("Password must be at least 6 characters.");
          setEditLoading(false);
          return;
        }
        payload.password = editFormData.password.trim();
      }

      const res = await api.put(`/admin/users/${editFormData.id}`, payload);
      setSuccessMsg(`User '${editFormData.full_name}' updated successfully! All existing data preserved.`);
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error("Failed to update user:", err);
      const detail = err.response?.data?.detail;
      let msg = 'Failed to update user account.';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map(d => d.msg || d.detail || JSON.stringify(d)).join(', ');
      }
      setEditError(msg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (user) => {
    const warning = `⚠️ CAUTION: Deleting user '${user.full_name}' (${user.email}) will permanently delete their account.\n\nTip: If you only want to revoke admin privileges, click 'Make Farmer' instead.\nIf you want to suspend their login, click 'Active/Inactive' toggle instead.\n\nAre you sure you still want to permanently delete this user?`;
    if (window.confirm(warning)) {
      try {
        await api.delete(`/admin/users/${user.id}`);
        setUsers(users.filter(u => u.id !== user.id));
        setSuccessMsg(`User deleted successfully.`);
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to delete user.");
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

      setSuccessMsg(`Account successfully saved for ${formData.full_name} (${formData.role_name}). All user data is preserved.`);
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
            Manage users, promote existing farmers to Admin safely without data loss, and configure roles
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
              placeholder="Search by name, email, phone..."
              className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 text-xs rounded-xl text-white outline-hidden focus:ring-2 focus:ring-purple-500 w-64"
            />
          </div>

          <button
            onClick={() => {
              setModalError('');
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Create New Admin</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/80 text-emerald-300 rounded-2xl text-xs flex items-center justify-between border border-emerald-800 shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{successMsg}</span>
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
                  <th className="py-4 px-6">Role & Safe Promotion</th>
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
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md flex items-center space-x-1 ${
                          u.role_name === 'ADMIN' ? 'bg-purple-900/60 text-purple-300 border border-purple-700' : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                        }`}>
                          {u.role_name === 'ADMIN' && <Shield className="w-3 h-3 text-purple-400 mr-1" />}
                          <span>{u.role_name || 'FARMER'}</span>
                        </span>

                        {u.role_name !== 'ADMIN' ? (
                          <button
                            onClick={() => handleRoleChange(u, 'ADMIN')}
                            className="px-2 py-0.5 bg-purple-950 hover:bg-purple-900 text-purple-300 hover:text-white border border-purple-800 rounded text-[10px] font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                            title="Promote to Admin (keeps all user products and data 100% saved)"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Make Admin</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRoleChange(u, 'FARMER')}
                            className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 hover:text-white border border-emerald-800 rounded text-[10px] font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                            title="Change role to Farmer (keeps all data saved)"
                          >
                            <Sprout className="w-3 h-3" />
                            <span>Make Farmer</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {u.profile?.farm_location || 'Not Specified'}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleStatus(u.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer ${
                          u.is_active ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                        }`}
                      >
                        {u.is_active ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <XCircle className="w-3 h-3 text-red-400" />}
                        <span>{u.is_active ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit user details, role, or reset password"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(u)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Delete user account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

            <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl text-[11px] text-purple-200 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>
                <strong>Data Protection:</strong> If this email belongs to an existing farmer or user, their account will be <strong>safely upgraded to Admin</strong> without deleting any of their products, crops, or profile data.
              </span>
            </div>

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
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>{modalLoading ? 'Saving...' : 'Save Account'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal: Edit User & Safe Role / Password Management */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 text-slate-100 animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Edit User Account & Role</h3>
                  <p className="text-[11px] text-slate-400">Update role, details, or password without deleting any data</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-950/70 border border-red-800 text-red-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-[11px] text-emerald-200 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Data Loss:</strong> All products, crop records, orders, and profile details will remain <strong>100% saved and intact</strong> in the database.
              </span>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Account Role</label>
                  <select
                    value={editFormData.role_name}
                    onChange={(e) => setEditFormData({ ...editFormData, role_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-purple-500 outline-hidden font-bold"
                  >
                    <option value="ADMIN">ADMIN (Full Administrative Privileges)</option>
                    <option value="FARMER">FARMER (Standard User)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Email Address (Account ID)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    disabled
                    value={editFormData.email}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-xs text-slate-400 outline-hidden cursor-not-allowed"
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
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
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
                      value={editFormData.farm_location}
                      onChange={(e) => setEditFormData({ ...editFormData, farm_location: e.target.value })}
                      placeholder="e.g. HQ Administration / Farm Location"
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Reset Password <span className="text-slate-400 font-normal">(Leave blank to keep existing password)</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="Enter new password (optional)"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-purple-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>{editLoading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

