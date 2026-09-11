'use client';

import React, { useState, useTransition } from 'react';
import { RoutineProgressSummary } from '@/lib/habits/types';
import {
  completeHabitOccurrenceAction,
  uncompleteHabitOccurrenceAction,
  deleteRoutineAction,
} from '../actions';
import {
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Edit3,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface RoutineCardProps {
  routineSummary: RoutineProgressSummary;
  currentDateStr: string;
  onEdit: (routine: RoutineProgressSummary) => void;
  onRefresh: () => void;
}

export function RoutineCard({
  routineSummary,
  onEdit,
  onRefresh,
}: RoutineCardProps) {
  const { routine, totalHabits, completedHabits, progressPercentage, items } = routineSummary;
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleToggleHabit = (occurrenceId: string | null | undefined, isCurrentlyCompleted: boolean) => {
    if (isPending || !occurrenceId) return;

    startTransition(async () => {
      if (isCurrentlyCompleted) {
        await uncompleteHabitOccurrenceAction({
          occurrenceId,
        });
      } else {
        await completeHabitOccurrenceAction({
          occurrenceId,
        });
      }
      onRefresh();
    });
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (confirm(`Delete routine "${routine.name}"? The individual habits will NOT be deleted.`)) {
      startTransition(async () => {
        await deleteRoutineAction(routine.id);
        onRefresh();
      });
    }
  };

  const isAllComplete = totalHabits > 0 && completedHabits === totalHabits;

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-200 backdrop-blur-xl ${
        isAllComplete
          ? 'bg-emerald-950/20 border-emerald-500/30 shadow-lg shadow-emerald-950/20'
          : 'bg-[#121217]/80 border-white/[0.08] hover:border-white/[0.15]'
      }`}
    >
      {/* Routine Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <h3 className="text-base font-bold text-zinc-100 truncate">{routine.name}</h3>

            {routine.target_time_local && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800">
                <Clock className="w-3 h-3 text-zinc-500" />
                {routine.target_time_local.slice(0, 5)}
              </span>
            )}
          </div>

          {routine.description && (
            <p className="text-xs text-zinc-400 mb-2">{routine.description}</p>
          )}

          {/* Progress Bar & Counter */}
          <div className="space-y-1.5 mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">
                {completedHabits} of {totalHabits} completed
              </span>
              <span
                className={`font-mono font-semibold ${
                  isAllComplete ? 'text-emerald-400' : 'text-[#d4af37]'
                }`}
              >
                {progressPercentage}%
              </span>
            </div>
            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/[0.05]">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isAllComplete
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-[#d4af37] to-amber-300'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Actions: Expand Toggle & Menu */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]"
            aria-label={isExpanded ? 'Collapse routine' : 'Expand routine'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Routine menu"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-40 rounded-xl bg-[#18181f] border border-white/[0.1] shadow-2xl z-30 py-1 backdrop-blur-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(routineSummary);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                    Edit Routine
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Routine
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ordered Habit Items */}
      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-2">
          {items.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-1">No habit items linked to this routine.</p>
          ) : (
            items.map((item, idx) => (
              <div
                key={item.habit.id}
                onClick={() => handleToggleHabit(item.occurrence?.id, item.isCompleted)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                  item.isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/20 text-zinc-300'
                    : 'bg-zinc-900/40 border-white/[0.04] hover:border-white/[0.1] text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[11px] font-mono text-zinc-500 w-4 text-center">
                    {idx + 1}.
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    {item.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    )}
                    <span
                      className={`text-xs font-medium truncate ${
                        item.isCompleted ? 'line-through text-zinc-400' : ''
                      }`}
                    >
                      {item.habit.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  {item.habit.target_duration_minutes && (
                    <span className="font-mono">{item.habit.target_duration_minutes}m</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
