import React, { useState, useEffect } from 'react';
import { TrendingUp, Search, Filter, MapPin, ArrowUpRight, ArrowDownRight, Minus, RefreshCw } from 'lucide-react';
import api from '../../services/api';

export const MarketPricesPage = () => {
  const [prices, setPrices] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      let url = '/market-prices?';
      if (selectedState !== 'All') url += `state=${encodeURIComponent(selectedState)}&`;
      if (selectedCrop !== 'All') url += `crop_name=${encodeURIComponent(selectedCrop)}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await api.get(url);
      setPrices(res.data || []);
    } catch (err) {
      console.error("Failed to load market prices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, [selectedState, selectedCrop]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPrices();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
          <TrendingUp className="w-7 h-7 text-emerald-600" />
          <span>Daily Mandi Market Prices & Commodity Ticker</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Live modal prices, price ranges, and market trends across APMC mandis in India
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-emerald-100 shadow-xs space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by crop, mandi or state (e.g. Wheat, Lucknow, Delhi)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 bg-white"
            >
              <option value="All">All States</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Delhi">Delhi</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Punjab">Punjab</option>
              <option value="Haryana">Haryana</option>
              <option value="Rajasthan">Rajasthan</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Prices Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading daily mandi rates...</div>
        ) : prices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-4 px-6">Commodity / Crop</th>
                  <th className="py-4 px-6">Mandi / Market</th>
                  <th className="py-4 px-6">State</th>
                  <th className="py-4 px-6">Min - Max Price</th>
                  <th className="py-4 px-6">Modal Price</th>
                  <th className="py-4 px-6 text-right">Market Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {prices.map((p) => (
                  <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900">
                      <span className="block text-sm">{p.crop_name}</span>
                      <span className="text-[10px] text-gray-400 font-normal">Variety: {p.variety || 'Standard'}</span>
                    </td>
                    <td className="py-4 px-6 text-gray-700 font-semibold">{p.market_name}</td>
                    <td className="py-4 px-6 text-gray-500">{p.state}</td>
                    <td className="py-4 px-6 text-gray-500 font-mono">
                      ₹{p.min_price.toLocaleString()} - ₹{p.max_price.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-emerald-800 text-sm">
                      ₹ {p.modal_price.toLocaleString()}{' '}
                      <span className="text-[10px] text-gray-400 font-normal">{p.unit}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {p.trend === 'UP' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <ArrowUpRight className="w-3 h-3 mr-0.5 text-emerald-600" />
                          +{p.change_percent || 2.4}% UP
                        </span>
                      ) : p.trend === 'DOWN' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                          <ArrowDownRight className="w-3 h-3 mr-0.5 text-red-600" />
                          {p.change_percent || -3.1}% DOWN
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                          <Minus className="w-3 h-3 mr-0.5 text-gray-400" />
                          STABLE
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-gray-400">
            No market prices found for selected criteria.
          </div>
        )}
      </div>

    </div>
  );
};
