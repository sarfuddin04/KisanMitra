import React, { useState, useEffect } from 'react';
import { CloudSun, Droplets, Wind, Thermometer, MapPin, Sparkles, AlertCircle, Calendar } from 'lucide-react';
import api from '../../services/api';

const DISTRICTS = [
  "Lucknow", "Varanasi", "Pune", "Nagpur", "Ludhiana", "Karnal",
  "Jaipur", "Patna", "Bhopal", "Ahmedabad", "Bengaluru", "Hyderabad", "Delhi"
];

export const WeatherPage = () => {
  const [selectedLoc, setSelectedLoc] = useState("Lucknow");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = async (loc) => {
    setLoading(true);
    try {
      const res = await api.get(`/weather?location=${encodeURIComponent(loc)}`);
      setWeather(res.data);
    } catch (err) {
      console.error("Weather load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(selectedLoc);
  }, [selectedLoc]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header & Location Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
            <CloudSun className="w-7 h-7 text-sky-600" />
            <span>Hyperlocal Weather Radar & Agro-Advisory</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Real-time meteorological feed powered by Open-Meteo & Indian agricultural hub geocoding
          </p>
        </div>

        {/* District Selector */}
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <select
            value={selectedLoc}
            onChange={(e) => setSelectedLoc(e.target.value)}
            className="px-4 py-2 bg-white rounded-xl border border-gray-300 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-sky-500 outline-hidden shadow-xs"
          >
            {DISTRICTS.map(d => (
              <option key={d} value={d}>{d} Mandi Region</option>
            ))}
          </select>
        </div>
      </div>

      {weather && (
        <div className="space-y-6">
          
          {/* Main Hero Weather Card */}
          <div className="bg-gradient-to-tr from-sky-600 via-sky-700 to-teal-700 rounded-3xl p-8 text-white shadow-xl space-y-6">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <div className="flex items-center space-x-2 text-sky-100 text-xs font-semibold mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{weather.location}</span>
                </div>
                <h3 className="text-5xl sm:text-6xl font-black tracking-tight">{weather.temperature}°C</h3>
                <p className="text-base text-sky-100 font-semibold mt-1">
                  {weather.condition} • Feels like {weather.feels_like}°C
                </p>
              </div>

              <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <CloudSun className="w-14 h-14 text-amber-300" />
              </div>
            </div>

            {/* Weather Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/15 text-xs font-medium">
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                <span className="text-sky-200 block text-[10px] uppercase font-bold">Relative Humidity</span>
                <span className="text-lg font-bold text-white mt-0.5 block">{weather.humidity}%</span>
              </div>
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                <span className="text-sky-200 block text-[10px] uppercase font-bold">Precipitation</span>
                <span className="text-lg font-bold text-white mt-0.5 block">{weather.rainfall} mm</span>
              </div>
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                <span className="text-sky-200 block text-[10px] uppercase font-bold">Wind Speed</span>
                <span className="text-lg font-bold text-white mt-0.5 block">{weather.wind_speed} km/h</span>
              </div>
              <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                <span className="text-sky-200 block text-[10px] uppercase font-bold">Air Quality Index</span>
                <span className="text-lg font-bold text-white mt-0.5 block">{weather.air_quality}</span>
              </div>
            </div>
          </div>

          {/* Agricultural Field Advisory Box */}
          {weather.advisory && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-xs text-amber-950 space-y-2">
              <p className="font-bold text-sm text-amber-900 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span>Agricultural Field Advisory for {weather.location}</span>
              </p>
              <p className="leading-relaxed text-amber-800 text-xs sm:text-sm">
                {weather.advisory}
              </p>
            </div>
          )}

          {/* 7-Day Forecast Cards */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>7-Day District Weather Forecast</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {weather.forecast_daily && weather.forecast_daily.map((day, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center space-y-2 hover:border-sky-300 transition-all">
                  <p className="font-bold text-xs text-gray-700">{day.day}</p>
                  <p className="text-[10px] text-gray-400">{day.date}</p>
                  <CloudSun className="w-7 h-7 mx-auto text-sky-500" />
                  <div>
                    <p className="font-black text-sm text-gray-900">{day.max_temp}°</p>
                    <p className="text-[10px] text-gray-400">{day.min_temp}°</p>
                  </div>
                  <div className="pt-1 border-t border-gray-200/60 text-[10px] font-bold text-sky-700">
                    💧 {day.rain_probability}% Rain
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
