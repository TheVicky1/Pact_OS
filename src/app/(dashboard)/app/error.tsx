'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error internally without exposing DB secrets or stack traces to UI
    console.error('Dashboard Error Boundary Captured:', error);
  }, [error]);

  return (
    <main className="max-w-xl w-full mx-auto p-6 sm:p-12 my-12">
      <div className="rounded-3xl border border-rose-900/40 bg-zinc-950/90 p-8 text-center backdrop-blur-xl space-y-6 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center mx-auto text-rose-400">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">
            Unable to load PACT Overview
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            An error occurred while communicating with the server. Your data remains secure.
          </p>
        </div>

        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2.5 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      </div>
    </main>
  );
}
