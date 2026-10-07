import React, { useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const InstallBanner: React.FC = () => {
  const { canInstall, isIOS, isInstalled, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('bloom_install_dismissed') === '1'
  );

  if (!canInstall || isInstalled || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('bloom_install_dismissed', '1');
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 safe-bottom">
      <div className="mx-3 mb-3 sm:mx-4 sm:mb-4 rounded-2xl bg-slate-900/95 border border-pink-500/30 backdrop-blur-xl shadow-2xl shadow-black/50 p-3 sm:p-4 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-start space-x-2 sm:space-x-3">
          {/* Icon */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/20">
            <span className="text-white text-lg sm:text-xl">✿</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
             <p className="text-xs sm:text-sm font-bold text-white">Install Bloom@ Home</p>
            {isIOS ? (
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">
                Tap <Share className="inline w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400 mx-0.5" /> then{' '}
                <strong className="text-slate-300">Add to Home Screen</strong>
              </p>
            ) : (
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Get instant access from your home screen
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
            {!isIOS && (
              <button
                onClick={install}
                className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-pink-500 text-white text-[11px] sm:text-xs font-bold hover:bg-pink-600 transition-colors shadow-lg shadow-pink-500/30"
              >
                <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Install</span>
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
