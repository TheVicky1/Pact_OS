import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './input';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

/** Controlled search field with an "X" clear button; Escape also clears the query. */
export function SearchInput({ value, onChange, onKeyDown, className = '', ...props }: SearchInputProps) {
  return (
    <div className="relative">
      <Input
        type="search"
        leftIcon={<Search className="w-4 h-4" />}
        className={`pr-10 [&::-webkit-search-cancel-button]:hidden ${className}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && value) {
            e.preventDefault();
            onChange('');
          }
          onKeyDown?.(e);
        }}
        {...props}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-500 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#d4af37] cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
