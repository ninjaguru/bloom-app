import React from 'react';

interface GenderToggleProps {
  gender: 'women' | 'men';
  onChange: (gender: 'women' | 'men') => void;
}

export const GenderToggle: React.FC<GenderToggleProps> = ({ gender, onChange }) => {
  const isWomen = gender === 'women';

  const tabStyle = (active: boolean): React.CSSProperties => ({
    color: active ? 'var(--color-accent-ink)' : 'var(--color-muted)',
    backgroundColor: active ? 'var(--color-accent)' : 'transparent',
    transition: `background-color var(--dur-short) var(--ease-out), color var(--dur-short) var(--ease-out)`,
  });

  return (
    <div
      className="inline-flex gap-1 rounded-[var(--radius-pill)] p-1"
      style={{ backgroundColor: 'var(--color-paper-2)', border: '1px solid var(--color-rule)' }}
      role="group"
      aria-label="Filter services by gender"
    >
      <button
        type="button"
        onClick={() => onChange('women')}
        aria-pressed={isWomen}
        className="rounded-[var(--radius-pill)] px-5 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ ...tabStyle(isWomen), outlineColor: 'var(--color-focus)' }}
      >
        Women
      </button>
      <button
        type="button"
        onClick={() => onChange('men')}
        aria-pressed={!isWomen}
        className="rounded-[var(--radius-pill)] px-5 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ ...tabStyle(!isWomen), outlineColor: 'var(--color-focus)' }}
      >
        Men
      </button>
    </div>
  );
};
