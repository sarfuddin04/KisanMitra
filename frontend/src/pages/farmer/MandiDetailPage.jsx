import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Clock, Phone, ArrowLeft, TrendingUp, Store, Navigation,
  Wheat, CloudSun, Droplets, Wind, Thermometer, ExternalLink, Loader2
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import api from '../../services/api';
import { useLocation } from '../../context/LocationContext';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const MANDI_FALLBACK = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80';

export const MandiDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lat: userLat, lon: userLon, granted } = useLocation();

  const [mandi, setMandi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/mandis/${id}/detail`);
        setMandi(res.data);

        // Fetch weather for mandi location
        if (res.data?.latitude && res.data?.longitude) {
          setWeatherLoading(true);
          try {
            const wRes = await api.get(`/weather/current?lat=${res.data.latitude}&lon=${res.data.longitude}`);
            if (!wRes.data?.error) setWeather(wRes.data);
          } catch { }
          setWeatherLoading(false);
        }
      } catch (err) {
        console.error("Failed to load mandi:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return d; }
  };

  // Calculate distance
  const distance = (() => {
    if (!granted || !userLat || !userLon || !mandi?.latitude || !mandi?.longitude) return null;
    const R = 6371;
    const dLat = (mandi.latitude - userLat) * Math.PI / 180;
    const dLon = (mandi.longitude - userLon) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(userLat*Math.PI/180) * Math.cos(mandi.latitude*Math.PI/180) * Math.sin(dLon/2)**2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
  })();

  const handleGetDirections = () => {
    if (!mandi?.latitude || !mandi?.longitude) return;
    const origin = userLat && userLon ? `${userLat},${userLon}` : '';
    const dest = `${mandi.latitude},${mandi.longitude}`;
    const url = origin
      ? `https://www.google.com/maps/dir/${origin}/${dest}`
      : `https://www.google.com/maps/dir//${dest}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="ml-2 text-sm text-gray-400 font-medium">Loading mandi details...</span>
      </div>
    );
  }

  if (!mandi) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center">
        <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Mandi not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-emerald-600 font-bold text-xs hover:underline">← Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-1.5 text-xs font-bold text-gray-500 hover:text-emerald-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Mandi Header Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Image Banner */}
        <div className="h-48 sm:h-56 overflow-hidden relative">
          <img
            src={mandi.image_url ? `/api/static/${mandi.image_url}` : MANDI_FALLBACK}
            alt={mandi.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = MANDI_FALLBACK; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-6 text-white">
            <h1 className="text-2xl font-black tracking-tight">{mandi.name}</h1>
            <p className="text-sm font-medium opacity-90 flex items-center space-x-1 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{mandi.district_name}, {mandi.state_name}</span>
            </p>
          </div>
          {distance && (
            <div className="absolute bottom-4 right-6 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
              <Navigation className="w-3 h-3" /> {distance} km away
            </div>
          )}
        </div>

        {/* Mandi Info Grid */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoItem icon={Store} label="Type" value={mandi.mandi_type || 'APMC Mandi'} />
          <InfoItem icon={MapPin} label="Address" value={mandi.address || '—'} />
          <InfoItem icon={MapPin} label="Pincode" value={mandi.pincode || '—'} />
          <InfoItem icon={Phone} label="Contact" value={mandi.contact_number || '—'} />
          {mandi.opening_time && (
            <InfoItem icon={Clock} label="Timings" value={`${mandi.opening_time} – ${mandi.closing_time || '—'}`} />
          )}
          {mandi.latitude && (
            <InfoItem icon={MapPin} label="Coordinates" value={`${mandi.latitude}, ${mandi.longitude}`} />
          )}
        </div>

        {/* Action Buttons */}
        {mandi.latitude && mandi.longitude && (
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={handleGetDirections}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all"
            >
              <Navigation className="w-4 h-4" /> Get Directions
            </button>
            <button
              onClick={() => navigate('/mandi-map')}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-all"
            >
              <MapPin className="w-4 h-4" /> View on Map
            </button>
          </div>
        )}
      </div>

      {/* Map + Weather Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map Section */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" /> Mandi Location
            </h3>
          </div>
          <div className="h-64">
            {GOOGLE_MAPS_KEY && mandi.latitude && mandi.longitude ? (
              <APIProvider apiKey={GOOGLE_MAPS_KEY}>
                <Map
                  defaultCenter={{ lat: mandi.latitude, lng: mandi.longitude }}
                  defaultZoom={14}
                  mapId="mandi-detail-map"
                  gestureHandling="cooperative"
                  className="w-full h-full"
                >
                  <AdvancedMarker position={{ lat: mandi.latitude, lng: mandi.longitude }}>
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg border-3 border-white">
                      <Store className="w-5 h-5 text-white" />
                    </div>
                  </AdvancedMarker>
                </Map>
              </APIProvider>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center p-4">
                  <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-500">Map temporarily unavailable</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {!mandi.latitude ? 'Location coordinates not available for this mandi.' : 'Google Maps is not configured.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weather at Mandi */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <CloudSun className="w-4 h-4 text-sky-600" /> Current Weather at {mandi.name}
            </h3>
          </div>
          <div className="p-5">
            {weatherLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
                <span className="ml-2 text-xs text-gray-400">Loading weather...</span>
              </div>
            ) : weather ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {weather.icon_url && <img src={weather.icon_url} alt={weather.condition} className="w-14 h-14" />}
                  <div>
                    <p className="text-3xl font-black text-gray-900">
                      {weather.temperature != null ? `${Math.round(weather.temperature)}°C` : '—'}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">{weather.condition}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <WeatherMini icon={<Thermometer className="w-3.5 h-3.5 text-orange-500" />} label="Feels Like" value={weather.feels_like != null ? `${Math.round(weather.feels_like)}°C` : '—'} />
                  <WeatherMini icon={<Droplets className="w-3.5 h-3.5 text-blue-500" />} label="Humidity" value={weather.humidity != null ? `${weather.humidity}%` : '—'} />
                  <WeatherMini icon={<Wind className="w-3.5 h-3.5 text-teal-500" />} label="Wind" value={`${weather.wind_speed ?? 0} km/h`} />
                  <WeatherMini icon={<CloudSun className="w-3.5 h-3.5 text-sky-500" />} label="Rainfall" value={`${weather.rainfall ?? 0} mm`} />
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-8 text-center">
                Weather data unavailable. Set WEATHER_API_KEY in backend .env.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Crops at this Mandi */}
      {mandi.crops && mandi.crops.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <Wheat className="w-4 h-4 text-amber-600" /> Crops Available ({mandi.crops.length})
            </h3>
          </div>
          <div className="p-5 flex flex-wrap gap-2">
            {mandi.crops.map(c => (
              <span key={c.id} className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                {c.name}
                {c.season && <span className="text-amber-400 ml-1.5">• {c.season}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Current Prices Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-black text-gray-900">Market Prices at {mandi.name}</h3>
          </div>
          <span className="text-[10px] text-gray-400 font-semibold">Source: Official Market Data</span>
        </div>

        {mandi.latest_prices && mandi.latest_prices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50/80 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-5 text-left">Commodity</th>
                  <th className="py-3.5 px-5 text-left">Variety</th>
                  <th className="py-3.5 px-5 text-right">Min Price</th>
                  <th className="py-3.5 px-5 text-right">Max Price</th>
                  <th className="py-3.5 px-5 text-right">Modal Price</th>
                  <th className="py-3.5 px-5 text-left">Price Date</th>
                  <th className="py-3.5 px-5 text-left">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {mandi.latest_prices.map((p) => (
                  <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-gray-900">{p.crop_name}</td>
                    <td className="py-3.5 px-5 text-gray-500">{p.variety || 'Standard'}</td>
                    <td className="py-3.5 px-5 text-right font-mono">₹{(p.min_price || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-5 text-right font-mono">₹{(p.max_price || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-5 text-right font-extrabold text-emerald-700">
                      ₹{(p.modal_price || 0).toLocaleString('en-IN')}
                      <span className="text-[10px] text-gray-400 font-normal ml-1">/{p.unit || 'Quintal'}</span>
                    </td>
                    <td className="py-3.5 px-5 text-gray-500">{formatDate(p.price_date)}</td>
                    <td className="py-3.5 px-5">
                      <span className="text-[10px] font-semibold text-gray-400">
                        {p.data_source === 'data.gov.in' ? 'Official' : p.data_source || 'Admin'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-gray-400">
            No prices currently available for this mandi. Data will appear after synchronization.
          </div>
        )}
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start space-x-2">
    <Icon className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
    <div>
      <p className="text-[10px] text-gray-400 font-bold uppercase">{label}</p>
      <p className="text-xs font-semibold text-gray-700 mt-0.5">{value}</p>
    </div>
  </div>
);

const WeatherMini = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
    {icon}
    <div>
      <p className="text-[9px] text-gray-400 font-bold uppercase">{label}</p>
      <p className="text-xs font-bold text-gray-700">{value}</p>
    </div>
  </div>
);
