import React, { useState, useEffect } from 'react';
import {
  MapPin, Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
  ChevronDown, Building2, Globe, Map, Search, X, Check,
  Clock, Phone, Tag, Navigation
} from 'lucide-react';
import api from '../../services/api';
import { ImageUpload } from '../../components/ImageUpload';

// ==================== HELPERS ====================

const statusBadge = (active) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
    active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
  }`}>
    {active ? '● Active' : '○ Inactive'}
  </span>
);

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h3 className="text-lg font-black text-gray-900">{title}</h3>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const FormField = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-bold text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const inputClass = "w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 outline-none transition-all";


// ==================== STATES TAB ====================

const StatesTab = () => {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/states');
      setStates(res.data || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ name: '', is_active: true }); setEditing(null); setError(''); setModal('add'); };
  const openEdit = (s) => { setForm({ name: s.name, is_active: s.is_active }); setEditing(s); setError(''); setModal('edit'); };

  const save = async () => {
    if (!form.name.trim()) { setError('State name is required.'); return; }
    setSaving(true); setError('');
    try {
      if (editing) {
        await api.put(`/admin/states/${editing.id}`, form);
      } else {
        await api.post('/admin/states', form);
      }
      setModal(null);
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || 'Save failed.');
    }
    setSaving(false);
  };

  const toggleStatus = async (s) => {
    try { await api.put(`/admin/states/${s.id}`, { is_active: !s.is_active }); load(); } catch { }
  };

  const del = async (s) => {
    if (!window.confirm(`Delete state "${s.name}"? This will also delete all its districts and mandis.`)) return;
    try { await api.delete(`/admin/states/${s.id}`); load(); } catch (e) {
      alert(e?.response?.data?.detail || 'Delete failed.');
    }
  };

  const filtered = states.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input type="text" placeholder="Search states..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all">
          <Plus className="w-4 h-4" /> Add State
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading states...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">No states found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">#</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">State Name</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                <th className="py-3 px-4 text-right text-xs font-bold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s, i) => (
                <tr key={s.id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="py-3 px-4 text-gray-400 text-xs">{i + 1}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-500" /> {s.name}
                  </td>
                  <td className="py-3 px-4">{statusBadge(s.is_active)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => toggleStatus(s)} title={s.is_active ? 'Deactivate' : 'Activate'}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
                        {s.is_active ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => del(s)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add New State' : `Edit: ${editing?.name}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <FormField label="State Name" required>
              <input className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Uttar Pradesh" />
            </FormField>
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-gray-700">Active</label>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded" />
            </div>
            {error && <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};


// ==================== DISTRICTS TAB ====================

