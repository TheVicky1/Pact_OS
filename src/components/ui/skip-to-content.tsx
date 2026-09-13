import React from 'react';

/**
 * PACT Phase 12: Accessible Skip Link for Screen Readers and Keyboard Users
 */

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-400 focus:text-neutral-950 focus:font-bold focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs transition-all"
    >
      Skip to main content
    </a>
  );
}
