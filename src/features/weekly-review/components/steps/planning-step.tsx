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
      <div className="border-b border-border/40 pb-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Step 5: Plan Next Week & Lock Commitment
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Define top strategic outcomes, anchor essential habits, and explicitly commit to the upcoming week.
        </p>
      </div>

      {/* Top 3-5 Priorities Section */}
      <div className="p-5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-primary font-medium text-sm">
            <Target className="w-4 h-4" />
            <span>Top Priorities for the Coming Week ({priorities.length}/5)</span>
          </div>
          <span className="text-xs text-muted-foreground">Keep it focused (max 5)</span>
        </div>

        {/* Priority Input */}
        {priorities.length < 5 && (
          <div className="flex space-x-2">
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
              className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleAddPriority}
              disabled={!newPriorityText.trim()}
              className="px-3.5 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        )}

        {/* Priority List */}
        <div className="space-y-2">
          {priorities.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-background/50"
            >
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-mono text-xs flex items-center justify-center font-semibold">
                  {idx + 1}
                </span>
                <span className="text-sm font-medium text-foreground">{item.text}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemovePriority(item.id)}
                className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {priorities.length === 0 && (
            <p className="text-xs text-muted-foreground italic text-center py-2">
              No priorities added yet. Define at least 1-3 primary outcomes.
            </p>
          )}
        </div>
      </div>

      {/* Strategic Goals, Projects & Habits Emphasis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Goals Emphasis */}
        <div className="p-4 rounded-xl border border-border/50 bg-card/40 space-y-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block flex items-center space-x-1.5">
            <Target className="w-3.5 h-3.5 text-amber-500" />
            <span>Active Goals</span>
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {activeGoals.map((goal) => {
              const isSelected = focusGoalIds.has(goal.id);
              return (
                <div
                  key={goal.id}
                  onClick={() => toggleGoalFocus(goal.id)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'border-amber-500/60 bg-amber-500/10 text-foreground font-medium'
                      : 'border-border/40 bg-background/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="truncate pr-2">{goal.title}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                </div>
              );
            })}
            {activeGoals.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No active goals.</p>
            )}
          </div>
        </div>

        {/* Projects Emphasis */}
        <div className="p-4 rounded-xl border border-border/50 bg-card/40 space-y-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block flex items-center space-x-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-sky-500" />
            <span>Active Projects</span>
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {activeProjects.map((project) => {
              const isSelected = focusProjectIds.has(project.id);
              return (
                <div
                  key={project.id}
                  onClick={() => toggleProjectFocus(project.id)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'border-sky-500/60 bg-sky-500/10 text-foreground font-medium'
                      : 'border-border/40 bg-background/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="truncate pr-2">{project.title}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                </div>
              );
            })}
            {activeProjects.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No active projects.</p>
            )}
          </div>
        </div>

        {/* Habits Emphasis */}
        <div className="p-4 rounded-xl border border-border/50 bg-card/40 space-y-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block flex items-center space-x-1.5">
            <Repeat className="w-3.5 h-3.5 text-emerald-500" />
            <span>Daily Habits</span>
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {activeHabits.map((habit) => {
              const isSelected = targetHabitIds.has(habit.id);
              return (
                <div
                  key={habit.id}
                  onClick={() => toggleHabitFocus(habit.id)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-foreground font-medium'
                      : 'border-border/40 bg-background/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="truncate pr-2">{habit.name}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                </div>
              );
            })}
            {activeHabits.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No active habits.</p>
            )}
          </div>
        </div>
      </div>

      {/* Structured Habit & Method Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            What to Continue? (Winning behaviors to double down on)
          </label>
          <textarea
            value={reflection.whatToContinue}
            onChange={(e) => onUpdateReflection('whatToContinue', e.target.value)}
            placeholder="e.g. Daily morning shutdown routine and 3L water intake."
            maxLength={2000}
            rows={2}
            className="w-full rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            What to Start? (New experiment or behavior adjustment)
          </label>
          <textarea
            value={reflection.whatToStart}
            onChange={(e) => onUpdateReflection('whatToStart', e.target.value)}
            placeholder="e.g. Plan meals on Sunday evening to eliminate decision fatigue."
            maxLength={2000}
            rows={2}
            className="w-full rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      </div>

      {/* Final Commitment Checkpoint Card */}
      <div className="p-6 rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-background to-card/60 backdrop-blur-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-primary" />
            <span className="font-bold text-base text-foreground tracking-tight">
              WEEKLY OPERATING COMMITMENT
            </span>
          </div>
          <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
            FINAL STEP
          </span>
        </div>

        <div className="space-y-2 text-sm text-foreground/90">
          <p className="font-medium">THIS COMING WEEK I AM COMMITTING TO:</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground pl-2">
            <li>
              <span className="font-semibold text-foreground">{priorities.length}</span> top priority outcome{priorities.length !== 1 ? 's' : ''}
            </li>
            <li>
              <span className="font-semibold text-foreground">{focusGoalIds.size}</span> strategic goal focus area{focusGoalIds.size !== 1 ? 's' : ''}
            </li>
            <li>
              <span className="font-semibold text-foreground">{focusProjectIds.size}</span> active project focus area{focusProjectIds.size !== 1 ? 's' : ''}
            </li>
            <li>
              <span className="font-semibold text-foreground">{targetHabitIds.size}</span> daily habit anchor{targetHabitIds.size !== 1 ? 's' : ''}
            </li>
          </ul>
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="button"
            disabled={isCommitting || priorities.length === 0}
            onClick={onCommitReview}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>{isCommitting ? 'Locking Weekly Plan...' : 'Commit & Lock Weekly Plan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
