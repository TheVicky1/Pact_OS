import React, { forwardRef } from 'react';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'spotlight';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glow?: 'none' | 'gold' | 'amber';
  as?: React.ElementType;
}

/**
 * PACT GlassCard Primitive
 * Unified dark glass surface establishing the core visual language of PACT.
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  {
    variant = 'default',
    padding = 'md',
    glow = 'none',
    as: Component = 'div',
    className = '',
    children,
    ...props
  },
  ref
) {
  const variantStyles = {
    default: 'bg-[rgba(18,18,23,0.72)] backdrop-blur-md border border-white/[0.07] shadow-xl shadow-black/30',
    elevated: 'bg-[rgba(26,26,34,0.82)] backdrop-blur-xl border border-white/[0.10] shadow-2xl shadow-black/50',
    interactive: 'glass-interactive cursor-pointer',
    spotlight: 'bg-[rgba(18,18,23,0.72)] backdrop-blur-md border border-white/[0.07] spotlight-gold shadow-xl shadow-black/30',
  }[variant];

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  }[padding];

  const glowStyles = {
    none: '',
    gold: 'relative before:absolute before:inset-0 before:rounded-3xl before:bg-[#d4af37]/5 before:blur-xl before:pointer-events-none',
    amber: 'amber-backlight',
  }[glow];

  return (
    <Component
      ref={ref}
      className={`rounded-3xl ${variantStyles} ${paddingStyles} ${glowStyles} relative overflow-hidden transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
});

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

/**
 * PACT GlassPanel Primitive
 * Outer framing panel for major page sections or grouped cards.
 */
export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(function GlassPanel(
  { className = '', children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={`rounded-[32px] bg-[#0d0d12]/90 border border-white/[0.06] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-black/60 relative overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
