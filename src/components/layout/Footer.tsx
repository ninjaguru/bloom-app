import React from 'react';
import { Flower } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-slate-950 py-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400">
              <Flower className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-white font-outfit">
              Bloom<span className="text-pink-400"> at Home</span>
            </span>
            <span className="text-xs text-slate-500 ml-2">| Premium At-Home Beauty</span>
          </div>

          <div className="flex items-center space-x-6 text-sm text-slate-400">
            <a href="#" className="hover:text-pink-400 transition-colors">About Us</a>
            <a href="#" className="hover:text-pink-400 transition-colors">Services</a>
            <a href="#" className="hover:text-pink-400 transition-colors">Safety Standard</a>
            <a href="#" className="hover:text-pink-400 transition-colors">Contact</a>
          </div>

          <p className="text-xs text-slate-500">
            &copy; 2026 Bloom at Home. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
