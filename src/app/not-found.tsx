import React from 'react';
import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

/**
 * PACT Custom 404 Not Found Screen
 */

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6 select-none font-sans">
      <div className="w-full max-w-md bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-100">
            Route Not Found
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            The requested view or module could not be found within PACT OS.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/app"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-100 text-neutral-950 font-medium text-sm hover:bg-neutral-200 transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            Return to Command Center
          </Link>
        </div>

        <div className="pt-2 border-t border-neutral-800/60">
          <p className="text-[11px] font-mono text-neutral-500">
            PACT OS 0.1.0 • 404
          </p>
        </div>
      </div>
    </div>
  );
}
