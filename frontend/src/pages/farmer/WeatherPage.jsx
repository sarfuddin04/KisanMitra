import React, { useState, useEffect } from 'react';
import { CloudSun, Droplets, Wind, Thermometer, MapPin, AlertCircle, Calendar, Eye, Gauge, Sun, Crosshair, Loader2, Search } from 'lucide-react';
import api from '../../services/api';
import { useLocation } from '../../context/LocationContext';

export const WeatherPage = () => {
  const { lat: userLat, lon: userLon, locationName: userLocName, loading: locLoading, error: locError, granted, requestLocation } = useLocation();
  const [locationInput, setLocationInput] = useState('Lucknow');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = async (loc, lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      let url;
      if (lat && lon) {
        url = `/weather/forecast?lat=${lat}&lon=${lon}&days=7`;
      } else {
        url = `/weather/forecast?location=${encodeURIComponent(loc)}&days=7`;
      }
      const res = await api.get(url);
      if (res.data?.error) {
        setError(res.data.error);
        setWeather(null);
      } else {
        setWeather(res.data);
      }
    } catch (err) {
      setError('Unable to fetch weather data. Please check your connection.');
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchWeather(locationInput);
  }, []);

  // When user location becomes available
  useEffect(() => {
    if (granted && userLat && userLon) {
      fetchWeather(null, userLat, userLon);
    }
  }, [granted, userLat, userLon]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (locationInput.trim()) {
      fetchWeather(locationInput.trim());
    }
  };

  const handleUseMyLocation = async () => {
    try {
      const loc = await requestLocation();
      if (loc.lat && loc.lon) {
        fetchWeather(null, loc.lat, loc.lon);
      }
    } catch { }
  };

  const current = weather?.current;
  const forecast = weather?.forecast_daily || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Header & Location Controls */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
            <CloudSun className="w-7 h-7 text-sky-600" />
            <span>Weather & Agro-Advisory</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Real-time weather data powered by WeatherAPI.com
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Enter city or district..."
                className="pl-9 pr-4 py-2 bg-white rounded-xl border border-gray-300 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-sky-500 outline-none shadow-xs w-52"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all">
              Search
            </button>
          </form>

          {/* Use My Location */}
          <button
            onClick={handleUseMyLocation}
            disabled={locLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all disabled:opacity-50"
          >
            {locLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
            {locLoading ? 'Locating...' : 'Use My Location'}
          </button>
        </div>
      </div>

      {/* Location Error */}
      {locError && (
        <div className="bg-red-50 text-red-700 text-xs font-medium px-4 py-3 rounded-xl border border-red-200">{locError}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
          <span className="ml-3 text-sm font-bold text-gray-500">Fetching weather data...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-amber-900">{error}</p>
          <p className="text-xs text-amber-600 mt-1">
            {error.includes('unavailable') || error.includes('not configured')
              ? 'The weather service may not be configured yet. Please contact the administrator.'
              : 'Please try again or search for a different location.'}
          </p>
        </div>
      )}

      {/* Weather Content */}
      {current && !loading && (
        <div className="space-y-6">

          {/* Main Hero Weather Card */}
          <div className="bg-gradient-to-tr from-sky-600 via-sky-700 to-teal-700 rounded-3xl p-8 text-white shadow-xl space-y-6">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <div className="flex items-center space-x-2 text-sky-100 text-xs font-semibold mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{current.location}</span>
                </div>
                <h3 className="text-5xl sm:text-6xl font-black tracking-tight">
                  {current.temperature != null ? `${Math.round(current.temperature)}°C` : '—'}
                </h3>
                <p className="text-base text-sky-100 font-semibold mt-1">
                  {current.condition}{current.feels_like != null ? ` • Feels like ${Math.round(current.feels_like)}°C` : ''}
                </p>
                {current.last_updated && (
                  <p className="text-[10px] text-sky-200 mt-2">Updated: {current.last_updated}</p>
                )}
              </div>

              <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                {current.icon_url ? (
                  <img src={current.icon_url} alt={current.condition} className="w-16 h-16" />
                ) : (
                  <CloudSun className="w-14 h-14 text-amber-300" />
                )}
              </div>
            </div>

            {/* Weather Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-4 border-t border-white/15 text-xs font-medium">
              <MetricCard icon={<Droplets className="w-4 h-4 text-sky-200" />} label="Humidity" value={current.humidity != null ? `${current.humidity}%` : '—'} />
              <MetricCard icon={<CloudSun className="w-4 h-4 text-sky-200" />} label="Precipitation" value={`${current.rainfall ?? 0} mm`} />
              <MetricCard icon={<Wind className="w-4 h-4 text-sky-200" />} label="Wind" value={`${current.wind_speed ?? 0} km/h ${current.wind_direction || ''}`} />
              <MetricCard icon={<Gauge className="w-4 h-4 text-sky-200" />} label="Pressure" value={current.pressure != null ? `${current.pressure} mb` : '—'} />
              <MetricCard icon={<Eye className="w-4 h-4 text-sky-200" />} label="Visibility" value={current.visibility != null ? `${current.visibility} km` : '—'} />
              <MetricCard icon={<Sun className="w-4 h-4 text-sky-200" />} label="UV Index" value={current.uv_index != null ? current.uv_index : '—'} />
            </div>
          </div>

          {/* Agricultural Advisory */}
          {weather.advisory && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-xs text-amber-950 space-y-2">
              <p className="font-bold text-sm text-amber-900 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span>Agricultural Field Advisory for {current.location}</span>
              </p>
              <p className="leading-relaxed text-amber-800 text-xs sm:text-sm">
                {weather.advisory}
              </p>
            </div>
          )}

          {/* 7-Day Forecast */}
          {forecast.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>7-Day Forecast</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {forecast.map((day, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center space-y-2 hover:border-sky-300 transition-all">
                    <p className="font-bold text-xs text-gray-700">{day.day}</p>
                    <p className="text-[10px] text-gray-400">{day.date}</p>
                    {day.icon_url ? (
                      <img src={day.icon_url} alt={day.condition} className="w-10 h-10 mx-auto" />
                    ) : (
                      <CloudSun className="w-7 h-7 mx-auto text-sky-500" />
                    )}
                    <p className="text-[10px] text-gray-500 font-medium truncate">{day.condition}</p>
                    <div>
                      <p className="font-black text-sm text-gray-900">{day.max_temp != null ? `${Math.round(day.max_temp)}°` : '—'}</p>
                      <p className="text-[10px] text-gray-400">{day.min_temp != null ? `${Math.round(day.min_temp)}°` : '—'}</p>
                    </div>
                    <div className="pt-1 border-t border-gray-200/60 text-[10px] font-bold text-sky-700">
                      💧 {day.chance_of_rain ?? 0}% Rain
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

// Small metric card inside the hero
function MetricCard({ icon, label, value }) {
  return (
    <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-sky-200 text-[10px] uppercase font-bold">{label}</span>
      </div>
      <span className="text-base font-bold text-white block">{value}</span>
    </div>
  );
}
