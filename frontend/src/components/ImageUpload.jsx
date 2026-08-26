import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='100' y='105' text-anchor='middle' font-family='Arial' font-size='14' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";

/**
 * Reusable image upload component.
 *
 * Props:
 *   currentImageUrl  — existing image URL (string or null)
 *   onImageUploaded  — callback(newUrl: string) called after a successful upload
 *   onImageDeleted   — callback() called after clearing the image
 *   category         — upload category: 'mandi' | 'crop' | 'fertilizer' | 'disease' | 'banner' | 'general'
 *   label            — field label text
 *   disabled         — disable the upload controls
 */
export const ImageUpload = ({
  currentImageUrl = null,
  onImageUploaded,
  onImageDeleted,
  category = 'general',
  label = 'Image',
  disabled = false,
}) => {
  const [preview, setPreview] = useState(currentImageUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');

    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, or WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5 MB.');
      return;
    }

    // Local preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Upload to backend
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newUrl = res.data.url;
      setPreview(newUrl);
      setSuccess(`Uploaded successfully (${res.data.size_kb} KB)`);
      onImageUploaded?.(newUrl);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Upload failed. Please try again.');
      setPreview(currentImageUrl); // restore previous
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = () => {
    setPreview(null);
    setSuccess('');
    setError('');
    onImageDeleted?.();
  };

  const getDisplayUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    // Relative /api/static/... → absolute
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace('/api', '');
    return `${base}${url}`;
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>

      {/* Preview */}
      <div className="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
        {preview ? (
          <>
            <img
              src={getDisplayUrl(preview)}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleDelete}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <ImageIcon className="w-12 h-12 opacity-40" />
            <span className="text-xs font-medium">No image selected</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-emerald-700">Uploading...</span>
            </div>
          </div>
        )}
      </div>

      {/* Upload button */}
      {!disabled && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Upload className="w-4 h-4" />
            {preview ? 'Replace Image' : 'Upload Image'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <span className="text-xs text-gray-400 self-center">JPEG / PNG / WebP · Max 5 MB</span>
        </div>
      )}

      {/* Status messages */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-xs font-medium bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-emerald-700 text-xs font-medium bg-emerald-50 px-3 py-2 rounded-lg">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
