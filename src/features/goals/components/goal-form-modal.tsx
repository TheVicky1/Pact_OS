'use client';

import { useState, useEffect, useTransition } from 'react';
import { Goal, GoalStatus } from '@/types/domain';
import { createGoalAction, updateGoalAction } from '@/features/goals/actions';
import { X, Target, Loader2, AlertCircle } from 'lucide-react';

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: Goal | null;
}

export function GoalFormModal({ isOpen, onClose, goalToEdit }: GoalFormModalProps) {
  // Use key-based state reset pattern or derived initial state
  const isEditing = Boolean(goalToEdit);

  const getInitialTargetDate = () => {
    if (goalToEdit?.target_date) {
      const dateObj = new Date(goalToEdit.target_date);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return '';
  };

  const [title, setTitle] = useState(goalToEdit?.title || '');
  const [description, setDescription] = useState(goalToEdit?.description || '');
  const [targetDate, setTargetDate] = useState(getInitialTargetDate);
  const [status, setStatus] = useState<GoalStatus>(goalToEdit?.status || 'active');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Reset form when goalToEdit changes
  const [prevGoalId, setPrevGoalId] = useState<string | undefined>(goalToEdit?.id);
  if (goalToEdit?.id !== prevGoalId) {
    setPrevGoalId(goalToEdit?.id);
    setTitle(goalToEdit?.title || '');
    setDescription(goalToEdit?.description || '');
    setStatus(goalToEdit?.status || 'active');
    setTargetDate(getInitialTargetDate());
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMsg('Goal title is required.');
      return;
    }

    if (trimmedTitle.length > 255) {
      setErrorMsg('Goal title must not exceed 255 characters.');
      return;
    }

    if (description.length > 2000) {
      setErrorMsg('Description must not exceed 2000 characters.');
      return;
    }

    let isoTargetDate: string | null = null;
    if (targetDate) {
      const parsed = new Date(targetDate);
      if (isNaN(parsed.getTime())) {
        setErrorMsg('Invalid target date format.');
        return;
      }
      isoTargetDate = parsed.toISOString();
    }

    startTransition(async () => {
      if (isEditing && goalToEdit) {
        const res = await updateGoalAction(goalToEdit.id, {
          title: trimmedTitle,
          description: description.trim() || null,
          target_date: isoTargetDate,
          status,
        });

        if (res.success) {
          onClose();
        } else {
          setErrorMsg(res.error || 'Failed to update goal.');
        }
      } else {
        const res = await createGoalAction({
          title: trimmedTitle,
          description: description.trim() || null,
          target_date: isoTargetDate,
        });

        if (res.success) {
          onClose();
        } else {
          setErrorMsg(res.error || 'Failed to create goal.');
        }
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="glass-card max-w-lg w-full rounded-2xl border border-zinc-800 p-6 sm:p-7 space-y-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-semibold text-zinc-100">
                {isEditing ? 'Edit Goal' : 'Create New Goal'}
              </h2>
              <p className="text-xs text-zinc-400">
                {isEditing
                  ? 'Update your long-term commitment details.'
                  : 'Establish a clear, meaningful long-term objective.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="goal-title" className="block text-xs font-medium text-zinc-300 mb-1.5">
              Goal Title <span className="text-[#d4af37]">*</span>
            </label>
            <input
              id="goal-title"
              type="text"
              required
              maxLength={255}
              disabled={isPending}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Launch SaaS Product or Master System Architecture"
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-[#d4af37] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="goal-description" className="block text-xs font-medium text-zinc-300 mb-1.5">
              Description / Notes
            </label>
            <textarea
              id="goal-description"
              rows={3}
              maxLength={2000}
              disabled={isPending}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Define why this goal matters and what success looks like..."
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-[#d4af37] focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="goal-target-date" className="block text-xs font-medium text-zinc-300 mb-1.5">
                Target Date
              </label>
              <input
                id="goal-target-date"
                type="date"
                disabled={isPending}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:border-[#d4af37] focus:outline-none transition-colors"
              />
            </div>

            {isEditing && (
              <div>
                <label htmlFor="goal-status" className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Status
                </label>
                <select
                  id="goal-status"
                  disabled={isPending}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as GoalStatus)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:border-[#d4af37] focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-transparent transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 bg-[#d4af37] hover:bg-[#e5c158] text-zinc-950 font-semibold px-5 py-2 rounded-xl text-xs transition-colors shadow-md cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? 'Update Goal' : 'Create Goal'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
