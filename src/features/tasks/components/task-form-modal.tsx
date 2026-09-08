'use client';

import { TaskWithParents } from '../data-access';
import { createTaskAction, updateTaskAction } from '../actions';
import { TaskPriority, TaskStatus } from '@/types/domain';
import { localToUtc, utcToDatetimeLocalInput, getDefaultLocalDeadline } from '@/lib/time';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskToEdit?: TaskWithParents | null;
  availableGoals: Array<{ id: string; title: string }>;
  availableProjects: Array<{ id: string; title: string }>;
  timezone?: string;
}

export function TaskFormModal({
  isOpen,
  onClose,
  onSuccess,
  taskToEdit,
  availableGoals,
  availableProjects,
  timezone = 'UTC',
}: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [goalId, setGoalId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [deadlineAt, setDeadlineAt] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when editing or opening
  const [prevTaskToEditId, setPrevTaskToEditId] = useState<string | undefined>(undefined);
  if (isOpen && taskToEdit?.id !== prevTaskToEditId) {
    setPrevTaskToEditId(taskToEdit?.id);
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setGoalId(taskToEdit.goal_id || '');
      setProjectId(taskToEdit.project_id || '');
      // Format stored UTC deadline into user's local wall-clock time for datetime-local input
      try {
        setDeadlineAt(utcToDatetimeLocalInput(taskToEdit.deadline_at, timezone));
      } catch {
        setDeadlineAt('');
      }
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('pending');
      setGoalId('');
      setProjectId('');
      // Default deadline: tomorrow at 23:59 in user's configured IANA timezone
      try {
        setDeadlineAt(getDefaultLocalDeadline(timezone));
      } catch {
        setDeadlineAt('');
      }
    }
    setErrorMessage(null);
  }

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Task title is required.');
      return;
    }

    if (!deadlineAt) {
      setErrorMessage('Deadline is required.');
      return;
    }

    // Convert local wall-clock datetime-local string to UTC ISO string using user's configured timezone
    const conv = localToUtc(deadlineAt, timezone);
    if (conv.error || !conv.utcIso) {
      setErrorMessage(conv.error || 'Please provide a valid deadline date and time.');
      return;
    }
    const isoDeadline = conv.utcIso;

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        deadline_at: isoDeadline,
        local_deadline: deadlineAt,
        timezone,
        goal_id: goalId || null,
        project_id: projectId || null,
        ...(taskToEdit ? { status } : {}),
      };

      const result = taskToEdit
        ? await updateTaskAction(taskToEdit.id, payload)
        : await createTaskAction(payload);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(result.error || 'Operation failed. Please check input values.');
      }
    } catch {
      setErrorMessage('An unexpected system error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            {taskToEdit ? 'Edit Task Commitment' : 'New Task Commitment'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Task Title <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Complete LeetCode 75 Array Section"
              maxLength={255}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/60 transition-all disabled:opacity-50"
            />
          </div>

          {/* Priority & Deadline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-2.5 text-sm text-zinc-100 focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/60 transition-all disabled:opacity-50"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority</option>
              </select>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Deadline <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={deadlineAt}
                  onChange={(e) => setDeadlineAt(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-2.5 text-sm text-zinc-100 focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/60 transition-all disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Goal & Project Selectors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Goal Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Parent Goal (Optional)
              </label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-2.5 text-sm text-zinc-100 focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/60 transition-all disabled:opacity-50"
              >
                <option value="">No Goal (Independent Task)</option>
                {availableGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Parent Project (Optional)
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-2.5 text-sm text-zinc-100 focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/60 transition-all disabled:opacity-50"
              >
                <option value="">No Project (Independent Task)</option>
                {availableProjects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status (Edit Only) */}
          {taskToEdit && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-2.5 text-sm text-zinc-100 focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/60 transition-all disabled:opacity-50"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}

          {/* Description Textarea */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key notes or acceptance criteria for this commitment..."
              rows={3}
              maxLength={2000}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/60 transition-all disabled:opacity-50"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-zinc-800 px-4 py-2.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-semibold text-zinc-950 hover:from-amber-400 hover:to-amber-500 shadow-md shadow-amber-500/10 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{taskToEdit ? 'Update Task' : 'Create Task'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
