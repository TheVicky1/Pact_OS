'use client';

import React, { useState, useTransition } from 'react';
import {
  DailyHabitItem,
  HabitFrequency,
} from '@/lib/habits/types';
import {
  completeHabitOccurrenceAction,
  uncompleteHabitOccurrenceAction,
  skipHabitOccurrenceAction,
  archiveHabitAction,
  toggleHabitStatusAction,
  deleteHabitAction,
} from '../actions';
import {
  Check,
  Flame,
  Clock,
  MoreVertical,
  Edit2,
  Archive,
  Trash2,
  PauseCircle,
  PlayCircle,
  FastForward,
  Loader2,
  Tag,
  Link as LinkIcon,
  RotateCcw,
} from 'lucide-react';

interface HabitCardProps {
  item: DailyHabitItem;
  currentDateStr?: string;
  onEdit: (habit: DailyHabitItem) => void;
  onRefresh: () => void;
}

function formatFrequencyLabel(freq: HabitFrequency, days?: number[], intervalDays?: number): string {
  switch (freq) {
    case 'daily':
      return 'Daily';
    case 'weekdays':
      return 'Weekdays (Mon–Fri)';
    case 'weekly':
      return 'Weekly';
    case 'selected_days': {
      if (!days || days.length === 0) return 'Custom Days';
      const map = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days.map((d) => map[d]).join(', ');
    }
    case 'custom_interval':
      return `Every ${intervalDays || 2} days`;
    default:
      return 'Scheduled';
  }
}

