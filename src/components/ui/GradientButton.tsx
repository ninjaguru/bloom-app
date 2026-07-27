import React from 'react';
import { cn } from './SpotlightCards';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled,
  style,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-medium rounded-[calc(var(--radius-input)*0.85)]',
    md: 'px-5 py-2.5 text-sm font-medium rounded-[var(--radius-input)]',
    lg: 'px-6 py-3 text-base font-medium rounded-[var(--radius-input)]',
  };

  const variantStyle: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-ink)' },
    secondary: { backgroundColor: 'var(--color-paper-3)', color: 'var(--color-ink)', border: '1px solid var(--color-rule)' },
    outline: { backgroundColor: 'var(--color-accent-soft)', color: 'var(--color-accent)', border: '1px solid var(--color-accent)' },
    danger: { backgroundColor: 'var(--color-danger)', color: 'var(--color-accent-ink)' },
  };

  return (
    <button
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className
      )}
      style={{
        ...variantStyle[variant],
        outlineColor: 'var(--color-focus)',
        transition: 'background-color var(--dur-short) var(--ease-out), transform var(--dur-micro) var(--ease-out)',
        ...style,
      }}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = 'translateY(1px)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
      {...props}
    >
      {children}
    </button>
  );
};
