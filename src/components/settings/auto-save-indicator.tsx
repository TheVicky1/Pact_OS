import React from 'react';
import { Loader2, Check, AlertCircle, Cloud } from 'lucide-react';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface AutoSaveIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: AutoSaveStatus;
  lastSavedAt?: Date | null;
  className?: string;
}

/**
 * Formats a Date object into a human-readable relative time string.
 * Example: "Saved 2 seconds ago", "Saved 1 minute ago", "Saved just now".
 */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 2) {
    return 'Saved just now';
  }
  if (diffSec < 60) {
    return `Saved ${diffSec} seconds ago`;
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) {
    return 'Saved 1 minute ago';
  }
  if (diffMin < 60) {
    return `Saved ${diffMin} minutes ago`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) {
    return 'Saved 1 hour ago';
  }
  if (diffHours < 24) {
    return `Saved ${diffHours} hours ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return 'Saved 1 day ago';
  }
  return `Saved ${diffDays} days ago`;
}

/**
 * AutoSaveIndicator Component
 * Displays live auto-save state for forms and settings with ARIA live region support
 * and formatted relative time tooltip on hover.
 */
export function AutoSaveIndicator({
  status,
  lastSavedAt,
  className = '',
  ...props
}: AutoSaveIndicatorProps) {
  const statusConfig = {
    saving: {
      text: 'Saving...',
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-amber-300" data-testid="icon-saving" />,
      styles: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
    },
    saved: {
      text: 'Saved',
      icon: <Check className="w-3.5 h-3.5 shrink-0 text-emerald-300" data-testid="icon-saved" />,
      styles: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40',
    },
    error: {
      text: 'Failed to save',
      icon: <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-300" data-testid="icon-error" />,
      styles: 'bg-red-950/40 text-red-300 border-red-800/40',
    },
    idle: {
      text: 'Idle',
      icon: <Cloud className="w-3.5 h-3.5 shrink-0 text-zinc-400" data-testid="icon-idle" />,
      styles: 'bg-zinc-800/70 text-zinc-400 border-white/[0.08]',
    },
  }[status];

  const tooltipText = status === 'saved' && lastSavedAt ? formatRelativeTime(lastSavedAt) : undefined;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      title={tooltipText}
      className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors select-none ${statusConfig.styles} ${className}`}
      {...props}
    >
      {statusConfig.icon}
      <span>{statusConfig.text}</span>

      {tooltipText && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex items-center px-2 py-0.5 text-[11px] font-medium text-zinc-200 bg-zinc-900 border border-white/10 rounded shadow-md whitespace-nowrap z-50"
        >
          {tooltipText}
        </span>
      )}
    </div>
  );
}

export default AutoSaveIndicator;
