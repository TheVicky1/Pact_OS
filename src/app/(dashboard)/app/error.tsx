'use client';

/**
 * PACT Dashboard Error Boundary
 */

import React, { useEffect } from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard state error:', error?.message || 'Unknown dashboard error');
  }, [error]);

  return (
    <div className="h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-neutral-900/60 border border-neutral-800 backdrop-blur-md rounded-xl p-6 text-center space-y-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <RotateCcw className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-neutral-200">Module Refresh Needed</h2>
          <p className="text-xs text-neutral-400">
            A temporary client exception interrupted this view. Click below to reload the module.
          </p>
        </div>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reload Module
        </button>
      </div>
    </div>
  );
}
