/**
 * Projects page skeleton loader.
 * Matches the actual ProjectCard layout with accent bar, progress, and footer.
 */
export function ProjectsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-zinc-800 rounded-full" />
          <div className="h-7 w-28 bg-zinc-800 rounded-lg" />
          <div className="h-3 w-72 bg-zinc-800/60 rounded-full" />
        </div>
        <div className="h-9 w-32 bg-zinc-800 rounded-xl shrink-0" />
      </div>

      {/* Toolbar skeleton */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="h-9 w-96 bg-zinc-900 border border-zinc-800 rounded-xl" />
        <div className="flex gap-3">
          <div className="h-9 w-40 bg-zinc-900 border border-zinc-800 rounded-xl" />
          <div className="h-9 w-52 bg-zinc-900 border border-zinc-800 rounded-xl" />
        </div>
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl border border-zinc-800/80 overflow-hidden flex flex-col">
      {/* Top accent bar */}
      <div className="h-1 bg-zinc-800 w-full" />

      <div className="p-5 sm:p-6 flex flex-col space-y-4">
        {/* Card header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 shrink-0" />
            <div className="h-5 w-16 bg-zinc-800 rounded-full" />
          </div>
          <div className="flex gap-1">
            <div className="w-7 h-7 rounded-lg bg-zinc-800" />
            <div className="w-7 h-7 rounded-lg bg-zinc-800" />
            <div className="w-7 h-7 rounded-lg bg-zinc-800" />
          </div>
        </div>

        {/* Title + description */}
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-zinc-800 rounded-lg" />
          <div className="h-3 w-full bg-zinc-800/60 rounded-md" />
          <div className="h-3 w-5/6 bg-zinc-800/60 rounded-md" />
        </div>

        {/* Progress area */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <div className="h-3 w-16 bg-zinc-800/60 rounded-md" />
            <div className="h-3 w-10 bg-zinc-800/60 rounded-md" />
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full" />
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
          <div className="h-3 w-32 bg-zinc-800/60 rounded-md" />
          <div className="h-3 w-20 bg-zinc-800/60 rounded-md" />
        </div>
      </div>
    </div>
  );
}
