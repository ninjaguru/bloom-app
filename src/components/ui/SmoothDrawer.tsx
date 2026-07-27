import React, { useEffect } from 'react';
import { cn } from './SpotlightCards';
import { X } from 'lucide-react';

interface SmoothDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  position?: 'right' | 'bottom';
  className?: string;
}

export const SmoothDrawer: React.FC<SmoothDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  className = '',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isRight = position === 'right';

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 animate-in fade-in duration-300"
        style={{ backgroundColor: 'oklch(8% 0.01 350 / 0.6)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 flex flex-col shadow-2xl transition-transform duration-300 ease-out',
          isRight
            ? 'ml-auto h-full w-full max-w-md animate-in slide-in-from-right'
            : 'mt-auto max-h-[90vh] w-full animate-in slide-in-from-bottom',
          className
        )}
        style={{
          backgroundColor: 'var(--color-paper-2)',
          color: 'var(--color-ink)',
          borderColor: 'var(--color-rule)',
          borderLeft: isRight ? '1px solid var(--color-rule)' : undefined,
          borderTop: !isRight ? '1px solid var(--color-rule)' : undefined,
          borderTopLeftRadius: !isRight ? 'var(--radius-card)' : undefined,
          borderTopRightRadius: !isRight ? 'var(--radius-card)' : undefined,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-rule)' }}>
          <div className="text-lg font-medium font-outfit" style={{ color: 'var(--color-ink)' }}>
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 focus-visible:outline focus-visible:outline-2"
            style={{ color: 'var(--color-neutral)', outlineColor: 'var(--color-focus)', transition: 'color var(--dur-short) var(--ease-out)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  );
};
