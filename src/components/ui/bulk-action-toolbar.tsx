'use client';

import React, { useEffect } from 'react';
import { X, Loader2, CheckSquare } from 'lucide-react';



export interface BulkActionToolbarProps {
  selectedCount: number;
  onClear: () => void;
  isProcessing?: boolean;
  processingLabel?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * PACT OS — Phase 6E: Glassmorphic Bulk Action Toolbar
 * Floating, bottom-docked or sticky contextual action bar for multi-select batch workflows.
 */
export function BulkActionToolbar({
  selectedCount,
  onClear,
  isProcessing = false,
  processingLabel = 'Processing batch...',
  children,
  className = '',
}: BulkActionToolbarProps) {
  // Listen for Escape key to dismiss selection
  useEffect(() => {
    if (selectedCount === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCount, onClear]);

  if (selectedCount === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk actions toolbar"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 sm:py-3 rounded-2xl bg-zinc-900/90 border border-white/15 backdrop-blur-2xl shadow-2xl shadow-black/80 ring-1 ring-white/10 text-white">
        {/* Left: Selection Counter & Clear button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/30 text-amber-400">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div className="text-xs sm:text-sm font-medium">
            <span className="text-amber-400 font-bold">{selectedCount}</span>{' '}
            <span className="text-zinc-300">
              {selectedCount === 1 ? 'item selected' : 'items selected'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClear}
            disabled={isProcessing}
            aria-label="Clear selection"
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Clear selection (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isProcessing ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>{processingLabel}</span>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
