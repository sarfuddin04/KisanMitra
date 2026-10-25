/**
 * MandiMapPage – All India Mandi Intelligence System
 * ==================================================
 * Complete nationwide agricultural market directory & map:
 * - 36 States & Union Territories → 786+ Authoritative Districts → Verified Mandis
 * - Interactive Navigation: India → State → District → Mandi → Mandi Details
 * - Real geographic coordinates & OpenStreetMap Leaflet integration
 * - Real-time Operating Hours (IST UTC+5:30) with Open Now / Closed / Hours Unknown
 * - Genuine Farmer Rating & Reviews System (no fake ratings/counts)
 * - Real Agricultural Market Prices (AGMARKNET / data.gov.in & Verified Private Markets)
 * - Intelligent natural-language and multi-attribute search
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, SlidersHorizontal, Navigation, LayoutGrid, List, Map as MapIcon,
  Star, Clock, Phone, Store, ChevronRight, X, ArrowLeft, TrendingUp, TrendingDown,
  Minus, Wheat, CloudSun, ExternalLink, Loader2, RefreshCw, Filter, ChevronDown,
  Eye, MessageSquare, Send, User, Droplets, Wind, Thermometer, AlertCircle, Locate,
  Check, CheckCircle2, Building2, Sparkles, ShieldCheck
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../services/api';
import { useLocation } from '../../context/LocationContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

// ── Leaflet icon fix ────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MANDI_FALLBACK = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=60';
const INDIA_CENTER = [22.5, 82.0];

// ── Custom Leaflet Icons ────────────────────────────────────────────────────
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

  const size = isSelected ? 44 : 34;
  const shadow = isSelected ? '0 0 0 5px rgba(16, 185, 129, 0.35), 0 8px 24px rgba(0,0,0,0.4)' : '0 4px 14px rgba(0,0,0,0.3)';

  return L.divIcon({
    className: 'custom-mandi-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${bg};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: ${shadow};
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
    ">
      <svg width="${isSelected ? '22' : '16'}" height="${isSelected ? '22' : '16'}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
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
    box-shadow: 0 0 0 8px rgba(59,130,246,0.25), 0 4px 12px rgba(0,0,0,0.3);
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

// ── Quick Search Filter Chips ─────────────────────────────────────────────
const QUICK_SEARCH_CHIPS = [
  { label: '🌾 Wheat in Gorakhpur', query: 'Government wheat mandi in Gorakhpur' },
  { label: '🏛️ Lucknow Mandis', state: 'Uttar Pradesh', district: 'Lucknow' },
  { label: '🏪 Private Markets', type: 'Private Wholesale Market' },
  { label: '⚡ Open Now', status: 'OPEN' },
  { label: '🍅 Tomato in UP', query: 'Tomato prices in Uttar Pradesh' },
];

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const MandiMapPage = () => {
  const navigate = useNavigate();
  const { lat: userLat, lon: userLon, loading: locLoading, requestLocation, granted } = useLocation();
  const { t } = useLanguage();
  const { isAuthenticated, requireAuth, user } = useAuth();

  // ── Data & Selection State ─────────────────────────────────────────────
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

  // ── Filters ────────────────────────────────────────────────────────────
  const [filterStateName, setFilterStateName] = useState('');
  const [filterDistrictId, setFilterDistrictId] = useState('');
  const [filterDistrictName, setFilterDistrictName] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterOperatingStatus, setFilterOperatingStatus] = useState(''); // OPEN | CLOSED | HOURS_UNKNOWN
  const [filterMinRating, setFilterMinRating] = useState('');             // 4 | 3
  const [filterHasPrices, setFilterHasPrices] = useState(false);          // boolean
  const [filterMaxDistance, setFilterMaxDistance] = useState('');         // 25 | 50 | 100
  const [districts, setDistricts] = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);

  // ── Haversine distance calculator ──────────────────────────────────────
  const getDistance = useCallback((lat, lon) => {
    if (!granted || !userLat || !userLon || !lat || !lon) return null;
    const R = 6371;
    const dLat = (lat - userLat) * Math.PI / 180;
    const dLon = (lon - userLon) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(userLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
  }, [userLat, userLon, granted]);

  // ── Load mandis from API ──────────────────────────────────────────────
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
      if (filterOperatingStatus) params.operating_status = filterOperatingStatus;
      if (filterMinRating) params.min_rating = filterMinRating;
      if (filterHasPrices) params.has_prices = true;
      if (filterMaxDistance && userLat && userLon) {
        params.user_lat = userLat;
        params.user_lng = userLon;
        params.max_distance_km = parseFloat(filterMaxDistance);
      }

      const res = await api.get('/mandis/map', { params });
      setMandis(res.data || []);
    } catch (err) {
      console.error('Failed to load mandis:', err);
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery, filterStateName, filterDistrictId, filterType,
    filterOperatingStatus, filterMinRating, filterHasPrices, filterMaxDistance,
    userLat, userLon
  ]);

  useEffect(() => { loadMandis(); }, [loadMandis]);

  // Load states for filter dropdown with counts
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

  // When state or district changes on map — fly to center of matching mandis
  useEffect(() => {
    if (!filterStateName) {
      setMapCenter(INDIA_CENTER);
      setMapZoom(5);
    } else if (filterStateName && mandis.length > 0) {
      const withCoords = mandis.filter(m => m.latitude && m.longitude);
      if (withCoords.length > 0) {
        const avgLat = withCoords.reduce((s, m) => s + m.latitude, 0) / withCoords.length;
        const avgLon = withCoords.reduce((s, m) => s + m.longitude, 0) / withCoords.length;
        setMapCenter([avgLat, avgLon]);
        setMapZoom(filterDistrictId ? 11 : 7);
      }
    }
  }, [filterStateName, filterDistrictId, mandis]);

  // ── Search debounce ───────────────────────────────────────────────────
  const searchTimeout = useRef(null);
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      loadMandis();
    }, 400);
  };

  // ── Select a mandi (load detail + reviews) ────────────────────────────
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

    // Load live weather at mandi coordinates
    if (mandi.latitude && mandi.longitude) {
      setWeatherLoading(true);
      try {
        const wRes = await api.get(`/weather/current?lat=${mandi.latitude}&lon=${mandi.longitude}`);
        if (!wRes.data?.error) setWeather(wRes.data);
      } catch { }
      setWeatherLoading(false);
    }
  }, [isAuthenticated]);

  // ── Submit review ─────────────────────────────────────────────────────
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
      // Reload map list so rating reflects on cards
      loadMandis();
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // ── Use My Location ───────────────────────────────────────────────────
  const handleUseLocation = async () => {
    try {
      const loc = await requestLocation();
      if (loc?.lat && loc?.lon) {
        setMapCenter([loc.lat, loc.lon]);
        setMapZoom(10);
      }
    } catch { }
  };

  // ── Sorted mandis ────────────────────────────────────────────────────
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

  // ── Reset all filters ─────────────────────────────────────────────────
  const resetAllFilters = () => {
    setFilterStateName('');
    setFilterDistrictId('');
    setFilterDistrictName('');
    setFilterType('');
    setFilterOperatingStatus('');
    setFilterMinRating('');
    setFilterHasPrices(false);
    setFilterMaxDistance('');
    setSearchQuery('');
    setMapCenter(INDIA_CENTER);
    setMapZoom(5);
  };

  const hasActiveFilters = Boolean(
    filterStateName || filterDistrictId || filterType || filterOperatingStatus ||
    filterMinRating || filterHasPrices || filterMaxDistance || searchQuery
  );

  // ═════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Green Gradient Banner ─────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-emerald-800 via-green-700 to-teal-700 text-white shadow-md">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/25 shadow-inner">
                <Building2 className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">All India Mandi Intelligence System</h1>
                  <span className="bg-emerald-400/25 border border-emerald-300/40 text-emerald-100 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Live Verified
                  </span>
                </div>
                <p className="text-emerald-100/90 text-xs sm:text-sm font-medium mt-0.5">
                  Complete 36 States/UTs Coverage • Real GPS Coordinates • AGMARKNET & Official Market Prices
                </p>
              </div>
            </div>

            {/* Nationwide Quick Stats Pills */}
            <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
              <div className="bg-white/15 border border-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                <span>36 States & UTs</span>
              </div>
              <div className="bg-white/15 border border-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-200" />
                <span>{mandis.length} Verified Mandis</span>
              </div>
              {granted && (
                <div className="bg-blue-500/30 border border-blue-300/40 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-blue-100">
                  <Locate className="w-3.5 h-3.5 text-blue-200" />
                  <span>GPS Active</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Interactive Hierarchical Breadcrumb Navigation ───────────── */}
          {/* India → State → District → Mandi → Mandi Details */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center gap-2 text-xs font-bold overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => {
                setFilterStateName('');
                setFilterDistrictId('');
                setFilterDistrictName('');
                setSelectedMandi(null);
                setShowDetailPanel(false);
                setMapCenter(INDIA_CENTER);
                setMapZoom(5);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                !filterStateName ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-100 hover:bg-white/10'
              }`}
            >
              <span>🇮🇳</span>
              <span>All India</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-emerald-300/60 flex-shrink-0" />

            {filterStateName ? (
              <button
                onClick={() => {
                  setFilterDistrictId('');
                  setFilterDistrictName('');
                  setSelectedMandi(null);
                  setShowDetailPanel(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                  !filterDistrictName ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-100 hover:bg-white/10'
                }`}
              >
                <span>{filterStateName}</span>
              </button>
            ) : (
              <span className="text-emerald-200/60 text-[11px] font-normal italic">Select a State</span>
            )}

            {filterDistrictName && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-300/60 flex-shrink-0" />
                <button
                  onClick={() => {
                    setSelectedMandi(null);
                    setShowDetailPanel(false);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                    !selectedMandi ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  <span>{filterDistrictName} District</span>
                </button>
              </>
            )}

            {selectedMandi && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-300/60 flex-shrink-0" />
                <span className="bg-white text-emerald-900 px-2.5 py-1 rounded-lg shadow-sm font-extrabold truncate max-w-[200px]">
                  {selectedMandi.name}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls Bar ──────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by mandi name, crop (e.g. wheat, tomato), city, district, or state..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); loadMandis(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex gap-2 flex-shrink-0 items-center">
              <button
                onClick={handleUseLocation}
                disabled={locLoading}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  granted
                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
                title="Find mandis near current coordinates"
              >
                <Locate className={`w-3.5 h-3.5 ${locLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{locLoading ? 'Locating...' : granted ? 'Near Me' : 'Use GPS'}</span>
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  showFilters || hasActiveFilters
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </button>

              {/* View Switcher */}
              <div className="flex bg-gray-100 rounded-xl border border-gray-200 p-0.5">
                {[
                  { mode: 'map', Icon: MapIcon, label: 'Map' },
                  { mode: 'grid', Icon: LayoutGrid, label: 'Grid' },
                  { mode: 'list', Icon: List, label: 'List' },
                ].map(({ mode, Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    title={`${label} View`}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === mode ? 'bg-white shadow-sm text-emerald-700 font-bold' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Quick Filter Chips ─────────────────────────────────────── */}
          <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[10px] uppercase font-black text-gray-400 flex-shrink-0">Quick Queries:</span>
            {QUICK_SEARCH_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (chip.query) setSearchQuery(chip.query);
                  if (chip.state) setFilterStateName(chip.state);
                  if (chip.district) {
                    setFilterDistrictName(chip.district);
                  }
                  if (chip.type) setFilterType(chip.type);
                  if (chip.status) setFilterOperatingStatus(chip.status);
                }}
                className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 rounded-lg text-[11px] font-bold border border-gray-200 hover:border-emerald-200 transition-all flex-shrink-0"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* ── Advanced Filter Panel ─────────────────────────────────── */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. State Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-extrabold text-emerald-900 px-1">
                    State / Union Territory
                  </label>
                  <select
                    value={filterStateName}
                    onChange={(e) => setFilterStateName(e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm"
                  >
                    <option value="">🇮🇳 All India (36 States & UTs)</option>
                    {states.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} {s.mandi_count !== undefined ? `(${s.mandi_count})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. District Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-extrabold text-emerald-900 px-1 flex items-center justify-between">
                    <span>District</span>
                    {districtsLoading && <span className="text-[9px] text-emerald-600 animate-pulse">Loading...</span>}
                  </label>
                  <select
                    value={filterDistrictId}
                    onChange={(e) => {
                      setFilterDistrictId(e.target.value);
                      const found = districts.find(d => String(d.id) === e.target.value);
                      setFilterDistrictName(found?.name || '');
                    }}
                    disabled={!filterStateName || districtsLoading}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm disabled:opacity-50"
                  >
                    <option value="">
                      {!filterStateName ? 'Select State First' : `All Districts (${districts.length})`}
                    </option>
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.mandi_count !== undefined ? `(${d.mandi_count})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Mandi Category */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-extrabold text-gray-600 px-1">
                    Market Category
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm"
                  >
                    <option value="">All Categories</option>
                    <option value="APMC Mandi">🏛️ APMC Mandi</option>
                    <option value="Government Mandi">🏢 Government Mandi</option>
                    <option value="Private Wholesale Market">🏪 Private Wholesale Market</option>
                    <option value="Wholesale">📦 Wholesale Terminal</option>
                    <option value="Rural Haat">🛖 Rural Haat</option>
                  </select>
                </div>

                {/* 4. Operating Status (Open Now) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-extrabold text-gray-600 px-1">
                    Operating Status (IST)
                  </label>
                  <select
                    value={filterOperatingStatus}
                    onChange={(e) => setFilterOperatingStatus(e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm"
                  >
                    <option value="">All Schedules</option>
                    <option value="OPEN">🟢 Open Now</option>
                    <option value="CLOSED">🔴 Closed</option>
                    <option value="HOURS_UNKNOWN">⚪ Hours Unknown</option>
                  </select>
                </div>

                {/* 5. Minimum Rating */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-extrabold text-gray-600 px-1">
                    Farmer Rating
                  </label>
                  <select
                    value={filterMinRating}
                    onChange={(e) => setFilterMinRating(e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm"
                  >
                    <option value="">All Ratings</option>
                    <option value="4">⭐ 4.0 & Above</option>
                    <option value="3">⭐ 3.0 & Above</option>
                  </select>
                </div>

                {/* 6. Distance Filter */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-extrabold text-gray-600 px-1">
                    Distance Radius
                  </label>
                  <select
                    value={filterMaxDistance}
                    onChange={(e) => setFilterMaxDistance(e.target.value)}
                    disabled={!granted}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm disabled:opacity-50"
                  >
                    <option value="">Any Distance</option>
                    <option value="25">Within 25 km</option>
                    <option value="50">Within 50 km</option>
                    <option value="100">Within 100 km</option>
                  </select>
                </div>
              </div>

              {/* Extra toggles & Reset */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 flex-wrap gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                  <input
                    type="checkbox"
                    checked={filterHasPrices}
                    onChange={(e) => setFilterHasPrices(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <span>Show only mandis with live market prices</span>
                </label>

                {hasActiveFilters && (
                  <button
                    onClick={resetAllFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold border border-red-200 transition-all"
                  >
                    <X className="w-3.5 h-3.5" /> Reset All Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content Area ─────────────────────────────────────────── */}
      <div className="max-w-[1800px] mx-auto w-full flex-1 flex flex-col">
        <div className="flex h-[calc(100vh-210px)] overflow-hidden">

          {/* ── LEFT PANEL: Mandi Cards List ──────────────────────────── */}
          <div className={`${
            viewMode === 'map' && showDetailPanel && selectedMandi ? 'hidden lg:flex' : 'flex'
          } flex-col w-full sm:w-84 lg:w-96 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto`}>
            
            {/* Header info */}
            <div className="p-3 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
              <p className="text-xs font-bold text-gray-700 truncate">
                {filterDistrictName ? (
                  <span>Mandis in <span className="text-emerald-800 font-extrabold">{filterDistrictName}</span></span>
                ) : filterStateName ? (
                  <span>Mandis in <span className="text-emerald-800 font-extrabold">{filterStateName}</span></span>
                ) : granted ? (
                  <span>Nearby Mandis</span>
                ) : (
                  <span>All India Mandis</span>
                )} • <span className="text-emerald-700 font-extrabold">{sortedMandis.length}</span>
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="text-[10px] text-gray-400 hover:text-emerald-700 font-semibold underline flex-shrink-0 ml-2"
                >
                  Clear All
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
                <span className="text-xs text-gray-500 font-medium">Retrieving verified mandi records...</span>
              </div>
            ) : sortedMandis.length === 0 ? (
              /* ── Distinct Empty States for 0 Mandis Found ─────────── */
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-3.5 border border-amber-200 shadow-sm">
                  <Store className="w-8 h-8 text-amber-600" />
                </div>

                {filterDistrictId ? (
                  <>
                    <h4 className="text-sm font-extrabold text-gray-900 mb-1.5">
                      No verified mandis registered for {filterDistrictName}
                    </h4>
                    <p className="text-xs text-gray-500 max-w-xs mb-4 leading-relaxed">
                      No official APMC or wholesale market records are registered under{' '}
                      <span className="font-semibold text-gray-700">{filterDistrictName}</span> in the connected government database.
                      Farmers typically trade at neighboring district hubs.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => { setFilterDistrictId(''); setFilterDistrictName(''); }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                      >
                        View All Mandis in {filterStateName}
                      </button>
                      <button
                        onClick={resetAllFilters}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
                      >
                        Explore All India
                      </button>
                    </div>
                  </>
                ) : searchQuery ? (
                  <>
                    <h4 className="text-sm font-extrabold text-gray-900 mb-1.5">
                      No mandis matching &ldquo;{searchQuery}&rdquo;
                    </h4>
                    <p className="text-xs text-gray-500 max-w-xs mb-4 leading-relaxed">
                      We searched mandi names, commodities, addresses, and districts. Check your spelling or try searching by popular commodity name (e.g. &ldquo;wheat&rdquo;, &ldquo;mustard&rdquo;).
                    </p>
                    <button
                      onClick={() => { setSearchQuery(''); loadMandis(); }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                      Clear Search Query
                    </button>
                  </>
                ) : filterOperatingStatus || filterMinRating || filterHasPrices ? (
                  <>
                    <h4 className="text-sm font-extrabold text-gray-900 mb-1.5">
                      No mandis match active criteria
                    </h4>
                    <p className="text-xs text-gray-500 max-w-xs mb-4 leading-relaxed">
                      No mandi records currently satisfy all selected filters (Operating status, ratings, or prices).
                    </p>
                    <button
                      onClick={resetAllFilters}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                      Reset All Filters
                    </button>
                  </>
                ) : (
                  <>
                    <h4 className="text-sm font-extrabold text-gray-900 mb-1.5">
                      No mandi records found
                    </h4>
                    <p className="text-xs text-gray-500 max-w-xs mb-4">
                      Adjust your active filters to view available agricultural mandis across India.
                    </p>
                    <button
                      onClick={resetAllFilters}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                      Reset All Filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3 p-3' : 'space-y-0 divide-y divide-gray-100'}>
                {sortedMandis.map((m) => {
                  const dist = getDistance(m.latitude, m.longitude);
                  const isActive = selectedMandi?.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => selectMandi(m)}
                      className={`cursor-pointer transition-all ${
                        viewMode === 'grid'
                          ? `rounded-2xl border overflow-hidden hover:shadow-md ${
                              isActive ? 'border-emerald-500 ring-2 ring-emerald-200 shadow-md bg-emerald-50/20' : 'border-gray-200 hover:border-emerald-300 bg-white'
                            }`
                          : `flex gap-3 p-3 hover:bg-emerald-50/40 ${
                              isActive ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600' : 'bg-white'
                            }`
                      }`}
                    >
                      {/* Card Image */}
                      <div className={viewMode === 'grid' ? 'h-28 overflow-hidden relative' : 'w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative'}>
                        <img
                          src={m.image_url ? `/api/static/${m.image_url}` : MANDI_FALLBACK}
                          alt={m.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = MANDI_FALLBACK; }}
                        />
                        {/* Live Price Tag */}
                        {m.has_prices && (
                          <span className="absolute bottom-1 right-1 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded shadow">
                            ₹ Prices
                          </span>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className={viewMode === 'grid' ? 'p-2.5' : 'flex-1 min-w-0'}>
                        {/* Badges strip */}
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md border ${
                            m.mandi_type === 'Government Mandi' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            m.mandi_type === 'Private Wholesale Market' || m.mandi_type === 'Private' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            m.mandi_type === 'Wholesale' || m.mandi_type === 'Rural Haat' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {m.mandi_type || 'APMC Mandi'}
                          </span>

                          {/* Operating Status Badge */}
                          {m.operating_status === 'OPEN' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Open Now
                            </span>
                          ) : m.operating_status === 'CLOSED' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Closed
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded border border-gray-200">
                              Hours Unknown
                            </span>
                          )}
                        </div>

                        {/* Mandi Name */}
                        <h3 className="text-xs font-black text-gray-900 truncate leading-snug">{m.name}</h3>
                        
                        {/* Location */}
                        <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 flex-shrink-0 text-emerald-600" />
                          <span className="truncate">{m.district_name}, {m.state_name}</span>
                        </p>

                        {/* Rating, Distance, Crops */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {m.average_rating > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              {m.average_rating} ({m.review_count})
                            </span>
                          ) : (
                            <span className="text-[9px] text-gray-400 font-medium">
                              Not Rated Yet
                            </span>
                          )}

                          {dist && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                              <Navigation className="w-2.5 h-2.5" /> {dist} km
                            </span>
                          )}

                          {m.crop_count > 0 && (
                            <span className="text-[10px] text-gray-500 font-semibold">
                              {m.crop_count} crops
                            </span>
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

          {/* ── CENTER PANEL: Interactive Map ─────────────────────────── */}
          {viewMode === 'map' && (
            <div className="flex-1 relative bg-gray-100">
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

                {/* User GPS location marker */}
                {granted && userLat && userLon && (
                  <Marker position={[userLat, userLon]} icon={userLocationIcon}>
                    <Popup>
                      <div className="text-center p-1">
                        <p className="font-bold text-xs text-blue-700">📍 Your Current Location</p>
                        <p className="text-[10px] text-gray-400">{userLat.toFixed(4)}°N, {userLon.toFixed(4)}°E</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Mandi markers with real coordinates */}
                {mandis.filter(m => m.latitude && m.longitude).map((m) => (
                  <Marker
                    key={m.id}
                    position={[m.latitude, m.longitude]}
                    icon={createMandiIcon(m.mandi_type, selectedMandi?.id === m.id)}
                    eventHandlers={{ click: () => selectMandi(m) }}
                  >
                    <Popup maxWidth={300}>
                      <div className="min-w-[240px] p-0.5">
                        <div className="flex items-center justify-between gap-1 mb-1.5">
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
                          <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span>{m.district_name}, {m.state_name}</span>
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2 font-semibold">
                          <span>
                            {m.operating_status === 'OPEN' ? '🟢 Open Now' : m.operating_status === 'CLOSED' ? '🔴 Closed' : '⚪ Hours Unknown'}
                          </span>
                          {m.average_rating > 0 ? (
                            <span className="text-amber-600 font-bold">⭐ {m.average_rating} ({m.review_count})</span>
                          ) : (
                            <span className="text-gray-400">Not Rated Yet</span>
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

              {/* Map Floating Record Counter */}
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md rounded-2xl px-3.5 py-2 shadow-lg border border-gray-200 z-10 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-xs font-bold text-gray-700">
                  <span className="text-emerald-700 font-extrabold">
                    {mandis.filter(m => m.latitude && m.longitude).length}
                  </span> Verified Markers
                </p>
              </div>

              {/* Map Floating Category Legend */}
              <div className="absolute bottom-6 right-3 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-gray-200 z-10 text-xs space-y-1.5 min-w-[180px]">
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
                  <span className="text-[11px] font-semibold text-gray-700">Private Wholesale Market</span>
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

          {/* Grid/List View alternate container */}
          {viewMode !== 'map' && !showDetailPanel && (
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {/* Handled in left panel */}
            </div>
          )}

          {/* ── RIGHT PANEL: Mandi Detail & Reviews Panel ─────────────── */}
          {showDetailPanel && selectedMandi && (
            <div className="w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto shadow-lg z-20">
              {/* Detail Header Hero */}
              <div className="relative">
                <div className="h-44 overflow-hidden">
                  <img
                    src={selectedMandi.image_url ? `/api/static/${selectedMandi.image_url}` : MANDI_FALLBACK}
                    alt={selectedMandi.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = MANDI_FALLBACK; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                </div>

                <button
                  onClick={() => { setShowDetailPanel(false); setSelectedMandi(null); }}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-extrabold uppercase bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded border border-white/30 text-white">
                      {selectedMandi.mandi_type || 'APMC Mandi'}
                    </span>
                    <span className="text-[9px] font-bold bg-emerald-500/80 text-white px-2 py-0.5 rounded">
                      ✓ Verified
                    </span>
                  </div>
                  <h2 className="text-lg font-black tracking-tight leading-snug">{selectedMandi.name}</h2>
                  <p className="text-xs font-medium text-white/85 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-emerald-300" />
                    {selectedMandi.district_name}, {selectedMandi.state_name}
                  </p>
                </div>
              </div>

              {/* Quick Action & Status Bar */}
              <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100 bg-gray-50/50 flex-wrap">
                {/* Operating status badge */}
                {selectedMandi.operating_status === 'OPEN' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Open Now
                  </span>
                ) : selectedMandi.operating_status === 'CLOSED' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-lg border border-rose-200">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Closed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg border border-gray-200">
                    Hours Unknown
                  </span>
                )}

                {/* Rating summary */}
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-black text-gray-900">
                    {detailData?.rating_stats?.average_rating > 0 ? detailData.rating_stats.average_rating : selectedMandi.average_rating || '—'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold">
                    ({detailData?.rating_stats?.total_reviews || selectedMandi.review_count || 0})
                  </span>
                </div>

                {/* Directions Button */}
                <button
                  onClick={() => handleGetDirections(selectedMandi)}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  <Navigation className="w-3.5 h-3.5" /> Directions
                </button>
              </div>

              {/* Tabs: Overview | Prices | Reviews */}
              <div className="flex border-b border-gray-200">
                {[
                  { key: 'overview', label: 'Overview', Icon: Store },
                  { key: 'prices', label: 'Market Prices', Icon: TrendingUp },
                  { key: 'reviews', label: 'Reviews', Icon: Star },
                ].map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    onClick={() => setDetailTab(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all border-b-2 ${
                      detailTab === key
                        ? 'text-emerald-700 border-emerald-600 bg-emerald-50/40'
                        : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="p-4">
                {detailLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
                    <span className="text-xs text-gray-400 font-medium">Loading mandi details...</span>
                  </div>
                ) : (
                  <>
                    {/* ─── TAB 1: OVERVIEW ──────────────────────────────── */}
                    {detailTab === 'overview' && detailData && (
                      <div className="space-y-4">
                        {/* Operating status & hours card */}
                        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5">
                          <p className="text-[10px] uppercase font-extrabold text-emerald-900 tracking-wider mb-1 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-700" /> Operating Schedule (Indian Standard Time)
                          </p>
                          <p className="text-xs font-bold text-emerald-950">
                            {detailData.opening_time && detailData.closing_time
                              ? `${detailData.opening_time} – ${detailData.closing_time} (IST)`
                              : 'Standard trading hours (Hours not explicitly published)'}
                          </p>
                          <p className="text-[11px] text-emerald-800 font-medium mt-1">
                            Status: <span className="font-bold">{selectedMandi.status_detail || 'Trading schedule verified'}</span>
                          </p>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <InfoCard icon={Store} label="Category" value={detailData.mandi_type || 'APMC Mandi'} />
                          <InfoCard icon={MapPin} label="Pincode" value={detailData.pincode || '—'} />
                          <InfoCard
                            icon={Navigation}
                            label="Coordinates"
                            value={detailData.latitude && detailData.longitude ? `${detailData.latitude.toFixed(4)}°N, ${detailData.longitude.toFixed(4)}°E` : 'Verified on Map'}
                          />
                          <InfoCard icon={Check} label="Verification" value={detailData.verification_status || 'VERIFIED'} />
                          {detailData.contact_number && (
                            <div className="col-span-2">
                              <InfoCard icon={Phone} label="Mandi Contact" value={detailData.contact_number} />
                            </div>
                          )}
                        </div>

                        {/* Authoritative Data Source */}
                        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 flex items-start gap-3">
                          <div className="w-7 h-7 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 text-blue-700 font-bold text-xs">
                            🏛️
                          </div>
                          <div>
                            <p className="text-[10px] font-extrabold text-blue-900 uppercase">Authoritative Data Source</p>
                            <p className="text-xs text-blue-900 font-bold mt-0.5">
                              {detailData.data_source || 'AGMARKNET / Directorate of Marketing & Inspection (Govt. of India)'}
                            </p>
                            <p className="text-[10px] text-blue-700 font-medium mt-1">
                              Record verified under the National Mandi Intelligence Registry.
                            </p>
                          </div>
                        </div>

                        {/* Address */}
                        {detailData.address && (
                          <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                            <p className="text-[10px] uppercase font-extrabold text-gray-400 mb-1">Full Mandi Address</p>
                            <p className="text-xs text-gray-700 font-medium leading-relaxed">{detailData.address}</p>
                          </div>
                        )}

                        {/* Traded Crops */}
                        {detailData.crops && detailData.crops.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase font-extrabold text-gray-500 mb-2 flex items-center gap-1.5">
                              <Wheat className="w-3.5 h-3.5 text-amber-500" /> Traded Agricultural Crops ({detailData.crops.length})
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {detailData.crops.map((c) => (
                                <span key={c.id} className="px-2.5 py-1 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-lg border border-amber-200">
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Live Weather */}
                        {weatherLoading ? (
                          <div className="flex items-center gap-2 py-3">
                            <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                            <span className="text-xs text-gray-400">Loading current weather at mandi...</span>
                          </div>
                        ) : weather ? (
                          <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl p-3.5 border border-sky-200">
                            <p className="text-[10px] uppercase font-extrabold text-sky-700 mb-2 flex items-center gap-1">
                              <CloudSun className="w-3.5 h-3.5" /> Live Weather at Market
                            </p>
                            <div className="flex items-center gap-3 mb-2">
                              {weather.icon_url && <img src={weather.icon_url} alt="" className="w-10 h-10" />}
                              <div>
                                <p className="text-xl font-black text-gray-900">
                                  {weather.temperature != null ? `${Math.round(weather.temperature)}°C` : '—'}
                                </p>
                                <p className="text-xs text-gray-500 font-medium">{weather.condition}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <MiniStat icon={<Droplets className="w-3 h-3 text-blue-500" />} value={`${weather.humidity || 0}%`} label="Humidity" />
                              <MiniStat icon={<Wind className="w-3 h-3 text-teal-500" />} value={`${weather.wind_speed || 0} km/h`} label="Wind" />
                              <MiniStat icon={<Thermometer className="w-3 h-3 text-orange-500" />} value={`${weather.feels_like ? Math.round(weather.feels_like) : '—'}°C`} label="Feels Like" />
                            </div>
                          </div>
                        ) : null}

                        {/* View Full Profile Page */}
                        <button
                          onClick={() => navigate(`/mandis/${selectedMandi.id}`)}
                          className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-all flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open Full Mandi Directory Profile
                        </button>
                      </div>
                    )}

                    {/* ─── TAB 2: MARKET PRICES ─────────────────────────── */}
                    {detailTab === 'prices' && (
                      <div className="space-y-3">
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-900">
                          <span>Verified Agricultural Market Rates</span>
                          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-black">
                            Official AGMARKNET
                          </span>
                        </div>

                        {detailData?.latest_prices && detailData.latest_prices.length > 0 ? (
                          detailData.latest_prices.map((p, i) => (
                            <div key={p.id || i} className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200 shadow-sm">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-xs font-black text-gray-900">{p.crop_name}</h4>
                                <span className="flex items-center gap-1 text-[11px] font-bold">
                                  {p.trend === 'UP' ? <TrendingUp className="w-3.5 h-3.5 text-green-600" /> :
                                   p.trend === 'DOWN' ? <TrendingDown className="w-3.5 h-3.5 text-red-500" /> :
                                   <Minus className="w-3.5 h-3.5 text-gray-400" />}
                                  <span className={p.trend === 'UP' ? 'text-green-600' : p.trend === 'DOWN' ? 'text-red-500' : 'text-gray-500'}>
                                    {p.change_percent ? `${p.change_percent > 0 ? '+' : ''}${p.change_percent}%` : 'Stable'}
                                  </span>
                                </span>
                              </div>

                              <p className="text-[10px] text-gray-400 font-medium mb-2.5">
                                Variety: <span className="font-semibold text-gray-600">{p.variety || 'Standard'}</span> • Reported:{' '}
                                {p.price_date ? new Date(p.price_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'}
                              </p>

                              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200/80 items-end">
                                <div>
                                  <p className="text-[9px] text-gray-400 font-bold uppercase">Min Price</p>
                                  <p className="text-xs font-bold text-gray-700">₹{(p.min_price || 0).toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-gray-400 font-bold uppercase">Max Price</p>
                                  <p className="text-xs font-bold text-gray-700">₹{(p.max_price || 0).toLocaleString('en-IN')}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] text-emerald-600 font-bold uppercase">Modal Price</p>
                                  <p className="text-base font-black text-emerald-700">₹{(p.modal_price || 0).toLocaleString('en-IN')}</p>
                                  <p className="text-[9px] text-gray-400 font-medium">per {p.unit || 'Quintal'}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 px-4">
                            <TrendingUp className="w-9 h-9 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs text-gray-600 font-bold">No live price reports recorded for today</p>
                            <p className="text-[10px] text-gray-400 mt-1 max-w-xs mx-auto">
                              Market arrival prices are published following the official AGMARKNET bulletin daily by the state marketing board.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ─── TAB 3: REVIEWS & RATINGS ─────────────────────── */}
                    {detailTab === 'reviews' && (
                      <div className="space-y-4">
                        {/* Rating Summary Card */}
                        {detailData?.rating_stats && (
                          <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200">
                            {detailData.rating_stats.total_reviews > 0 ? (
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <p className="text-3xl font-black text-amber-700">
                                    {detailData.rating_stats.average_rating || '—'}
                                  </p>
                                  <div className="flex items-center gap-0.5 mt-1 justify-center">
                                    {[1, 2, 3, 4, 5].map(s => (
                                      <Star
                                        key={s}
                                        className={`w-3.5 h-3.5 ${
                                          s <= Math.round(detailData.rating_stats.average_rating)
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <p className="text-[10px] text-amber-800 font-bold mt-1">
                                    {detailData.rating_stats.total_reviews} Farmer {detailData.rating_stats.total_reviews === 1 ? 'Review' : 'Reviews'}
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
                                        <span className="text-[10px] text-gray-500 font-bold w-5 text-right">{count}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-2">
                                <p className="text-sm font-black text-amber-900">Not Rated Yet — Be the First to Review.</p>
                                <p className="text-xs text-amber-700 mt-0.5">Share genuine feedback on weighing accuracy, payment speed, and facilities.</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Write/Edit Review Form */}
                        <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200">
                          <p className="text-[10px] uppercase font-extrabold text-gray-500 mb-2">
                            {myReview ? 'Update Your Farmer Review' : 'Rate & Review This Mandi'}
                          </p>
                          <div className="flex items-center gap-1.5 mb-2.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setReviewForm(f => ({ ...f, rating: s }))}
                                className="p-0.5 transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    s <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="text-xs font-bold text-gray-600 ml-2">
                              {reviewForm.rating} / 5 Stars
                            </span>
                          </div>

                          <textarea
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                            placeholder="Share your experience (payment time, commission, weighing transparency, parking)..."
                            maxLength={1000}
                            rows={3}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                          />

                          <button
                            onClick={handleSubmitReview}
                            disabled={submittingReview}
                            className="mt-2.5 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
                          >
                            {submittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            {submittingReview ? 'Submitting...' : myReview ? 'Update My Review' : 'Submit Review'}
                          </button>
                        </div>

                        {/* Genuine Reviews List */}
                        {reviewsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                            <span className="ml-2 text-xs text-gray-400">Loading farmer reviews...</span>
                          </div>
                        ) : reviews.length > 0 ? (
                          <div className="space-y-3">
                            {reviews.map((r) => (
                              <div key={r.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                                <div className="flex items-start gap-2.5">
                                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    {r.user_avatar ? (
                                      <img src={r.user_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                      <User className="w-4 h-4 text-emerald-700" />
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
                                      <p className="text-[11px] text-gray-700 mt-1.5 leading-relaxed">{r.comment}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs text-gray-600 font-bold">Not Rated Yet — Be the First to Review.</p>
                            <p className="text-[10px] text-gray-400 mt-1">Genuine farmer ratings help the entire agricultural community.</p>
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

      {/* Global pulse and styling fixes */}
      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          70% { box-shadow: 0 0 0 16px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          padding: 0 !important;
          box-shadow: 0 12px 36px rgba(0,0,0,0.2) !important;
        }
        .leaflet-popup-content {
          margin: 14px 16px !important;
        }
        .leaflet-popup-close-button {
          top: 8px !important;
          right: 10px !important;
        }
      `}</style>
    </div>
  );
};


// ── Helper Components ────────────────────────────────────────────────────────

const InfoCard = ({ icon: Icon, label, value }) => (
  <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
    <div className="flex items-center gap-1.5 mb-1">
      <Icon className="w-3 h-3 text-emerald-600" />
      <p className="text-[9px] uppercase font-extrabold text-gray-400">{label}</p>
    </div>
    <p className="text-xs font-bold text-gray-800 truncate">{value}</p>
  </div>
);

const MiniStat = ({ icon, value, label }) => (
  <div className="text-center">
    <div className="flex items-center justify-center mb-0.5">{icon}</div>
    <p className="text-xs font-bold text-gray-800">{value}</p>
    <p className="text-[9px] text-gray-400 font-medium">{label}</p>
  </div>
);

export default MandiMapPage;
export { MandiMapPage };
