'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  WeeklyReview,
  WeeklyReviewBootstrapData,
  WeeklyReviewStep,
  WeeklyReflection,
  WeeklyCleanupDecisions,
  NextWeekPlan,
} from '@/lib/weekly-review/types';
import { LookBackStep } from './steps/look-back-step';
import { AccountabilityStep } from './steps/accountability-step';
import { FinanceFocusStep } from './steps/finance-focus-step';
import { CleanupStep } from './steps/cleanup-step';
import { PlanningStep } from './steps/planning-step';
import { CompletedReviewView } from './steps/completed-review-view';
import { ReviewHistoryDrawer } from './review-history-drawer';
import {
  startWeeklyReviewAction,
  saveReviewDraftAction,
  commitWeeklyReviewAction,
  carryForwardTasksAction,
  reopenWeeklyReviewAction,
} from '../actions';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Calendar,
  History,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Wallet,
  Target,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { addDaysToDateString } from '@/lib/time';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface WeeklyReviewWorkspaceProps {
  initialData: WeeklyReviewBootstrapData;
}

interface StepMeta {
  step: WeeklyReviewStep;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}

const STEPS: StepMeta[] = [
  { step: 1, label: 'Look Back', shortLabel: 'Facts', icon: Clock },
  { step: 2, label: 'Accountability', shortLabel: 'Integrity', icon: ShieldCheck },
  { step: 3, label: 'Finance & Focus', shortLabel: 'Discipline', icon: Wallet },
  { step: 4, label: 'Clean Up', shortLabel: 'Triage', icon: CheckCircle2 },
  { step: 5, label: 'Plan & Commit', shortLabel: 'Commit', icon: Target },
];

