'use client';

import React from 'react';
import { TaskWithParents } from '@/features/tasks/data-access';
import { GlassCard, Button, Badge } from '@/components/ui';
import { Clock, ChevronRight, CheckCircle2, FolderKanban, Target, Calendar, Plus, CheckSquare } from 'lucide-react';
import { utcToLocal } from '@/lib/time';
import Link from 'next/link';

export interface UpcomingCommitmentsWidgetProps {
  tasks: TaskWithParents[];
  timezone: string;
  onComplete: (taskId: string) => void;
  completingTaskId: string | null;
}

/**
 * PACT Upcoming Commitments Section Widget
 * Enhanced representation of immediate pending commitments.
 * Strictly confidentiality-safe: never renders consequence details or snapshots.
 */
export function UpcomingCommitmentsWidget({
  tasks,
  timezone,
  onComplete,
  completingTaskId,
}: UpcomingCommitmentsWidgetProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#d4af37]" />
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-100">
            Upcoming Commitments
          </h2>
        </div>
        <Link
          href="/app/tasks"
          className="text-xs font-medium text-[#d4af37] hover:text-[#e5c158] transition-colors inline-flex items-center gap-1"
        >
          <span>View All Tasks</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tasks.map((task) => {
            const priorityVariant =
              task.priority === 'urgent'
                ? 'danger'
                : task.priority === 'high'
                ? 'warning'
                : 'neutral';

            return (
              <GlassCard
                key={task.id}
                variant="default"
                padding="md"
                className="flex flex-col justify-between space-y-4 hover:border-white/[0.14] transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={priorityVariant} size="sm">
                      {task.priority.toUpperCase()}
                    </Badge>

                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={completingTaskId === task.id}
                      onClick={() => onComplete(task.id)}
                      icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    >
                      {completingTaskId === task.id ? 'Completing...' : 'Mark Done'}
                    </Button>
                  </div>

                  <h3 className="font-semibold text-zinc-100 text-base leading-snug">
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400 gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {task.projects && (
                      <Badge
                        variant="neutral"
                        size="sm"
                        icon={<FolderKanban className="w-3 h-3 text-[#d4af37]" />}
                      >
                        <span className="truncate max-w-[120px]">{task.projects.title}</span>
                      </Badge>
                    )}
                    {task.goals && (
                      <Badge
                        variant="neutral"
                        size="sm"
                        icon={<Target className="w-3 h-3 text-[#d4af37]" />}
                      >
                        <span className="truncate max-w-[120px]">{task.goals.title}</span>
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-400 shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>{utcToLocal(task.deadline_at, timezone)}</span>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <GlassCard variant="default" padding="lg" className="text-center py-10">
          <CheckSquare className="w-8 h-8 text-[#d4af37]/70 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-200">
            Make your next commitment
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            You have no pending commitments due. Take disciplined action and schedule a new task.
          </p>
          <div className="mt-4">
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
        </GlassCard>
      )}
    </div>
  );
}
