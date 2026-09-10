import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, ShieldCheck, X } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'gold';
  title?: string;
  onDismiss?: () => void;
}

/**
 * PACT Alert Primitive
 * Semantic notification callout for error states, notices, and warnings.
 */
export function Alert({
  variant = 'info',
  title,
  onDismiss,
  className = '',
  children,
  ...props
}: AlertProps) {
  const variantStyles = {
    info: 'bg-blue-950/30 border-blue-800/40 text-blue-200',
    success: 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200',
    warning: 'bg-amber-950/30 border-amber-800/40 text-amber-200',
    danger: 'bg-red-950/30 border-red-800/50 text-red-200',
    gold: 'bg-[#d4af37]/10 border-[#d4af37]/30 text-zinc-100',
  }[variant];

  const IconComponent = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: AlertCircle,
    gold: ShieldCheck,
  }[variant];

  const iconColor = {
    info: 'text-blue-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
    gold: 'text-[#d4af37]',
  }[variant];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3.5 p-4 rounded-2xl border backdrop-blur-sm ${variantStyles} ${className}`}
      {...props}
    >
      <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
      <div className="flex-1 text-xs sm:text-sm leading-relaxed">
        {title && <h5 className="font-semibold mb-0.5 tracking-tight">{title}</h5>}
        <div>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
