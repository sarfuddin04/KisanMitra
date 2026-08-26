import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Search, MapPin, ArrowUpRight, ArrowDownRight, Minus, RefreshCw, Clock, Database, ChevronDown, BarChart3, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const STATUS_COLORS = {
  UPDATED_TODAY: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Updated Today' },
  UPDATED_RECENTLY: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Updated Recently' },
  LATEST_AVAILABLE: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Latest Available' },
  DATA_UNAVAILABLE: { bg: 'bg-red-100', text: 'text-red-800', label: 'Data Unavailable' },
  ADMIN_ENTRY: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Admin Entry' },
};

export const MarketPricesPage = () => {
  const navigate = useNavigate();
  const [prices, setPrices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState(null);

  // Location hierarchy from DB
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [mandis, setMandis] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedMandiId, setSelectedMandiId] = useState('');

  // Price history
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedCropForHistory, setSelectedCropForHistory] = useState(null);

  // Load states from DB
  useEffect(() => {
    api.get('/states').then(r => setStates(r.data || [])).catch(() => {});
    api.get('/market-prices/sync-status').then(r => setSyncStatus(r.data)).catch(() => {});
  }, []);

  // Load districts when state changes
  useEffect(() => {
    setDistricts([]);
    setMandis([]);
    setSelectedDistrictId('');
    setSelectedMandiId('');
    if (selectedStateId) {
      api.get(`/states/${selectedStateId}/districts`).then(r => setDistricts(r.data || [])).catch(() => {});
    }
  }, [selectedStateId]);

  // Load mandis when district changes
  useEffect(() => {
    setMandis([]);
    setSelectedMandiId('');
    if (selectedDistrictId) {
      api.get(`/districts/${selectedDistrictId}/mandis`).then(r => setMandis(r.data || [])).catch(() => {});
    }
  }, [selectedDistrictId]);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStateId) params.append('state_id', selectedStateId);
      if (selectedDistrictId) params.append('district_id', selectedDistrictId);
      if (selectedMandiId) params.append('mandi_id', selectedMandiId);
      if (search) params.append('search', search);
      const res = await api.get(`/market-prices?${params.toString()}`);
      setPrices(res.data || []);
    } catch (err) {
      console.error("Failed to load market prices:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedStateId, selectedDistrictId, selectedMandiId, search]);

  useEffect(() => {
    fetchPrices();
  }, [selectedStateId, selectedDistrictId, selectedMandiId]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPrices();
  };

  const fetchHistory = async (cropName, mandiId) => {
    setSelectedCropForHistory(cropName);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      if (cropName) params.append('crop_name', cropName);
      if (mandiId) params.append('mandi_id', mandiId);
      params.append('days', '30');
      const res = await api.get(`/market-prices/history?${params.toString()}`);
      setHistoryData(res.data || []);
    } catch {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return d; }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
          <TrendingUp className="w-7 h-7 text-emerald-600" />
          <span>Daily Mandi Market Prices</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Official APMC mandi prices across India • Source: Official Market Data
        </p>
      </div>

      {/* Sync Status Bar */}
      {syncStatus && (
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex flex-wrap items-center gap-3 text-[11px]">
          <div className="flex items-center space-x-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-bold text-gray-700">Data Source:</span>
            <span className="text-gray-500">{syncStatus.data_source || 'Official Market Data'}</span>
          </div>
          {syncStatus.last_sync && (
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-bold text-gray-700">Last Sync:</span>
              <span className="text-gray-500">{formatDate(syncStatus.last_sync)}</span>
            </div>
          )}
          <div className={`px-2 py-0.5 rounded-full font-bold ${
            syncStatus.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
            syncStatus.status === 'no_api_key' ? 'bg-amber-100 text-amber-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {syncStatus.status === 'success' ? '✓ Synced' :
             syncStatus.status === 'no_api_key' ? '⚠ API Key Required' :
             syncStatus.status === 'never_synced' ? 'Not Yet Synced' :
             syncStatus.status}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-emerald-100 shadow-xs space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by crop, mandi or state..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            Search
          </button>
        </form>

        {/* Dependent Location Dropdowns — all from DB */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={selectedStateId}
            onChange={(e) => setSelectedStateId(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 bg-white"
          >
            <option value="">All States</option>
            {states.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={selectedDistrictId}
            onChange={(e) => setSelectedDistrictId(e.target.value)}
            disabled={!selectedStateId}
            className="px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 bg-white disabled:opacity-50"
          >
            <option value="">All Districts</option>
            {districts.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={selectedMandiId}
            onChange={(e) => setSelectedMandiId(e.target.value)}
            disabled={!selectedDistrictId}
            className="px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 bg-white disabled:opacity-50"
          >
            <option value="">All Mandis</option>
            {mandis.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Prices Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">
            <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-emerald-500" />
            Loading mandi rates...
          </div>
        ) : prices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-4 px-5">Commodity</th>
                  <th className="py-4 px-5">Mandi</th>
                  <th className="py-4 px-5">State / District</th>
                  <th className="py-4 px-5">Min – Max</th>
                  <th className="py-4 px-5">Modal Price</th>
                  <th className="py-4 px-5">Price Date</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {prices.map((p) => {
                  const statusInfo = STATUS_COLORS[p.data_status] || STATUS_COLORS.DATA_UNAVAILABLE;
                  return (
                    <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-4 px-5 font-bold text-gray-900">
                        <span className="block text-sm">{p.crop_name}</span>
                        <span className="text-[10px] text-gray-400 font-normal">Variety: {p.variety || 'Standard'}</span>
                      </td>
                      <td className="py-4 px-5">
                        <button
                          onClick={() => p.mandi_id && navigate(`/mandis/${p.mandi_id}`)}
                          className="text-emerald-700 font-semibold hover:underline text-left"
                        >
                          {p.mandi_name || p.market_name || '—'}
                        </button>
                      </td>
                      <td className="py-4 px-5 text-gray-500">
                        <span className="block text-[11px] font-semibold">{p.state_name || p.state}</span>
                        <span className="text-[10px] text-gray-400">{p.district_name || p.district}</span>
                      </td>
                      <td className="py-4 px-5 text-gray-600 font-mono text-[11px]">
                        ₹{(p.min_price || 0).toLocaleString('en-IN')} – ₹{(p.max_price || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-extrabold text-emerald-800 text-sm">
                          ₹{(p.modal_price || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-gray-400 font-normal ml-1">/{p.unit || 'Quintal'}</span>
                      </td>
                      <td className="py-4 px-5 text-[11px] text-gray-500">
                        {formatDate(p.price_date)}
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.bg} ${statusInfo.text}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => fetchHistory(p.crop_name, p.mandi_id)}
                          className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center space-x-1 ml-auto"
                        >
                          <BarChart3 className="w-3 h-3" />
                          <span>History</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-2">
            <Info className="w-6 h-6 mx-auto text-gray-300" />
            <p className="text-xs text-gray-400">
              {syncStatus?.status === 'no_api_key'
                ? 'Market data source not configured. Admin needs to add MARKET_DATA_API_KEY in settings.'
                : 'No market prices found for selected criteria.'}
            </p>
          </div>
        )}
      </div>

      {/* Price History Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setHistoryOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-gray-900">
                Price History: {selectedCropForHistory}
              </h3>
              <button onClick={() => setHistoryOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm font-bold">✕</button>
            </div>
            <p className="text-[11px] text-gray-500 mb-4">Last 30 days • Source: Official Market Data • Only showing dates with real data</p>

            {historyLoading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading history...</div>
            ) : historyData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4 text-left">Date</th>
                      <th className="py-3 px-4 text-left">Mandi</th>
                      <th className="py-3 px-4 text-right">Min</th>
                      <th className="py-3 px-4 text-right">Max</th>
                      <th className="py-3 px-4 text-right">Modal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historyData.map((h, i) => (
                      <tr key={i} className="hover:bg-emerald-50/30">
                        <td className="py-3 px-4 font-semibold text-gray-700">{formatDate(h.date)}</td>
                        <td className="py-3 px-4 text-gray-500">{h.mandi_name || '—'}</td>
                        <td className="py-3 px-4 text-right text-gray-500">₹{(h.min_price || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right text-gray-500">₹{(h.max_price || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">₹{(h.modal_price || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-gray-400">
                No historical data available for this commodity. Data will appear after price sync.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
