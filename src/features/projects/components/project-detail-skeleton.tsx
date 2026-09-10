/**
 * Project Detail page skeleton loader.
 * Matches the two-column layout: header, progress bar, overview panel, task list.
 */
export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-8 animate-pulse max-w-5xl w-full mx-auto">
      {/* Back nav skeleton */}
      <div className="h-4 w-36 bg-zinc-800/70 rounded-full" />

      {/* Project header */}
      <div className="glass-card rounded-2xl border border-zinc-800/80 overflow-hidden">
        <div className="h-[3px] bg-zinc-800 w-full" />
        <div className="p-6 sm:p-8 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2.5 min-w-0 flex-1">
              <div className="h-5 w-24 bg-zinc-800 rounded-full" />
              <div className="h-8 w-2/3 bg-zinc-800 rounded-xl" />
              <div className="h-3.5 w-full bg-zinc-800/60 rounded-md" />
              <div className="h-3.5 w-4/5 bg-zinc-800/60 rounded-md" />
            </div>
            <div className="flex gap-2 shrink-0">
              <div className="w-9 h-9 bg-zinc-800 rounded-xl" />
              <div className="w-9 h-9 bg-zinc-800 rounded-xl" />
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-16 bg-zinc-800/60 rounded-md" />
              <div className="h-3 w-10 bg-zinc-800/60 rounded-md" />
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full" />
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-6 pt-1">
            <div className="h-3 w-28 bg-zinc-800/60 rounded-md" />
            <div className="h-3 w-24 bg-zinc-800/60 rounded-md" />
          </div>
        </div>
      </div>

      {/* Task list skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-20 bg-zinc-800 rounded-lg" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-800/70 bg-zinc-900/50"
          >
            <div className="w-4 h-4 rounded-full bg-zinc-800 shrink-0" />
            <div className="flex-1 h-3 bg-zinc-800/70 rounded-md" />
            <div className="hidden sm:block h-3 w-12 bg-zinc-800/50 rounded-md" />
            <div className="h-3 w-16 bg-zinc-800/50 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
