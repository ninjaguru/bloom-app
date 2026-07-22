import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from './SpotlightCards';

interface ActionSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const ActionSearchBar: React.FC<ActionSearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search services, facial, massage...',
  className = '',
}) => {
  return (
    <div className={cn('relative w-full max-w-xl mx-auto', className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-10 py-3.5 bg-slate-900/80 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 backdrop-blur-md transition-all shadow-lg text-sm"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
