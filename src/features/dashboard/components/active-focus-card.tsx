'use client';

import React from 'react';
import { TaskWithParents } from '@/features/tasks/data-access';
import { GlassCard, Button, Badge, GoldSpotlight } from '@/components/ui';
import { Target, CheckCircle2, Clock, FolderKanban } from 'lucide-react';
import { utcToLocal } from '@/lib/time';

export interface ActiveFocusCardProps {
  task: TaskWithParents | null;
  timezone: string;
  onComplete: (taskId: string) => void;
  isCompleting: boolean;
}

/**
 * PACT Active Focus Card
 * Spotlight command card highlighting the most immediate pending commitment.
 * Direct translation of the reference spotlight widget using authoritative task data.
 */
export function ActiveFocusCard({
  task,
  timezone,
  onComplete,
  isCompleting,
}: ActiveFocusCardProps) {
  if (!task) {
    return (
      <GlassCard
        variant="spotlight"
        padding="md"
        className="h-full flex flex-col justify-between min-h-[190px]"
      >
        <GoldSpotlight position="top-right" />
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Immediate Focus
          </span>
          <Target className="w-4 h-4 text-[#d4af37]" />
        </div>

        <div className="my-auto py-2">
          <h3 className="text-lg font-semibold text-zinc-200">
            All commitments in order
          </h3>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            No pending tasks due immediately. You have met your current commitments.
          </p>
        </div>

        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Active horizon clear</span>
        </div>
      </GlassCard>
    );
  }

  const priorityVariant =
    task.priority === 'urgent'
      ? 'danger'
      : task.priority === 'high'
      ? 'warning'
      : 'neutral';

  const formattedDeadline = utcToLocal(task.deadline_at, timezone, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <GlassCard
      variant="spotlight"
      padding="md"
      className="h-full flex flex-col justify-between min-h-[190px] relative overflow-hidden"
    >
      <GoldSpotlight position="top-right" />

      {/* Card Header */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Immediate Focus
          </span>
          <Badge variant={priorityVariant} size="sm">
            {task.priority.toUpperCase()}
          </Badge>
        </div>
        <Target className="w-4 h-4 text-[#d4af37]" />
      </div>

      {/* Task Content */}
      <div className="relative z-10 py-2 space-y-1.5">
        <h3 className="text-base sm:text-lg font-semibold text-zinc-100 line-clamp-2 leading-snug">
          {task.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
          <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Due today at {formattedDeadline}</span>
        </div>

        {task.projects && (
          <div className="inline-flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-900/60 border border-white/[0.06] px-2 py-0.5 rounded-md mt-1">
            <FolderKanban className="w-3 h-3 text-[#d4af37]" />
            <span className="truncate max-w-[150px]">{task.projects.title}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="relative z-10 pt-3 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-[11px] text-zinc-400">Mark complete to fulfill:</span>
        <Button
          variant="secondary"
          size="sm"
          disabled={isCompleting}
          onClick={() => onComplete(task.id)}
          icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
        >
          {isCompleting ? 'Completing...' : 'Mark Done'}
        </Button>
      </div>
    </GlassCard>
  );
}
