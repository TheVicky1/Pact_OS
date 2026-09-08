import React from 'react';

export type BadgeVariant = 'neutral' | 'gold' | 'success' | 'warning' | 'danger' | 'info' | 'waived';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  withDot?: boolean;
  icon?: React.ReactNode;
}

/**
 * PACT Badge Primitive
 * Semantic tag/chip combining restrained contrast, optional status dot, and accessibility.
 */
export function Badge({
  variant = 'neutral',
  size = 'md',
  withDot = false,
  icon,
  className = '',
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    neutral: 'bg-zinc-800/70 text-zinc-300 border-white/[0.08]',
    gold: 'bg-[#d4af37]/10 text-[#e2c056] border-[#d4af37]/30 shadow-sm shadow-[#d4af37]/5',
    success: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40',
    warning: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
    danger: 'bg-red-950/40 text-red-300 border-red-800/40',
    info: 'bg-blue-950/40 text-blue-300 border-blue-800/40',
    waived: 'bg-purple-950/40 text-purple-300 border-purple-800/40',
  }[variant];

  const dotColor = {
    neutral: 'bg-zinc-400',
    gold: 'bg-[#d4af37]',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    info: 'bg-blue-400',
    waived: 'bg-purple-400',
  }[variant];

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {withDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

export interface StatusIndicatorProps {
  status: 'pending' | 'in_progress' | 'completed' | 'missed' | 'waived' | 'archived';
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Standalone Status Indicator Dot
 */
export function StatusIndicator({
  status,
  pulse = false,
  size = 'md',
  className = '',
}: StatusIndicatorProps) {
  const statusColors = {
    pending: 'bg-blue-500',
    in_progress: 'bg-amber-500',
    completed: 'bg-emerald-500',
    missed: 'bg-red-500',
    waived: 'bg-purple-500',
    archived: 'bg-zinc-500',
  }[status];

  const dimension = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  return (
    <span className={`relative inline-flex items-center justify-center ${dimension} ${className}`}>
      {pulse && (
        <span
          className={`absolute inset-0 rounded-full ${statusColors} opacity-75 animate-ping`}
        />
      )}
      <span className={`relative inline-flex rounded-full ${dimension} ${statusColors}`} />
    </span>
  );
}
