'use client';

import React from 'react';
import { TaskWithParents } from '@/features/tasks/data-access';
import { Button, Badge, GoldSpotlight } from '@/components/ui';
import { Target, CheckCircle2, Clock, FolderKanban, Check } from 'lucide-react';
import { utcToLocal } from '@/lib/time';

export interface ActiveFocusCardProps {
  task: TaskWithParents | null;
  timezone: string;
  onComplete: (taskId: string) => void;
  isCompleting: boolean;
}

/**
 * PACT Active Focus Card
 * High-priority command center card communicating "What should I focus on RIGHT NOW?".
 * Precision-machined dark surface with warm gold illumination and authoritative task lifecycle.
 */
export function ActiveFocusCard({
  task,
  timezone,
  onComplete,
  isCompleting,
}: ActiveFocusCardProps) {
  if (!task) {
    return (
      <div className="h-full flex flex-col justify-between min-h-[220px] rounded-3xl bg-[rgba(16,16,22,0.85)] border border-white/[0.08] p-5 sm:p-6 shadow-xl shadow-black/40 backdrop-blur-xl relative overflow-hidden group">
        <GoldSpotlight position="top-right" />

        <div className="relative z-10 flex items-center justify-between text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Immediate Focus
            </span>
            <Badge variant="gold" size="sm" className="text-[10px] py-0 px-2 bg-[#181820] border-[#d4af37]/20">
              Clear
            </Badge>
          </div>
          <div className="w-8 h-8 rounded-xl bg-zinc-900/80 border border-white/[0.08] flex items-center justify-center text-[#d4af37]">
            <Target className="w-4 h-4" />
          </div>
        </div>

        <div className="relative z-10 my-auto py-2">
          <h3 className="text-lg font-bold text-zinc-200">
            All commitments in order
          </h3>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
            No pending tasks due immediately. You have fulfilled your active commitments.
          </p>
        </div>

        <div className="relative z-10 pt-3 border-t border-white/[0.06] text-xs text-zinc-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active horizon clear</span>
        </div>
      </div>
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
    <div className="h-full flex flex-col justify-between min-h-[220px] rounded-3xl bg-[rgba(16,16,22,0.85)] border border-white/[0.08] p-5 sm:p-6 shadow-xl shadow-black/40 backdrop-blur-xl relative overflow-hidden transition-all duration-200 hover:border-[#d4af37]/35 hover:shadow-2xl hover:shadow-[#d4af37]/5 group">
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
        <div className="w-8 h-8 rounded-xl bg-zinc-900/80 border border-white/[0.08] flex items-center justify-center text-[#d4af37] group-hover:border-[#d4af37]/30 transition-colors">
          <Target className="w-4 h-4" />
        </div>
      </div>

      {/* Task Content */}
      <div className="relative z-10 py-3 space-y-2">
        <h3 className="text-base sm:text-lg font-bold text-zinc-100 line-clamp-2 leading-snug">
          {task.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
          <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Due today at {formattedDeadline}</span>
        </div>

        {task.projects && (
          <div className="inline-flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-900/80 border border-white/[0.08] px-2.5 py-1 rounded-lg">
            <FolderKanban className="w-3 h-3 text-[#d4af37]" />
            <span className="truncate max-w-[170px]">{task.projects.title}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="relative z-10 pt-3 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-xs text-zinc-400">Mark complete to fulfill:</span>
        <Button
          variant="secondary"
          size="sm"
          disabled={isCompleting}
          onClick={() => onComplete(task.id)}
          icon={<Check className="w-3.5 h-3.5 text-[#d4af37]" />}
          className="hover:border-[#d4af37]/40 hover:text-zinc-100 font-medium"
        >
          {isCompleting ? 'Completing...' : 'Mark Done'}
        </Button>
      </div>
    </div>
  );
}
