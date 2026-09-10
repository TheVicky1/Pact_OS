import React from 'react';
import { GlassCard } from '@/components/ui';

export function PlannerSkeleton() {
  return (
    <GlassCard variant="default" padding="none" className="overflow-hidden border-white/[0.08] animate-pulse">
      {/* Header Skeleton */}
      <div className="p-4 sm:p-5 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900/90 border border-white/[0.1]" />
          <div className="space-y-1.5">
            <div className="h-4 w-28 bg-zinc-800 rounded" />
            <div className="h-3 w-48 bg-zinc-900 rounded" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-8 w-36 bg-zinc-900 rounded-xl" />
          <div className="h-8 w-28 bg-zinc-900 rounded-xl" />
          <div className="h-8 w-24 bg-[#d4af37]/20 rounded-xl" />
        </div>
      </div>

      {/* Body Skeleton */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-9 space-y-4">
            <div className="h-10 bg-zinc-900/60 rounded-xl" />
            <div className="h-80 bg-zinc-950/40 rounded-xl border border-white/[0.05]" />
          </div>
          <div className="lg:col-span-3">
            <div className="h-80 bg-zinc-950/40 rounded-xl border border-white/[0.05]" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
