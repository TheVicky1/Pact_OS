'use client';

import React from 'react';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface InterventionBannerProps {
  activatedCount: number;
  onReview: () => void;
}

/**
 * PACT Intervention Banner
 * High-visibility, dignified, executive banner displayed when activated accountability commitments exist.
 * Avoids shame, insults, or humiliation; communicates direct accountability and clear resolution paths.
 */
export function InterventionBanner({ activatedCount, onReview }: InterventionBannerProps) {
  if (activatedCount <= 0) return null;

  return (
    <div
      role="alert"
      className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-[#16141a]/80 to-[#121217]/90 p-4 sm:p-5 shadow-2xl backdrop-blur-xl mb-6"
    >
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-[#d4af37]">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90">
                Accountability Active
              </span>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <h3 className="text-sm sm:text-base font-medium text-zinc-100 mt-0.5">
              {activatedCount === 1
                ? '1 commitment requires your attention and resolution.'
                : `${activatedCount} commitments require your attention and resolution.`}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              An agreed consequence is ready for verification or disciplined weekly waiver.
            </p>
          </div>
        </div>

        <div className="shrink-0 w-full sm:w-auto">
          <Button
            variant="primary"
            size="sm"
            onClick={onReview}
            className="w-full sm:w-auto shadow-lg shadow-[#d4af37]/10"
          >
            <span>Review Accountability</span>
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
