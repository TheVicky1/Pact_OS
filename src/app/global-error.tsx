'use client';

/**
 * PACT Global Error Boundary
 *
 * Catches errors in the root layout and renders an isolated recovery shell.
 */

import React from 'react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-neutral-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-semibold text-neutral-100">Critical Runtime Exception</h1>
            <p className="text-xs text-neutral-400">
              The root layout encountered an unhandled exception. Local state and cryptographic commitments remain protected.
            </p>
          </div>
          <button
            onClick={() => reset()}
            className="w-full py-2.5 px-4 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors"
          >
            Reload Application Shell
          </button>
        </div>
      </body>
    </html>
  );
}
