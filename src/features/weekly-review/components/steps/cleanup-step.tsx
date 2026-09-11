'use client';

import React, { useState } from 'react';
import {
  WeeklyCleanupDecisions,
  WeeklyReflection,
} from '@/lib/weekly-review/types';
import { Task } from '@/types/domain';
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { addDaysToDateString } from '@/lib/time';
import { Button } from '@/components/ui/button';

export interface CleanupStepProps {
  unfinishedTasks: Task[];
  cleanupDecisions: WeeklyCleanupDecisions;
  nextWeekStart: string;
  reflection: WeeklyReflection;
  onUpdateCleanupDecisions: (decisions: WeeklyCleanupDecisions) => void;
  onUpdateReflection: (field: keyof WeeklyReflection, value: string) => void;
  onCarryForwardBatch?: (tasks: Array<{ taskId: string; newDeadline: string }>) => Promise<void>;
}

export function CleanupStep({
  unfinishedTasks,
  cleanupDecisions,
  nextWeekStart,
  reflection,
  onUpdateCleanupDecisions,
  onUpdateReflection,
  onCarryForwardBatch,
}: CleanupStepProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(cleanupDecisions.carriedForwardTasks.map((t) => t.taskId))
  );
  const [defaultCarryDeadline, setDefaultCarryDeadline] = useState<string>(
    // Default to Friday of next week (nextWeekStart + 4 days) at 23:59
    `${addDaysToDateString(nextWeekStart, 4)}T23:59:00.000Z`
  );
  const [isExecutingCarry, setIsExecutingCarry] = useState(false);

  const toggleTaskSelection = (taskId: string, title: string) => {
    const next = new Set(selectedTaskIds);
    let updatedCarried = [...cleanupDecisions.carriedForwardTasks];

    if (next.has(taskId)) {
      next.delete(taskId);
      updatedCarried = updatedCarried.filter((t) => t.taskId !== taskId);
    } else {
      next.add(taskId);
      updatedCarried.push({
        taskId,
        title,
        newDeadline: defaultCarryDeadline,
      });
    }

    setSelectedTaskIds(next);
    onUpdateCleanupDecisions({
      ...cleanupDecisions,
      carriedForwardTasks: updatedCarried,
    });
  };

  const handleApplyCarryForward = async () => {
    if (selectedTaskIds.size === 0 || !onCarryForwardBatch) return;
    setIsExecutingCarry(true);
    try {
      const payload = Array.from(selectedTaskIds).map((id) => ({
        taskId: id,
        newDeadline: defaultCarryDeadline,
      }));
      await onCarryForwardBatch(payload);
    } finally {
      setIsExecutingCarry(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
            Step 4 • Open Loops
          </span>
          <span className="h-1 w-1 rounded-full bg-zinc-500" />
          <span className="text-xs text-zinc-400">Operational Clean Up</span>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-100 mt-1">
          Operational Clean Up & Carry Forward
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Triage open loops, carry forward essential commitments into next week (preserving task IDs), and eliminate obsolete items.
        </p>
      </div>

      {/* Unfinished / Overdue Tasks List */}
      <div className="glass-card rounded-2xl p-6 border-white/[0.08] bg-zinc-900/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Unfinished Commitments ({unfinishedTasks.length})</span>
          </span>
          {unfinishedTasks.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-400">Target New Deadline:</label>
              <input
                type="date"
                defaultValue={defaultCarryDeadline.slice(0, 10)}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    const newIso = `${val}T23:59:00.000Z`;
                    setDefaultCarryDeadline(newIso);
                    // Update all currently selected
                    const updated = cleanupDecisions.carriedForwardTasks.map((t) => ({
                      ...t,
                      newDeadline: newIso,
                    }));
                    onUpdateCleanupDecisions({
                      ...cleanupDecisions,
                      carriedForwardTasks: updated,
                    });
                  }
                }}
                className="text-xs rounded-xl border border-white/[0.08] bg-zinc-950/80 px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-[#d4af37]/60"
              />
            </div>
          )}
        </div>

        {unfinishedTasks.length === 0 ? (
          <div className="p-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-200">Clean Slate Achieved</p>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              No overdue or open commitments pending resolution. Your queue is fully reconciled.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {unfinishedTasks.map((task) => {
              const isSelected = selectedTaskIds.has(task.id);
              const isOverdue = task.status === 'missed' || (task.deadline_at && new Date(task.deadline_at) < new Date());

              return (
                <div
                  key={task.id}
                  onClick={() => toggleTaskSelection(task.id, task.title)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-[#d4af37]/50 bg-[#15141c] shadow-sm'
                      : 'border-white/[0.06] bg-zinc-950/40 hover:border-white/[0.12] hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-[#d4af37] bg-[#d4af37] text-zinc-950'
                          : 'border-white/[0.15] bg-zinc-900/80'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-zinc-100 truncate block">
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                          task.priority === 'urgent' || task.priority === 'high'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {task.priority}
                        </span>
                        {isOverdue && (
                          <span className="text-rose-400 text-xs font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {isSelected ? (
                      <span className="text-xs text-[#e2c056] font-semibold flex items-center gap-1">
                        Carrying Forward <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                        Select to carry
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedTaskIds.size > 0 && onCarryForwardBatch && (
          <div className="flex justify-end pt-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={isExecutingCarry}
              onClick={handleApplyCarryForward}
              className="text-xs"
            >
              {isExecutingCarry ? 'Applying...' : `Carry Forward ${selectedTaskIds.size} Selected Task(s) Now`}
            </Button>
          </div>
        )}
      </div>

      {/* Lessons & Elimination Reflection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        <div className="glass-card rounded-2xl p-5 border-white/[0.08] bg-zinc-900/60 space-y-3">
          <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider block">
            Lesson Learned <span className="text-zinc-400 font-normal font-sans lowercase">(key realization or strategic insight)</span>
          </label>
          <textarea
            value={reflection.lessonLearned}
            onChange={(e) => onUpdateReflection('lessonLearned', e.target.value)}
            placeholder="e.g. Schedule demanding deep work in the first 2 hours of the day before meetings."
            maxLength={2000}
            rows={3}
            className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/60 p-3.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 transition-all resize-none"
          />
        </div>

        <div className="glass-card rounded-2xl p-5 border-white/[0.08] bg-zinc-900/60 space-y-3">
          <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider block">
            What to Stop? <span className="text-zinc-400 font-normal font-sans lowercase">(activities to intentionally eliminate)</span>
          </label>
          <textarea
            value={reflection.whatToStop}
            onChange={(e) => onUpdateReflection('whatToStop', e.target.value)}
            placeholder="e.g. Stop checking analytics multiple times daily."
            maxLength={2000}
            rows={3}
            className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/60 p-3.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
}
