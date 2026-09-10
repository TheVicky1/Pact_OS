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
      <div className="border-b border-border/40 pb-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Step 4: Operational Clean Up & Carry Forward
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Triage open loops, carry forward essential commitments into next week (preserving task IDs), and eliminate obsolete items.
        </p>
      </div>

      {/* Unfinished / Overdue Tasks List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Unfinished & Overdue Commitments ({unfinishedTasks.length})</span>
          </span>
          {unfinishedTasks.length > 0 && (
            <div className="flex items-center space-x-2">
              <label className="text-xs text-muted-foreground">New Target Date:</label>
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
                className="text-xs rounded border border-border/60 bg-background px-2 py-1 text-foreground"
              />
            </div>
          )}
        </div>

        {unfinishedTasks.length === 0 ? (
          <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-medium text-foreground">Clean Slate Achieved</p>
            <p className="text-xs text-muted-foreground">
              No overdue or open commitments pending resolution.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {unfinishedTasks.map((task) => {
              const isSelected = selectedTaskIds.has(task.id);
              const isOverdue = task.status === 'missed' || (task.deadline_at && new Date(task.deadline_at) < new Date());

              return (
                <div
                  key={task.id}
                  onClick={() => toggleTaskSelection(task.id, task.title)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border/50 bg-card/40 hover:border-border/80'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/40 bg-background'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground block">
                        {task.title}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center space-x-2 mt-0.5">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                          task.priority === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                        }`}>
                          {task.priority}
                        </span>
                        {isOverdue && (
                          <span className="text-destructive font-medium flex items-center">
                            <AlertCircle className="w-3 h-3 mr-0.5" /> Overdue
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    {isSelected ? (
                      <span className="text-xs text-primary font-medium flex items-center">
                        Carry Forward <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Click to carry forward</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedTaskIds.size > 0 && onCarryForwardBatch && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={isExecutingCarry}
              onClick={handleApplyCarryForward}
              className="text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary font-medium hover:bg-primary/30 transition-colors"
            >
              {isExecutingCarry ? 'Applying...' : `Carry Forward ${selectedTaskIds.size} Selected Task(s) Now`}
            </button>
          </div>
        )}
      </div>

      {/* Lessons & Elimination Reflection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Lesson Learned (Key realization or strategic insight)
          </label>
          <textarea
            value={reflection.lessonLearned}
            onChange={(e) => onUpdateReflection('lessonLearned', e.target.value)}
            placeholder="e.g. Schedule hard tasks in the first 2 hours of the day before meetings."
            maxLength={2000}
            rows={3}
            className="w-full rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            What to Stop? (Activities to intentionally eliminate)
          </label>
          <textarea
            value={reflection.whatToStop}
            onChange={(e) => onUpdateReflection('whatToStop', e.target.value)}
            placeholder="e.g. Stop checking analytics multiple times daily."
            maxLength={2000}
            rows={3}
            className="w-full rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      </div>
    </div>
  );
}
