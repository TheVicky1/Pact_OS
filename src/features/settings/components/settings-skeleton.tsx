import React from 'react';

export function SettingsSkeleton() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-pulse" aria-busy="true" aria-label="Loading settings">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3 pb-2 border-b border-white/[0.06]">
        <div className="w-12 h-12 rounded-2xl bg-zinc-800" />
        <div className="space-y-2">
          <div className="w-48 h-7 bg-zinc-800 rounded-lg" />
          <div className="w-80 h-4 bg-zinc-800/60 rounded-md" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column Nav */}
        <div className="lg:col-span-4">
          <div className="glass-card rounded-3xl p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-full h-14 bg-zinc-800/60 rounded-2xl" />
            ))}
          </div>
        </div>

        {/* Right Column Card */}
        <div className="lg:col-span-8">
          <div className="glass-card rounded-3xl p-8 space-y-6">
            <div className="flex justify-between items-center pb-6 border-b border-white/[0.06]">
              <div className="space-y-2">
                <div className="w-40 h-6 bg-zinc-800 rounded-lg" />
                <div className="w-64 h-4 bg-zinc-800/60 rounded-md" />
              </div>
              <div className="w-24 h-6 bg-zinc-800 rounded-full" />
            </div>

            <div className="w-full h-24 bg-zinc-800/40 rounded-2xl" />
            <div className="space-y-4">
              <div className="w-full h-12 bg-zinc-800/60 rounded-xl" />
              <div className="w-full h-12 bg-zinc-800/60 rounded-xl" />
            </div>
            <div className="flex justify-end pt-4">
              <div className="w-36 h-11 bg-zinc-800 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
