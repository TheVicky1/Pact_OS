import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

/**
 * PACT Button Primitive
 * Authoritative button component supporting restrained warm gold primary actions,
 * glass secondary actions, ghost controls, and accessible loading states.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    pill = false,
    loading = false,
    disabled = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    className = '',
    children,
    ...props
  },
  ref
) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const roundedStyles = pill ? 'rounded-full' : 'rounded-xl';

  const variantStyles = {
    primary:
      'bg-[#d4af37] text-zinc-950 hover:bg-[#e5c158] active:bg-[#c49f2e] font-semibold shadow-lg shadow-[#d4af37]/15 border border-[#d4af37]/40',
    secondary:
      'bg-zinc-900/80 hover:bg-zinc-800/90 text-zinc-200 hover:text-zinc-100 border border-white/[0.08] backdrop-blur-sm shadow-sm',
    ghost:
      'bg-transparent hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-100 active:bg-white/[0.10]',
    destructive:
      'bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-800/50 shadow-sm shadow-red-950/20',
    icon:
      'bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-100 border border-white/[0.06] p-2',
  }[variant];

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[36px] touch-manipulation',
    md: 'text-sm px-4 py-2.5 gap-2 min-h-[42px] touch-manipulation',
    lg: 'text-base px-6 py-3.5 gap-2.5 min-h-[48px] touch-manipulation',
  }[size];

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`${baseStyles} ${roundedStyles} ${variantStyles} ${variant === 'icon' ? '' : sizeStyles} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {!loading && icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
      {!loading && icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
});
