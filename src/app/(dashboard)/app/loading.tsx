import React from 'react';
import { PageContainer } from '@/components/ui';

export default function DashboardLoading() {
  return (
    <PageContainer as="main" className="space-y-8 animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="rounded-3xl border border-white/[0.07] bg-[rgba(18,18,23,0.72)] p-6 sm:p-8 h-48 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="w-44 h-5 rounded-full bg-zinc-800" />
          <div className="w-72 h-9 rounded-xl bg-zinc-800" />
          <div className="w-96 max-w-full h-4 rounded-lg bg-zinc-800/60" />
        </div>
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-white/[0.07] bg-[rgba(18,18,23,0.72)] p-5 sm:p-6 space-y-4 h-32"
          >
            <div className="w-28 h-4 rounded bg-zinc-800" />
            <div className="w-16 h-8 rounded-lg bg-zinc-800" />
            <div className="w-24 h-3 rounded bg-zinc-800/60" />
          </div>
        ))}
      </div>

      {/* Featured 3-Card Command Center Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-white/[0.07] bg-[rgba(18,18,23,0.72)] p-5 sm:p-6 space-y-4 h-48"
          />
        ))}
      </div>

      {/* Timeline / Calendar Widget Skeleton */}
      <div className="rounded-3xl border border-white/[0.07] bg-[rgba(18,18,23,0.72)] p-6 sm:p-8 space-y-4 h-64" />
    </PageContainer>
  );
}
