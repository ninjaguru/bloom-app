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
    <div className="my-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
      {dates.map((d) => {
        const isSelected = selectedDate === d.value;
        return (
          <button
            key={d.value}
            type="button"
            onClick={() => onSelectDate(d.value)}
            aria-pressed={isSelected}
            className="flex flex-col items-center rounded-[var(--radius-input)] p-2.5 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--color-paper-2)',
              border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-rule)'}`,
              color: isSelected ? 'var(--color-accent-ink)' : 'var(--color-muted)',
              outlineColor: 'var(--color-focus)',
              transition: 'background-color var(--dur-short) var(--ease-out), border-color var(--dur-short) var(--ease-out)',
            }}
          >
            <span className="font-medium font-mono-tabular">{d.label}</span>
            <span
              className="text-[10px]"
              style={{ color: isSelected ? 'var(--color-accent-ink)' : 'var(--color-neutral)', opacity: isSelected ? 0.8 : 1 }}
            >
              {d.sublabel}
            </span>
          </button>
        );
      })}
    </div>
  );
};
