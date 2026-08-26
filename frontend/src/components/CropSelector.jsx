import React, { useState, useEffect } from 'react';
import { Check, X, Sprout, Search, Image as ImageIcon, AlertCircle } from 'lucide-react';
import api from '../services/api';

const DEFAULT_CROPS = [
  {
    id: 2,
    name: 'Wheat',
    category: 'Cereal',
    season: 'Rabi',
    image_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 1,
    name: 'Rice',
    category: 'Cereal',
    season: 'Kharif',
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 3,
    name: 'Maize',
    category: 'Cereal',
    season: 'Kharif / Rabi',
    image_url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 5,
    name: 'Cotton',
    category: 'Cash Crop',
    season: 'Kharif',
    image_url: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 7,
    name: 'Sugarcane',
    category: 'Cash Crop',
    season: 'Year-round',
    image_url: 'https://images.unsplash.com/photo-1596797882870-8c33deeac224?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 8,
    name: 'Potato',
    category: 'Vegetable',
    season: 'Rabi',
    image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 9,
    name: 'Tomato',
    category: 'Vegetable',
    season: 'Year-round',
    image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 10,
    name: 'Onion',
    category: 'Vegetable',
    season: 'Rabi / Kharif',
    image_url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 11,
    name: 'Gram (Chickpea)',
    category: 'Pulses',
    season: 'Rabi',
    image_url: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e6?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 6,
    name: 'Mustard',
    category: 'Oilseeds',
    season: 'Rabi',
    image_url: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=400&q=80'
  }
];

export const CropSelector = ({
  selectedCropIds = [],
  onChange,
  label = "Select Your Cultivated Crops *",
  helperText = "Select one or more crops to personalize your agronomic AI advisories and market analytics.",
  error = "",
  disabled = false
}) => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [imgErrors, setImgErrors] = useState({});

  useEffect(() => {
    let isMounted = true;
    const fetchCrops = async () => {
      try {
        const res = await api.get('/crops');
        if (isMounted) {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setCrops(res.data.filter((c) => c.is_active));
          } else {
            setCrops(DEFAULT_CROPS);
          }
        }
      } catch (err) {
        console.warn("Could not load /crops from API, falling back to standard agricultural crops:", err);
        if (isMounted) {
          setCrops(DEFAULT_CROPS);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCrops();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleCrop = (cropId) => {
    if (disabled) return;
    const exists = selectedCropIds.includes(cropId);
    let updated;
    if (exists) {
      updated = selectedCropIds.filter((id) => id !== cropId);
    } else {
      updated = [...selectedCropIds, cropId];
    }
    onChange?.(updated);
  };

  const handleRemoveCrop = (cropId, e) => {
    e.stopPropagation();
    if (disabled) return;
    const updated = selectedCropIds.filter((id) => id !== cropId);
    onChange?.(updated);
  };

  const handleImageError = (cropId) => {
    setImgErrors((prev) => ({ ...prev, [cropId]: true }));
  };

  // Categories list
  const categories = ['ALL', ...new Set(crops.map((c) => c.category).filter(Boolean))];

  // Filtered crops
  const filteredCrops = crops.filter((crop) => {
    const matchesSearch =
      crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (crop.scientific_name && crop.scientific_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'ALL' || crop.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const selectedCropsList = crops.filter((c) => selectedCropIds.includes(c.id));

  return (
    <div className="space-y-3">
      {/* Header Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <label className="block text-xs font-bold text-gray-800 tracking-tight">
            {label}
          </label>
          {helperText && (
            <p className="text-[11px] text-gray-500">{helperText}</p>
          )}
        </div>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full self-start sm:self-auto border border-emerald-200">
          {selectedCropIds.length} Selected
        </span>
      </div>

      {/* Selected Chips Bar */}
      {selectedCropsList.length > 0 && (
        <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-3 space-y-1.5 transition-all">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center space-x-1">
            <Sprout className="w-3.5 h-3.5 text-emerald-600" />
            <span>Selected Crops ({selectedCropsList.length}):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedCropsList.map((crop) => (
              <span
                key={crop.id}
                className="inline-flex items-center space-x-1.5 bg-white text-emerald-900 border border-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full shadow-xs hover:border-emerald-500 transition-colors"
              >
                <span>{crop.name}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveCrop(crop.id, e)}
                  disabled={disabled}
                  aria-label={`Remove ${crop.name}`}
                  className="w-4 h-4 rounded-full bg-emerald-100 hover:bg-red-100 hover:text-red-700 text-emerald-700 flex items-center justify-center transition-colors focus:outline-hidden"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search crops (e.g. Wheat, Rice, Potato)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden bg-white"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {categories.length > 2 && (
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Multi-Select Cards Grid */}
      {loading ? (
        <div className="py-8 text-center text-xs text-gray-400 flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading crop catalog...</span>
        </div>
      ) : filteredCrops.length === 0 ? (
        <div className="py-6 text-center text-xs text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          No crops found matching "{searchTerm}".
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 max-h-[290px] overflow-y-auto pr-1 p-0.5 rounded-2xl border border-gray-100 bg-gray-50/40">
          {filteredCrops.map((crop) => {
            const isSelected = selectedCropIds.includes(crop.id);
            const hasImgError = imgErrors[crop.id];

            return (
              <div
                key={crop.id}
                onClick={() => handleToggleCrop(crop.id)}
                className={`group relative flex flex-col rounded-2xl cursor-pointer select-none overflow-hidden transition-all duration-200 border text-left ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/90 shadow-md ring-2 ring-emerald-500/30'
                    : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-xs hover:-translate-y-0.5'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {/* Crop Image Container */}
                <div className="h-20 w-full bg-gray-100 relative overflow-hidden">
                  {crop.image_url && !hasImgError ? (
                    <img
                      src={crop.image_url}
                      alt={crop.name}
                      onError={() => handleImageError(crop.id)}
                      className={`h-full w-full object-cover transition-transform duration-300 ${
                        isSelected ? 'scale-105' : 'group-hover:scale-105'
                      }`}
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-tr from-emerald-100 to-teal-50 text-emerald-700">
                      <Sprout className="w-7 h-7" />
                      <span className="text-[10px] font-bold mt-1 text-emerald-800">{crop.name}</span>
                    </div>
                  )}

                  {/* Top Badges / Indicators */}
                  <div className="absolute top-1.5 right-1.5 flex items-center space-x-1">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white/80 border border-gray-300 text-transparent backdrop-blur-xs group-hover:border-emerald-500'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                  </div>

                  {crop.category && (
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-white rounded-md">
                      {crop.category}
                    </span>
                  )}
                </div>

                {/* Crop Label Details */}
                <div className="p-2 flex flex-col justify-between flex-1">
                  <div>
                    <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-950' : 'text-gray-900'}`}>
                      {crop.name}
                    </h4>
                    {crop.season && (
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">
                        {crop.season}
                      </p>
                    )}
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[10px]">
                    <span
                      className={`font-semibold ${
                        isSelected ? 'text-emerald-700' : 'text-gray-400 group-hover:text-emerald-600'
                      }`}
                    >
                      {isSelected ? '✓ Selected' : '+ Select'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="p-2.5 bg-red-50 text-red-700 rounded-xl text-xs flex items-center space-x-1.5 border border-red-200">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default CropSelector;
