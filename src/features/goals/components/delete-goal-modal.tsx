'use client';

import { useState, useTransition, useEffect } from 'react';
import { Goal } from '@/types/domain';
import { deleteGoalAction } from '@/features/goals/actions';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface DeleteGoalModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteGoalModal({ goal, isOpen, onClose }: DeleteGoalModalProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset error when target goal changes during render
  const [prevGoalId, setPrevGoalId] = useState<string | undefined>(goal?.id);
  if (goal?.id !== prevGoalId) {
    setPrevGoalId(goal?.id);
    setErrorMsg(null);
  }

  // Handle ESC key press for closing modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !goal) return null;

  const handleDelete = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await deleteGoalAction(goal.id);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to delete goal.');
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div
        className="glass-card max-w-md w-full rounded-2xl border border-rose-900/60 p-6 space-y-5 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="delete-dialog-title" className="text-base font-semibold text-zinc-100">
                Delete Goal
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">This action cannot be undone.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close confirmation dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Body */}
        <div className="space-y-2.5 text-xs text-zinc-300">
          <p>
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold text-zinc-100">&quot;{goal.title}&quot;</span>?
          </p>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            Associated projects and tasks will remain intact; their parent goal linkage will be cleared automatically.
          </p>
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium px-4 py-2 rounded-xl text-xs transition-colors shadow-md cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Confirm Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
