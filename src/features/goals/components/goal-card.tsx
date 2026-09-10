'use client';

import { Goal, GoalStatus } from '@/types/domain';
import { Calendar, Edit3, Trash2, Archive, Target, RotateCcw, Clock } from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onArchive: (goal: Goal) => void;
  onRestore: (goal: Goal) => void;
}

const statusConfig: Record<GoalStatus, { label: string; badgeCls: string; dot: string }> = {
  active: {
    label: 'Active',
    badgeCls: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    dot: 'bg-emerald-400',
  },
  completed: {
    label: 'Completed',
    badgeCls: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
    dot: 'bg-amber-400',
  },
  archived: {
    label: 'Archived',
    badgeCls: 'bg-zinc-900 text-zinc-500 border-zinc-700/80',
    dot: 'bg-zinc-500',
  },
};

/**
 * Computes a human-readable days-remaining string from a target_date ISO string.
 * Returns null if no target_date is provided.
 */
function computeDaysRemaining(targetDateIso: string | null): {
  label: string;
  urgency: 'overdue' | 'soon' | 'normal' | 'none';
} | null {
  if (!targetDateIso) return null;

  const target = new Date(targetDateIso);
  if (isNaN(target.getTime())) return null;

  // Normalize both to midnight local date for day-level comparison
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  const diffMs = targetMidnight.getTime() - todayMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} overdue`,
      urgency: 'overdue',
    };
  }
  if (diffDays === 0) {
    return { label: 'Due today', urgency: 'soon' };
  }
  if (diffDays <= 7) {
    return { label: `${diffDays} day${diffDays === 1 ? '' : 's'} left`, urgency: 'soon' };
  }
  if (diffDays <= 30) {
    return { label: `${diffDays} days left`, urgency: 'normal' };
  }

  // Format the target date for longer horizons
  const formatted = target.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return { label: formatted, urgency: 'normal' };
}

export function GoalCard({ goal, onEdit, onDelete, onArchive, onRestore }: GoalCardProps) {
  const config = statusConfig[goal.status] ?? statusConfig.active;
  const daysInfo = computeDaysRemaining(goal.target_date);

  const urgencyColor =
    daysInfo?.urgency === 'overdue'
      ? 'text-rose-400'
      : daysInfo?.urgency === 'soon'
        ? 'text-amber-400'
        : 'text-zinc-400';

  const isArchived = goal.status === 'archived';

  return (
    <div
      className={`glass-card p-5 sm:p-6 rounded-2xl border flex flex-col justify-between space-y-4 transition-all duration-200 group ${
        isArchived
          ? 'border-zinc-800/50 opacity-75 hover:opacity-90'
          : 'border-zinc-800/80 hover:border-[#d4af37]/40 hover:shadow-[0_0_24px_0_rgba(212,175,55,0.07)]'
      }`}
    >
      <div className="space-y-3">
        {/* Card Header: Icon + Status Badge + Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {/* Goal icon */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                isArchived
                  ? 'bg-zinc-900/60 border-zinc-700/60 text-zinc-500'
                  : 'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#d4af37]'
              }`}
            >
              <Target className="w-4 h-4" />
            </div>

            {/* Status badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${config.badgeCls}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
              {config.label}
            </span>
          </div>

          {/* Action buttons — visible on hover */}
          <div
            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            role="group"
            aria-label="Goal actions"
          >
            <button
              onClick={() => onEdit(goal)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors cursor-pointer"
              title="Edit goal"
              aria-label={`Edit goal: ${goal.title}`}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {/* Archive (active/completed only) */}
            {!isArchived && (
              <button
                onClick={() => onArchive(goal)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-amber-950/40 transition-colors cursor-pointer"
                title="Archive goal"
                aria-label={`Archive goal: ${goal.title}`}
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Restore (archived only) */}
            {isArchived && (
              <button
                onClick={() => onRestore(goal)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-950/40 transition-colors cursor-pointer"
                title="Restore goal"
                aria-label={`Restore goal: ${goal.title}`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => onDelete(goal)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Delete goal"
              aria-label={`Delete goal: ${goal.title}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title + Description */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors line-clamp-2 leading-snug">
            {goal.title}
          </h3>
          {goal.description ? (
            <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
              {goal.description}
            </p>
          ) : (
            <p className="text-xs text-zinc-600 italic mt-1.5">No description provided.</p>
          )}
        </div>

        {/* Progress label — honest representation */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500 font-medium uppercase tracking-wide">Progress</span>
            <span className="text-zinc-500">Tracked via linked tasks</span>
          </div>
          {/* Indeterminate bar — styled to communicate "no measurable % yet" without faking data */}
          <div
            className="h-1 w-full rounded-full bg-zinc-800/80 overflow-hidden"
            role="progressbar"
            aria-label="Goal progress"
            aria-valuenow={0}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full w-0 bg-[#d4af37] rounded-full" />
          </div>
        </div>
      </div>

      {/* Card Footer: Target date */}
      <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2 text-xs">
        {daysInfo ? (
          <div className={`flex items-center gap-1.5 font-medium ${urgencyColor}`}>
            {daysInfo.urgency === 'overdue' ? (
              <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <Calendar className="w-3.5 h-3.5 shrink-0 text-[#d4af37]" aria-hidden="true" />
            )}
            <span>{daysInfo.label}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-zinc-600">
            <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>No target date</span>
          </div>
        )}

        {/* Created date — quiet metadata */}
        <span className="text-zinc-600 text-[11px]">
          {new Date(goal.created_at).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
}
