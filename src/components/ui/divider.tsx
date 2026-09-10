import React from 'react';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  className?: string;
}

/**
 * PACT Divider Primitive
 * Subtle divider with optional centered text label.
 */
export function Divider({
  orientation = 'horizontal',
  label,
  className = '',
}: DividerProps) {
  if (orientation === 'vertical') {
    return <div className={`w-px h-full bg-white/[0.08] ${className}`} role="separator" />;
  }

  if (label) {
    return (
      <div className={`relative flex items-center my-4 ${className}`} role="separator">
        <div className="flex-grow border-t border-white/[0.08]" />
        <span className="px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-400 bg-[#09090b] rounded-full border border-white/[0.06]">
          {label}
        </span>
        <div className="flex-grow border-t border-white/[0.08]" />
      </div>
    );
  }

  return <hr className={`border-t border-white/[0.08] my-4 ${className}`} role="separator" />;
}
