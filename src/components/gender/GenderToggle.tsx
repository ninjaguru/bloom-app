import React from 'react';

interface GenderToggleProps {
  gender: 'women' | 'men';
  onChange: (gender: 'women' | 'men') => void;
}

export const GenderToggle: React.FC<GenderToggleProps> = ({ gender, onChange }) => {
  const isWomen = gender === 'women';

  return (
    <div className="relative inline-flex p-1 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md">
      <button
        onClick={() => onChange('women')}
        className={`relative z-10 px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
          isWomen ? 'text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        Women
      </button>
      <button
        onClick={() => onChange('men')}
        className={`relative z-10 px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
          !isWomen ? 'text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        Men
      </button>
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl transition-all duration-300 ease-out ${
          isWomen ? 'left-1' : 'left-[calc(50%+2px)]'
        }`}
      />
    </div>
  );
};