export function WeeklyReviewWorkspace({ initialData }: WeeklyReviewWorkspaceProps) {
  const router = useRouter();
  const [review, setReview] = useState<WeeklyReview | null>(initialData.currentReview);
  const [currentStep, setCurrentStep] = useState<WeeklyReviewStep>(
    (initialData.currentReview?.current_step as WeeklyReviewStep) || 1
  );
  const [activeTab, setActiveTab] = useState<'review' | 'history'>('review');

  // Working state for reflections
  const [reflection, setReflection] = useState<WeeklyReflection>({
    biggestWin: initialData.currentReview?.reflection?.biggestWin || '',
    biggestChallenge: initialData.currentReview?.reflection?.biggestChallenge || '',
    whatWorked: initialData.currentReview?.reflection?.whatWorked || '',
    whatDidNotWork: initialData.currentReview?.reflection?.whatDidNotWork || '',
    lessonLearned: initialData.currentReview?.reflection?.lessonLearned || '',
    whatToStop: initialData.currentReview?.reflection?.whatToStop || '',
    whatToContinue: initialData.currentReview?.reflection?.whatToContinue || '',
    whatToStart: initialData.currentReview?.reflection?.whatToStart || '',
  });

  // Working state for cleanup decisions
  const [cleanupDecisions, setCleanupDecisions] = useState<WeeklyCleanupDecisions>({
    rescheduledTasks: initialData.currentReview?.cleanup_decisions?.rescheduledTasks || [],
    carriedForwardTasks: initialData.currentReview?.cleanup_decisions?.carriedForwardTasks || [],
    archivedTasks: initialData.currentReview?.cleanup_decisions?.archivedTasks || [],
    pausedHabits: initialData.currentReview?.cleanup_decisions?.pausedHabits || [],
  });

  // Working state for next week plan
  const [nextWeekPlan, setNextWeekPlan] = useState<NextWeekPlan>({
    topPriorities: initialData.currentReview?.next_week_plan?.topPriorities || [],
    committedTaskIds: initialData.currentReview?.next_week_plan?.committedTaskIds || [],
    focusGoalIds: initialData.currentReview?.next_week_plan?.focusGoalIds || [],
    focusProjectIds: initialData.currentReview?.next_week_plan?.focusProjectIds || [],
    targetHabitIds: initialData.currentReview?.next_week_plan?.targetHabitIds || [],
    focusTargetMinutes: initialData.currentReview?.next_week_plan?.focusTargetMinutes || 0,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [lastSavedText, setLastSavedText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize review row if none exists
  useEffect(() => {
    if (!review) {
      startWeeklyReviewAction({ weekStart: initialData.weekStart }).then((res) => {
        if (res.success && res.data) {
          setReview(res.data);
        }
      });
    }
  }, [review, initialData.weekStart]);

  const updateReflectionField = (field: keyof WeeklyReflection, value: string) => {
    setReflection((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = useCallback(
    async (stepToSave?: WeeklyReviewStep) => {
      if (!review) return;
      setIsSaving(true);
      setErrorMessage(null);

      try {
        const step = stepToSave || currentStep;
        const res = await saveReviewDraftAction({
          reviewId: review.id,
          currentStep: step,
          reflection,
          cleanupDecisions,
          nextWeekPlan,
        });

        if (res.success && res.data) {
          setReview(res.data);
          setLastSavedText(`Saved ${new Date().toLocaleTimeString()}`);
        } else {
          setErrorMessage(res.error || 'Failed to save review draft.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Draft save failed.';
        setErrorMessage(msg);
      } finally {
        setIsSaving(false);
      }
    },
    [review, currentStep, reflection, cleanupDecisions, nextWeekPlan]
  );

  const handleNextStep = async () => {
    if (currentStep < 5) {
      const nextStep = (currentStep + 1) as WeeklyReviewStep;
      setCurrentStep(nextStep);
      await handleSaveDraft(nextStep);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WeeklyReviewStep);
    }
  };

  const handleCarryForwardBatch = async (
    tasks: Array<{ taskId: string; newDeadline: string }>
  ) => {
    const res = await carryForwardTasksAction({ tasks });
    if (res.success) {
      router.refresh();
      await handleSaveDraft();
    }
  };

  const handleCommitReview = async () => {
    if (!review) return;
    setIsCommitting(true);
    setErrorMessage(null);

    try {
      const res = await commitWeeklyReviewAction({
        reviewId: review.id,
        reflection,
        cleanupDecisions,
        nextWeekPlan,
        metricsSnapshot: initialData.liveMetrics,
      });

      if (res.success && res.data) {
        setReview(res.data);
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to commit weekly review.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Review commit failed.';
      setErrorMessage(msg);
    } finally {
      setIsCommitting(false);
    }
  };

  const handleReopenReview = async (reason: string) => {
    if (!review) return;
    const res = await reopenWeeklyReviewAction({
      reviewId: review.id,
      reason,
    });
    if (res.success && res.data) {
      setReview(res.data);
      setCurrentStep(1);
      router.refresh();
    }
  };

  const isCompleted = review?.status === 'completed';
  const nextWeekStart = addDaysToDateString(initialData.weekStart, 7);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Header Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
              Ritual Architecture
            </span>
            <span className="h-1 w-1 rounded-full bg-zinc-500" />
            <span className="text-xs text-zinc-400">Cadence Command</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
              Weekly Review & Sunday Ritual
            </h1>
            <Badge
              variant={isCompleted ? 'success' : 'warning'}
              size="sm"
            >
              {isCompleted ? 'Certified Plan' : 'Draft in Progress'}
            </Badge>
          </div>

          <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
              {initialData.weekLabel}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400 font-mono text-xs">{initialData.userTimezone}</span>
          </p>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0 self-start md:self-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'review' ? 'history' : 'review')}
              className={`h-9 px-3.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none ${
                activeTab === 'history'
                  ? 'bg-[#121217] text-[#e2c056] border-[#d4af37]/40 shadow-sm'
                  : 'bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-300 hover:text-zinc-100 border-white/[0.08]'
              }`}
            >
              <History className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>{activeTab === 'history' ? 'Current Ritual' : 'Archive'}</span>
            </button>

            {!isCompleted && activeTab === 'review' && (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveDraft()}
                className="h-9 px-3.5 rounded-xl text-xs font-medium border border-white/[0.08] bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-200 hover:text-zinc-100 transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
              </button>
            )}
          </div>

          {lastSavedText && activeTab === 'review' && (
            <span className="text-[11px] font-mono text-zinc-500 self-end sm:self-center">
              {lastSavedText}
            </span>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <span className="font-semibold">Error:</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'history' ? (
        <ReviewHistoryDrawer
          reviews={initialData.historyReviews}
          currentWeekStart={initialData.weekStart}
        />
      ) : isCompleted ? (
        <CompletedReviewView
          review={review!}
          onReopenReview={handleReopenReview}
        />
      ) : (
        <div className="space-y-6">
          {/* Step Stepper Pill Bar */}
          <div className="glass-card rounded-2xl p-3 sm:p-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-3 px-1">
              <span className="font-semibold text-zinc-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#d4af37]" />
                Step {currentStep} of 5: {STEPS[currentStep - 1].label}
              </span>
              <span className="font-mono text-zinc-400">
                {Math.round((currentStep / 5) * 100)}% Complete
              </span>
            </div>

            {/* Stepper Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {STEPS.map((stepMeta) => {
                const stepNum = stepMeta.step;
                const isPast = stepNum < currentStep;
                const isCurrent = stepNum === currentStep;
                const Icon = stepMeta.icon;

                return (
                  <button
                    key={stepMeta.label}
                    type="button"
                    onClick={() => {
                      setCurrentStep(stepNum);
                      handleSaveDraft(stepNum);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer focus-visible:outline-none ${
                      isCurrent
                        ? 'bg-[#181822] text-zinc-100 border-[#d4af37]/50 shadow-md shadow-black/40 font-semibold ring-1 ring-[#d4af37]/20'
                        : isPast
                        ? 'bg-zinc-900/50 text-zinc-300 border-white/[0.06] hover:border-white/[0.12]'
                        : 'bg-zinc-900/30 text-zinc-500 border-transparent hover:border-white/[0.04]'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-mono font-bold transition-colors ${
                        isCurrent
                          ? 'bg-[#d4af37]/20 text-[#e2c056] border border-[#d4af37]/40'
                          : isPast
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : stepNum}
                    </div>
                    <div className="min-w-0 flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-[#d4af37]' : 'text-zinc-500'}`} />
                      <span className="text-xs truncate block">{stepMeta.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Step Content */}
          <div className="min-h-[440px]">
            {currentStep === 1 && (
              <LookBackStep
                metrics={initialData.liveMetrics}
                weekLabel={initialData.weekLabel}
              />
            )}
            {currentStep === 2 && (
              <AccountabilityStep
                accountability={initialData.liveMetrics.accountability}
                reflection={reflection}
                onUpdateReflection={updateReflectionField}
              />
            )}
            {currentStep === 3 && (
              <FinanceFocusStep
                finance={initialData.liveMetrics.finance}
                focus={initialData.liveMetrics.focus}
                reflection={reflection}
                onUpdateReflection={updateReflectionField}
              />
            )}
            {currentStep === 4 && (
              <CleanupStep
                unfinishedTasks={initialData.unfinishedTasks}
                cleanupDecisions={cleanupDecisions}
                nextWeekStart={nextWeekStart}
                reflection={reflection}
                onUpdateCleanupDecisions={setCleanupDecisions}
                onUpdateReflection={updateReflectionField}
                onCarryForwardBatch={handleCarryForwardBatch}
              />
            )}
            {currentStep === 5 && (
              <PlanningStep
                nextWeekPlan={nextWeekPlan}
                activeGoals={initialData.activeGoals}
                activeProjects={initialData.activeProjects}
                activeHabits={initialData.activeHabits}
                reflection={reflection}
                isCommitting={isCommitting}
                onUpdatePlan={setNextWeekPlan}
                onUpdateReflection={updateReflectionField}
                onCommitReview={handleCommitReview}
              />
            )}
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-white/[0.06]">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={handlePrevStep}
              className="h-10 px-4 rounded-xl text-xs font-medium border border-white/[0.08] bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 disabled:opacity-30 disabled:hover:bg-zinc-900/60 transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>

            {currentStep < 5 ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleNextStep}
                className="shadow-lg shadow-[#d4af37]/15"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <span className="text-xs text-zinc-400 italic">
                Final step: Finalize priorities above and click Commit & Lock.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
