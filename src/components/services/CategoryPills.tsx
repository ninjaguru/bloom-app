import React from 'react';

interface CategoryPillsProps {
  categories: string[];
  active: string;
  onSelect: (category: string) => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  categories,
  active,
  onSelect,
}) => {
  return (
    <div className="relative w-full">
      <div className="w-full overflow-x-auto no-scrollbar py-3 my-2">
        <div className="flex items-center justify-start sm:justify-center gap-2 min-w-max px-4">
          {categories.map((cat) => {
            const isActive = active === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelect(cat)}
                aria-pressed={isActive}
                className="whitespace-nowrap rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  backgroundColor: isActive ? 'var(--color-accent)' : 'var(--color-paper-2)',
                  color: isActive ? 'var(--color-accent-ink)' : 'var(--color-muted)',
                  border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                  outlineColor: 'var(--color-focus)',
                  transition: 'background-color var(--dur-short) var(--ease-out), color var(--dur-short) var(--ease-out), border-color var(--dur-short) var(--ease-out)',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 sm:hidden"
        style={{ background: 'linear-gradient(to left, var(--color-paper), transparent)' }}
      />
    </div>
  );
};
