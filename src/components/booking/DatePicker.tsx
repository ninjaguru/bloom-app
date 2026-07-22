import React from 'react';
import { DateItem } from '../../lib/booking';

interface DatePickerProps {
  dates: DateItem[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  dates,
  selectedDate,
  onSelectDate,
}) => {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 my-3">
      {dates.map((d) => {
        const isSelected = selectedDate === d.value;
        return (
          <button
            key={d.value}
            type="button"
            onClick={() => onSelectDate(d.value)}
            className={`flex flex-col items-center p-2.5 rounded-xl border text-xs transition-all duration-200 ${
              isSelected
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 border-pink-500 text-white font-bold shadow-lg shadow-pink-500/25 scale-105'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            <span className="font-semibold">{d.label}</span>
            <span className={`text-[10px] ${isSelected ? 'text-pink-100' : 'text-slate-500'}`}>
              {d.sublabel}
            </span>
          </button>
        );
      })}
    </div>
  );
};
