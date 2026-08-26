import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn, UserPlus, X } from 'lucide-react';

/**
 * LoginRequiredModal
 * Shows when a guest user tries to perform an action that requires authentication.
 * After login, redirects back to the `returnTo` path.
 */
export const LoginRequiredModal = ({ isOpen, onClose, message, returnTo }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = () => {
    const returnPath = returnTo || window.location.pathname;
    navigate(`/login?returnTo=${encodeURIComponent(returnPath)}`);
    onClose();
  };

  const handleRegister = () => {
    const returnPath = returnTo || window.location.pathname;
    navigate(`/register?returnTo=${encodeURIComponent(returnPath)}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-in zoom-in-95 duration-200">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-200">
          <Lock className="w-7 h-7 text-white" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-gray-900 mb-2">Login Required</h3>

        {/* Message */}
        <p className="text-sm text-gray-500 leading-relaxed mb-7">
          {message || 'Please login or create an account to continue with this action.'}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center space-x-2 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-200 transition-all hover:shadow-lg"
          >
            <LogIn className="w-4 h-4" />
            <span>Login to Continue</span>
          </button>
          <button
            onClick={handleRegister}
            className="w-full flex items-center justify-center space-x-2 py-3 px-6 border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-sm rounded-xl transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>

        <p className="text-[11px] text-gray-400 mt-5">
          You'll be returned to this page after login.
        </p>
      </div>
    </div>
  );
};
