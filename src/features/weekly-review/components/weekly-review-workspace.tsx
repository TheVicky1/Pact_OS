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
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { addDaysToDateString } from '@/lib/time';

export interface WeeklyReviewWorkspaceProps {
  initialData: WeeklyReviewBootstrapData;
}

const STEP_LABELS = [
  'Look Back',
  'Accountability',
  'Finance & Focus',
  'Clean Up',
  'Plan & Commit',
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
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Weekly Review & Sunday Ritual
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold ${
                isCompleted
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'bg-primary/10 text-primary border border-primary/20'
              }`}
            >
              {isCompleted ? 'Locked Plan' : 'In Progress'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 flex items-center space-x-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{initialData.weekLabel}</span>
            <span>•</span>
            <span>{initialData.userTimezone}</span>
          </p>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'review' ? 'history' : 'review')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center space-x-1.5 ${
              activeTab === 'history'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background/50 border-border/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{activeTab === 'history' ? 'Current Review' : 'Archive'}</span>
          </button>

          {!isCompleted && activeTab === 'review' && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveDraft()}
              className="px-3.5 py-2 rounded-xl text-xs font-medium border border-border/60 bg-background/50 hover:bg-background text-foreground transition-colors flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>
          )}
        </div>
      </div>

      {lastSavedText && activeTab === 'review' && (
        <div className="flex justify-end text-[11px] text-muted-foreground pr-2">
          <span>{lastSavedText}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-xs">
          {errorMessage}
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
          {/* Step Progress Bar */}
          <div className="p-4 rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-semibold text-foreground">
                Step {currentStep} of 5: {STEP_LABELS[currentStep - 1]}
              </span>
              <span className="font-mono">{Math.round((currentStep / 5) * 100)}%</span>
            </div>

            {/* Stepper Dots & Line */}
            <div className="grid grid-cols-5 gap-2">
              {STEP_LABELS.map((label, idx) => {
                const stepNum = (idx + 1) as WeeklyReviewStep;
                const isPast = stepNum < currentStep;
                const isCurrent = stepNum === currentStep;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setCurrentStep(stepNum);
                      handleSaveDraft(stepNum);
                    }}
                    className={`h-2 rounded-full transition-all ${
                      isPast
                        ? 'bg-primary'
                        : isCurrent
                        ? 'bg-primary ring-2 ring-primary/30'
                        : 'bg-muted'
                    }`}
                    title={label}
                  />
                );
              })}
            </div>
          </div>

          {/* Active Step Content */}
          <div className="min-h-[420px]">
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
          <div className="flex items-center justify-between pt-4 border-t border-border/40">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={handlePrevStep}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-border/60 bg-background/50 hover:bg-background text-foreground disabled:opacity-40 transition-colors flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous Step</span>
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                Final step: Review your commitment above and click Commit to lock.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
