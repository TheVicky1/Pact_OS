'use client';

import { Goal, GoalStatus } from '@/types/domain';
import { Calendar, Edit3, Trash2, Archive, CheckCircle2, Target, FolderKanban, CheckSquare } from 'lucide-react';
import Link from 'next/link';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onArchive: (goal: Goal) => void;
}

const statusBadgeConfig: Record<GoalStatus, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
  },
  completed: {
    label: 'Completed',
    className: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
  },
  archived: {
    label: 'Archived',
    className: 'bg-zinc-900 text-zinc-400 border-zinc-700/80',
  },
};

export function GoalCard({ goal, onEdit, onDelete, onArchive }: GoalCardProps) {
  const badge = statusBadgeConfig[goal.status] || statusBadgeConfig.active;

  const formattedDate = goal.target_date
    ? new Date(goal.target_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="glass-card p-5 sm:p-6 rounded-2xl border border-zinc-800/80 flex flex-col justify-between space-y-4 hover:border-[#d4af37]/30 transition-all group">
      <div className="space-y-3">
        {/* Card Header: Icon, Badge, Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(goal)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors cursor-pointer"
              title="Edit Goal"
              aria-label={`Edit goal ${goal.title}`}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {goal.status !== 'archived' && (
              <button
                onClick={() => onArchive(goal)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-amber-950/40 transition-colors cursor-pointer"
                title="Archive Goal"
                aria-label={`Archive goal ${goal.title}`}
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => onDelete(goal)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Delete Goal"
              aria-label={`Delete goal ${goal.title}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title and Description */}
        <div>
          <h3 className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors line-clamp-2">
            {goal.title}
          </h3>
          {goal.description ? (
            <p className="text-xs text-zinc-400 mt-1.5 line-clamp-3 leading-relaxed">
              {goal.description}
            </p>
          ) : (
            <p className="text-xs text-zinc-600 italic mt-1.5">No description provided.</p>
          )}
        </div>
      </div>

      {/* Card Footer: Target Date & Cross-domain Navigation */}
      <div className="pt-3 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>{formattedDate ? `Target: ${formattedDate}` : 'No target date'}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/projects"
            className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-[#d4af37] transition-colors"
            title="View projects"
          >
            <FolderKanban className="w-3 h-3 text-[#d4af37]" />
            <span>Projects</span>
          </Link>
          <Link
            href="/app/tasks"
            className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-[#d4af37] transition-colors"
            title="View tasks"
          >
            <CheckSquare className="w-3 h-3 text-[#d4af37]" />
            <span>Tasks</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

