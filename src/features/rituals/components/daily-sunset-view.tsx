'use client';

/**
 * PACT Phase 12: Daily Sunset & Shutdown Ritual View
 *
 * 4-Step Interactive Evening Closure Wizard:
 * Step 1: Daily Scorecard & Metrics
 * Step 2: Unfinished Tasks Triage
 * Step 3: Evening Habits Checklist
 * Step 4: Tomorrow's Top 3 Priorities & Final Commitment
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sunset,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Target,
  Sparkles,
  Calendar,
  Flame,
  Clock,
  Archive,
  Trash2,
  Loader2,
} from 'lucide-react';
import { submitDailySunset } from '../daily-sunset-actions';
import { computeDailyDisciplineScore } from '@/lib/rituals/daily-sunset';

interface UnfinishedTask {
  id: string;
  title: string;
  priority?: string;
}

interface EveningHabit {
  id: string;
  title: string;
  completed: boolean;
}

export function DailySunsetView({
  initialTasksCompleted = 4,
  initialTasksTotal = 6,
  initialFocusMinutes = 145,
  initialUnfinishedTasks = [
    { id: '11111111-1111-4111-8111-111111111111', title: 'Refactor rate limiter middleware', priority: 'high' },
    { id: '22222222-2222-4222-8222-222222222222', title: 'Review open pull requests', priority: 'medium' },
  ] as UnfinishedTask[],
  initialHabits = [
    { id: 'h1', title: 'Evening meditation & breathwork', completed: false },
    { id: 'h2', title: 'Plan tomorrow’s schedule in calendar', completed: false },
    { id: 'h3', title: 'No screens 30m before sleep', completed: false },
  ] as EveningHabit[],
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [triageMap, setTriageMap] = useState<Record<string, 'carry_forward_tomorrow' | 'move_to_backlog' | 'discard'>>({
    '11111111-1111-4111-8111-111111111111': 'carry_forward_tomorrow',
    '22222222-2222-4222-8222-222222222222': 'move_to_backlog',
  });
  const [habits, setHabits] = useState<EveningHabit[]>(initialHabits);
  const [tomorrowPriorities, setTomorrowPriorities] = useState<string[]>([
    'Deploy Phase 12 release candidates',
    'Deep work focus session on core protocol',
    '',
  ]);
  const [reflection, setReflection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const habitsCompletedCount = habits.filter((h) => h.completed).length;
  const disciplineScore = computeDailyDisciplineScore(
    initialTasksCompleted,
    initialTasksTotal,
    habitsCompletedCount,
    habits.length,
    initialFocusMinutes
  );

  const handleToggleHabit = (id: string) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h)));
  };

  const handlePriorityChange = (index: number, val: string) => {
    const updated = [...tomorrowPriorities];
    updated[index] = val;
    setTomorrowPriorities(updated);
  };

  const handleFinishSunset = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const filteredPriorities = tomorrowPriorities.map((p) => p.trim()).filter(Boolean);
    if (filteredPriorities.length === 0) {
      setErrorMsg('Please enter at least one top priority for tomorrow.');
      setIsSubmitting(false);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0] || '2026-09-14';

    const triageDecisions = Object.entries(triageMap).map(([taskId, decision]) => ({
      taskId,
      decision,
    }));

    const result = await submitDailySunset({
      date: todayStr,
      tasksCompletedCount: initialTasksCompleted,
      tasksTotalCount: initialTasksTotal,
      focusMinutesTotal: initialFocusMinutes,
      habitsCompletedCount,
      habitsTotalCount: habits.length,
      triageDecisions,
      tomorrowTopPriorities: filteredPriorities,
      reflectionNotes: reflection || undefined,
      shutdownConfirmed: true,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Failed to record daily sunset.');
    } else {
      router.push('/app');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 select-none font-sans pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Sunset className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-100 tracking-tight">Daily Sunset &amp; Shutdown</h1>
            <p className="text-xs text-neutral-400">End-of-day closure, task triage, and tomorrow&apos;s top priorities.</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <span className="font-mono text-amber-400">Step {step}</span> of 4
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
          {errorMsg}
        </div>
      )}

      {/* Step 1: Scorecard */}
      {step === 1 && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-200">Today&apos;s Execution Scorecard</h2>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-bold">
              <Flame className="w-3.5 h-3.5" />
              {disciplineScore}% Discipline Score
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-xl space-y-1">
              <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Tasks Closed
              </span>
              <p className="text-xl font-bold font-mono text-neutral-100">
                {initialTasksCompleted} / {initialTasksTotal}
              </p>
            </div>

            <div className="p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-xl space-y-1">
              <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" /> Deep Work Time
              </span>
              <p className="text-xl font-bold font-mono text-neutral-100">
                {Math.floor(initialFocusMinutes / 60)}h {initialFocusMinutes % 60}m
              </p>
            </div>

            <div className="p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-xl space-y-1">
              <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Habits Checked
              </span>
              <p className="text-xl font-bold font-mono text-neutral-100">
                {habitsCompletedCount} / {habits.length}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-300">Daily Reflection (Optional)</label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What went well today? Any friction or lessons learned?"
              rows={3}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 resize-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-100 text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition-colors"
            >
              Continue to Task Triage
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Incomplete Task Triage */}
      {step === 2 && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-6 backdrop-blur-xl">
          <div>
            <h2 className="text-sm font-semibold text-neutral-200">Triage Incomplete Tasks</h2>
            <p className="text-xs text-neutral-400">
              Clear your mind by deciding the immediate fate of lingering tasks before tomorrow.
            </p>
          </div>

          <div className="space-y-3">
            {initialUnfinishedTasks.map((task) => {
              const currentDecision = triageMap[task.id] || 'carry_forward_tomorrow';
              return (
                <div
                  key={task.id}
                  className="p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-neutral-200">{task.title}</p>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                      Priority: {task.priority || 'Normal'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
                    <button
                      onClick={() => setTriageMap({ ...triageMap, [task.id]: 'carry_forward_tomorrow' })}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        currentDecision === 'carry_forward_tomorrow'
                          ? 'bg-amber-500/20 text-amber-300 font-semibold'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <Calendar className="w-3 h-3" /> Tomorrow
                    </button>
                    <button
                      onClick={() => setTriageMap({ ...triageMap, [task.id]: 'move_to_backlog' })}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        currentDecision === 'move_to_backlog'
                          ? 'bg-neutral-800 text-neutral-200 font-semibold'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <Archive className="w-3 h-3" /> Backlog
                    </button>
                    <button
                      onClick={() => setTriageMap({ ...triageMap, [task.id]: 'discard' })}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        currentDecision === 'discard'
                          ? 'bg-rose-500/20 text-rose-300 font-semibold'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <Trash2 className="w-3 h-3" /> Discard
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-neutral-400 hover:text-neutral-200 text-xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-100 text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition-colors"
            >
              Continue to Habits
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Evening Habits */}
      {step === 3 && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-6 backdrop-blur-xl">
          <div>
            <h2 className="text-sm font-semibold text-neutral-200">Evening Habit Routines</h2>
            <p className="text-xs text-neutral-400">Complete your wind-down habits before shutting down your day.</p>
          </div>

          <div className="space-y-2.5">
            {habits.map((habit) => (
              <label
                key={habit.id}
                onClick={() => handleToggleHabit(habit.id)}
                className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  habit.completed
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-neutral-100'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    habit.completed
                      ? 'bg-emerald-500 border-emerald-500 text-neutral-950'
                      : 'border-neutral-700 bg-neutral-900'
                  }`}
                >
                  {habit.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-xs ${habit.completed ? 'line-through text-neutral-400' : 'text-neutral-200'}`}>
                  {habit.title}
                </span>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-neutral-400 hover:text-neutral-200 text-xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-100 text-neutral-950 text-xs font-semibold hover:bg-neutral-200 transition-colors"
            >
              Lock in Tomorrow&apos;s Priorities
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Tomorrow's Top 3 MITs & Commitment */}
      {step === 4 && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-6 backdrop-blur-xl">
          <div>
            <h2 className="text-sm font-semibold text-neutral-200">Tomorrow&apos;s Top 3 Priorities (MITs)</h2>
            <p className="text-xs text-neutral-400">
              Narrow your focus to the 3 highest-leverage tasks for tomorrow.
            </p>
          </div>

          <div className="space-y-3">
            {tomorrowPriorities.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-neutral-800 border border-neutral-700 text-[11px] font-mono font-bold text-neutral-300 flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={p}
                  onChange={(e) => handlePriorityChange(idx, e.target.value)}
                  placeholder={`Top Priority #${idx + 1}...`}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            ))}
          </div>

          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <Target className="w-4 h-4" />
              Shutdown Commitment
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              By confirming shutdown, you release your mental bandwidth from work until tomorrow morning.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-neutral-400 hover:text-neutral-200 text-xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={handleFinishSunset}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-400 text-neutral-950 font-bold text-xs hover:bg-amber-300 transition-colors shadow-lg shadow-amber-500/10 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Recording Closure...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Complete Daily Shutdown
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
