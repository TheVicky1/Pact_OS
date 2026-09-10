'use client';

import React, { useEffect } from 'react';
import { PageContainer } from '@/components/ui/page-container';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Settings route error:', error);
  }, [error]);

  return (
    <PageContainer>
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-zinc-100">
            Failed to Load Settings
          </h2>
          <p className="text-sm text-zinc-400">
            An unexpected error occurred while loading your profile and preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#d4af37] text-zinc-950 font-semibold text-xs shadow-lg shadow-[#d4af37]/20 hover:bg-[#e2c056] transition-all cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    </PageContainer>
  );
}
