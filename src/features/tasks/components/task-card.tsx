'use client';

import React, { useState } from 'react';
import { TaskWithParents } from '../data-access';
import { TaskPriority, TaskStatus } from '@/types/domain';
import { GlassCard, Badge } from '@/components/ui';
import {
  Clock,
  Check,
  MoreVertical,
  Trash2,
  Edit3,
  Target,
  FolderKanban,
  Lock,
  Play,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { utcToLocal } from '@/lib/time';
import Link from 'next/link';

export interface TaskCardProps {
  task: TaskWithParents;
  onEdit: (task: TaskWithParents) => void;
  onDelete: (task: TaskWithParents) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  timezone?: string;
}

/**
 * PACT Commitment Card (TaskCard)
 * Phase 4F implementation compliant with Section 8 of docs/ACCOUNTABILITY_UX_SPEC.md.
 * Features custom circular ring checkbox, accountability lock, relative deadline tag,
 * hierarchy badges, and disciplined micro-interactions.
 */
export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  timezone = 'UTC',
}: TaskCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHoveredLock, setIsHoveredLock] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const isCompleted = task.status === 'completed';
  const isMissed = task.status === 'missed';
  const isInProgress = task.status === 'in_progress';
  const isArchived = task.status === 'archived';

  // Check if an accountability commitment snapshot is attached
  const hasCommitment = Boolean(
    task.task_accountability_commitments &&
      (Array.isArray(task.task_accountability_commitments)
        ? task.task_accountability_commitments.length > 0
        : Boolean(task.task_accountability_commitments))
  );

  // Compute deadline urgency and relative label
  const [nowMs] = useState(() => Date.now());
  const deadlineMs = new Date(task.deadline_at).getTime();
  const diffMs = deadlineMs - nowMs;
  const isOverdue = diffMs < 0 && !isCompleted && !isArchived;

  const getRelativeDeadline = () => {
    const formattedExact = utcToLocal(task.deadline_at, timezone, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (isCompleted) {
      return {
        label: `Completed`,
        variant: 'success' as const,
      };
    }

    if (isMissed) {
      return {
        label: `Missed Deadline`,
        variant: 'danger' as const,
      };
    }

    if (isOverdue) {
      const hoursOverdue = Math.max(1, Math.floor(Math.abs(diffMs) / 3600000));
      return {
        label: hoursOverdue >= 24
          ? `Overdue by ${Math.floor(hoursOverdue / 24)}d`
          : `Overdue by ${hoursOverdue}h`,
        variant: 'danger' as const,
      };
    }

    // Due in the future
    const hoursRemaining = Math.floor(diffMs / 3600000);
    const minutesRemaining = Math.floor((diffMs % 3600000) / 60000);

    if (hoursRemaining < 1) {
      return {
        label: `Due in ${Math.max(1, minutesRemaining)}m`,
        variant: 'danger' as const,
      };
    }

    if (hoursRemaining < 24) {
      return {
        label: `Due in ${hoursRemaining}h (${formattedExact})`,
        variant: 'warning' as const,
      };
    }

    const daysRemaining = Math.floor(hoursRemaining / 24);
    if (daysRemaining === 1) {
      return {
        label: `Due tomorrow (${formattedExact})`,
        variant: 'neutral' as const,
      };
    }

    const formattedDate = utcToLocal(task.deadline_at, timezone, {
      month: 'short',
      day: 'numeric',
    });
    return {
      label: `Due ${formattedDate}`,
      variant: 'neutral' as const,
    };
  };

  const deadlineInfo = getRelativeDeadline();

  const getPriorityVariant = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return 'danger' as const;
      case 'high':
        return 'warning' as const;
      case 'medium':
        return 'gold' as const;
      case 'low':
      default:
        return 'neutral' as const;
    }
  };

  const handleToggleCompletion = async () => {
    if (!onStatusChange || isToggling) return;
    setIsToggling(true);
    try {
      if (isCompleted) {
        await onStatusChange(task.id, 'pending');
      } else {
        await onStatusChange(task.id, 'completed');
      }
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <GlassCard
      variant="interactive"
      padding="sm"
      className={`group relative transition-all duration-200 ${
        isCompleted
          ? 'opacity-65 hover:opacity-90 bg-[rgba(18,18,23,0.4)]'
          : isMissed
          ? 'border-red-500/30 bg-red-950/10'
          : isInProgress
          ? 'border-amber-500/40 shadow-[0_0_20px_rgba(212,175,55,0.06)]'
          : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Custom Circular Ring Checkbox */}
        <button
          type="button"
          onClick={handleToggleCompletion}
          disabled={isToggling || isArchived}
          aria-label={isCompleted ? 'Reopen commitment' : 'Complete commitment'}
          className={`mt-0.5 relative shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] ${
            isCompleted
              ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 scale-100'
              : isMissed
              ? 'border-2 border-red-500/60 bg-red-500/10 text-red-400'
              : isInProgress
              ? 'border-2 border-[#d4af37] bg-[#d4af37]/15 text-[#d4af37]'
              : 'border-2 border-zinc-700/80 bg-zinc-900/60 hover:border-[#d4af37]/70 hover:bg-zinc-800'
          } ${isToggling ? 'opacity-60 cursor-wait' : ''}`}
        >
          {isToggling ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#d4af37]" />
          ) : isCompleted ? (
            <Check className="w-3.5 h-3.5 stroke-[3] transition-transform scale-100" />
          ) : isInProgress ? (
            <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
          ) : (
            <span className="w-2 h-2 rounded-full opacity-0 group-hover:opacity-30 bg-[#d4af37] transition-opacity" />
          )}
        </button>

        {/* Task Core Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Header Row: Priority Badge, Status Pill, Accountability Lock */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={getPriorityVariant(task.priority)} size="sm">
                {task.priority.toUpperCase()}
              </Badge>

              {isInProgress && (
                <Badge variant="warning" size="sm">
                  IN PROGRESS
                </Badge>
              )}

              {isMissed && (
                <Badge variant="danger" size="sm">
                  MISSED
                </Badge>
              )}

              {/* Accountability Lock Indicator */}
              {hasCommitment && (
                <div
                  className="relative inline-flex items-center"
                  onMouseEnter={() => setIsHoveredLock(true)}
                  onMouseLeave={() => setIsHoveredLock(false)}
                >
                  <span
                    role="img"
                    aria-label="Accountability active"
                    className="inline-flex items-center gap-1 rounded-md bg-[#d4af37]/10 border border-[#d4af37]/30 px-1.5 py-0.5 text-[10px] font-semibold text-[#d4af37] select-none cursor-help"
                  >
                    <Lock className="w-2.5 h-2.5" />
                    <span>PACT</span>
                  </span>

                  {/* Confidentiality-Safe Tooltip */}
                  {isHoveredLock && (
                    <div className="absolute left-0 bottom-full mb-1.5 z-30 w-56 p-2 rounded-xl bg-zinc-950/95 border border-white/[0.12] shadow-2xl backdrop-blur-md text-[11px] text-zinc-300 leading-tight">
                      <p className="font-semibold text-[#d4af37] mb-0.5 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Accountability Active
                      </p>
                      <span>
                        An immutable consequence is sealed to this commitment until deadline resolution.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions Menu Trigger */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 transition-colors focus-visible:outline-none cursor-pointer"
                aria-label="Commitment options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {/* Action Dropdown */}
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsMenuOpen(false)} />
                  <div className="absolute right-0 z-30 mt-1 w-44 rounded-2xl border border-white/[0.12] bg-[#121217]/95 p-1.5 shadow-2xl backdrop-blur-xl space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onEdit(task);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.08] hover:text-zinc-100 transition-colors cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-zinc-400" />
                      Edit Commitment
                    </button>

                    {onStatusChange && !isCompleted && !isArchived && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onStatusChange(
                            task.id,
                            isInProgress ? 'pending' : 'in_progress'
                          );
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5" />
                        {isInProgress ? 'Mark Pending' : 'Start Focus'}
                      </button>
                    )}

                    {onStatusChange && isCompleted && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onStatusChange(task.id, 'pending');
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reopen
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onDelete(task);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <h3
            className={`font-semibold text-sm sm:text-base leading-snug transition-colors ${
              isCompleted
                ? 'line-through text-zinc-500'
                : 'text-zinc-100 group-hover:text-[#d4af37]'
            }`}
          >
            {task.title}
          </h3>

          {/* Description */}
          {task.description && (
            <p
              className={`text-xs leading-relaxed line-clamp-2 ${
                isCompleted ? 'text-zinc-600 line-through' : 'text-zinc-400'
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Metadata Footer: Parent Badges & Relative Deadline */}
          <div className="pt-2.5 mt-2.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Parent Project & Goal Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {task.projects && (
                <Link
                  href="/app/projects"
                  className="inline-flex items-center gap-1 rounded-lg bg-white/[0.04] px-2 py-0.5 text-[11px] text-zinc-300 border border-white/[0.06] hover:border-[#d4af37]/40 hover:text-zinc-100 transition-colors"
                >
                  <FolderKanban className="h-3 w-3 text-[#d4af37]" />
                  <span className="max-w-[130px] truncate">{task.projects.title}</span>
                </Link>
              )}
              {task.goals && (
                <Link
                  href="/app/goals"
                  className="inline-flex items-center gap-1 rounded-lg bg-white/[0.04] px-2 py-0.5 text-[11px] text-zinc-300 border border-white/[0.06] hover:border-[#d4af37]/40 hover:text-zinc-100 transition-colors"
                >
                  <Target className="h-3 w-3 text-[#d4af37]" />
                  <span className="max-w-[130px] truncate">{task.goals.title}</span>
                </Link>
              )}
            </div>

            {/* Relative Deadline Pill */}
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <Badge variant={deadlineInfo.variant} size="sm">
                {deadlineInfo.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
