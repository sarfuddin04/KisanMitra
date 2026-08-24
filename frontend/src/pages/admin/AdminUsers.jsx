import React, { useState, useEffect } from 'react';
import { Users, Search, Trash2, Shield, UserCheck, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../services/api';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Users className="w-7 h-7 text-purple-400" />
            <span>User Management & Authorization</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            View registered farmers, administrators, account statuses, and profiles
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            placeholder="Search users by name or email..."
            className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 text-xs rounded-xl text-white outline-hidden focus:ring-2 focus:ring-purple-500 w-64"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading user records...</div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-4 px-6">User / Farmer Name</th>
                  <th className="py-4 px-6">Email & Phone</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Farm Location</th>
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
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md ${
                        u.role_name === 'ADMIN' ? 'bg-purple-900/60 text-purple-300 border border-purple-700' : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                      }`}>
                        {u.role_name || 'FARMER'}
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

    </div>
  );
};
