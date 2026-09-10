'use client';

import React, { useState } from 'react';
import { WeeklyReview } from '@/lib/weekly-review/types';
import {
  Lock,
  Target,
  RotateCcw,
} from 'lucide-react';

export interface CompletedReviewViewProps {
  review: WeeklyReview;
  onReopenReview: (reason: string) => Promise<void>;
}

export function CompletedReviewView({
  review,
  onReopenReview,
}: CompletedReviewViewProps) {
  const [isReopening, setIsReopening] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  const metrics = review.snapshot_metrics;
  const plan = review.next_week_plan;
  const reflection = review.reflection;

  const handleConfirmReopen = async () => {
    if (!reopenReason.trim() || reopenReason.length < 5) return;
    setIsReopening(true);
    try {
      await onReopenReview(reopenReason.trim());
      setShowReopenModal(false);
    } finally {
      setIsReopening(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Commitment Banner */}
      <div className="p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-background to-card/60 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-foreground">
                WEEKLY REVIEW COMMITTED & LOCKED
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-mono font-medium">
                Certified
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review cycle locked on {review.committed_at ? new Date(review.committed_at).toLocaleString() : 'N/A'}. Historical snapshot frozen.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowReopenModal(true)}
          className="text-xs px-3.5 py-2 rounded-lg border border-border/60 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reopen Review</span>
        </button>
      </div>

      {/* Committed Plan Summary */}
      <div className="p-5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-md space-y-4">
        <span className="text-xs font-semibold text-primary uppercase tracking-wider block flex items-center space-x-1.5">
          <Target className="w-4 h-4 text-primary" />
          <span>Committed Priorities for the Coming Week</span>
        </span>

        <div className="space-y-2">
          {(plan?.topPriorities || []).map((priority, idx) => (
            <div
              key={priority.id}
              className="flex items-center space-x-3 p-3 rounded-lg border border-border/40 bg-background/40 text-sm font-medium text-foreground"
            >
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-mono text-xs flex items-center justify-center font-bold">
                {idx + 1}
              </span>
              <span>{priority.text}</span>
            </div>
          ))}
          {(!plan?.topPriorities || plan.topPriorities.length === 0) && (
            <p className="text-xs text-muted-foreground italic">No top priorities recorded.</p>
          )}
        </div>
      </div>

      {/* Frozen Metrics Summary */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-border/50 bg-card/40">
            <span className="text-xs text-muted-foreground block">Tasks Completed</span>
            <span className="text-xl font-bold text-foreground mt-1">
              {metrics.tasks.completedCount} / {metrics.tasks.completedCount + metrics.tasks.pendingCount + metrics.tasks.missedCount}
            </span>
            <span className="text-[10px] text-primary font-mono mt-0.5 block">
              {metrics.tasks.completionRate}% Rate
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border/50 bg-card/40">
            <span className="text-xs text-muted-foreground block">Pacts Fulfilled</span>
            <span className="text-xl font-bold text-emerald-500 mt-1">
              {metrics.accountability.totalFulfilled} / {metrics.accountability.totalActivated}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">
              {metrics.accountability.totalWaived} Waived
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border/50 bg-card/40">
            <span className="text-xs text-muted-foreground block">Deep Work Focus</span>
            <span className="text-xl font-bold text-sky-400 mt-1">
              {metrics.focus.formattedDuration}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">
              {metrics.focus.completedSessions} Sessions
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border/50 bg-card/40">
            <span className="text-xs text-muted-foreground block">Net Cash Flow</span>
            <span className="text-xl font-bold text-foreground mt-1">
              {metrics.finance.formattedNet}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">
              {metrics.finance.formattedExpense} Outflow
            </span>
          </div>
        </div>
      )}

      {/* Structured Reflections */}
      {reflection && (
        <div className="p-5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-md space-y-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Weekly Operating Reflections
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {reflection.biggestWin && (
              <div className="p-3 rounded-lg bg-background/50 border border-border/30 space-y-1">
                <span className="font-semibold text-emerald-500 block">Biggest Win</span>
                <p className="text-muted-foreground">{reflection.biggestWin}</p>
              </div>
            )}
            {reflection.biggestChallenge && (
              <div className="p-3 rounded-lg bg-background/50 border border-border/30 space-y-1">
                <span className="font-semibold text-destructive block">Biggest Challenge</span>
                <p className="text-muted-foreground">{reflection.biggestChallenge}</p>
              </div>
            )}
            {reflection.lessonLearned && (
              <div className="p-3 rounded-lg bg-background/50 border border-border/30 space-y-1">
                <span className="font-semibold text-primary block">Lesson Learned</span>
                <p className="text-muted-foreground">{reflection.lessonLearned}</p>
              </div>
            )}
            {reflection.whatToStart && (
              <div className="p-3 rounded-lg bg-background/50 border border-border/30 space-y-1">
                <span className="font-semibold text-amber-500 block">What to Start</span>
                <p className="text-muted-foreground">{reflection.whatToStart}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-foreground">Reopen Weekly Review</h3>
            <p className="text-xs text-muted-foreground">
              Provide an explicit reason for unlocking this completed review ritual.
            </p>
            <textarea
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="e.g. Need to adjust committed top priorities due to unforeseen schedule changes."
              rows={3}
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReopenModal(false)}
                className="text-xs px-3.5 py-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isReopening || reopenReason.trim().length < 5}
                onClick={handleConfirmReopen}
                className="text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isReopening ? 'Reopening...' : 'Confirm Reopen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
