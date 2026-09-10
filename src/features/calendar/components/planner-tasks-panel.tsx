'use client';

import React from 'react';
import Link from 'next/link';
import { CheckSquare, ArrowUpRight, Clock, AlertCircle } from 'lucide-react';
import { GlassCard, Badge } from '@/components/ui';
import { utcToLocal } from '@/lib/time';

export interface PlannerTaskItem {
  id: string;
  title: string;
  priority?: string;
  status?: string;
  deadline_at?: string;
}

export interface PlannerTasksPanelProps {
  tasks: PlannerTaskItem[];
  timezone: string;
  selectedDate?: string;
}

export function PlannerTasksPanel({
  tasks,
  timezone,
}: PlannerTasksPanelProps) {
  // Filter active/pending tasks
  const pendingTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'archived'
  );

  return (
    <GlassCard variant="default" padding="none" className="border-white/[0.08] overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-zinc-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-[#d4af37]">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Tasks</h3>
            <p className="text-[11px] text-zinc-400">
              {pendingTasks.length} active {pendingTasks.length === 1 ? 'task' : 'tasks'}
            </p>
          </div>
        </div>

        <Link
          href="/app/tasks"
          className="text-xs font-semibold text-[#d4af37] hover:text-[#e2c056] flex items-center gap-1 transition-colors"
        >
          <span>All Tasks</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Task List */}
      <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-[380px]">
        {pendingTasks.length === 0 ? (
          <div className="py-8 text-center px-4">
            <CheckSquare className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium text-zinc-300">No active tasks</p>
            <p className="text-[11px] text-zinc-500 mt-1">
              All commitments for this period are fulfilled.
            </p>
          </div>
        ) : (
          pendingTasks.slice(0, 6).map((task) => {
            const deadlineFormatted = task.deadline_at
              ? utcToLocal(task.deadline_at, timezone, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })
              : null;

            return (
              <div
                key={task.id}
                className="p-2.5 rounded-xl bg-zinc-950/40 border border-white/[0.05] hover:border-white/[0.12] transition-colors flex flex-col gap-1.5 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-medium text-zinc-200 group-hover:text-white line-clamp-2">
                    {task.title}
                  </h4>
                  {task.priority && (
                    <Badge
                      variant={
                        task.priority === 'urgent'
                          ? 'danger'
                          : task.priority === 'high'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                      className="shrink-0 text-[10px] uppercase"
                    >
                      {task.priority}
                    </Badge>
                  )}
                </div>

                {deadlineFormatted && (
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                    <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                    <span>Due: {deadlineFormatted}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info Notice */}
      <div className="p-3 border-t border-white/[0.04] bg-zinc-950/20 text-[10px] text-zinc-500 flex items-center gap-1.5">
        <AlertCircle className="w-3 h-3 shrink-0" />
        <span>Deadlines are completion targets, distinct from calendar time blocks.</span>
      </div>
    </GlassCard>
  );
}
