import React from 'react';

export default function DashboardLoading() {
  return (
    <main className="max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-8 animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 h-44 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="w-48 h-5 rounded-full bg-zinc-800" />
          <div className="w-72 h-8 rounded-xl bg-zinc-800" />
          <div className="w-96 h-4 rounded-lg bg-zinc-800/60" />
        </div>
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
            <div className="w-24 h-4 rounded bg-zinc-800" />
            <div className="w-12 h-8 rounded-lg bg-zinc-800" />
            <div className="w-20 h-3 rounded bg-zinc-800/60" />
          </div>
        ))}
      </div>

      {/* Upcoming Commitments Skeleton */}
      <div className="space-y-4">
        <div className="w-48 h-6 rounded bg-zinc-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4 h-36" />
          ))}
        </div>
      </div>
    </main>
  );
}
