import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ScanEye,
  UploadCloud,
  FileDown,
  History,
  AlertTriangle,
  CheckCircle2,
  Bug,
  ShieldAlert,
  Sparkles,
  Info,
  RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export const DiseaseDetection = () => {
  const { t } = useLanguage();

  const [cropName, setCropName] = useState('Tomato');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (PNG, JPG, JPEG).');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
      setDiagnosis(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
      setDiagnosis(null);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please upload a leaf photograph for pathology detection.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (cropName) {
      formData.append('crop_name', cropName);
    }

    try {
      const res = await api.post('/disease/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDiagnosis(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Disease analysis failed. Please try a clearer leaf photo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
            <ScanEye className="w-7 h-7 text-teal-600" />
            <span>AI Plant Leaf Disease Pathology Scanner</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Computer vision leaf lesion analysis & integrated pest management advisory
          </p>
        </div>

        <Link
          to="/disease-history"
          className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5"
        >
          <History className="w-4 h-4" />
          <span>View Scan History</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Upload Column */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
          
          <form onSubmit={handleAnalyze} className="space-y-5">
            
            {/* Target Crop Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Target Crop Variety
              </label>
              <select
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden"
              >
                <option value="Tomato">Tomato (Solanum lycopersicum)</option>
                <option value="Rice">Rice / Paddy (Oryza sativa)</option>
                <option value="Wheat">Wheat (Triticum aestivum)</option>
                <option value="Potato">Potato (Solanum tuberosum)</option>
                <option value="Cotton">Cotton (Gossypium hirsutum)</option>
                <option value="Citrus">Citrus / Lemon / Orange</option>
                <option value="Grapes">Grapes (Vitis vinifera)</option>
                <option value="General Crop">Other / General Crop</option>
              </select>
            </div>

            {/* Drag & Drop Box */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Upload Affected Leaf Photo
              </label>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/30 rounded-3xl p-6 text-center cursor-pointer transition-all relative overflow-hidden"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />

                {previewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={previewUrl}
                      alt="Leaf Preview"
                      className="max-h-52 mx-auto rounded-2xl object-cover shadow-md border border-teal-200"
                    />
                    <p className="text-xs font-bold text-teal-800">
                      {selectedFile?.name} (Click or drag to replace)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 py-6">
                    <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        Click to upload or drag & drop leaf image
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        High-resolution leaf photos (JPG, PNG, WebP up to 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs flex items-center space-x-2 border border-red-200">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedFile}
              className={`w-full py-4 rounded-2xl text-sm font-bold shadow-md transition-all flex items-center justify-center space-x-2 ${
                !selectedFile
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-teal-600/20 hover:shadow-lg'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Leaf Morphology & Color Histograms...</span>
                </>
              ) : (
                <>
                  <ScanEye className="w-5 h-5" />
                  <span>Diagnose Plant Pathology</span>
                </>
              )}
            </button>

          </form>

          {/* Photo guide */}
          <div className="bg-gray-50 p-4 rounded-2xl text-xs text-gray-600 space-y-1.5 border border-gray-200">
            <p className="font-bold text-gray-800 flex items-center">
              <Info className="w-4 h-4 text-teal-600 mr-1" />
              Photography Tips for High Accuracy:
            </p>
            <ul className="list-disc list-inside text-[11px] text-gray-500 space-y-1">
              <li>Take photo under bright natural daylight avoiding strong shadows.</li>
              <li>Focus clearly on visible spots, lesions, or powdery patches.</li>
              <li>Include both green healthy tissue and diseased edges in the frame.</li>
            </ul>
          </div>

        </div>

        {/* Diagnosis Results Column */}
        <div className="lg:col-span-6 space-y-6">
          {diagnosis ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-teal-500 shadow-xl space-y-5 animate-in fade-in slide-in-from-bottom-3">
              
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  diagnosis.severity === 'Critical' || diagnosis.severity === 'High'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  Severity: {diagnosis.severity || 'Moderate'}
                </span>
                <span className="text-xs font-bold text-teal-700">
                  {(diagnosis.confidence * 100).toFixed(1)}% Confidence
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Detected Pathology</p>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
                  {diagnosis.predicted_disease}
                </h3>
                {diagnosis.scientific_name && (
                  <p className="text-xs text-teal-700 italic font-medium mt-0.5">
                    Pathogen: {diagnosis.scientific_name} ({diagnosis.pathogen_type})
                  </p>
                )}
              </div>

              {/* Symptoms */}
              {diagnosis.symptoms && (
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-700 space-y-1">
                  <p className="font-bold text-gray-900">Key Visual Symptoms:</p>
                  <p className="leading-relaxed">{diagnosis.symptoms}</p>
                </div>
              )}

              {/* Treatment */}
              {diagnosis.treatment && (
                <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-200 text-xs text-teal-950 space-y-1.5">
                  <p className="font-bold text-teal-900 flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 mr-1.5 shrink-0" />
                    Recommended Treatment & Fungicide/Bactericide:
                  </p>
                  <p className="leading-relaxed whitespace-pre-line text-teal-800 font-medium">
                    {diagnosis.treatment}
                  </p>
                </div>
              )}

              {/* PDF Download Button */}
              {diagnosis.id && (
                <a
                  href={`/api/disease/${diagnosis.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-sm"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download Pathology Diagnostic PDF Report</span>
                </a>
              )}

              {/* Mandatory AI Safety Disclaimer */}
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 space-y-1 leading-relaxed">
                <p className="font-bold flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  Important Diagnostic Notice:
                </p>
                <p>{diagnosis.disclaimer || t('ai_disclaimer')}</p>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-gray-200/80 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center mx-auto">
                <ScanEye className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-gray-800">Awaiting Leaf Photograph</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                Select your crop, upload a photo of the affected plant leaf, and run the vision diagnostic model for immediate pathology identification.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
