import React from 'react';
import { PageContainer } from '@/components/ui';

export default function AccountabilityLoading() {
  return (
    <PageContainer as="main" className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-2">
          <div className="w-32 h-4 rounded bg-zinc-800" />
          <div className="w-64 h-8 rounded-xl bg-zinc-800" />
          <div className="w-96 max-w-full h-4 rounded bg-zinc-800/60" />
        </div>
        <div className="w-48 h-12 rounded-2xl bg-zinc-800/80" />
      </div>

      {/* Active Interventions Skeleton */}
      <div className="space-y-4">
        <div className="w-48 h-6 rounded bg-zinc-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-white/[0.07] bg-[rgba(18,18,23,0.72)] p-5 space-y-4 h-48"
            >
              <div className="w-32 h-4 rounded bg-zinc-800" />
              <div className="w-3/4 h-6 rounded bg-zinc-800" />
              <div className="w-full h-16 rounded-xl bg-zinc-850" />
            </div>
          ))}
        </div>
      </div>

      {/* Audit Trail Skeleton */}
      <div className="space-y-4 pt-4">
        <div className="w-48 h-6 rounded bg-zinc-800" />
        <div className="rounded-3xl border border-white/[0.07] bg-[rgba(18,18,23,0.72)] p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-zinc-850" />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
