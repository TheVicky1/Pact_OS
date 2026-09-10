'use client';

import React, { useState } from 'react';
import {
  NextWeekPlan,
  WeeklyReflection,
  TopPriorityItem,
} from '@/lib/weekly-review/types';
import { Goal, Project } from '@/types/domain';
import { HabitTemplate } from '@/lib/habits/types';
import {
  Target,
  Plus,
  Trash2,
  Lock,
  Repeat,
  CheckCircle2,
  FolderKanban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PlanningStepProps {
  nextWeekPlan: NextWeekPlan;
  activeGoals: Goal[];
  activeProjects: Project[];
  activeHabits: HabitTemplate[];
  reflection: WeeklyReflection;
  isCommitting: boolean;
  onUpdatePlan: (plan: NextWeekPlan) => void;
  onUpdateReflection: (field: keyof WeeklyReflection, value: string) => void;
  onCommitReview: () => void;
}

export function PlanningStep({
  nextWeekPlan,
  activeGoals,
  activeProjects,
  activeHabits,
  reflection,
  isCommitting,
  onUpdatePlan,
  onUpdateReflection,
  onCommitReview,
}: PlanningStepProps) {
  const [newPriorityText, setNewPriorityText] = useState('');

  const priorities = nextWeekPlan.topPriorities || [];
  const focusGoalIds = new Set(nextWeekPlan.focusGoalIds || []);
  const focusProjectIds = new Set(nextWeekPlan.focusProjectIds || []);
  const targetHabitIds = new Set(nextWeekPlan.targetHabitIds || []);

  const handleAddPriority = () => {
    if (!newPriorityText.trim() || priorities.length >= 5) return;
    const newItem: TopPriorityItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      text: newPriorityText.trim(),
    };
    onUpdatePlan({
      ...nextWeekPlan,
      topPriorities: [...priorities, newItem],
    });
    setNewPriorityText('');
  };

  const handleRemovePriority = (id: string) => {
    onUpdatePlan({
      ...nextWeekPlan,
      topPriorities: priorities.filter((p) => p.id !== id),
    });
  };

  const toggleGoalFocus = (goalId: string) => {
    const next = new Set(focusGoalIds);
    if (next.has(goalId)) {
      next.delete(goalId);
    } else {
      next.add(goalId);
    }
    onUpdatePlan({
      ...nextWeekPlan,
      focusGoalIds: Array.from(next),
    });
  };

  const toggleProjectFocus = (projectId: string) => {
    const next = new Set(focusProjectIds);
    if (next.has(projectId)) {
      next.delete(projectId);
    } else {
      next.add(projectId);
    }
    onUpdatePlan({
      ...nextWeekPlan,
      focusProjectIds: Array.from(next),
    });
  };

  const toggleHabitFocus = (habitId: string) => {
    const next = new Set(targetHabitIds);
    if (next.has(habitId)) {
      next.delete(habitId);
    } else {
      next.add(habitId);
    }
    onUpdatePlan({
      ...nextWeekPlan,
      targetHabitIds: Array.from(next),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
            Step 5 • Strategic Alignment
          </span>
          <span className="h-1 w-1 rounded-full bg-zinc-500" />
          <span className="text-xs text-zinc-400">Plan & Commit</span>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-100 mt-1">
          Plan Next Week & Lock Operating Contract
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Define your top 3-5 strategic outcomes, select core goal and project focus areas, and seal your commitment.
        </p>
      </div>

      {/* Top 3-5 Priorities Section */}
      <div className="glass-card rounded-2xl p-6 border-white/[0.08] bg-zinc-900/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#d4af37] font-medium text-xs">
            <Target className="w-4 h-4" />
            <span>Top Priorities for the Coming Week ({priorities.length}/5)</span>
          </div>
          <span className="text-xs text-zinc-400">Essential focus (max 5)</span>
        </div>

        {/* Priority Input */}
        {priorities.length < 5 && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newPriorityText}
              onChange={(e) => setNewPriorityText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddPriority();
                }
              }}
              placeholder="e.g. Complete Phase 6E implementation and security audit"
              maxLength={255}
              className="flex-1 rounded-xl border border-white/[0.08] bg-zinc-950/80 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleAddPriority}
              disabled={!newPriorityText.trim()}
              className="shrink-0"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>Add</span>
            </Button>
          </div>
        )}

        {/* Priority List */}
        <div className="space-y-2.5">
          {priorities.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.06] bg-zinc-950/60"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-[#d4af37]/15 text-[#e2c056] border border-[#d4af37]/30 font-mono text-xs flex items-center justify-center font-bold shrink-0">
                  {idx + 1}
                </span>
                <span className="text-xs sm:text-sm font-medium text-zinc-100 truncate">{item.text}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemovePriority(item.id)}
                className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                title="Remove priority"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {priorities.length === 0 && (
            <p className="text-xs text-zinc-500 italic text-center py-3">
              No priorities added yet. Define at least 1-3 primary outcomes.
            </p>
          )}
        </div>
      </div>

      {/* Strategic Goals, Projects & Habits Emphasis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Goals Emphasis */}
        <div className="glass-card rounded-2xl p-5 border-white/[0.08] bg-zinc-900/60 space-y-3">
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>Active Goals</span>
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {activeGoals.map((goal) => {
              const isSelected = focusGoalIds.has(goal.id);
              return (
                <div
                  key={goal.id}
                  onClick={() => toggleGoalFocus(goal.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'border-amber-500/50 bg-amber-500/10 text-zinc-100 font-medium'
                      : 'border-white/[0.06] bg-zinc-950/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <span className="truncate pr-2">{goal.title}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                </div>
              );
            })}
            {activeGoals.length === 0 && (
              <p className="text-xs text-zinc-500 italic">No active goals.</p>
            )}
          </div>
        </div>

        {/* Projects Emphasis */}
        <div className="glass-card rounded-2xl p-5 border-white/[0.08] bg-zinc-900/60 space-y-3">
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block flex items-center gap-2">
            <FolderKanban className="w-3.5 h-3.5 text-sky-400" />
            <span>Active Projects</span>
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {activeProjects.map((project) => {
              const isSelected = focusProjectIds.has(project.id);
              return (
                <div
                  key={project.id}
                  onClick={() => toggleProjectFocus(project.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'border-sky-500/50 bg-sky-500/10 text-zinc-100 font-medium'
                      : 'border-white/[0.06] bg-zinc-950/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <span className="truncate pr-2">{project.title}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />}
                </div>
              );
            })}
            {activeProjects.length === 0 && (
              <p className="text-xs text-zinc-500 italic">No active projects.</p>
            )}
          </div>
        </div>

        {/* Habits Emphasis */}
        <div className="glass-card rounded-2xl p-5 border-white/[0.08] bg-zinc-900/60 space-y-3">
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block flex items-center gap-2">
            <Repeat className="w-3.5 h-3.5 text-emerald-400" />
            <span>Daily Habits</span>
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {activeHabits.map((habit) => {
              const isSelected = targetHabitIds.has(habit.id);
              return (
                <div
                  key={habit.id}
                  onClick={() => toggleHabitFocus(habit.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-zinc-100 font-medium'
                      : 'border-white/[0.06] bg-zinc-950/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <span className="truncate pr-2">{habit.name}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </div>
              );
            })}
            {activeHabits.length === 0 && (
              <p className="text-xs text-zinc-500 italic">No active habits.</p>
            )}
          </div>
        </div>
      </div>

      {/* Structured Habit & Method Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
        <div className="glass-card rounded-2xl p-5 border-white/[0.08] bg-zinc-900/60 space-y-3">
          <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider block">
            What to Continue? <span className="text-zinc-400 font-normal font-sans lowercase">(winning behaviors to double down on)</span>
          </label>
          <textarea
            value={reflection.whatToContinue}
            onChange={(e) => onUpdateReflection('whatToContinue', e.target.value)}
            placeholder="e.g. Daily morning shutdown routine and 3L water intake."
            maxLength={2000}
            rows={2}
            className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/60 p-3.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 transition-all resize-none"
          />
        </div>

        <div className="glass-card rounded-2xl p-5 border-white/[0.08] bg-zinc-900/60 space-y-3">
          <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider block">
            What to Start? <span className="text-zinc-400 font-normal font-sans lowercase">(new experiment or behavior adjustment)</span>
          </label>
          <textarea
            value={reflection.whatToStart}
            onChange={(e) => onUpdateReflection('whatToStart', e.target.value)}
            placeholder="e.g. Plan nutrition on Sunday evening to eliminate daily decision fatigue."
            maxLength={2000}
            rows={2}
            className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/60 p-3.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 transition-all resize-none"
          />
        </div>
      </div>

      {/* Final Commitment Checkpoint Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-[#d4af37]/40 bg-gradient-to-br from-[#181622] via-[#121217] to-black shadow-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#d4af37]/15 text-[#e2c056] border border-[#d4af37]/30">
              <Lock className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-zinc-100 tracking-tight">
              WEEKLY OPERATING COMMITMENT
            </span>
          </div>
          <span className="text-[11px] font-mono uppercase px-3 py-1 rounded-full bg-[#d4af37]/20 text-[#e2c056] border border-[#d4af37]/30 font-semibold">
            FINAL LOCK
          </span>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-zinc-300">
          <p className="font-semibold text-zinc-100">THIS COMING WEEK I AM COMMITTING TO:</p>
          <ul className="space-y-2 text-xs text-zinc-400 pl-1">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
              <span>
                <strong className="text-zinc-200 font-mono">{priorities.length}</strong> top priority outcome{priorities.length !== 1 ? 's' : ''}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>
                <strong className="text-zinc-200 font-mono">{focusGoalIds.size}</strong> strategic goal focus area{focusGoalIds.size !== 1 ? 's' : ''}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>
                <strong className="text-zinc-200 font-mono">{focusProjectIds.size}</strong> active project focus area{focusProjectIds.size !== 1 ? 's' : ''}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>
                <strong className="text-zinc-200 font-mono">{targetHabitIds.size}</strong> daily habit anchor{targetHabitIds.size !== 1 ? 's' : ''}
              </span>
            </li>
          </ul>
        </div>

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.08]">
          <p className="text-xs text-zinc-500">
            Committing freezes this week&apos;s verified facts and certifies your operating plan.
          </p>

          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={isCommitting || priorities.length === 0}
            onClick={onCommitReview}
            className="w-full sm:w-auto shadow-xl shadow-[#d4af37]/20"
          >
            <Lock className="w-4 h-4 mr-2" />
            <span>{isCommitting ? 'Locking Weekly Plan...' : 'Commit & Lock Weekly Plan'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
