import React from 'react';
import { PageContainer, GlassCard } from '@/components/ui';

export default function CalendarLoading() {
  return (
    <PageContainer as="main">
      <div className="space-y-6">
        <GlassCard variant="default" padding="none" className="overflow-hidden animate-pulse">
          {/* Header Skeleton */}
          <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800/60" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-zinc-800/60 rounded" />
                <div className="h-3 w-48 bg-zinc-850/60 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-28 bg-zinc-800/60 rounded-xl" />
              <div className="h-8 w-24 bg-zinc-800/60 rounded-xl" />
            </div>
          </div>

          {/* Grid Skeleton */}
          <div className="h-[520px] p-4 space-y-8 bg-zinc-950/20">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-16 h-3 bg-zinc-800/40 rounded" />
                <div className="flex-1 h-[1px] bg-white/[0.04]" />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </PageContainer>
  );
}
