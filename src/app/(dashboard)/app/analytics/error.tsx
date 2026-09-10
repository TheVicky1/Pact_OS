'use client';

import React, { useEffect } from 'react';
import { PageContainer } from '@/components/ui';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Analytics page error caught:', error);
  }, [error]);

  return (
    <PageContainer as="main">
      <div className="py-24 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Unable to load analytics</h2>
        <p className="text-sm text-zinc-400 max-w-md mb-6">
          We encountered an issue while loading your progress metrics. Please try again.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/[0.08] text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    </PageContainer>
  );
}