const DistrictsTab = () => {
  const [districts, setDistricts] = useState([]);
  const [states, setStates] = useState([]);
  const [filterState, setFilterState] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ state_id: '', name: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadStates = async () => {
    try { const r = await api.get('/admin/states'); setStates(r.data || []); } catch { }
  };
  const loadDistricts = async () => {
    setLoading(true);
    try {
      const params = filterState ? `?state_id=${filterState}` : '';
      const r = await api.get(`/admin/districts${params}`);
      setDistricts(r.data || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { loadStates(); }, []);
  useEffect(() => { loadDistricts(); }, [filterState]);

  const openAdd = () => { setForm({ state_id: filterState || '', name: '', is_active: true }); setEditing(null); setError(''); setModal('add'); };
  const openEdit = (d) => { setForm({ state_id: d.state_id, name: d.name, is_active: d.is_active }); setEditing(d); setError(''); setModal('edit'); };

  const save = async () => {
    if (!form.state_id) { setError('Please select a state.'); return; }
    if (!form.name.trim()) { setError('District name is required.'); return; }
    setSaving(true); setError('');
    try {
      if (editing) { await api.put(`/admin/districts/${editing.id}`, { ...form, state_id: Number(form.state_id) }); }
      else { await api.post('/admin/districts', { ...form, state_id: Number(form.state_id) }); }
      setModal(null); loadDistricts();
    } catch (e) { setError(e?.response?.data?.detail || 'Save failed.'); }
    setSaving(false);
  };

  const toggleStatus = async (d) => {
    try { await api.put(`/admin/districts/${d.id}`, { is_active: !d.is_active }); loadDistricts(); } catch { }
  };
  const del = async (d) => {
    if (!window.confirm(`Delete district "${d.name}"? This will also delete all its mandis.`)) return;
    try { await api.delete(`/admin/districts/${d.id}`); loadDistricts(); } catch (e) {
      alert(e?.response?.data?.detail || 'Delete failed.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <select value={filterState} onChange={e => setFilterState(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">All States</option>
          {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all">
          <Plus className="w-4 h-4" /> Add District
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-sm text-gray-400">Loading...</div>
          : districts.length === 0 ? <div className="p-12 text-center text-sm text-gray-400">No districts found.</div>
          : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">#</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">District</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">State</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                  <th className="py-3 px-4 text-right text-xs font-bold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {districts.map((d, i) => (
                  <tr key={d.id} className="hover:bg-emerald-50/30">
                    <td className="py-3 px-4 text-gray-400 text-xs">{i + 1}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-2">
                      <Map className="w-4 h-4 text-blue-400" /> {d.name}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{d.state_name}</td>
                    <td className="py-3 px-4">{statusBadge(d.is_active)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => toggleStatus(d)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                          {d.is_active ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => del(d)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add New District' : `Edit: ${editing?.name}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <FormField label="State" required>
              <select className={inputClass} value={form.state_id} onChange={e => setForm({ ...form, state_id: e.target.value })}>
                <option value="">Select State...</option>
                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>
            <FormField label="District Name" required>
              <input className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Lucknow" />
            </FormField>
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-gray-700">Active</label>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-emerald-500" />
            </div>
            {error && <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};


// ==================== MANDIS TAB ====================

const MandiForm = ({ states, form, setForm }) => {
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    if (form.state_id) {
      api.get(`/states/${form.state_id}/districts`).then(r => setDistricts(r.data || [])).catch(() => setDistricts([]));
    } else {
      setDistricts([]);
    }
  }, [form.state_id]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <FormField label="State" required>
          <select className={inputClass} value={form.state_id} onChange={e => setForm({ ...form, state_id: e.target.value, district_id: '' })}>
            <option value="">Select State...</option>
            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FormField>
      </div>
      <div className="col-span-2">
        <FormField label="District" required>
          <select className={inputClass} value={form.district_id} onChange={e => setForm({ ...form, district_id: e.target.value })} disabled={!form.state_id}>
            <option value="">Select District...</option>
            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </FormField>
      </div>
      <div className="col-span-2">
        <FormField label="Mandi Name" required>
          <input className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Lucknow Mandi" />
        </FormField>
      </div>
      <div className="col-span-2">
        <FormField label="Address">
          <input className={inputClass} value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full address..." />
        </FormField>
      </div>
      <FormField label="PIN Code">
        <input className={inputClass} value={form.pincode || ''} onChange={e => setForm({ ...form, pincode: e.target.value })} placeholder="110001" />
      </FormField>
      <FormField label="Contact Number">
        <input className={inputClass} value={form.contact_number || ''} onChange={e => setForm({ ...form, contact_number: e.target.value })} placeholder="+91-XXXXXXXXXX" />
      </FormField>
      <FormField label="Opening Time">
        <input className={inputClass} type="time" value={form.opening_time || ''} onChange={e => setForm({ ...form, opening_time: e.target.value })} />
      </FormField>
      <FormField label="Closing Time">
        <input className={inputClass} type="time" value={form.closing_time || ''} onChange={e => setForm({ ...form, closing_time: e.target.value })} />
      </FormField>
      <FormField label="Latitude">
        <input className={inputClass} type="number" step="0.000001" value={form.latitude || ''} onChange={e => setForm({ ...form, latitude: e.target.value })} placeholder="28.6139" />
      </FormField>
      <FormField label="Longitude">
        <input className={inputClass} type="number" step="0.000001" value={form.longitude || ''} onChange={e => setForm({ ...form, longitude: e.target.value })} placeholder="77.2090" />
      </FormField>
      <div className="col-span-2">
        <FormField label="Mandi Type">
          <select className={inputClass} value={form.mandi_type || 'APMC Mandi'} onChange={e => setForm({ ...form, mandi_type: e.target.value })}>
            <option>APMC Mandi</option>
            <option>Rural Haat</option>
            <option>Wholesale</option>
            <option>Terminal</option>
          </select>
        </FormField>
      </div>
      <div className="col-span-2">
        <ImageUpload
          currentImageUrl={form.image_url || null}
          onImageUploaded={(url) => setForm({ ...form, image_url: url })}
          onImageDeleted={() => setForm({ ...form, image_url: '' })}
          category="mandi"
          label="Mandi Image"
        />
      </div>
      <div className="col-span-2 flex items-center gap-3">
        <label className="text-xs font-bold text-gray-700">Active</label>
        <input type="checkbox" checked={form.is_active !== false} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-emerald-500" />
      </div>
    </div>
  );
};

const MandisTab = () => {
  const [mandis, setMandis] = useState([]);
  const [states, setStates] = useState([]);
  const [filterState, setFilterState] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterDistricts, setFilterDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ state_id: '', district_id: '', name: '', address: '', pincode: '', contact_number: '', opening_time: '', closing_time: '', latitude: '', longitude: '', mandi_type: 'APMC Mandi', image_url: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadStates = async () => {
    try { const r = await api.get('/admin/states'); setStates(r.data || []); } catch { }
  };
  const loadMandis = async () => {
    setLoading(true);
    try {
      let params = [];
      if (filterDistrict) params.push(`district_id=${filterDistrict}`);
      else if (filterState) params.push(`state_id=${filterState}`);
      const r = await api.get(`/admin/mandis${params.length ? '?' + params.join('&') : ''}`);
      setMandis(r.data || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { loadStates(); }, []);
  useEffect(() => {
    if (filterState) {
      api.get(`/states/${filterState}/districts`).then(r => setFilterDistricts(r.data || [])).catch(() => setFilterDistricts([]));
      setFilterDistrict('');
    } else {
      setFilterDistricts([]);
      setFilterDistrict('');
    }
  }, [filterState]);
  useEffect(() => { loadMandis(); }, [filterState, filterDistrict]);

  const emptyForm = () => ({ state_id: filterState || '', district_id: '', name: '', address: '', pincode: '', contact_number: '', opening_time: '', closing_time: '', latitude: '', longitude: '', mandi_type: 'APMC Mandi', image_url: '', is_active: true });

  const openAdd = () => { setForm(emptyForm()); setEditing(null); setError(''); setModal('add'); };
  const openEdit = (m) => {
    setForm({
      state_id: m.state_id || '', district_id: m.district_id, name: m.name, address: m.address || '',
      pincode: m.pincode || '', contact_number: m.contact_number || '', opening_time: m.opening_time || '',
      closing_time: m.closing_time || '', latitude: m.latitude || '', longitude: m.longitude || '',
      mandi_type: m.mandi_type || 'APMC Mandi', image_url: m.image_url || '', is_active: m.is_active
    });
    setEditing(m); setError(''); setModal('edit');
  };

  const save = async () => {
    if (!form.district_id) { setError('Please select a district.'); return; }
    if (!form.name.trim()) { setError('Mandi name is required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        district_id: Number(form.district_id),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      };
      delete payload.state_id;
      if (editing) { await api.put(`/admin/mandis/${editing.id}`, payload); }
      else { await api.post('/admin/mandis', payload); }
      setModal(null); loadMandis();
    } catch (e) { setError(e?.response?.data?.detail || 'Save failed.'); }
    setSaving(false);
  };

  const toggleStatus = async (m) => {
    try { await api.put(`/admin/mandis/${m.id}`, { is_active: !m.is_active }); loadMandis(); } catch { }
  };
  const del = async (m) => {
    if (!window.confirm(`Delete mandi "${m.name}"?`)) return;
    try { await api.delete(`/admin/mandis/${m.id}`); loadMandis(); } catch (e) {
      alert(e?.response?.data?.detail || 'Delete failed.');
    }
  };

  const getImgUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace('/api', '');
    return `${base}${url}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 justify-between">
        <div className="flex gap-2 flex-wrap">
          <select value={filterState} onChange={e => setFilterState(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">All States</option>
            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {filterDistricts.length > 0 && (
            <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">All Districts</option>
              {filterDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all">
          <Plus className="w-4 h-4" /> Add Mandi
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-sm text-gray-400">Loading mandis...</div>
          : mandis.length === 0 ? <div className="p-12 text-center text-sm text-gray-400">No mandis found. Add your first mandi.</div>
          : (
            <div className="divide-y divide-gray-100">
              {mandis.map((m) => (
                <div key={m.id} className="flex items-start gap-4 p-4 hover:bg-emerald-50/20 transition-colors">
                  {/* Mandi image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                    {m.image_url ? (
                      <img src={getImgUrl(m.image_url)} alt={m.name} className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm">{m.name}</span>
                      {statusBadge(m.is_active)}
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{m.mandi_type}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="font-medium text-emerald-700">{m.district_name}</span>
                      {m.state_name && <>, {m.state_name}</>}
                    </p>
                    {m.address && <p className="text-xs text-gray-400 mt-0.5 truncate">{m.address} {m.pincode && `- ${m.pincode}`}</p>}
                    <div className="flex gap-3 mt-1 text-[10px] text-gray-400">
                      {m.opening_time && <span>🕐 {m.opening_time} - {m.closing_time}</span>}
                      {m.contact_number && <span>📞 {m.contact_number}</span>}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleStatus(m)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                      {m.is_active ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => del(m)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add New Mandi' : `Edit: ${editing?.name}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <MandiForm states={states} form={form} setForm={setForm} />
            {error && <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-600">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Mandi'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};


// ==================== MAIN PAGE ====================

const TABS = [
  { key: 'states', label: 'States', icon: Globe },
  { key: 'districts', label: 'Districts', icon: Map },
  { key: 'mandis', label: 'Mandis', icon: Building2 },
];

export const AdminLocations = () => {
  const [activeTab, setActiveTab] = useState('states');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-emerald-600" />
          </div>
          Location Management
        </h2>
        <p className="text-sm text-gray-500 mt-1">Manage the 3-tier location hierarchy: States → Districts → Mandis</p>
      </div>

      {/* Hierarchy Info */}
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-sm text-emerald-800 font-medium">
        <Globe className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span>State</span>
        <span className="text-emerald-400">→</span>
        <Map className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span>District</span>
        <span className="text-emerald-400">→</span>
        <Building2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
        <span>Mandi (Multiple per District)</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'states' && <StatesTab />}
      {activeTab === 'districts' && <DistrictsTab />}
      {activeTab === 'mandis' && <MandisTab />}
    </div>
  );
};

export default AdminLocations;
