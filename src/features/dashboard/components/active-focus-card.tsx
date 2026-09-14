'use client';

import React from 'react';
import { TaskWithParents } from '@/features/tasks/data-access';
import { Button } from '@/components/ui';
import { Target, Clock, FolderKanban, Check } from 'lucide-react';
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
 * Near-black surface with soft upper-right gold lighting and authoritative task lifecycle.
 */
export function ActiveFocusCard({
  task,
  timezone,
  onComplete,
  isCompleting,
}: ActiveFocusCardProps) {
  if (!task) {
    return (
      <div className="h-full flex flex-col justify-between min-h-[220px] rounded-3xl bg-[#0C0C0F] border border-white/[0.06] p-5 sm:p-6 shadow-xl shadow-black/60 relative overflow-hidden transition-all duration-200 hover:border-[#D4AF37]/30 hover:shadow-2xl hover:shadow-black/80 hover:-translate-y-0.5 group cursor-default">
        {/* Soft Upper-Right Gold Glow */}
        <div
          aria-hidden="true"
          className="absolute -top-10 -right-10 w-44 h-44 rounded-full blur-2xl opacity-15 pointer-events-none group-hover:opacity-25 transition-opacity"
          style={{
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.45) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 flex items-center justify-between text-[#8B8B92]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B8B92]">
              Immediate Focus
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#101012] border border-[#D4AF37]/30 text-[#D4AF37]">
              Clear
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-[#101012] border border-white/[0.06] flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37]/25 transition-colors">
            <Target className="w-4 h-4" />
          </div>
        </div>

        <div className="relative z-10 my-auto py-2">
          <h3 className="text-lg font-bold text-[#E8E8E8]">
            All commitments in order
          </h3>
          <p className="text-xs text-[#8B8B92] mt-1.5 leading-relaxed">
            No pending tasks due immediately. You have met your current commitments.
          </p>
        </div>

        <div className="relative z-10 pt-3 border-t border-white/[0.04] text-xs text-[#71717A] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
          <span>Active horizon clear</span>
        </div>
      </div>
    );
  }

  const isUrgent = task.priority === 'urgent' || task.priority === 'high';

  const formattedDeadline = utcToLocal(task.deadline_at, timezone, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="h-full flex flex-col justify-between min-h-[220px] rounded-3xl bg-[#0C0C0F] border border-white/[0.06] p-5 sm:p-6 shadow-xl shadow-black/60 relative overflow-hidden transition-all duration-200 hover:border-[#D4AF37]/30 hover:shadow-2xl hover:shadow-black/80 hover:-translate-y-0.5 group">
      {/* Soft Upper-Right Gold Glow */}
      <div
        aria-hidden="true"
        className="absolute -top-10 -right-10 w-44 h-44 rounded-full blur-2xl opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity"
        style={{
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.45) 0%, transparent 70%)',
        }}
      />

      {/* Card Header */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B8B92]">
            Immediate Focus
          </span>
          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
              isUrgent
                ? 'bg-[#18181C] border-[#D4AF37]/40 text-[#D4AF37]'
                : 'bg-[#101012] border-white/[0.08] text-[#A1A1AA]'
            }`}
          >
            {task.priority.toUpperCase()}
          </span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-[#101012] border border-white/[0.06] flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37]/25 transition-colors">
          <Target className="w-4 h-4" />
        </div>
      </div>

      {/* Task Content */}
      <div className="relative z-10 py-3 space-y-2">
        <h3 className="text-base sm:text-lg font-bold text-[#F5F5F5] line-clamp-2 leading-snug">
          {task.title}
        </h3>

        <div
          aria-label={`Immediate focus task due today at ${formattedDeadline}`}
          className="flex items-center gap-2 text-xs text-[#8B8B92] font-mono"
        >
          <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Due today at {formattedDeadline}</span>
        </div>

        {task.projects && (
          <div className="inline-flex items-center gap-1.5 text-xs text-[#A1A1AA] bg-[#101012] border border-white/[0.06] px-2.5 py-1 rounded-lg">
            <FolderKanban className="w-3 h-3 text-[#D4AF37]" />
            <span className="truncate max-w-[170px]">{task.projects.title}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="relative z-10 pt-3 border-t border-white/[0.04] flex items-center justify-between">
        <span className="text-xs text-[#71717A]">Mark complete to fulfill:</span>
        <Button
          variant="secondary"
          size="sm"
          disabled={isCompleting}
          onClick={() => onComplete(task.id)}
          icon={<Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
          className="bg-[#101012] hover:bg-[#151517] text-[#E8E8E8] border border-white/[0.08] hover:border-[#D4AF37]/35 text-xs font-medium"
        >
          {isCompleting ? 'Completing...' : 'Mark Done'}
        </Button>
      </div>
    </div>
  );
}