export function HabitCard({
  item,
  onEdit,
  onRefresh,
}: HabitCardProps) {
  const { template, occurrence, streak } = item;
  const [isPending, startTransition] = useTransition();
  const [showMenu, setShowMenu] = useState(false);
  const [completionNote, setCompletionNote] = useState(occurrence?.notes || '');
  const [isEditingNote, setIsEditingNote] = useState(false);

  const isCompleted = occurrence?.status === 'completed';
  const isSkipped = occurrence?.status === 'skipped';
  const isPaused = template.status === 'paused';

  const handleToggleCompletion = () => {
    if (isPending || !occurrence) return;

    startTransition(async () => {
      if (isCompleted) {
        await uncompleteHabitOccurrenceAction({
          occurrenceId: occurrence.id,
        });
      } else {
        await completeHabitOccurrenceAction({
          occurrenceId: occurrence.id,
          notes: completionNote.trim() || undefined,
        });
      }
      onRefresh();
    });
  };

  const handleSkip = () => {
    if (!occurrence) return;
    setShowMenu(false);
    startTransition(async () => {
      await skipHabitOccurrenceAction({
        occurrenceId: occurrence.id,
      });
      onRefresh();
    });
  };

  const handleTogglePause = () => {
    setShowMenu(false);
    startTransition(async () => {
      await toggleHabitStatusAction(template.id, isPaused ? 'active' : 'paused');
      onRefresh();
    });
  };

  const handleArchive = () => {
    setShowMenu(false);
    if (confirm(`Archive habit "${template.name}"? Active streaks will be preserved.`)) {
      startTransition(async () => {
        await archiveHabitAction(template.id);
        onRefresh();
      });
    }
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (
      confirm(
        `Are you sure you want to delete "${template.name}"? All past occurrences and streaks will be permanently deleted.`
      )
    ) {
      startTransition(async () => {
        await deleteHabitAction(template.id);
        onRefresh();
      });
    }
  };

  const handleSaveNote = () => {
    if (!occurrence) return;
    setIsEditingNote(false);
    if (isCompleted) {
      startTransition(async () => {
        await completeHabitOccurrenceAction({
          occurrenceId: occurrence.id,
          notes: completionNote.trim() || undefined,
        });
        onRefresh();
      });
    }
  };

  return (
    <div
      className={`group relative rounded-2xl border p-5 transition-all duration-200 backdrop-blur-xl ${
        isCompleted
          ? 'bg-emerald-950/15 border-emerald-500/30 shadow-emerald-950/20'
          : isSkipped
          ? 'bg-zinc-900/30 border-zinc-800/60 opacity-70'
          : isPaused
          ? 'bg-zinc-900/20 border-zinc-800/40 opacity-60'
          : 'bg-[#121217]/80 border-white/[0.08] hover:border-white/[0.15] hover:shadow-lg'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Completion Button & Core Info */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={handleToggleCompletion}
            disabled={isPending || isPaused || isSkipped || !occurrence}
            aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
            className={`mt-0.5 relative flex-shrink-0 w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
              isCompleted
                ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20 scale-105'
                : isSkipped
                ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
                : isPaused
                ? 'bg-zinc-800/50 border-zinc-700/50 text-zinc-600 cursor-not-allowed'
                : !occurrence
                ? 'bg-zinc-800/30 border-zinc-700/30 text-zinc-600 cursor-not-allowed'
                : 'bg-zinc-900/80 border-zinc-700/80 text-transparent hover:border-[#d4af37] hover:text-[#d4af37]/40'
            }`}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
            ) : isCompleted ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : isSkipped ? (
              <FastForward className="w-3.5 h-3.5" />
            ) : (
              <Check className="w-4 h-4 transition-opacity" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3
                className={`text-base font-semibold truncate transition-colors ${
                  isCompleted ? 'text-zinc-300 line-through' : 'text-zinc-100'
                }`}
              >
                {template.name}
              </h3>

              {template.category && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.04] text-zinc-400 border border-white/[0.06] capitalize">
                  <Tag className="w-2.5 h-2.5" />
                  {template.category}
                </span>
              )}

              {isPaused && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Paused
                </span>
              )}

              {isSkipped && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Skipped
                </span>
              )}
            </div>

            {template.description && (
              <p className="text-xs text-zinc-400 line-clamp-2 mb-2">{template.description}</p>
            )}

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-400">
                <RotateCcw className="w-3 h-3 text-zinc-500" />
                {formatFrequencyLabel(template.frequency_type, template.selected_days, template.interval_days)}
              </span>

              {template.target_time_local && (
                <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-400">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  {template.target_time_local.slice(0, 5)}
                  {template.target_duration_minutes
                    ? ` (${template.target_duration_minutes}m)`
                    : ''}
                </span>
              )}

              {template.tasks && (
                <span className="flex items-center gap-1 font-mono text-[11px] text-[#d4af37]/80">
                  <LinkIcon className="w-3 h-3 text-[#d4af37]" />
                  Task: {template.tasks.title}
                </span>
              )}
            </div>

            {/* Completion Note display or input */}
            {isCompleted && (
              <div className="mt-2.5">
                {isEditingNote ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={completionNote}
                      onChange={(e) => setCompletionNote(e.target.value)}
                      placeholder="Add completion reflection or note..."
                      className="text-xs bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-[#d4af37] w-full max-w-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveNote();
                        if (e.key === 'Escape') setIsEditingNote(false);
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 rounded-lg"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {occurrence?.notes ? (
                      <p className="text-xs text-emerald-400/90 italic">
                        &quot;{occurrence.notes}&quot;
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setIsEditingNote(true)}
                      className="text-[11px] text-zinc-500 hover:text-zinc-300 underline"
                    >
                      {occurrence?.notes ? 'Edit note' : '+ Add note'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Streak Flame & Context Menu */}
        <div className="flex items-center gap-3">
          {/* Streak Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border font-mono text-xs font-semibold ${
              streak.currentStreak > 0
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}
            title={`Current streak: ${streak.currentStreak} days | Longest: ${streak.longestStreak} days | Completion rate: ${streak.completionRate}%`}
          >
            <Flame
              className={`w-3.5 h-3.5 ${
                streak.currentStreak > 0
                  ? 'text-amber-400 fill-amber-400/30 animate-pulse'
                  : 'text-zinc-600'
              }`}
            />
            <span>{streak.currentStreak}d</span>
          </div>

          {/* Menu Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Habit options"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05] transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[#18181f] border border-white/[0.1] shadow-2xl z-30 py-1.5 backdrop-blur-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(item);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                    Edit Habit
                  </button>

                  {!isCompleted && !isSkipped && occurrence && (
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                    >
                      <FastForward className="w-3.5 h-3.5 text-zinc-400" />
                      Skip Today
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleTogglePause}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                  >
                    {isPaused ? (
                      <>
                        <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                        Resume Habit
                      </>
                    ) : (
                      <>
                        <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                        Pause Habit
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleArchive}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-amber-400/90 hover:bg-amber-500/10"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Archive Habit
                  </button>

                  <div className="my-1 border-t border-white/[0.06]" />

                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Permanently
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
