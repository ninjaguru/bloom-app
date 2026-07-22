import React from 'react';
import { ActionSearchBar } from '../ui/ActionSearchBar';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
      <ActionSearchBar
        value={value}
        onChange={onChange}
        placeholder="Search services (e.g., Facial, Waxing, Massage, Pedicure)..."
      />
    </div>
  );
};
