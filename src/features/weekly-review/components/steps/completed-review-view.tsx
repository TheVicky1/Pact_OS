'use client';

import React, { useState } from 'react';
import { WeeklyReview } from '@/lib/weekly-review/types';
import {
  Lock,
  Target,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
      <div className="glass-card rounded-3xl p-6 sm:p-8 border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-[#121217] to-black/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-bold text-lg text-zinc-100 tracking-tight">
                WEEKLY REVIEW COMMITTED & CERTIFIED
              </span>
              <Badge variant="success" size="sm">
                Certified
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Review cycle locked on {review.committed_at ? new Date(review.committed_at).toLocaleString() : 'N/A'}. Historical metrics snapshot frozen.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setShowReopenModal(true)}
          className="self-start sm:self-auto text-xs shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          <span>Reopen Review</span>
        </Button>
      </div>

      {/* Committed Plan Summary */}
      <div className="glass-card rounded-2xl p-6 border-white/[0.08] bg-zinc-900/60 space-y-4">
        <span className="text-xs font-semibold text-[#d4af37] uppercase tracking-wider block flex items-center gap-2">
          <Target className="w-4 h-4 text-[#d4af37]" />
          <span>Committed Strategic Priorities for the Coming Week</span>
        </span>

        <div className="space-y-2.5">
          {(plan?.topPriorities || []).map((priority, idx) => (
            <div
              key={priority.id}
              className="flex items-center gap-3.5 p-3.5 rounded-xl border border-white/[0.06] bg-zinc-950/60 text-sm font-medium text-zinc-100"
            >
              <span className="w-6 h-6 rounded-lg bg-[#d4af37]/15 text-[#e2c056] border border-[#d4af37]/30 font-mono text-xs flex items-center justify-center font-bold shrink-0">
                {idx + 1}
              </span>
              <span>{priority.text}</span>
            </div>
          ))}
          {(!plan?.topPriorities || plan.topPriorities.length === 0) && (
            <p className="text-xs text-zinc-500 italic py-2">No top priorities recorded.</p>
          )}
        </div>
      </div>

      {/* Frozen Metrics Summary */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="glass-card rounded-2xl p-4 border-white/[0.08] bg-zinc-900/60">
            <span className="text-xs text-zinc-400 block">Tasks Execution</span>
            <span className="text-2xl font-bold font-mono text-zinc-100 mt-1 block">
              {metrics.tasks.completedCount} / {metrics.tasks.completedCount + metrics.tasks.pendingCount + metrics.tasks.missedCount}
            </span>
            <span className="text-[11px] text-[#e2c056] font-mono mt-1 block">
              {metrics.tasks.completionRate}% Completion
            </span>
          </div>

          <div className="glass-card rounded-2xl p-4 border-white/[0.08] bg-zinc-900/60">
            <span className="text-xs text-zinc-400 block">Pacts Fulfilled</span>
            <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
              {metrics.accountability.totalFulfilled} / {metrics.accountability.totalActivated}
            </span>
            <span className="text-[11px] text-zinc-400 font-mono mt-1 block">
              {metrics.accountability.totalWaived} Waived
            </span>
          </div>

          <div className="glass-card rounded-2xl p-4 border-white/[0.08] bg-zinc-900/60">
            <span className="text-xs text-zinc-400 block">Deep Work Focus</span>
            <span className="text-2xl font-bold font-mono text-sky-400 mt-1 block">
              {metrics.focus.formattedDuration}
            </span>
            <span className="text-[11px] text-zinc-400 font-mono mt-1 block">
              {metrics.focus.completedSessions} Sessions
            </span>
          </div>

          <div className="glass-card rounded-2xl p-4 border-white/[0.08] bg-zinc-900/60">
            <span className="text-xs text-zinc-400 block">Net Cash Flow</span>
            <span className="text-2xl font-bold font-mono text-zinc-100 mt-1 block">
              {metrics.finance.formattedNet}
            </span>
            <span className="text-[11px] text-zinc-400 font-mono mt-1 block">
              {metrics.finance.formattedExpense} Outflow
            </span>
          </div>
        </div>
      )}

      {/* Structured Reflections */}
      {reflection && (
        <div className="glass-card rounded-2xl p-6 border-white/[0.08] bg-zinc-900/60 space-y-4">
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
            Weekly Operating Reflections
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {reflection.biggestWin && (
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/[0.06] space-y-1">
                <span className="font-semibold text-emerald-400 text-xs block">Biggest Win</span>
                <p className="text-zinc-300 leading-relaxed">{reflection.biggestWin}</p>
              </div>
            )}
            {reflection.biggestChallenge && (
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/[0.06] space-y-1">
                <span className="font-semibold text-rose-400 text-xs block">Biggest Challenge</span>
                <p className="text-zinc-300 leading-relaxed">{reflection.biggestChallenge}</p>
              </div>
            )}
            {reflection.lessonLearned && (
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/[0.06] space-y-1">
                <span className="font-semibold text-[#e2c056] text-xs block">Lesson Learned</span>
                <p className="text-zinc-300 leading-relaxed">{reflection.lessonLearned}</p>
              </div>
            )}
            {reflection.whatToStart && (
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/[0.06] space-y-1">
                <span className="font-semibold text-amber-400 text-xs block">What to Start</span>
                <p className="text-zinc-300 leading-relaxed">{reflection.whatToStart}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.12] bg-[#121217] p-6 sm:p-8 shadow-2xl space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-zinc-100">Reopen Weekly Review</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Provide an explicit reason for unlocking this certified review ritual.
              </p>
            </div>
            <textarea
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="e.g. Need to adjust committed top priorities due to unforeseen schedule changes."
              rows={3}
              className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/80 p-3.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 resize-none"
            />
            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowReopenModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isReopening || reopenReason.trim().length < 5}
                onClick={handleConfirmReopen}
              >
                {isReopening ? 'Reopening...' : 'Confirm Reopen'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
