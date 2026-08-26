import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Phone, ArrowLeft, TrendingUp, Store, BarChart3 } from 'lucide-react';
import api from '../../services/api';

const MANDI_FALLBACK = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80';

export const MandiDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mandi, setMandi] = useState(null);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [mandiRes, pricesRes] = await Promise.all([
          api.get(`/mandis/${id}`),
          api.get(`/market-prices/mandis/${id}/prices`)
        ]);
        setMandi(mandiRes.data);
        setPrices(pricesRes.data || []);
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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center text-xs text-gray-400">
        Loading mandi details...
      </div>
    );
  }

  if (!mandi) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center">
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
        <span>Back to Market Prices</span>
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
      </div>

      {/* Current Prices Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-black text-gray-900">Current Market Prices at {mandi.name}</h3>
          </div>
          <span className="text-[10px] text-gray-400 font-semibold">Source: Official Market Data</span>
        </div>

        {prices.length > 0 ? (
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
                {prices.map((p) => (
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
