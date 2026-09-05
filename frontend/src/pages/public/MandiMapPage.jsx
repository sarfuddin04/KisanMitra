import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Search, Navigation, Filter, ChevronDown, ExternalLink,
  Clock, Phone, Wheat, Store, X, Crosshair, Loader2, Map as MapIcon,
  List, SlidersHorizontal, ChevronRight, Star
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import api from '../../services/api';
import { useLocation } from '../../context/LocationContext';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// India center coordinates
const INDIA_CENTER = { lat: 22.5937, lng: 78.9629 };
const INDIA_ZOOM = 5;

const RADIUS_OPTIONS = [
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
];

// ═══════════════════════════════════════════════════════
//  MARKER CLUSTERING COMPONENT
// ═══════════════════════════════════════════════════════
function ClusteredMarkers({ mandis, onMarkerClick, selectedId }) {
  const map = useMap();
  const clustererRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!map) return;
    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({ map, markers: [] });
    }
    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
    };
  }, [map]);

  useEffect(() => {
    if (!clustererRef.current) return;
    clustererRef.current.clearMarkers();
    markersRef.current = [];
  }, [mandis]);

  const handleMarkerMount = useCallback((marker, mandi) => {
    if (!clustererRef.current || !marker) return;
    markersRef.current.push(marker);
    clustererRef.current.addMarker(marker);
  }, []);

  return (
    <>
      {mandis.map(m => (
        <AdvancedMarker
          key={m.id}
          position={{ lat: m.latitude, lng: m.longitude }}
          onClick={() => onMarkerClick(m)}
          ref={(marker) => {
            if (marker) handleMarkerMount(marker, m);
          }}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 transition-all ${
            selectedId === m.id
              ? 'bg-amber-500 border-amber-600 scale-125'
              : 'bg-emerald-600 border-emerald-700 hover:scale-110'
          }`}>
            <Store className="w-4 h-4 text-white" />
          </div>
        </AdvancedMarker>
      ))}
    </>
  );
}

// ═══════════════════════════════════════════════════════
//  USER LOCATION MARKER
// ═══════════════════════════════════════════════════════
function UserLocationMarker({ lat, lon }) {
  if (!lat || !lon) return null;
  return (
    <AdvancedMarker position={{ lat, lng: lon }}>
      <div className="relative">
        <div className="w-5 h-5 bg-blue-500 rounded-full border-3 border-white shadow-lg animate-pulse" />
        <div className="absolute inset-0 w-5 h-5 bg-blue-400 rounded-full animate-ping opacity-40" />
      </div>
    </AdvancedMarker>
  );
}

// ═══════════════════════════════════════════════════════
//  MANDI CARD COMPONENT
// ═══════════════════════════════════════════════════════
function MandiCard({ mandi, isSelected, onClick, onViewDetails, onGetDirections }) {
  return (
    <div
      onClick={() => onClick(mandi)}
      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50/80 shadow-md ring-1 ring-emerald-200'
          : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Mandi Image / Placeholder */}
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
          {mandi.image_url ? (
            <img src={mandi.image_url} alt={mandi.name} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <Store className="w-6 h-6 text-emerald-600" />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm truncate">{mandi.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {mandi.district_name}{mandi.state_name ? `, ${mandi.state_name}` : ''}
          </p>

          {/* Distance badge */}
          {mandi.distance_km != null && (
            <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
              <Navigation className="w-3 h-3" />
              {mandi.distance_km} km away
            </span>
          )}

          {/* Crops */}
          {mandi.crops && mandi.crops.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {mandi.crops.slice(0, 3).map((crop, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-semibold">
                  {typeof crop === 'string' ? crop : crop.name}
                </span>
              ))}
              {mandi.crops.length > 3 && (
                <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-semibold">
                  +{mandi.crops.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Timing */}
          {(mandi.opening_time || mandi.closing_time) && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400">
              <Clock className="w-3 h-3" />
              {mandi.opening_time || '—'} – {mandi.closing_time || '—'}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {isSelected && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-emerald-200">
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails(mandi); }}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all"
          >
            View Details <ChevronRight className="w-3.5 h-3.5" />
          </button>
          {mandi.latitude && mandi.longitude && (
            <button
              onClick={(e) => { e.stopPropagation(); onGetDirections(mandi); }}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
            >
              <Navigation className="w-3.5 h-3.5" /> Directions
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  MAIN MANDI MAP PAGE
// ═══════════════════════════════════════════════════════
export const MandiMapPage = () => {
  const navigate = useNavigate();
  const { lat: userLat, lon: userLon, locationName, loading: locLoading, error: locError, granted, requestLocation } = useLocation();

  // Filters
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [crops, setCrops] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedCropId, setSelectedCropId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(50);
  const [useNearby, setUseNearby] = useState(false);

  // Map data
  const [mandis, setMandis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMandi, setSelectedMandi] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'map' | 'list'

  const searchTimeoutRef = useRef(null);

  // Load filter options
  useEffect(() => {
    api.get('/states').then(r => setStates(r.data || [])).catch(() => {});
    api.get('/crops').then(r => setCrops(r.data || [])).catch(() => {});
  }, []);

  // Load districts when state changes
  useEffect(() => {
    setDistricts([]);
    setSelectedDistrictId('');
    if (selectedStateId) {
      api.get(`/states/${selectedStateId}/districts`).then(r => setDistricts(r.data || [])).catch(() => {});
    }
  }, [selectedStateId]);

  // Fetch mandis based on filters
  const fetchMandis = useCallback(async () => {
    setLoading(true);
    try {
      if (useNearby && userLat && userLon) {
        const params = new URLSearchParams({
          lat: userLat, lon: userLon, radius: radius,
          ...(selectedCropId && { crop_id: selectedCropId }),
          limit: 200,
        });
        const res = await api.get(`/mandis/nearby?${params}`);
        setMandis(res.data || []);
      } else {
        const params = new URLSearchParams({
          ...(selectedStateId && { state_id: selectedStateId }),
          ...(selectedDistrictId && { district_id: selectedDistrictId }),
          ...(selectedCropId && { crop_id: selectedCropId }),
          ...(searchQuery.trim() && { q: searchQuery.trim() }),
          limit: 500,
        });
        // Use search endpoint when there's a query, map endpoint otherwise
        const endpoint = searchQuery.trim() ? '/mandis/search' : '/mandis/map';
        const res = await api.get(`${endpoint}?${params}`);
        setMandis(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch mandis:', err);
      setMandis([]);
    }
    setLoading(false);
  }, [selectedStateId, selectedDistrictId, selectedCropId, searchQuery, useNearby, userLat, userLon, radius]);

  useEffect(() => {
    fetchMandis();
  }, [fetchMandis]);

  // Debounced search
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      // fetchMandis will be triggered by searchQuery dependency
    }, 400);
  };

  // Actions
  const handleMarkerClick = (mandi) => {
    setSelectedMandi(mandi);
  };

  const handleViewDetails = (mandi) => {
    navigate(`/mandis/${mandi.id}`);
  };

  const handleGetDirections = (mandi) => {
    if (!mandi.latitude || !mandi.longitude) return;
    const origin = userLat && userLon ? `${userLat},${userLon}` : '';
    const dest = `${mandi.latitude},${mandi.longitude}`;
    const url = origin
      ? `https://www.google.com/maps/dir/${origin}/${dest}`
      : `https://www.google.com/maps/dir//${dest}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleUseMyLocation = async () => {
    try {
      await requestLocation();
      setUseNearby(true);
    } catch (err) {
      // Error is already set in context
    }
  };

  const clearFilters = () => {
    setSelectedStateId('');
    setSelectedDistrictId('');
    setSelectedCropId('');
    setSearchQuery('');
    setUseNearby(false);
    setSelectedMandi(null);
  };

  const hasActiveFilters = selectedStateId || selectedDistrictId || selectedCropId || searchQuery || useNearby;

  // Map center
  const mapCenter = useMemo(() => {
    if (useNearby && userLat && userLon) return { lat: userLat, lng: userLon };
    if (mandis.length > 0 && mandis[0].latitude) {
      return { lat: mandis[0].latitude, lng: mandis[0].longitude };
    }
    return INDIA_CENTER;
  }, [useNearby, userLat, userLon, mandis]);

  const mapZoom = useMemo(() => {
    if (useNearby && userLat) return 10;
    if (selectedDistrictId) return 10;
    if (selectedStateId) return 7;
    return INDIA_ZOOM;
  }, [useNearby, userLat, selectedDistrictId, selectedStateId]);

  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
          <MapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-black text-gray-900 mb-2">Google Maps API Key Required</h2>
          <p className="text-sm text-gray-500">
            Add <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">VITE_GOOGLE_MAPS_API_KEY</code> to your <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">frontend/.env</code> file to enable the Mandi Map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <MapIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">All India Mandi Map</h1>
              <p className="text-emerald-100 text-xs font-medium">
                Explore {mandis.length} APMC mandis across India • Real-time market data
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search mandis, crops, locations..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              {/* Use My Location */}
              <button
                onClick={handleUseMyLocation}
                disabled={locLoading}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  useNearby && granted
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                {locLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
                {locLoading ? 'Locating...' : useNearby && granted ? locationName || 'My Location' : 'Use My Location'}
              </button>

              {/* Radius (when nearby) */}
              {useNearby && granted && (
                <select
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {RADIUS_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label} radius</option>
                  ))}
                </select>
              )}

              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  showFilters || hasActiveFilters
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {hasActiveFilters && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">
                    {[selectedStateId, selectedDistrictId, selectedCropId, useNearby].filter(Boolean).length}
                  </span>
                )}
              </button>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-all"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}

              {/* View Mode */}
              <div className="hidden md:flex items-center border border-gray-300 rounded-xl overflow-hidden">
                {[
                  { mode: 'split', icon: <span className="text-[10px] font-black">⊞</span>, label: 'Split' },
                  { mode: 'map', icon: <MapIcon className="w-3.5 h-3.5" />, label: 'Map' },
                  { mode: 'list', icon: <List className="w-3.5 h-3.5" />, label: 'List' },
                ].map(v => (
                  <button
                    key={v.mode}
                    onClick={() => setViewMode(v.mode)}
                    className={`flex items-center gap-1 px-3 py-2.5 text-xs font-bold transition-all ${
                      viewMode === v.mode ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {v.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
              <select
                value={selectedStateId}
                onChange={(e) => { setSelectedStateId(e.target.value); setUseNearby(false); }}
                className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">All States</option>
                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              <select
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                disabled={!selectedStateId}
                className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:opacity-50"
              >
                <option value="">All Districts</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>

              <select
                value={selectedCropId}
                onChange={(e) => setSelectedCropId(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">All Crops</option>
                {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Location Error */}
        {locError && (
          <div className="max-w-7xl mx-auto px-4 pb-2">
            <div className="bg-red-50 text-red-700 text-xs font-medium px-3 py-2 rounded-xl">{locError}</div>
          </div>
        )}
      </div>

      {/* Main Content: Map + List */}
      <div className="max-w-7xl mx-auto">
        <div className={`flex flex-col md:flex-row ${viewMode === 'list' ? '' : 'h-[calc(100vh-220px)]'}`}>
          {/* Map Panel */}
          {viewMode !== 'list' && (
            <div className={`${viewMode === 'split' ? 'md:w-3/5' : 'w-full'} h-[50vh] md:h-full relative`}>
              <APIProvider apiKey={GOOGLE_MAPS_KEY}>
                <Map
                  defaultCenter={mapCenter}
                  defaultZoom={mapZoom}
                  center={mapCenter}
                  zoom={mapZoom}
                  mapId="mandi-map-main"
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  className="w-full h-full"
                >
                  <ClusteredMarkers
                    mandis={mandis}
                    onMarkerClick={handleMarkerClick}
                    selectedId={selectedMandi?.id}
                  />
                  <UserLocationMarker lat={userLat} lon={userLon} />

                  {/* Info Window */}
                  {selectedMandi && selectedMandi.latitude && (
                    <InfoWindow
                      position={{ lat: selectedMandi.latitude, lng: selectedMandi.longitude }}
                      onCloseClick={() => setSelectedMandi(null)}
                      pixelOffset={[0, -40]}
                    >
                      <div className="p-2 min-w-[200px] max-w-[280px]">
                        <h3 className="font-black text-gray-900 text-sm">{selectedMandi.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {selectedMandi.district_name}{selectedMandi.state_name ? `, ${selectedMandi.state_name}` : ''}
                        </p>
                        {selectedMandi.distance_km != null && (
                          <p className="text-xs text-blue-600 font-bold mt-1">📍 {selectedMandi.distance_km} km away</p>
                        )}
                        {selectedMandi.crops && selectedMandi.crops.length > 0 && (
                          <p className="text-xs text-gray-600 mt-1">
                            🌾 {selectedMandi.crops.slice(0, 5).map(c => typeof c === 'string' ? c : c.name).join(', ')}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleViewDetails(selectedMandi)}
                            className="flex-1 text-xs font-bold bg-emerald-600 text-white px-2 py-1.5 rounded-lg hover:bg-emerald-700"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleGetDirections(selectedMandi)}
                            className="text-xs font-bold bg-blue-600 text-white px-2 py-1.5 rounded-lg hover:bg-blue-700"
                          >
                            Directions
                          </button>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>

              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-bold">Loading mandis...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* List Panel */}
          {viewMode !== 'map' && (
            <div className={`${viewMode === 'split' ? 'md:w-2/5' : 'w-full'} border-l border-gray-200 bg-gray-50 overflow-y-auto`}
                 style={{ maxHeight: viewMode === 'list' ? 'none' : undefined }}>
              <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-gray-900">
                    {loading ? 'Loading...' : `${mandis.length} Mandis Found`}
                  </h2>
                  {useNearby && granted && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      Within {radius} km
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 space-y-2">
                {mandis.length === 0 && !loading ? (
                  <div className="text-center py-16">
                    <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-500">No mandis found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  mandis.map(m => (
                    <MandiCard
                      key={m.id}
                      mandi={m}
                      isSelected={selectedMandi?.id === m.id}
                      onClick={handleMarkerClick}
                      onViewDetails={handleViewDetails}
                      onGetDirections={handleGetDirections}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
