'use client';

import React, { useState } from 'react';
import { HabitTemplate, RoutineProgressSummary } from '@/lib/habits/types';
import { createRoutineAction, updateRoutineAction } from '../actions';
import {
  X,
  Sparkles,
  Clock,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface RoutineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialRoutine?: RoutineProgressSummary | null;
  availableHabits: HabitTemplate[];
}

function RoutineFormModalContent({
  onClose,
  onSuccess,
  initialRoutine,
  availableHabits,
}: Omit<RoutineFormModalProps, 'isOpen'>) {
  const isEditing = Boolean(initialRoutine);
  const routine = initialRoutine?.routine;

  const [name, setName] = useState(routine?.name || '');
  const [description, setDescription] = useState(routine?.description || '');
  const [targetTimeLocal, setTargetTimeLocal] = useState(
    routine?.target_time_local ? routine.target_time_local.slice(0, 5) : ''
  );
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>(
    (routine?.items || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => i.habit_template_id)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddHabit = (habitId: string) => {
    if (!selectedHabitIds.includes(habitId)) {
      setSelectedHabitIds([...selectedHabitIds, habitId]);
    }
  };

  const handleRemoveHabit = (habitId: string) => {
    setSelectedHabitIds(selectedHabitIds.filter((id) => id !== habitId));
  };

  const handleMoveHabit = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= selectedHabitIds.length) return;

    const next = [...selectedHabitIds];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setSelectedHabitIds(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Routine name is required.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      targetTimeLocal: targetTimeLocal.trim() ? targetTimeLocal.trim() : undefined,
      habitTemplateIds: selectedHabitIds,
    };

    let res;
    if (isEditing && routine) {
      res = await updateRoutineAction({
        id: routine.id,
        ...payload,
      });
    } else {
      res = await createRoutineAction(payload);
    }

    setIsLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to save routine.');
    }
  };

  const unselectedHabits = availableHabits.filter((h) => !selectedHabitIds.includes(h.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#121217] border border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-[#d4af37]/15 text-[#e2c056] border border-[#d4af37]/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">
              {isEditing ? 'Edit Routine' : 'Create Routine Template'}
            </h2>
            <p className="text-xs text-zinc-400">
              Sequence of habits executed together as a structured ritual
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Routine Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Kickstart, Evening Shutdown, Deep Work Prep"
              maxLength={100}
              required
              className="w-full bg-zinc-900/90 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Routine purpose and execution context..."
              rows={2}
              maxLength={500}
              className="w-full bg-zinc-900/90 border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#d4af37] resize-none"
            />
          </div>

          {/* Target Time */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-500" /> Target Execution Time
            </label>
            <input
              type="time"
              value={targetTimeLocal}
              onChange={(e) => setTargetTimeLocal(e.target.value)}
              className="w-full bg-zinc-900/90 border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* Routine Sequence Builder */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Habits in Sequence ({selectedHabitIds.length})
            </label>

            {selectedHabitIds.length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                No habits added yet. Select from below to build your routine sequence.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {selectedHabitIds.map((habitId, idx) => {
                  const habit = availableHabits.find((h) => h.id === habitId);
                  if (!habit) return null;
                  return (
                    <div
                      key={habitId}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/80 border border-white/[0.06] text-xs text-zinc-200"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[11px] text-zinc-500 w-4 text-center">
                          {idx + 1}.
                        </span>
                        <span className="font-medium truncate">{habit.name}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveHabit(idx, 'up')}
                          className="p-1 rounded text-zinc-400 hover:text-zinc-100 disabled:opacity-30"
                          aria-label="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === selectedHabitIds.length - 1}
                          onClick={() => handleMoveHabit(idx, 'down')}
                          className="p-1 rounded text-zinc-400 hover:text-zinc-100 disabled:opacity-30"
                          aria-label="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveHabit(habitId)}
                          className="p-1 rounded text-red-400/80 hover:text-red-400 hover:bg-red-500/10 ml-1"
                          aria-label="Remove habit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Habit Picker */}
            {unselectedHabits.length > 0 && (
              <div className="mt-2.5">
                <p className="text-[11px] text-zinc-400 mb-1.5 font-medium">Add available habit:</p>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {unselectedHabits.map((habit) => (
                    <button
                      key={habit.id}
                      type="button"
                      onClick={() => handleAddHabit(habit.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition-all"
                    >
                      <Plus className="w-3 h-3 text-[#d4af37]" />
                      <span>{habit.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#d4af37] text-black hover:bg-[#e2c056] shadow-lg shadow-[#d4af37]/20 flex items-center gap-2 transition-all"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Save Routine' : 'Create Routine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RoutineFormModal(props: RoutineFormModalProps) {
  if (!props.isOpen) return null;
  return (
    <RoutineFormModalContent
      key={props.initialRoutine?.routine.id || 'new-routine'}
      {...props}
    />
  );
}
