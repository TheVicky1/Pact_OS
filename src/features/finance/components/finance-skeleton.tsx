import React from 'react';

export function FinanceSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading financial data">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div className="space-y-2">
          <div className="h-3 w-32 bg-zinc-800/60 rounded" />
          <div className="h-8 w-48 bg-zinc-800 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-44 bg-zinc-800/80 rounded-xl" />
          <div className="h-10 w-24 bg-zinc-800/80 rounded-xl" />
          <div className="h-10 w-28 bg-zinc-800/80 rounded-xl" />
        </div>
      </div>

      {/* Summary 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-zinc-950/40 border border-white/[0.08] space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-zinc-800 rounded" />
              <div className="h-7 w-7 bg-zinc-800 rounded-lg" />
            </div>
            <div className="h-8 w-32 bg-zinc-800 rounded" />
            <div className="h-3 w-28 bg-zinc-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* 2-Column Middle Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-zinc-950/40 border border-white/[0.08] h-72 space-y-4">
          <div className="h-4 w-40 bg-zinc-800 rounded" />
          <div className="h-3 w-full bg-zinc-800/60 rounded-full" />
          <div className="space-y-3 pt-4">
            <div className="h-6 w-full bg-zinc-800/40 rounded" />
            <div className="h-6 w-full bg-zinc-800/40 rounded" />
            <div className="h-6 w-full bg-zinc-800/40 rounded" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-950/40 border border-white/[0.08] h-72 space-y-4">
          <div className="h-4 w-32 bg-zinc-800 rounded" />
          <div className="h-44 w-full bg-zinc-800/30 rounded-xl" />
        </div>
      </div>

      {/* Transaction Table Skeleton */}
      <div className="p-6 rounded-2xl bg-zinc-950/40 border border-white/[0.08] space-y-4">
        <div className="h-4 w-36 bg-zinc-800 rounded" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 w-full bg-zinc-800/30 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
