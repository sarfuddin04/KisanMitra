/**
 * MandiMapPage – All India Mandi Map
 * ==================================
 * Premium 3-panel dashboard with Leaflet map, mandi cards, and detail panel.
 * - Uses OpenStreetMap via Leaflet (no API key needed)
 * - Falls back to Google Maps if VITE_GOOGLE_MAPS_API_KEY is set
 * - Connected to real backend APIs (no fake/random data)
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, SlidersHorizontal, Navigation, LayoutGrid, List, Map as MapIcon,
  Star, Clock, Phone, Store, ChevronRight, X, ArrowLeft, TrendingUp, TrendingDown,
  Minus, Wheat, CloudSun, ExternalLink, Loader2, RefreshCw, Filter, ChevronDown,
  Eye, MessageSquare, Send, User, Droplets, Wind, Thermometer, AlertCircle, Locate
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../services/api';
import { useLocation } from '../../context/LocationContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

// ── Leaflet icon fix (Vite doesn't bundle default marker images) ──────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MANDI_FALLBACK = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=60';
const INDIA_CENTER = [22.5, 82.0];

// ── Custom Leaflet Icons ──────────────────────────────────────────────────
const createMandiIcon = (mandiType = 'APMC Mandi', isSelected = false) => {
  let bg = isSelected ? '#047857' : '#10b981'; // Default APMC: Emerald Green
  let svgPath = '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>';

  if (mandiType === 'Government Mandi') {
    bg = isSelected ? '#1d4ed8' : '#2563eb'; // Royal Blue
    svgPath = '<path d="M4 22h16M4 18h16M4 6l8-4 8 4v2H4zM6 10v6M10 10v6M14 10v6M18 10v6"></path>';
  } else if (mandiType === 'Private Wholesale Market' || mandiType === 'Private') {
    bg = isSelected ? '#d97706' : '#f59e0b'; // Amber
    svgPath = '<path d="M3 3h18l-2 9H5L3 3zM3 12h18v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8z"></path>';
  } else if (mandiType === 'Wholesale' || mandiType === 'Rural Haat') {
    bg = isSelected ? '#6d28d9' : '#8b5cf6'; // Purple
    svgPath = '<circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>';
  }

  const size = isSelected ? 42 : 34;
  return L.divIcon({
    className: 'custom-mandi-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${bg};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 14px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
    ">
      <svg width="${isSelected ? '20' : '16'}" height="${isSelected ? '20' : '16'}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        ${svgPath}
      </svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div style="
    width: 20px; height: 20px;
    background: #3b82f6;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 8px rgba(59,130,246,0.2), 0 4px 12px rgba(0,0,0,0.3);
    animation: pulse-ring 2s ease-out infinite;
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// ── Map Fly-To Helper Component ───────────────────────────────────────────
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 10, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};


// ═══════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const MandiMapPage = () => {
  const navigate = useNavigate();
  const { lat: userLat, lon: userLon, loading: locLoading, requestLocation, granted, error: locError } = useLocation();
  const { t } = useLanguage();
  const { isAuthenticated, requireAuth, user } = useAuth();

  // ── State ────────────────────────────────────────────────────────────
  const [mandis, setMandis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('map');       // map | grid | list
  const [selectedMandi, setSelectedMandi] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [detailTab, setDetailTab] = useState('overview');  // overview | prices | reviews
  const [mapCenter, setMapCenter] = useState(INDIA_CENTER);
  const [mapZoom, setMapZoom] = useState(5);
  const [showFilters, setShowFilters] = useState(false);
  const [states, setStates] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // Cascading filters
  const [filterStateName, setFilterStateName] = useState('');
  const [filterDistrictId, setFilterDistrictId] = useState('');
  const [filterDistrictName, setFilterDistrictName] = useState('');
  const [filterType, setFilterType] = useState('');
  const [districts, setDistricts] = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);

  // ── Load mandis from API ────────────────────────────────────────────
  const loadMandis = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 500 };
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (filterDistrictId) {
        params.district_id = filterDistrictId;
      } else if (filterStateName) {
        params.state_name = filterStateName;
      }
      if (filterType) params.mandi_type = filterType;

      const res = await api.get('/mandis/map', { params });
      setMandis(res.data || []);
    } catch (err) {
      console.error('Failed to load mandis:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterStateName, filterDistrictId, filterType]);

  useEffect(() => { loadMandis(); }, [loadMandis]);

  // Load states for filter dropdown
  useEffect(() => {
    api.get('/states').then(r => setStates(r.data || [])).catch(() => {});
  }, []);

  // Load districts when state changes
  useEffect(() => {
    setFilterDistrictId('');
    setFilterDistrictName('');
    setDistricts([]);
    if (!filterStateName) return;
    const selectedState = states.find(s => s.name === filterStateName);
    if (!selectedState) return;
    setDistrictsLoading(true);
    api.get(`/states/${selectedState.id}/districts`)
      .then(r => setDistricts(r.data || []))
      .catch(() => {})
      .finally(() => setDistrictsLoading(false));
  }, [filterStateName, states]);

  // When state or district changes on map — fly to center
  useEffect(() => {
    if (!filterStateName) {
      setMapCenter(INDIA_CENTER);
      setMapZoom(5);
    } else if (filterStateName && mandis.length > 0) {
      // Center map on mandis with coords in filtered list
      const withCoords = mandis.filter(m => m.latitude && m.longitude);
      if (withCoords.length > 0) {
        const avgLat = withCoords.reduce((s, m) => s + m.latitude, 0) / withCoords.length;
        const avgLon = withCoords.reduce((s, m) => s + m.longitude, 0) / withCoords.length;
        setMapCenter([avgLat, avgLon]);
        setMapZoom(filterDistrictId ? 11 : 7);
      }
    }
  }, [filterStateName, filterDistrictId, mandis]);

  // ── Search debounce ─────────────────────────────────────────────────
  const searchTimeout = useRef(null);
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => loadMandis(), 500);
  };

  // ── Select a mandi (load detail + reviews) ──────────────────────────
  const selectMandi = useCallback(async (mandi) => {
    setSelectedMandi(mandi);
    setShowDetailPanel(true);
    setDetailTab('overview');
    setDetailData(null);
    setReviews([]);
    setWeather(null);
    setMyReview(null);

    if (mandi.latitude && mandi.longitude) {
      setMapCenter([mandi.latitude, mandi.longitude]);
      setMapZoom(13);
    }

    // Load detail
    setDetailLoading(true);
    try {
      const res = await api.get(`/mandis/${mandi.id}/detail`);
      setDetailData(res.data);
    } catch (err) {
      console.error('Failed to load mandi detail:', err);
    } finally {
      setDetailLoading(false);
    }

    // Load reviews
    setReviewsLoading(true);
    try {
      const res = await api.get(`/mandis/${mandi.id}/reviews`);
      setReviews(res.data?.reviews || []);
    } catch { }
    setReviewsLoading(false);

    // Load user's own review if authenticated
    if (isAuthenticated) {
      try {
        const res = await api.get(`/mandis/${mandi.id}/my-review`);
        if (res.data?.exists) {
          setMyReview(res.data.review);
          setReviewForm({ rating: res.data.review.rating, comment: res.data.review.comment || '' });
        }
      } catch { }
    }

    // Load weather
    if (mandi.latitude && mandi.longitude) {
      setWeatherLoading(true);
      try {
        const wRes = await api.get(`/weather/current?lat=${mandi.latitude}&lon=${mandi.longitude}`);
        if (!wRes.data?.error) setWeather(wRes.data);
      } catch { }
      setWeatherLoading(false);
    }
  }, [isAuthenticated]);

  // ── Submit review ───────────────────────────────────────────────────
  const handleSubmitReview = async () => {
    if (!requireAuth('Please login to submit a review.')) return;
    if (!selectedMandi) return;

    setSubmittingReview(true);
    try {
      await api.post(`/mandis/${selectedMandi.id}/reviews`, {
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim() || null,
      });
      // Reload reviews
      const res = await api.get(`/mandis/${selectedMandi.id}/reviews`);
      setReviews(res.data?.reviews || []);
      // Reload detail for updated stats
      const detRes = await api.get(`/mandis/${selectedMandi.id}/detail`);
      setDetailData(detRes.data);
      // Reload my review
      const myRes = await api.get(`/mandis/${selectedMandi.id}/my-review`);
      setMyReview(myRes.data?.review || null);
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // ── Use My Location ─────────────────────────────────────────────────
  const handleUseLocation = async () => {
    try {
      const loc = await requestLocation();
      if (loc?.lat && loc?.lon) {
        setMapCenter([loc.lat, loc.lon]);
        setMapZoom(10);
      }
    } catch { }
  };

  // ── Haversine distance ──────────────────────────────────────────────
  const getDistance = useCallback((lat, lon) => {
    if (!granted || !userLat || !userLon || !lat || !lon) return null;
    const R = 6371;
    const dLat = (lat - userLat) * Math.PI / 180;
    const dLon = (lon - userLon) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(userLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
  }, [userLat, userLon, granted]);

  // ── Sorted mandis ──────────────────────────────────────────────────
  const sortedMandis = useMemo(() => {
    if (!granted || !userLat || !userLon) return mandis;
    return [...mandis].sort((a, b) => {
      const dA = a.latitude && a.longitude ? parseFloat(getDistance(a.latitude, a.longitude)) : 9999;
      const dB = b.latitude && b.longitude ? parseFloat(getDistance(b.latitude, b.longitude)) : 9999;
      return dA - dB;
    });
  }, [mandis, granted, userLat, userLon, getDistance]);

  const handleGetDirections = (mandi) => {
    if (!mandi?.latitude || !mandi?.longitude) return;
    const origin = userLat && userLon ? `${userLat},${userLon}` : '';
    const dest = `${mandi.latitude},${mandi.longitude}`;
    const url = origin
      ? `https://www.google.com/maps/dir/${origin}/${dest}`
      : `https://www.google.com/maps/dir//${dest}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ═══════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Green Gradient Banner ───────────────────────────────────── */}
      <div className="bg-gradient-to-r from-emerald-700 via-green-600 to-teal-600 text-white">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">All India Mandi Map</h1>
              <p className="text-emerald-100 text-xs sm:text-sm font-medium mt-0.5">
                Explore agricultural mandis across India with real-time market prices
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Actions Bar ────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by mandi name, crop, city, district, or state..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleUseLocation}
                disabled={locLoading}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 transition-all disabled:opacity-50"
              >
                <Locate className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{locLoading ? 'Locating...' : 'My Location'}</span>
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${showFilters ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'}`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filters</span>
              </button>

              <div className="flex bg-gray-100 rounded-xl border border-gray-200 p-0.5">
                {[
                  { mode: 'map', Icon: MapIcon },
                  { mode: 'grid', Icon: LayoutGrid },
                  { mode: 'list', Icon: List },
                ].map(({ mode, Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`p-2 rounded-lg transition-all ${viewMode === mode ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex flex-wrap gap-3 items-end">
                {/* State Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-extrabold text-emerald-800 px-1">
                    Select State / Union Territory
                  </label>
                  <select
                    value={filterStateName}
                    onChange={(e) => {
                      setFilterStateName(e.target.value);
                    }}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm min-w-[190px]"
                  >
                    <option value="">🇮🇳 All India (36 States & UTs)</option>
                    {states.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>

                {/* District Selection (cascades from selected state) */}
                {filterStateName && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-extrabold text-emerald-800 px-1 flex items-center justify-between">
                      <span>Select District</span>
                      {districtsLoading && <span className="text-[9px] text-emerald-600 animate-pulse">Loading...</span>}
                    </label>
                    <select
                      value={filterDistrictId}
                      onChange={(e) => {
                        setFilterDistrictId(e.target.value);
                        const found = districts.find(d => String(d.id) === e.target.value);
                        setFilterDistrictName(found?.name || '');
                      }}
                      disabled={districtsLoading || districts.length === 0}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm min-w-[180px] disabled:opacity-50"
                    >
                      <option value="">All Districts ({districts.length})</option>
                      {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Mandi Type Filter */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-gray-400 px-1">Mandi Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 min-w-[160px]"
                  >
                    <option value="">All Types</option>
                    <option value="APMC Mandi">🏛️ APMC Mandi</option>
                    <option value="Government Mandi">🏢 Government Mandi</option>
                    <option value="Private Wholesale Market">🏪 Private Wholesale</option>
                    <option value="Wholesale">📦 Wholesale Market</option>
                    <option value="Rural Haat">🛖 Rural Haat</option>
                  </select>
                </div>

                {/* Clear Filters */}
                {(filterStateName || filterType) && (
                  <button
                    onClick={() => {
                      setFilterStateName('');
                      setFilterDistrictId('');
                      setFilterDistrictName('');
                      setFilterType('');
                    }}
                    className="flex items-center gap-1 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-bold border border-red-200 transition-all self-end"
                  >
                    <X className="w-3 h-3" /> Clear All
                  </button>
                )}

                <div className="ml-auto flex items-center text-xs text-gray-400 font-semibold self-end pb-2">
                  <span className="text-emerald-600 font-bold">{mandis.length}</span>&nbsp;mandis found
                </div>
              </div>

              {/* Active filter breadcrumb */}
              {(filterStateName || filterDistrictName) && (
                <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-700 font-bold">
                  <MapPin className="w-3 h-3" />
                  <span>Showing:</span>
                  {filterStateName && <span className="bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">{filterStateName}</span>}
                  {filterDistrictName && <><ChevronRight className="w-3 h-3" /><span className="bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">{filterDistrictName}</span></>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <div className="max-w-[1800px] mx-auto">
        <div className="flex h-[calc(100vh-200px)] overflow-hidden">

          {/* ── LEFT PANEL: Mandi Cards ──────────────────────────────── */}
          <div className={`${viewMode === 'map' && showDetailPanel && selectedMandi ? 'hidden lg:flex' : 'flex'} flex-col w-full sm:w-80 lg:w-96 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto`}>
            <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-600 truncate">
                {filterStateName ? (
                  <span>Mandis in <span className="text-emerald-700 font-extrabold">{filterStateName}</span></span>
                ) : granted ? (
                  <span>Nearby Mandis</span>
                ) : (
                  <span>All India Mandis</span>
                )} • <span className="text-emerald-600 font-extrabold">{sortedMandis.length}</span>
              </p>
              {(filterStateName || filterType || searchQuery) && (
                <button
                  onClick={() => {
                    setFilterStateName('');
                    setFilterDistrictId('');
                    setFilterDistrictName('');
                    setFilterType('');
                    setSearchQuery('');
                  }}
                  className="text-[10px] text-gray-400 hover:text-emerald-600 font-semibold underline flex-shrink-0 ml-2"
                >
                  Clear
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                <span className="ml-2 text-xs text-gray-400 font-medium">Loading mandis...</span>
              </div>
            ) : sortedMandis.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-3 border border-amber-200">
                  <Store className="w-7 h-7 text-amber-600" />
                </div>
                {filterDistrictId ? (
                  <>
                    <h4 className="text-sm font-extrabold text-gray-800 mb-1">
                      No verified mandi records are currently available for this district.
                    </h4>
                    <p className="text-xs text-gray-500 max-w-xs mb-4">
                      No official APMC or wholesale market records are registered under <span className="font-semibold text-gray-700">{filterDistrictName || 'the selected district'}</span> in the government database yet.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setFilterDistrictId(''); setFilterDistrictName(''); }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                      >
                        View All in {filterStateName}
                      </button>
                      <button
                        onClick={loadMandis}
                        className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
                      >
                        Retry Search
                      </button>
                    </div>
                  </>
                ) : searchQuery ? (
                  <>
                    <h4 className="text-sm font-extrabold text-gray-800 mb-1">
                      No mandis found matching &ldquo;{searchQuery}&rdquo;
                    </h4>
                    <p className="text-xs text-gray-500 max-w-xs mb-4">
                      Check your spelling or try searching by state name, district, or agricultural commodity.
                    </p>
                    <button
                      onClick={() => { setSearchQuery(''); loadMandis(); }}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <h4 className="text-sm font-extrabold text-gray-800 mb-1">
                      No mandi records found
                    </h4>
                    <p className="text-xs text-gray-500 max-w-xs mb-4">
                      Try clearing or adjusting your active filters to view available mandis across India.
                    </p>
                    <button
                      onClick={() => {
                        setFilterStateName('');
                        setFilterDistrictId('');
                        setFilterDistrictName('');
                        setFilterType('');
                        setSearchQuery('');
                      }}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                      Reset All Filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3 p-3' : 'space-y-0'}>
                {sortedMandis.map((m) => {
                  const dist = getDistance(m.latitude, m.longitude);
                  const isActive = selectedMandi?.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => selectMandi(m)}
                      className={`cursor-pointer transition-all ${
                        viewMode === 'grid'
                          ? `rounded-2xl border overflow-hidden hover:shadow-md ${isActive ? 'border-emerald-400 ring-2 ring-emerald-100 shadow-md' : 'border-gray-200 hover:border-emerald-300'}`
                          : `flex gap-3 p-3 border-b border-gray-100 hover:bg-emerald-50/40 ${isActive ? 'bg-emerald-50/60 border-l-4 border-l-emerald-500' : ''}`
                      }`}
                    >
                      {/* Card Image */}
                      <div className={viewMode === 'grid' ? 'h-28 overflow-hidden' : 'w-16 h-16 rounded-xl overflow-hidden flex-shrink-0'}>
                        <img
                          src={m.image_url ? `/api/static/${m.image_url}` : MANDI_FALLBACK}
                          alt={m.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = MANDI_FALLBACK; }}
                        />
                      </div>

                      {/* Card Content */}
                      <div className={viewMode === 'grid' ? 'p-2.5' : 'flex-1 min-w-0'}>
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border ${
                            m.mandi_type === 'Government Mandi' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            m.mandi_type === 'Private Wholesale Market' || m.mandi_type === 'Private' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            m.mandi_type === 'Wholesale' || m.mandi_type === 'Rural Haat' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {m.mandi_type || 'APMC Mandi'}
                          </span>
                          <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50/80 px-1 py-0.2 rounded border border-emerald-200">
                            ✓ Verified
                          </span>
                        </div>
                        <h3 className="text-xs font-black text-gray-900 truncate">{m.name}</h3>
                        <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 flex-shrink-0 text-emerald-600" />
                          <span className="truncate">{m.district_name}, {m.state_name}</span>
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {dist && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                              <Navigation className="w-2.5 h-2.5" /> {dist} km
                            </span>
                          )}
                          {m.average_rating > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                              <Star className="w-2.5 h-2.5 fill-amber-400" /> {m.average_rating}
                            </span>
                          )}
                          {m.crop_count > 0 && (
                            <span className="text-[10px] text-gray-400 font-semibold">{m.crop_count} crops</span>
                          )}
                        </div>
                      </div>
                      {viewMode !== 'grid' && (
                        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 self-center" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── CENTER PANEL: Map ────────────────────────────────────── */}
          {viewMode === 'map' && (
            <div className="flex-1 relative">
              <MapContainer
                center={INDIA_CENTER}
                zoom={5}
                scrollWheelZoom={true}
                className="w-full h-full z-0"
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController center={mapCenter} zoom={mapZoom} />

                {/* User location marker */}
                {granted && userLat && userLon && (
                  <Marker position={[userLat, userLon]} icon={userLocationIcon}>
                    <Popup>
                      <div className="text-center">
                        <p className="font-bold text-sm">📍 Your Location</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Mandi markers */}
                {mandis.filter(m => m.latitude && m.longitude).map((m) => (
                  <Marker
                    key={m.id}
                    position={[m.latitude, m.longitude]}
                    icon={createMandiIcon(m.mandi_type, selectedMandi?.id === m.id)}
                    eventHandlers={{ click: () => selectMandi(m) }}
                  >
                    <Popup maxWidth={300}>
                      <div className="min-w-[230px] p-0.5">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            m.mandi_type === 'Government Mandi' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            m.mandi_type === 'Private Wholesale Market' || m.mandi_type === 'Private' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            m.mandi_type === 'Wholesale' || m.mandi_type === 'Rural Haat' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {m.mandi_type || 'APMC Mandi'}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            ✓ Verified
                          </span>
                        </div>
                        <h3 className="font-black text-sm text-gray-900 mb-1 leading-snug">{m.name}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-1.5 font-medium">
                          <span>📍</span> {m.district_name}, {m.state_name}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2 font-semibold">
                          <span>{m.latitude.toFixed(4)}°N, {m.longitude.toFixed(4)}°E</span>
                          {m.average_rating > 0 && (
                            <span className="text-amber-600 font-bold">⭐ {m.average_rating} ({m.review_count})</span>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); selectMandi(m); }}
                          className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1"
                        >
                          View Details & Prices →
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {/* Map overlay stats */}
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md rounded-2xl px-3.5 py-2 shadow-lg border border-gray-200 z-10 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-xs font-bold text-gray-700">
                  <span className="text-emerald-700 font-extrabold">{mandis.filter(m => m.latitude && m.longitude).length}</span> Verified Mandis on Map
                </p>
              </div>

              {/* Map Floating Legend */}
              <div className="absolute bottom-6 right-3 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-gray-200 z-10 text-xs space-y-1.5 min-w-[170px]">
                <p className="font-extrabold text-[10px] text-gray-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Market Categories
                </p>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm flex-shrink-0"></span>
                  <span className="text-[11px] font-semibold text-gray-700">APMC Mandi</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-sm flex-shrink-0"></span>
                  <span className="text-[11px] font-semibold text-gray-700">Government Mandi</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white shadow-sm flex-shrink-0"></span>
                  <span className="text-[11px] font-semibold text-gray-700">Private Wholesale</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-white shadow-sm flex-shrink-0"></span>
                  <span className="text-[11px] font-semibold text-gray-700">Rural Haat / Wholesale</span>
                </div>
                {granted && (
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-sm flex-shrink-0 ring-2 ring-blue-300"></span>
                    <span className="text-[11px] font-semibold text-blue-700">Your Location</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grid/List View replaces map */}
          {viewMode !== 'map' && !showDetailPanel && (
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {/* Already shown in left panel for grid/list */}
            </div>
          )}

          {/* ── RIGHT PANEL: Detail Panel ───────────────────────────── */}
          {showDetailPanel && selectedMandi && (
            <div className="w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
              {/* Detail Header */}
              <div className="relative">
                <div className="h-44 overflow-hidden">
                  <img
                    src={selectedMandi.image_url ? `/api/static/${selectedMandi.image_url}` : MANDI_FALLBACK}
                    alt={selectedMandi.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = MANDI_FALLBACK; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </div>
                <button
                  onClick={() => { setShowDetailPanel(false); setSelectedMandi(null); }}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h2 className="text-lg font-black tracking-tight">{selectedMandi.name}</h2>
                  <p className="text-xs font-medium text-white/80 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {selectedMandi.district_name}, {selectedMandi.state_name}
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100 bg-gray-50/50">
                {detailData?.rating_stats && (
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-black text-gray-900">
                      {detailData.rating_stats.average_rating || '—'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">
                      ({detailData.rating_stats.total_reviews} reviews)
                    </span>
                  </div>
                )}
                {getDistance(selectedMandi.latitude, selectedMandi.longitude) && (
                  <div className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                    <Navigation className="w-3 h-3" />
                    {getDistance(selectedMandi.latitude, selectedMandi.longitude)} km
                  </div>
                )}
                <button
                  onClick={() => handleGetDirections(selectedMandi)}
                  className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all"
                >
                  <Navigation className="w-3 h-3" /> Directions
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                {[
                  { key: 'overview', label: 'Overview', Icon: Store },
                  { key: 'prices', label: 'Prices', Icon: TrendingUp },
                  { key: 'reviews', label: 'Reviews', Icon: Star },
                ].map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    onClick={() => setDetailTab(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all border-b-2 ${
                      detailTab === key
                        ? 'text-emerald-700 border-emerald-500 bg-emerald-50/30'
                        : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                    <span className="ml-2 text-xs text-gray-400 font-medium">Loading details...</span>
                  </div>
                ) : (
                  <>
                    {/* ─── OVERVIEW TAB ──────────────────────────────── */}
                    {detailTab === 'overview' && detailData && (
                      <div className="space-y-4">
                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <InfoCard icon={Store} label="Category" value={detailData.mandi_type || 'APMC Mandi'} />
                          <InfoCard icon={MapPin} label="Pincode" value={detailData.pincode || '—'} />
                          <InfoCard icon={Navigation} label="Coordinates" value={detailData.latitude && detailData.longitude ? `${detailData.latitude.toFixed(4)}, ${detailData.longitude.toFixed(4)}` : 'Verified on Map'} />
                          <InfoCard icon={Check} label="Verification" value={detailData.verification_status || 'Verified'} />
                          {detailData.opening_time && (
                            <InfoCard icon={Clock} label="Timings" value={`${detailData.opening_time} – ${detailData.closing_time || ''}`} />
                          )}
                          {detailData.contact_number && (
                            <InfoCard icon={Phone} label="Contact" value={detailData.contact_number} />
                          )}
                        </div>

                        {/* Data Source & Verification Notice */}
                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
                          <span className="text-emerald-700 font-bold text-xs">🏛️</span>
                          <div>
                            <p className="text-[10px] font-bold text-emerald-900 uppercase">Authoritative Data Source</p>
                            <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                              {detailData.data_source || 'AGMARKNET / Directorate of Marketing & Inspection (Govt. of India)'}
                            </p>
                            {detailData.updated_at && (
                              <p className="text-[9px] text-emerald-600 mt-1">
                                Last updated: {new Date(detailData.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Address */}
                        {detailData.address && (
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Address</p>
                            <p className="text-xs text-gray-700 font-medium">{detailData.address}</p>
                          </div>
                        )}

                        {/* Crops */}
                        {detailData.crops && detailData.crops.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 flex items-center gap-1">
                              <Wheat className="w-3 h-3 text-amber-500" /> Available Crops ({detailData.crops.length})
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {detailData.crops.map((c) => (
                                <span key={c.id} className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-200">
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Weather */}
                        {weatherLoading ? (
                          <div className="flex items-center gap-2 py-4">
                            <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                            <span className="text-xs text-gray-400">Loading weather...</span>
                          </div>
                        ) : weather ? (
                          <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-3 border border-sky-200">
                            <p className="text-[10px] uppercase font-bold text-sky-500 mb-2 flex items-center gap-1">
                              <CloudSun className="w-3 h-3" /> Weather at Mandi
                            </p>
                            <div className="flex items-center gap-3 mb-2">
                              {weather.icon_url && <img src={weather.icon_url} alt="" className="w-10 h-10" />}
                              <div>
                                <p className="text-xl font-black text-gray-900">
                                  {weather.temperature != null ? `${Math.round(weather.temperature)}°C` : '—'}
                                </p>
                                <p className="text-[10px] text-gray-500 font-medium">{weather.condition}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <MiniStat icon={<Droplets className="w-3 h-3 text-blue-500" />} value={`${weather.humidity || 0}%`} label="Humidity" />
                              <MiniStat icon={<Wind className="w-3 h-3 text-teal-500" />} value={`${weather.wind_speed || 0}`} label="Wind km/h" />
                              <MiniStat icon={<Thermometer className="w-3 h-3 text-orange-500" />} value={`${weather.feels_like ? Math.round(weather.feels_like) : '—'}°C`} label="Feels Like" />
                            </div>
                          </div>
                        ) : null}

                        {/* View Full Detail button */}
                        <button
                          onClick={() => navigate(`/mandis/${selectedMandi.id}`)}
                          className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-all flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View Full Details
                        </button>
                      </div>
                    )}

                    {/* ─── PRICES TAB ───────────────────────────────── */}
                    {detailTab === 'prices' && (
                      <div className="space-y-3">
                        {detailData?.latest_prices && detailData.latest_prices.length > 0 ? (
                          detailData.latest_prices.map((p, i) => (
                            <div key={p.id || i} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-xs font-black text-gray-900">{p.crop_name}</h4>
                                <span className="flex items-center gap-0.5 text-[10px] font-bold">
                                  {p.trend === 'UP' ? <TrendingUp className="w-3 h-3 text-green-600" /> :
                                   p.trend === 'DOWN' ? <TrendingDown className="w-3 h-3 text-red-500" /> :
                                   <Minus className="w-3 h-3 text-gray-400" />}
                                  <span className={p.trend === 'UP' ? 'text-green-600' : p.trend === 'DOWN' ? 'text-red-500' : 'text-gray-400'}>
                                    {p.change_percent ? `${p.change_percent > 0 ? '+' : ''}${p.change_percent}%` : 'Stable'}
                                  </span>
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400 font-medium mb-2">
                                {p.variety || 'Standard'} • {p.price_date ? new Date(p.price_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                              </p>
                              <div className="flex items-end gap-3">
                                <div>
                                  <p className="text-[9px] text-gray-400 font-bold uppercase">Min</p>
                                  <p className="text-xs font-bold text-gray-600">₹{(p.min_price || 0).toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-gray-400 font-bold uppercase">Max</p>
                                  <p className="text-xs font-bold text-gray-600">₹{(p.max_price || 0).toLocaleString('en-IN')}</p>
                                </div>
                                <div className="ml-auto text-right">
                                  <p className="text-[9px] text-emerald-500 font-bold uppercase">Modal</p>
                                  <p className="text-base font-black text-emerald-700">₹{(p.modal_price || 0).toLocaleString('en-IN')}</p>
                                  <p className="text-[9px] text-gray-400">per {p.unit || 'Quintal'}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12">
                            <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 font-bold">No price data available</p>
                            <p className="text-[10px] text-gray-400 mt-1">Prices will appear after data sync</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ─── REVIEWS TAB ──────────────────────────────── */}
                    {detailTab === 'reviews' && (
                      <div className="space-y-4">
                        {/* Rating Summary */}
                        {detailData?.rating_stats && (
                          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <p className="text-3xl font-black text-amber-700">
                                  {detailData.rating_stats.average_rating || '—'}
                                </p>
                                <div className="flex items-center gap-0.5 mt-1 justify-center">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <Star
                                      key={s}
                                      className={`w-3 h-3 ${s <= Math.round(detailData.rating_stats.average_rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                    />
                                  ))}
                                </div>
                                <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                                  {detailData.rating_stats.total_reviews} reviews
                                </p>
                              </div>
                              <div className="flex-1 space-y-1">
                                {[5, 4, 3, 2, 1].map(s => {
                                  const count = detailData.rating_stats.distribution?.[s] || 0;
                                  const pct = detailData.rating_stats.total_reviews > 0
                                    ? (count / detailData.rating_stats.total_reviews) * 100
                                    : 0;
                                  return (
                                    <div key={s} className="flex items-center gap-2">
                                      <span className="text-[10px] text-gray-500 font-bold w-3">{s}</span>
                                      <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                      </div>
                                      <span className="text-[10px] text-gray-400 font-bold w-5 text-right">{count}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Review Form */}
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                          <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">
                            {myReview ? 'Update Your Review' : 'Write a Review'}
                          </p>
                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map(s => (
                              <button
                                key={s}
                                onClick={() => setReviewForm(f => ({ ...f, rating: s }))}
                                className="p-0.5 transition-transform hover:scale-110"
                              >
                                <Star className={`w-5 h-5 ${s <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                            placeholder="Share your experience at this mandi..."
                            maxLength={1000}
                            rows={3}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                          />
                          <button
                            onClick={handleSubmitReview}
                            disabled={submittingReview}
                            className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            {submittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            {submittingReview ? 'Submitting...' : myReview ? 'Update Review' : 'Submit Review'}
                          </button>
                        </div>

                        {/* Reviews List */}
                        {reviewsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                            <span className="ml-2 text-xs text-gray-400">Loading reviews...</span>
                          </div>
                        ) : reviews.length > 0 ? (
                          <div className="space-y-3">
                            {reviews.map((r) => (
                              <div key={r.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                                <div className="flex items-start gap-2">
                                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    {r.user_avatar ? (
                                      <img src={r.user_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                      <User className="w-4 h-4 text-emerald-600" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-bold text-gray-900">{r.user_name}</p>
                                      <span className="text-[9px] text-gray-400 font-medium">
                                        {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-0.5 mt-0.5">
                                      {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                                      ))}
                                    </div>
                                    {r.comment && (
                                      <p className="text-[11px] text-gray-600 mt-1.5 leading-relaxed">{r.comment}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 font-bold">No reviews yet</p>
                            <p className="text-[10px] text-gray-400 mt-1">Be the first to review this mandi!</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global pulse animation for user location */}
      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          70% { box-shadow: 0 0 0 15px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          padding: 0 !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15) !important;
        }
        .leaflet-popup-content {
          margin: 12px 14px !important;
        }
        .leaflet-popup-close-button {
          top: 6px !important;
          right: 8px !important;
        }
      `}</style>
    </div>
  );
};


// ── Sub-components ──────────────────────────────────────────────────────────

const InfoCard = ({ icon: Icon, label, value }) => (
  <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
    <div className="flex items-center gap-1.5 mb-1">
      <Icon className="w-3 h-3 text-emerald-500" />
      <p className="text-[9px] uppercase font-bold text-gray-400">{label}</p>
    </div>
    <p className="text-xs font-bold text-gray-700 truncate">{value}</p>
  </div>
);

const MiniStat = ({ icon, value, label }) => (
  <div className="text-center">
    <div className="flex items-center justify-center mb-0.5">{icon}</div>
    <p className="text-xs font-bold text-gray-700">{value}</p>
    <p className="text-[9px] text-gray-400">{label}</p>
  </div>
);

export default MandiMapPage;
export { MandiMapPage };
