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
        <Search
          className="absolute left-4 h-4.5 w-4.5 pointer-events-none"
          style={{ color: 'var(--color-neutral)' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-[var(--radius-input)] py-3 pl-11 pr-10 text-sm placeholder-[var(--color-neutral)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            backgroundColor: 'var(--color-paper-2)',
            border: '1px solid var(--color-rule)',
            color: 'var(--color-ink)',
            outlineColor: 'var(--color-focus)',
            transition: 'border-color var(--dur-short) var(--ease-out)',
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 rounded-full p-1 focus-visible:outline focus-visible:outline-2"
            style={{ color: 'var(--color-neutral)', outlineColor: 'var(--color-focus)' }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
