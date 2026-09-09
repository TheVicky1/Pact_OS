'use client';

import React, { useMemo } from 'react';
import { TaskWithParents } from '@/features/tasks/data-access';
import { GlassCard, Button, Badge } from '@/components/ui';
import { Clock, Plus, CheckCircle2, FolderKanban, Target, ChevronRight } from 'lucide-react';
import { utcToLocal } from '@/lib/time';
import Link from 'next/link';

export interface DailyTimelineWidgetProps {
  tasks: TaskWithParents[];
  timezone: string;
  onComplete: (taskId: string) => void;
  completingTaskId: string | null;
}

interface TimelineHourSlot {
  hour: number;
  label: string;
}

/**
 * PACT Daily Timeline Widget
 * Chronological horizontal and responsive track mapping tasks to their scheduled deadline hours.
 * Direct translation of the Visual North Star Daily Timeline using authentic PACT data.
 */
export function DailyTimelineWidget({
  tasks,
  timezone,
  onComplete,
  completingTaskId,
}: DailyTimelineWidgetProps) {
  // Chronologically sort pending and completed tasks by deadline
  const timelineTasks = useMemo(() => {
    return [...tasks]
      .filter((t) => t.status !== 'archived')
      .sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime())
      .slice(0, 8); // Top 8 immediate horizon tasks
  }, [tasks]);

  // Standard daytime hour slots for axis reference
  const hourSlots: TimelineHourSlot[] = [
    { hour: 8, label: '8 AM' },
    { hour: 10, label: '10 AM' },
    { hour: 12, label: '12 PM' },
    { hour: 14, label: '2 PM' },
    { hour: 16, label: '4 PM' },
    { hour: 18, label: '6 PM' },
    { hour: 20, label: '8 PM' },
    { hour: 22, label: '10 PM' },
  ];

  const pendingCount = timelineTasks.filter(
    (t) => t.status === 'pending' || t.status === 'in_progress'
  ).length;

  return (
    <GlassCard variant="default" padding="lg" className="space-y-6 overflow-hidden">
      {/* Timeline Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900/80 border border-white/[0.08] flex items-center justify-center text-[#d4af37]">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-zinc-100">
                Daily Timeline
              </h2>
              <span className="text-zinc-600">|</span>
              <span className="text-xs text-zinc-400 font-mono">
                {pendingCount} active {pendingCount === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Chronological schedule mapped in your profile timezone ({timezone})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/app/tasks">
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5 text-[#d4af37]" />}
            >
              Add Commitment
            </Button>
          </Link>
        </div>
      </div>

      {/* Axis & Track Header (Visible on tablet & desktop) */}
      <div className="hidden md:block pt-2">
        <div className="relative border-t border-white/[0.08] pt-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono select-none px-2">
            {hourSlots.map((slot) => (
              <span key={slot.hour} className="text-center">
                {slot.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Content Stream */}
      {timelineTasks.length > 0 ? (
        <div className="space-y-3 pt-1">
          {timelineTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isMissed = task.status === 'missed';
            const isPending = !isCompleted && !isMissed;

            const priorityColor =
              task.priority === 'urgent'
                ? 'bg-red-500'
                : task.priority === 'high'
                ? 'bg-amber-500'
                : task.priority === 'medium'
                ? 'bg-[#d4af37]'
                : 'bg-zinc-500';

            const localTimeStr = utcToLocal(task.deadline_at, timezone, {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });

            const localDateStr = utcToLocal(task.deadline_at, timezone, {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={task.id}
                className={`group relative rounded-2xl border p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'bg-zinc-950/40 border-white/[0.04] opacity-75'
                    : isMissed
                    ? 'bg-red-950/10 border-red-900/30'
                    : 'bg-zinc-900/60 hover:bg-zinc-900/90 border-white/[0.08] hover:border-[#d4af37]/40 shadow-sm'
                }`}
              >
                {/* Left: Priority Indicator & Title */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div
                    className={`w-3 h-3 rounded-full mt-1 sm:mt-0 shrink-0 ${priorityColor} ${
                      isPending ? 'shadow-sm shadow-current' : ''
                    }`}
                    title={`Priority: ${task.priority}`}
                  />

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-semibold truncate ${
                          isCompleted
                            ? 'line-through text-zinc-400'
                            : isMissed
                            ? 'text-red-200'
                            : 'text-zinc-100 group-hover:text-[#d4af37] transition-colors'
                        }`}
                      >
                        {task.title}
                      </span>

                      <Badge
                        variant={
                          task.priority === 'urgent'
                            ? 'danger'
                            : task.priority === 'high'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {task.priority}
                      </Badge>

                      {isCompleted && (
                        <Badge variant="success" size="sm">
                          Completed
                        </Badge>
                      )}

                      {isMissed && (
                        <Badge variant="danger" size="sm">
                          Missed
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                      {task.projects && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                          <FolderKanban className="w-3 h-3 text-[#d4af37]" />
                          <span className="truncate max-w-[120px]">
                            {task.projects.title}
                          </span>
                        </span>
                      )}

                      {task.goals && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                          <Target className="w-3 h-3 text-[#d4af37]" />
                          <span className="truncate max-w-[120px]">
                            {task.goals.title}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Time and Action Button */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                  <div className="text-right font-mono">
                    <div className="text-xs font-semibold text-zinc-200">
                      {localTimeStr}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {localDateStr}
                    </div>
                  </div>

                  {isPending && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={completingTaskId === task.id}
                      onClick={() => onComplete(task.id)}
                      icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    >
                      {completingTaskId === task.id ? 'Completing...' : 'Complete'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-12 text-center border border-dashed border-white/[0.08] rounded-2xl bg-zinc-950/30 space-y-3">
          <Clock className="w-8 h-8 text-[#d4af37]/60 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-200">
            No commitments scheduled on the timeline
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Schedule deadlines to map your daily execution and visualize tasks across the day.
          </p>
          <div className="pt-1">
            <Link href="/app/tasks">
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5 text-[#d4af37]" />}
              >
                Create Task
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Timeline Footer Link */}
      <div className="pt-2 flex items-center justify-between text-xs text-zinc-400 border-t border-white/[0.06]">
        <span>Authoritative chronological horizon</span>
        <Link
          href="/app/tasks"
          className="text-xs font-medium text-[#d4af37] hover:text-[#e5c158] inline-flex items-center gap-1 transition-colors"
        >
          <span>View all commitments in Tasks</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </GlassCard>
  );
}
