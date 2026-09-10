import React, { forwardRef, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface FormFieldProps {
  label?: string;
  error?: string | null;
  helperText?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  error,
  helperText,
  required,
  className = '',
  children,
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-medium text-zinc-300">
          {label} {required && <span className="text-[#d4af37]">*</span>}
        </label>
      )}
      {children}
      {error && <p role="alert" className="text-xs text-red-400 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-zinc-500">{helperText}</p>}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error, leftIcon, rightIcon, className = '', ...props },
  ref
) {
  const hasError = Boolean(error);

  return (
    <div className="relative flex items-center">
      {leftIcon && (
        <div className="absolute left-3.5 text-zinc-500 pointer-events-none flex items-center justify-center">
          {leftIcon}
        </div>
      )}
      <input
        ref={ref}
        aria-invalid={hasError}
        className={`w-full bg-[rgba(18,18,23,0.85)] border rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-colors duration-150 outline-none backdrop-blur-sm ${
          hasError
            ? 'border-red-500/70 focus:border-red-400'
            : 'border-white/[0.08] focus:border-[#d4af37]'
        } ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`}
        {...props}
      />
      {rightIcon && (
        <div className="absolute right-3.5 text-zinc-500 pointer-events-none flex items-center justify-center">
          {rightIcon}
        </div>
      )}
    </div>
  );
});

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error, className = '', rows = 3, ...props },
  ref
) {
  const hasError = Boolean(error);

  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={hasError}
      className={`w-full bg-[rgba(18,18,23,0.85)] border rounded-xl p-3.5 text-sm text-zinc-100 placeholder-zinc-500 transition-colors duration-150 outline-none backdrop-blur-sm resize-y ${
        hasError
          ? 'border-red-500/70 focus:border-red-400'
          : 'border-white/[0.08] focus:border-[#d4af37]'
      } ${className}`}
      {...props}
    />
  );
});

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string | boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { error, className = '', children, ...props },
  ref
) {
  const hasError = Boolean(error);

  return (
    <div className="relative flex items-center">
      <select
        ref={ref}
        aria-invalid={hasError}
        className={`w-full bg-[rgba(18,18,23,0.85)] border rounded-xl pl-4 pr-10 py-2.5 text-sm text-zinc-100 transition-colors duration-150 outline-none appearance-none cursor-pointer backdrop-blur-sm ${
          hasError
            ? 'border-red-500/70 focus:border-red-400'
            : 'border-white/[0.08] focus:border-[#d4af37]'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3.5 pointer-events-none" />
    </div>
  );
});

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, className = '', checked, onChange, id: customId, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = customId || generatedId;

  return (
    <div className={`flex items-start gap-3 select-none ${className}`}>
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
          {...props}
        />
        <div className="w-5 h-5 rounded-lg border border-white/[0.15] bg-zinc-900/80 peer-checked:bg-[#d4af37] peer-checked:border-[#d4af37] peer-focus-visible:ring-2 peer-focus-visible:ring-[#d4af37] transition-all flex items-center justify-center cursor-pointer shadow-sm">
          <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[3] opacity-0 peer-checked:opacity-100 transition-opacity" />
        </div>
      </div>
      {(label || description) && (
        <label htmlFor={inputId} className="cursor-pointer">
          {label && <span className="block text-sm font-medium text-zinc-200">{label}</span>}
          {description && <span className="block text-xs text-zinc-400">{description}</span>}
        </label>
      )}
    </div>
  );
});

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  className = '',
}: SwitchProps) {
  const generatedId = useId();

  return (
    <div className={`flex items-center justify-between gap-4 select-none ${className}`}>
      {(label || description) && (
        <div>
          {label && <span className="block text-sm font-medium text-zinc-200">{label}</span>}
          {description && <span className="block text-xs text-zinc-400">{description}</span>}
        </div>
      )}
      <button
        id={generatedId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors duration-200 relative p-0.5 focus-visible:outline-none disabled:opacity-50 cursor-pointer ${
          checked ? 'bg-[#d4af37]' : 'bg-zinc-800 border border-white/[0.08]'
        }`}
      >
        <span
          className={`block w-5 h-5 rounded-full bg-zinc-100 shadow-md transition-transform duration-200 ${
            checked ? 'translate-x-5 bg-zinc-950' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
