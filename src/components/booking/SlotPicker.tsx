import React from 'react';

interface SlotPickerProps {
  slots: string[];
  selectedSlot: string | null;
  onSelectSlot: (slot: string) => void;
  loading?: boolean;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  slots,
  selectedSlot,
  onSelectSlot,
  loading = false,
}) => {
  if (loading) {
    return <p className="text-xs text-slate-400 py-2">Loading available slots...</p>;
  }

  if (slots.length === 0) {
    return (
      <p className="text-xs text-rose-400 py-2">
        No slots available for this apartment.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-3">
      {slots.map((slot) => {
        const isSelected = selectedSlot === slot;
        return (
          <button
            key={slot}
            type="button"
            onClick={() => onSelectSlot(slot)}
            className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all duration-200 ${
              isSelected
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 border-pink-500 text-white font-bold shadow-md scale-105'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            {slot}
          </button>
        );
      })}
    </div>
  );
};
