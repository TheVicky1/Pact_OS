'use client';

import React, { useEffect, useState, useRef } from 'react';
import { TaskWithParents } from '../data-access';
import { createTaskAction, updateTaskAction } from '../actions';
import { TaskPriority, TaskStatus } from '@/types/domain';
import { localToUtc, utcToDatetimeLocalInput } from '@/lib/time';
import { Modal, ModalFooter, Button } from '@/components/ui';
import {
  Lock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  Target,
  Sparkles,
} from 'lucide-react';

export interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskToEdit?: TaskWithParents | null;
  availableGoals: Array<{ id: string; title: string }>;
  availableProjects: Array<{ id: string; title: string }>;
  timezone?: string;
}

/**
 * Calculates default deadline (Today 22:00 in local timezone)
 * Returns YYYY-MM-DDTHH:mm format
 */
function getSmartDefaultDeadline(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const dateStr = formatter.format(now); // YYYY-MM-DD
    return `${dateStr}T22:00`;
  } catch {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T22:00`;
  }
}

/**
 * Quick deadline preset generator
 */
function getPresetDeadlines(timezone: string) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const now = new Date();

  const getDateInTz = (offsetDays: number) => {
    const target = new Date(now.getTime() + offsetDays * 86400000);
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(target);
    } catch {
      return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
    }
  };

  return [
    { label: 'Today 10 PM', value: `${getDateInTz(0)}T22:00` },
    { label: 'Tomorrow 10 PM', value: `${getDateInTz(1)}T22:00` },
    { label: 'In 2 Days', value: `${getDateInTz(2)}T22:00` },
    { label: 'End of Week', value: `${getDateInTz(7 - now.getDay())}T22:00` },
  ];
}

/**
 * PACT Speed-First Commitment Form Modal
 * Compliant with Section 8.1 of docs/ACCOUNTABILITY_UX_SPEC.md.
 * Allows committing to a task in < 5 seconds: Title -> Deadline -> Enter.
 */
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);

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
      setShowAdvanced(Boolean(taskToEdit.goal_id || taskToEdit.project_id || taskToEdit.description));
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
      setShowAdvanced(false);
      setDeadlineAt(getSmartDefaultDeadline(timezone));
    }
    setErrorMessage(null);
  }

  // Autofocus title input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const presetDeadlines = getPresetDeadlines(timezone);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Commitment title is required.');
      titleInputRef.current?.focus();
      return;
    }

    if (!deadlineAt) {
      setErrorMessage('Deadline is required.');
      return;
    }

    // Convert local wall-clock string to UTC ISO
    const conv = localToUtc(deadlineAt, timezone);
    if (conv.error || !conv.utcIso) {
      setErrorMessage(conv.error || 'Please provide a valid deadline date and time.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        deadline_at: conv.utcIso,
        local_deadline: deadlineAt,
        timezone,
        goal_id: goalId || null,
        project_id: projectId || null,
        accountability_mode: 'default' as const,
        ...(taskToEdit ? { status } : {}),
      };

      const result = taskToEdit
        ? await updateTaskAction(taskToEdit.id, payload)
        : await createTaskAction(payload);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(result.error || 'Failed to seal commitment. Please check inputs.');
      }
    } catch {
      setErrorMessage('An unexpected system error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityOptions: Array<{ value: TaskPriority; label: string }> = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Edit Commitment' : 'Seal New Commitment'}
      description={
        taskToEdit
          ? 'Update commitment parameters and deadline'
          : 'Define a clear, actionable promise to yourself'
      }
      size="lg"
    >
      {errorMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input (Autofocused) */}
        <div>
          <label
            htmlFor="commitment-title"
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5"
          >
            What do you commit to? <span className="text-[#d4af37]">*</span>
          </label>
          <input
            id="commitment-title"
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Finish Chapter 4 & write architecture review"
            maxLength={255}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-white/[0.10] bg-[rgba(18,18,23,0.85)] px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-[#d4af37] focus:outline-none transition-all disabled:opacity-50 font-medium"
          />
        </div>

        {/* Deadline Selection + Presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="commitment-deadline"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-400"
            >
              Deadline <span className="text-[#d4af37]">*</span>
            </label>
            <span className="text-[11px] text-zinc-500 font-mono">
              Timezone: {timezone}
            </span>
          </div>

          <div className="relative">
            <input
              id="commitment-deadline"
              type="datetime-local"
              value={deadlineAt}
              onChange={(e) => setDeadlineAt(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-white/[0.10] bg-[rgba(18,18,23,0.85)] px-4 py-2.5 text-xs sm:text-sm text-zinc-100 focus:border-[#d4af37] focus:outline-none transition-all disabled:opacity-50 font-mono"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {presetDeadlines.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setDeadlineAt(preset.value)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium border transition-all cursor-pointer ${
                  deadlineAt === preset.value
                    ? 'border-[#d4af37] bg-[#d4af37]/15 text-[#d4af37]'
                    : 'border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Selection Pills */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
            Priority Level
          </label>
          <div className="grid grid-cols-4 gap-2">
            {priorityOptions.map((opt) => {
              const isSelected = priority === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={`rounded-xl py-2 px-3 text-xs font-semibold border transition-all cursor-pointer text-center ${
                    isSelected
                      ? opt.value === 'urgent'
                        ? 'border-red-500/60 bg-red-500/20 text-red-300 shadow-sm'
                        : opt.value === 'high'
                        ? 'border-amber-500/60 bg-amber-500/20 text-amber-300 shadow-sm'
                        : opt.value === 'medium'
                        ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#d4af37] shadow-sm'
                        : 'border-zinc-500 bg-zinc-800 text-zinc-200'
                      : 'border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-300'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Picker (Only for existing task edit) */}
        {taskToEdit && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Lifecycle State
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-white/[0.10] bg-[rgba(18,18,23,0.85)] px-4 py-2.5 text-xs text-zinc-100 focus:border-[#d4af37] focus:outline-none transition-all disabled:opacity-50 cursor-pointer"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        )}

        {/* Collapsible Hierarchy & Description */}
        <div className="pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-xs font-medium text-zinc-400 hover:text-zinc-200 py-1 cursor-pointer transition-colors"
          >
            <span>Link Goal, Project & Description (Optional)</span>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4 text-zinc-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            )}
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Goal Picker */}
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#d4af37]" />
                    Parent Goal
                  </label>
                  <select
                    value={goalId}
                    onChange={(e) => setGoalId(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-white/[0.08] bg-[rgba(18,18,23,0.85)] px-3 py-2 text-xs text-zinc-200 focus:border-[#d4af37] focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="">No Goal (Independent)</option>
                    {availableGoals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project Picker */}
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                    <FolderKanban className="w-3.5 h-3.5 text-[#d4af37]" />
                    Parent Project
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-white/[0.08] bg-[rgba(18,18,23,0.85)] px-3 py-2 text-xs text-zinc-200 focus:border-[#d4af37] focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="">No Project (Independent)</option>
                    {availableProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Description / Acceptance Criteria
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key notes, scope boundary, or definition of done..."
                  rows={2}
                  maxLength={2000}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-white/[0.08] bg-[rgba(18,18,23,0.85)] px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-[#d4af37] focus:outline-none transition-all resize-y"
                />
              </div>
            </div>
          )}
        </div>

        {/* Accountability Seal Reassurance */}
        <div className="rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/[0.04] p-3 flex items-start gap-2.5">
          <div className="w-5 h-5 rounded-lg bg-[#d4af37]/15 flex items-center justify-center text-[#d4af37] shrink-0 mt-0.5">
            <Lock className="w-3 h-3" />
          </div>
          <div className="text-[11px] text-zinc-400 leading-snug">
            <span className="font-semibold text-zinc-200">
              Default Accountability Binding
            </span>
            <p className="mt-0.5 text-zinc-500">
              Seals your default consequence to this commitment. The consequence remains sealed and confidential until deadline resolution.
            </p>
          </div>
        </div>

        {/* Actions Footer */}
        <ModalFooter className="mt-4 pt-4 pb-6 sm:pb-4">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            size="md"
            type="submit"
            loading={isSubmitting}
            icon={<Sparkles className="w-4 h-4 text-zinc-950" />}
          >
            {taskToEdit ? 'Update Commitment' : 'Seal Pact ↵'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
