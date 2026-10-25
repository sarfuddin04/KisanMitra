import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, X, Star, Trash2, RefreshCw, Image as ImageIcon,
  CheckCircle2, AlertCircle, Loader2, ArrowLeft, ArrowRight,
  ZoomIn, Eye
} from 'lucide-react';
import api from '../services/api';

const PRODUCT_FALLBACK = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80';

export const getDisplayUrl = (url) => {
  if (!url) return PRODUCT_FALLBACK;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const clean = url.startsWith('/') ? url : `/${url}`;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace('/api', '');
  return `${base}${clean}`;
};

/**
 * ProductImageManager
 * ===================
 * Complete drag-and-drop, multi-image upload, reorder, primary designation,
 * and image replacement interface for both Admin and Farmer panels.
 */
export const ProductImageManager = ({
  productId = null,
  images = [],
  primaryImageUrl = '',
  onChange,
  isAdmin = false,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewModalImg, setPreviewModalImg] = useState(null);
  const fileInputRef = useRef(null);
  const replaceInputRefs = useRef({});

  const showNotification = (msg, isErr = false) => {
    if (isErr) {
      setError(msg);
      setSuccess('');
    } else {
      setSuccess(msg);
      setError('');
      setTimeout(() => setSuccess(''), 4000);
    }
  };

  // Client validation
  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return 'Only JPG, JPEG, PNG, or WebP images are supported.';
    }
    if (file.size > 5 * 1024 * 1024) {
      return `File '${file.name}' exceeds the 5 MB size limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`;
    }
    return null;
  };

  // Upload one or multiple files
  const handleUploadFiles = async (filesList) => {
    if (!filesList || filesList.length === 0 || disabled) return;
    setError('');
    setSuccess('');

    const files = Array.from(filesList);
    for (const f of files) {
      const err = validateFile(f);
      if (err) {
        showNotification(err, true);
        return;
      }
    }

    setUploading(true);
    let newImages = [...images];
    let currentPrimary = primaryImageUrl || (newImages.length > 0 ? newImages[0].image_url : '');

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', 'products');

        let uploadedUrl = '';
        let uploadedId = null;

        if (productId) {
          // Upload directly linked to product
          const endpoint = isAdmin
            ? `/admin/products/${productId}/images/upload`
            : `/marketplace/products/${productId}/images/upload`;
          const res = await api.post(endpoint, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          uploadedUrl = res.data?.image?.image_url || res.data?.image_url;
          uploadedId = res.data?.image?.id;
        } else {
          // Staged upload for new product creation
          const res = await api.post('/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          uploadedUrl = res.data.url;
          uploadedId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        }

        if (uploadedUrl) {
          const isFirst = newImages.length === 0;
          const imgItem = {
            id: uploadedId,
            image_url: uploadedUrl,
            is_primary: isFirst,
            display_order: newImages.length,
          };
          newImages.push(imgItem);
          if (isFirst) {
            currentPrimary = uploadedUrl;
          }
        }
      }

      showNotification(`Successfully uploaded ${files.length} image${files.length > 1 ? 's' : ''}!`);
      onChange?.({ images: newImages, primaryImageUrl: currentPrimary });
    } catch (err) {
      showNotification(err?.response?.data?.detail || 'Failed to upload image. Please try again.', true);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  // Set as primary image
  const handleSetPrimary = async (img) => {
    if (disabled) return;
    try {
      if (productId && typeof img.id === 'number') {
        const endpoint = isAdmin
          ? `/admin/products/${productId}/images/${img.id}/primary`
          : `/marketplace/products/${productId}/images/${img.id}/primary`;
        await api.put(endpoint);
      }
      const updated = images.map(i => ({
        ...i,
        is_primary: i.image_url === img.image_url,
      }));
      onChange?.({ images: updated, primaryImageUrl: img.image_url });
      showNotification('Main display image updated.');
    } catch (err) {
      showNotification(err?.response?.data?.detail || 'Failed to update primary image.', true);
    }
  };

  // Remove an image
  const handleRemoveImage = async (img) => {
    if (disabled) return;
    if (!window.confirm('Remove this image from the product?')) return;

    try {
      if (productId && typeof img.id === 'number') {
        const endpoint = isAdmin
          ? `/admin/products/${productId}/images/${img.id}`
          : `/marketplace/products/${productId}/images/${img.id}`;
        await api.delete(endpoint);
      }
      const updated = images.filter(i => i.image_url !== img.image_url);
      let newPrimary = primaryImageUrl;
      if (primaryImageUrl === img.image_url) {
        newPrimary = updated.length > 0 ? updated[0].image_url : '';
        if (updated.length > 0) updated[0].is_primary = true;
      }
      onChange?.({ images: updated, primaryImageUrl: newPrimary });
      showNotification('Image removed.');
    } catch (err) {
      showNotification(err?.response?.data?.detail || 'Failed to remove image.', true);
    }
  };

  // Replace an image
  const handleReplaceImage = async (img, e) => {
    const file = e.target.files?.[0];
    if (!file || disabled) return;

    const err = validateFile(file);
    if (err) {
      showNotification(err, true);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'products');

      let newUrl = '';
      if (productId && typeof img.id === 'number') {
        const endpoint = isAdmin
          ? `/admin/products/${productId}/images/${img.id}/replace`
          : `/marketplace/products/${productId}/images/${img.id}/replace`;
        const res = await api.put(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        newUrl = res.data?.image?.image_url || res.data?.image_url;
      } else {
        const res = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        newUrl = res.data.url;
      }

      if (newUrl) {
        const updated = images.map(i => {
          if (i.image_url === img.image_url) {
            return { ...i, image_url: newUrl };
          }
          return i;
        });
        const newPrimary = primaryImageUrl === img.image_url ? newUrl : primaryImageUrl;
        onChange?.({ images: updated, primaryImageUrl: newPrimary });
        showNotification('Image replaced successfully.');
      }
    } catch (err) {
      showNotification(err?.response?.data?.detail || 'Failed to replace image.', true);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Reorder images
  const handleMove = async (index, direction) => {
    if (disabled) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= images.length) return;

    const updated = [...images];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);

    const reordered = updated.map((item, idx) => ({ ...item, display_order: idx }));
    onChange?.({ images: reordered, primaryImageUrl });

    if (productId && reordered.every(i => typeof i.id === 'number')) {
      try {
        const endpoint = isAdmin
          ? `/admin/products/${productId}/images/reorder`
          : `/marketplace/products/${productId}/images/reorder`;
        await api.put(endpoint, { image_ids: reordered.map(i => i.id) });
      } catch { }
    }
  };

  return (
    <div className="space-y-3">
      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError('')} className="p-0.5 hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{success}</span>
          <button type="button" onClick={() => setSuccess('')} className="p-0.5 hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
          isDragging
            ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
            : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          className="hidden"
          onChange={(e) => handleUploadFiles(e.target.files)}
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-white">
              {uploading
                ? 'Uploading to persistent storage...'
                : 'Drag & drop product images here, or browse from device'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Supports JPG, JPEG, PNG, and WebP (up to 5 MB per image). Multiple images allowed.
            </p>
          </div>
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="mt-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Browse Files
          </button>
        </div>
      </div>

      {/* Image Gallery Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Product Gallery ({images.length} images)</span>
            <span className="text-[10px] text-slate-400">Click ⭐ to set as primary display image</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img, idx) => {
              const isPrimary = img.is_primary || img.image_url === primaryImageUrl || (idx === 0 && !primaryImageUrl);
              return (
                <div
                  key={img.id || img.image_url || idx}
                  className={`group relative rounded-2xl border overflow-hidden bg-slate-950 transition-all ${
                    isPrimary ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-md' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Image with preserved aspect ratio */}
                  <div className="aspect-square relative overflow-hidden bg-slate-900">
                    <img
                      src={getDisplayUrl(img.image_url)}
                      alt={`Product ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => { e.target.src = PRODUCT_FALLBACK; }}
                    />

                    {/* Primary Badge */}
                    {isPrimary ? (
                      <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-current" /> Main Image
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(img)}
                        className="absolute top-2 left-2 bg-black/60 hover:bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                        title="Set as Main Marketplace Image"
                      >
                        <Star className="w-2.5 h-2.5" /> Set Main
                      </button>
                    )}

                    {/* Quick Preview Lightbox Icon */}
                    <button
                      type="button"
                      onClick={() => setPreviewModalImg(img.image_url)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                      title="Preview Full Image"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Image Card Action Footer */}
                  <div className="p-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-1">
                    {/* Reorder Buttons */}
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, -1)}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                        title="Move Left"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={() => handleMove(idx, 1)}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
                        title="Move Right"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Replace Image Button with hidden input */}
                    <div>
                      <input
                        ref={el => replaceInputRefs.current[idx] = el}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(e) => handleReplaceImage(img, e)}
                      />
                      <button
                        type="button"
                        onClick={() => replaceInputRefs.current[idx]?.click()}
                        className="p-1 text-slate-400 hover:text-blue-400 rounded hover:bg-slate-800"
                        title="Change / Replace this image"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Delete Image Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img)}
                      className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800"
                      title="Remove image"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {previewModalImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewModalImg(null)}
        >
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-400" /> Image Preview
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalImg(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[70vh] overflow-hidden bg-black/40">
              <img
                src={getDisplayUrl(previewModalImg)}
                alt="Full preview"
                className="max-h-[60vh] max-w-full object-contain rounded-xl"
                onError={(e) => { e.target.src = PRODUCT_FALLBACK; }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImageManager;
