import React, { useEffect, useState } from 'react';
import { X, LogIn } from 'lucide-react';
import { signInWithGoogle } from '../../lib/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setErrorMsg(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center mx-auto border border-pink-500/30">
            <LogIn className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-bold text-white font-outfit">Sign In to Bloom</h2>
          <p className="text-xs text-slate-400 font-light">
            Sign in with Google to track your appointment history, view earned referral rewards, and redeem loyalty points.
          </p>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl font-semibold text-sm shadow-lg transition-all duration-200 disabled:opacity-50 mt-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path
                fill="#FFC107"
                d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-19.3 0-1.3-.1-2.5-.4-3.7z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.2 0 9.9-1.9 13.4-5L31.3 33c-2 1.4-4.5 2.2-7.3 2.2-5.2 0-9.6-3.5-11.2-8.3l-6.5 5C9.9 39.3 16.4 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4.1-4.3 5.4l6.1 5c3.7-3.4 5.9-8.4 5.9-14.1 0-1.3-.1-2.5-.4-3.7z"
              />
            </svg>
            <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
          </button>

          {errorMsg && (
            <p className="text-xs text-rose-400 font-medium pt-2">{errorMsg}</p>
          )}
        </div>
      </div>
    </div>
  );
};
