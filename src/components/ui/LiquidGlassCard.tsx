import React from 'react';
import { cn } from './SpotlightCards';

interface LiquidGlassCardProps {
  title: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
  gradient?: 'pink' | 'purple' | 'amber';
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  title,
  badge,
  children,
  className = '',
  gradient = 'pink',
}) => {
  const gradients = {
    pink: 'from-pink-500/20 via-rose-500/10 to-purple-500/20 border-pink-500/30',
    purple: 'from-purple-500/20 via-indigo-500/10 to-pink-500/20 border-purple-500/30',
    amber: 'from-amber-500/20 via-orange-500/10 to-rose-500/20 border-amber-500/30',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border bg-gradient-to-br backdrop-blur-xl p-6 shadow-2xl transition-all duration-300 hover:scale-[1.01]',
        gradients[gradient],
        className
      )}
    >
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
        {badge && (
          <span className="rounded-full bg-pink-500/20 px-3 py-1 text-xs font-semibold text-pink-300 border border-pink-500/30">
            {badge}
          </span>
        )}
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};
