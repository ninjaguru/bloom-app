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
    return <p className="py-2 text-xs" style={{ color: 'var(--color-muted)' }}>Loading available slots…</p>;
  }

  if (slots.length === 0) {
    return (
      <p className="py-2 text-xs" style={{ color: 'var(--color-danger)' }}>
        No slots available for this apartment.
      </p>
    );
  }

  return (
    <div className="my-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {slots.map((slot) => {
        const isSelected = selectedSlot === slot;
        return (
          <button
            key={slot}
            type="button"
            onClick={() => onSelectSlot(slot)}
            aria-pressed={isSelected}
            className="rounded-[var(--radius-input)] px-3 py-2.5 text-xs font-medium font-mono-tabular focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--color-paper-2)',
              border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-rule)'}`,
              color: isSelected ? 'var(--color-accent-ink)' : 'var(--color-muted)',
              outlineColor: 'var(--color-focus)',
              transition: 'background-color var(--dur-short) var(--ease-out), border-color var(--dur-short) var(--ease-out)',
            }}
          >
            {slot}
          </button>
        );
      })}
    </div>
  );
};
