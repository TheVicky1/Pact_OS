import React from 'react';
import { PageContainer } from '@/components/ui';

export default function TasksLoading() {
  return (
    <PageContainer as="main" className="space-y-6 sm:space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-800" />
            <div className="w-56 h-8 rounded-xl bg-zinc-800" />
          </div>
          <div className="w-80 max-w-full h-4 rounded bg-zinc-800/60" />
        </div>
        <div className="w-36 h-10 rounded-xl bg-zinc-800" />
      </div>

      {/* Quick Stats Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/[0.07] bg-[rgba(18,18,23,0.72)] p-4 space-y-2 h-20"
          >
            <div className="w-16 h-3 rounded bg-zinc-800" />
            <div className="w-10 h-6 rounded bg-zinc-800" />
          </div>
        ))}
      </div>

      {/* Filter Tabs & Search Bar Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto p-1 rounded-2xl bg-[rgba(18,18,23,0.7)] border border-white/[0.08] h-10 w-full md:w-96" />
        <div className="flex items-center gap-3">
          <div className="w-32 h-9 rounded-xl bg-zinc-800/80" />
          <div className="w-56 h-9 rounded-xl bg-zinc-800/80" />
        </div>
      </div>

      {/* Task Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-white/[0.07] bg-[rgba(18,18,23,0.72)] p-5 space-y-4 h-40 flex flex-col justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-zinc-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="w-24 h-4 rounded bg-zinc-800" />
                <div className="w-3/4 h-5 rounded bg-zinc-800" />
                <div className="w-1/2 h-3 rounded bg-zinc-800/60" />
              </div>
            </div>
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
              <div className="w-24 h-4 rounded bg-zinc-800/60" />
              <div className="w-20 h-4 rounded bg-zinc-800/60" />
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
