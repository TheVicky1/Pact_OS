'use client';

/**
 * PACT Root Error Boundary
 *
 * Catches client-side errors and renders a sleek, luxury dark recovery screen.
 * Logs error safely through structured logging without leaking sensitive data.
 */

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Non-leaking error logging
    console.error('PACT Application Error caught at root boundary:', error?.message || 'Unknown error');
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6 select-none font-sans">
      <div className="w-full max-w-md bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-100">
            System State Interruption
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            An unexpected error occurred while executing the interface state. Your commitments and data remain safe.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-100 text-neutral-950 font-medium text-sm hover:bg-neutral-200 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Action
          </button>

          <Link
            href="/app"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 font-medium text-sm border border-neutral-700/50 transition-colors"
          >
            <Home className="w-4 h-4" />
            Return to Command Center
          </Link>
        </div>

        <div className="pt-2 border-t border-neutral-800/60">
          <p className="text-[11px] font-mono text-neutral-500">
            PACT OS 0.1.0 • Fail-Safe Protection Active
          </p>
        </div>
      </div>
    </div>
  );
}
