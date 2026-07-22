import React from 'react';
import { Sparkles, ShieldCheck, Clock, Award } from 'lucide-react';
import { GenderToggle } from '../gender/GenderToggle';

interface HeroProps {
  gender: 'women' | 'men';
  onGenderChange: (gender: 'women' | 'men') => void;
}

export const Hero: React.FC<HeroProps> = ({ gender, onGenderChange }) => {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 text-center">
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4">
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>At-Home Luxury Salon Experience</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white font-outfit leading-tight mb-4">
          Salon Luxury, <br />
          <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 bg-clip-text text-transparent">
            At Your Doorstep
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 font-light">
          Premium beauty & grooming services delivered to your home by top certified professionals with single-use sterile kits.
        </p>

        {/* Gender Filter Toggle */}
        <div className="flex justify-center mb-10">
          <GenderToggle gender={gender} onChange={onGenderChange} />
        </div>

        {/* Value Highlights */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto text-xs sm:text-sm text-slate-400 pt-4 border-t border-slate-800/80">
          <div className="flex flex-col items-center space-y-1">
            <ShieldCheck className="w-5 h-5 text-pink-400" />
            <span className="font-medium text-slate-300">100% Hygienic</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <Clock className="w-5 h-5 text-pink-400" />
            <span className="font-medium text-slate-300">On-Time Service</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <Award className="w-5 h-5 text-pink-400" />
            <span className="font-medium text-slate-300">Top Beauticians</span>
          </div>
        </div>
      </div>
    </section>
  );
};
