'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TaskWithParents } from '../data-access';
import {
  deleteTaskAction,
  updateTaskAction,
  completeTaskAction,
  bulkCompleteTasksAction,
  bulkUpdateTaskStatusAction,
  bulkDeleteTasksAction,
  bulkRescheduleTasksAction,
} from '../actions';
import { TaskCard } from './task-card';
import { TaskFormModal } from './task-form-modal';
import { DeleteTaskModal } from './delete-task-modal';
import { TaskPriority, TaskStatus } from '@/types/domain';
import { Button, GlassCard, Alert, BulkActionToolbar } from '@/components/ui';
import {
  Plus,
  Search,
  CheckSquare,
  Filter,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Target,
  ShieldAlert,
  ArrowRight,
  Archive,
  Trash2,
  Calendar,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { useUrlState } from '@/hooks/use-url-state';
import { useSelection } from '@/hooks/use-selection';
import {
  type TasksUrlState,
  DEFAULT_TASKS_URL_STATE,
  parseTasksUrlState,
  serializeTasksUrlState,
} from '@/lib/url-state';

export interface TasksViewProps {
  initialTasks: TaskWithParents[];
  availableGoals: Array<{ id: string; title: string }>;
  availableProjects: Array<{ id: string; title: string }>;
  timezone?: string;
}

/**
 * PACT Tasks & Commitments View
 * Phase 6E implementation with deep-link URL state synchronization,
 * multi-select batch operations, and authoritative bulk server actions.
 */
export function TasksView({
  initialTasks,
  availableGoals,
  availableProjects,
  timezone = 'UTC',
}: TasksViewProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithParents[]>(initialTasks);

  // URL State Synchronization
  const [urlState, setUrlState] = useUrlState<TasksUrlState>({
    parse: parseTasksUrlState,
    serialize: serializeTasksUrlState,
    defaultValue: DEFAULT_TASKS_URL_STATE,
    debounceMs: 250,
  });

  const activeTab = urlState.tab;
  const priorityFilter = urlState.priority;
  const searchQuery = urlState.q;

  // Multi-Selection State
  const {
    selectedList,
    count: selectedCount,
    isSelected,
    toggle: toggleSelect,
    toggleAll,
    clear: clearSelection,
    isAllSelected,
    isIndeterminate,
  } = useSelection();

  // Bulk operation processing state
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProcessingLabel, setBulkProcessingLabel] = useState('');
  const [bulkFeedback, setBulkFeedback] = useState<{
    type: 'success' | 'warning' | 'danger';
    message: string;
  } | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskWithParents | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskWithParents | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Delete Confirmation Modal
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Bulk Reschedule Modal
  const [isBulkRescheduleModalOpen, setIsBulkRescheduleModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');

  const [actionError, setActionError] = useState<string | null>(null);

  // Sync state if initialTasks changes from server revalidation
  const [prevInitialTasks, setPrevInitialTasks] = useState(initialTasks);
  if (initialTasks !== prevInitialTasks) {
    setPrevInitialTasks(initialTasks);
    setTasks(initialTasks);
  }

  // Authoritative status counts
  const counts = useMemo(() => {
    return {
      all: tasks.filter((t) => t.status !== 'archived').length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      missed: tasks.filter((t) => t.status === 'missed').length,
      archived: tasks.filter((t) => t.status === 'archived').length,
    };
  }, [tasks]);

  const activatedAccountabilityCount = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status !== 'missed') return false;
      const cStatus = Array.isArray(t.task_accountability_commitments)
        ? t.task_accountability_commitments[0]?.commitment_status
        : t.task_accountability_commitments?.commitment_status;
      return cStatus === 'activated';
    }).length;
  }, [tasks]);

  // Filter tasks based on status, priority, and search query
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Tab status filter
      if (activeTab === 'all') {
        if (task.status === 'archived') return false;
      } else if (task.status !== activeTab) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query) || false;
        const matchesGoal = task.goals?.title.toLowerCase().includes(query) || false;
        const matchesProject = task.projects?.title.toLowerCase().includes(query) || false;
        return matchesTitle || matchesDesc || matchesGoal || matchesProject;
      }

      return true;
    });
  }, [tasks, activeTab, priorityFilter, searchQuery]);

  const visibleTaskIds = useMemo(() => filteredTasks.map((t) => t.id), [filteredTasks]);

  const handleOpenCreateModal = () => {
    setTaskToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (task: TaskWithParents) => {
    setTaskToEdit(task);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (task: TaskWithParents) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    setActionError(null);

    const res = await deleteTaskAction(taskToDelete.id);
    setIsDeleting(false);

    if (res.success) {
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
    } else {
      setActionError(res.error || 'Failed to delete task.');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setActionError(null);
    if (newStatus === 'completed') {
      const res = await completeTaskAction(taskId);
      if (res.success && res.data) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status: 'completed', completed_at: res.data?.completed_at || new Date().toISOString() }
              : t
          )
        );
      } else {
        setActionError(res.error || 'Failed to complete task.');
      }
    } else {
      const res = await updateTaskAction(taskId, { status: newStatus });
      if (res.success && res.data) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: newStatus, completed_at: null, missed_at: null } : t
          )
        );
      } else {
        setActionError(res.error || 'Failed to update task status.');
      }
    }
  };

  // ==========================================================================
  // Bulk Operations Handlers
  // ==========================================================================
  const handleBulkComplete = async () => {
    if (selectedList.length === 0) return;
    setIsBulkProcessing(true);
    setBulkProcessingLabel(`Completing ${selectedList.length} commitments...`);
    setBulkFeedback(null);

    try {
      const res = await bulkCompleteTasksAction({ taskIds: selectedList });
      setIsBulkProcessing(false);

      if (res.success) {
        const completedCount = res.succeeded.length;
        const failedCount = res.failed.length;
        const skippedCount = res.skipped.length;

        if (failedCount > 0) {
          setBulkFeedback({
            type: 'warning',
            message: `Completed ${completedCount} tasks. ${failedCount} could not be completed (${res.failed[0]?.reason || 'invariants not met'}).`,
          });
        } else {
          setBulkFeedback({
            type: 'success',
            message: `Successfully completed ${completedCount} ${completedCount === 1 ? 'task' : 'tasks'}${skippedCount > 0 ? ` (${skippedCount} already completed)` : ''}.`,
          });
        }

        const completedSet = new Set(res.succeeded);
        setTasks((prev) =>
          prev.map((t) => (completedSet.has(t.id) ? { ...t, status: 'completed', completed_at: new Date().toISOString() } : t))
        );
        clearSelection();
        router.refresh();
      } else {
        setBulkFeedback({
          type: 'danger',
          message: res.error || 'Failed to complete selected tasks.',
        });
      }
    } catch {
      setIsBulkProcessing(false);
      setBulkFeedback({
        type: 'danger',
        message: 'An unexpected error occurred during bulk completion.',
      });
    }
  };

  const handleBulkArchive = async () => {
    if (selectedList.length === 0) return;
    setIsBulkProcessing(true);
    setBulkProcessingLabel(`Archiving ${selectedList.length} commitments...`);
    setBulkFeedback(null);

    try {
      const res = await bulkUpdateTaskStatusAction({ taskIds: selectedList, status: 'archived' });
      setIsBulkProcessing(false);

      if (res.success) {
        const archivedCount = res.succeeded.length;
        const archivedSet = new Set(res.succeeded);

        setTasks((prev) =>
          prev.map((t) => (archivedSet.has(t.id) ? { ...t, status: 'archived' } : t))
        );
        clearSelection();
        setBulkFeedback({
          type: 'success',
          message: `Archived ${archivedCount} ${archivedCount === 1 ? 'task' : 'tasks'}.`,
        });
        router.refresh();
      } else {
        setBulkFeedback({
          type: 'danger',
          message: res.error || 'Failed to archive selected tasks.',
        });
      }
    } catch {
      setIsBulkProcessing(false);
      setBulkFeedback({
        type: 'danger',
        message: 'An unexpected error occurred during bulk archiving.',
      });
    }
  };

  const handleBulkConfirmDelete = async () => {
    if (selectedList.length === 0) return;
    setIsBulkProcessing(true);
    setBulkProcessingLabel(`Deleting ${selectedList.length} commitments...`);
    setBulkFeedback(null);

    try {
      const res = await bulkDeleteTasksAction({ taskIds: selectedList });
      setIsBulkProcessing(false);
      setIsBulkDeleteModalOpen(false);

      if (res.success) {
        const deletedSet = new Set(res.succeeded);
        setTasks((prev) => prev.filter((t) => !deletedSet.has(t.id)));
        clearSelection();
        setBulkFeedback({
          type: 'success',
          message: `Deleted ${res.succeeded.length} ${res.succeeded.length === 1 ? 'task' : 'tasks'}.`,
        });
        router.refresh();
      } else {
        setBulkFeedback({
          type: 'danger',
          message: res.error || 'Failed to delete selected tasks.',
        });
      }
    } catch {
      setIsBulkProcessing(false);
      setIsBulkDeleteModalOpen(false);
      setBulkFeedback({
        type: 'danger',
        message: 'An unexpected error occurred during bulk deletion.',
      });
    }
  };

  const handleBulkConfirmReschedule = async () => {
    if (selectedList.length === 0 || !rescheduleDate) return;
    setIsBulkProcessing(true);
    setBulkProcessingLabel(`Rescheduling ${selectedList.length} commitments...`);
    setBulkFeedback(null);

    try {
      // Build ISO UTC timestamp from date input
      const isoDeadline = new Date(`${rescheduleDate}T23:59:59Z`).toISOString();
      const res = await bulkRescheduleTasksAction({
        taskIds: selectedList,
        deadline_at: isoDeadline,
      });

      setIsBulkProcessing(false);
      setIsBulkRescheduleModalOpen(false);

      if (res.success) {
        const rescheduledSet = new Set(res.succeeded);
        setTasks((prev) =>
          prev.map((t) => (rescheduledSet.has(t.id) ? { ...t, deadline_at: isoDeadline } : t))
        );
        clearSelection();
        setBulkFeedback({
          type: 'success',
          message: `Rescheduled ${res.succeeded.length} ${res.succeeded.length === 1 ? 'task' : 'tasks'} to ${rescheduleDate}.`,
        });
        router.refresh();
      } else {
        setBulkFeedback({
          type: 'danger',
          message: res.error || 'Failed to reschedule selected tasks.',
        });
      }
    } catch {
      setIsBulkProcessing(false);
      setIsBulkRescheduleModalOpen(false);
      setBulkFeedback({
        type: 'danger',
        message: 'An unexpected error occurred during bulk rescheduling.',
      });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Commitments & Tasks</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              {counts.all} active
            </span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Deterministic execution cockpit. Every task is a binding commitment tied to your goals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4 text-zinc-950" />}
            onClick={handleOpenCreateModal}
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* Action / Error Alerts */}
      {actionError && (
        <Alert
          variant="danger"
          title="Operation Failed"
          onDismiss={() => setActionError(null)}
        >
          {actionError}
        </Alert>
      )}

      {bulkFeedback && (
        <Alert
          variant={bulkFeedback.type}
          title={bulkFeedback.type === 'success' ? 'Batch Operation Succeeded' : 'Batch Operation Notice'}
          onDismiss={() => setBulkFeedback(null)}
        >
          {bulkFeedback.message}
        </Alert>
      )}

      {/* Activated Accountability Warning Banner */}
      {activatedAccountabilityCount > 0 && (
        <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 flex items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-200">
                {activatedAccountabilityCount} Activated Accountability Consequence
                {activatedAccountabilityCount > 1 ? 's' : ''}
              </h4>
              <p className="text-xs text-red-300/80 mt-0.5">
                Deadlines were missed and real-world stakes have been activated. Settle consequences in the Accountability ledger.
              </p>
            </div>
          </div>
          <Link href="/app/accountability">
            <Button variant="destructive" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
              Open Ledger
            </Button>
          </Link>
        </div>
      )}

      {/* 2. Executive Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GlassCard variant="default" padding="sm" className="space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Pending</span>
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
            {counts.pending}
          </p>
        </GlassCard>

        <GlassCard variant="default" padding="sm" className="space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Fulfilled</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            {counts.completed}
          </p>
        </GlassCard>

        <GlassCard variant="default" padding="sm" className="space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Missed</span>
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-red-400">
            {counts.missed}
          </p>
        </GlassCard>

        <GlassCard variant="default" padding="sm" className="space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total</span>
            <Target className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-zinc-200">
            {counts.all + counts.archived}
          </p>
        </GlassCard>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs with Count Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 rounded-2xl bg-[rgba(18,18,23,0.7)] border border-white/[0.08] backdrop-blur-md">
            {[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'pending', label: 'Pending', count: counts.pending },
              { id: 'in_progress', label: 'In Focus', count: counts.in_progress },
              { id: 'completed', label: 'Completed', count: counts.completed },
              { id: 'missed', label: 'Missed', count: counts.missed },
              { id: 'archived', label: 'Archived', count: counts.archived },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setUrlState((prev) => ({ ...prev, tab: tab.id as 'all' | TaskStatus }))}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#d4af37] text-zinc-950 shadow-md shadow-[#d4af37]/10'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                      isActive
                        ? 'bg-zinc-950/20 text-zinc-950 font-bold'
                        : 'bg-white/[0.06] text-zinc-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Priority & Search & Multi-Select Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Priority Filter */}
            <div className="relative flex items-center">
              <Filter className="w-3.5 h-3.5 text-zinc-400 absolute left-3 pointer-events-none" />
              <select
                value={priorityFilter}
                onChange={(e) =>
                  setUrlState((prev) => ({
                    ...prev,
                    priority: e.target.value as TaskPriority | 'all',
                  }))
                }
                className="rounded-xl border border-white/[0.08] bg-[rgba(18,18,23,0.85)] pl-8 pr-4 py-1.5 text-xs text-zinc-200 focus:border-[#d4af37] focus:outline-none transition-all cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] sm:w-60">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  setUrlState((prev) => ({
                    ...prev,
                    q: e.target.value,
                  }))
                }
                placeholder="Search commitments..."
                className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/80 pl-9 pr-8 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-[#d4af37] focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setUrlState((prev) => ({ ...prev, q: '' }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-0.5 rounded cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Select All Visible Checkbox Button */}
            {visibleTaskIds.length > 0 && (
              <button
                type="button"
                onClick={() => toggleAll(visibleTaskIds)}
                title={isAllSelected(visibleTaskIds) ? 'Deselect all visible' : 'Select all visible'}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  isAllSelected(visibleTaskIds)
                    ? 'bg-amber-400/15 border-amber-400/40 text-amber-300'
                    : isIndeterminate(visibleTaskIds)
                    ? 'bg-amber-400/10 border-amber-400/30 text-amber-300'
                    : 'bg-zinc-900/80 border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                    isAllSelected(visibleTaskIds)
                      ? 'bg-amber-400 border-amber-400 text-zinc-950'
                      : isIndeterminate(visibleTaskIds)
                      ? 'bg-amber-400/50 border-amber-400 text-zinc-950'
                      : 'border-white/30 bg-zinc-800'
                  }`}
                >
                  {isAllSelected(visibleTaskIds) && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  {isIndeterminate(visibleTaskIds) && <span className="w-1.5 h-1.5 bg-zinc-950 rounded-sm" />}
                </div>
                <span className="hidden sm:inline">Select All</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Commitment Grid / List */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteModal}
              onStatusChange={handleStatusChange}
              timezone={timezone}
              isSelected={isSelected(task.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      ) : (
        <GlassCard variant="default" padding="lg" className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900/80 border border-white/[0.08] flex items-center justify-center text-[#d4af37] mx-auto">
            <CheckSquare className="w-6 h-6" />
          </div>

          <h3 className="text-base font-semibold text-zinc-200">
            {searchQuery || priorityFilter !== 'all' || activeTab !== 'all'
              ? 'No matching commitments found'
              : 'All commitments in order'}
          </h3>

          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            {searchQuery || priorityFilter !== 'all' || activeTab !== 'all'
              ? 'Adjust your filter criteria or search terms to inspect other commitments.'
              : 'You have fulfilled your active commitments. Maintain your discipline and seal your next pact.'}
          </p>

          <div className="pt-2">
            {searchQuery || priorityFilter !== 'all' || activeTab !== 'all' ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setUrlState({
                    ...DEFAULT_TASKS_URL_STATE,
                  });
                }}
              >
                Reset Filters
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5 text-zinc-950" />}
                onClick={handleOpenCreateModal}
              >
                Seal First Pact
              </Button>
            )}
          </div>
        </GlassCard>
      )}

      {/* 5. Floating Glassmorphic Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        isProcessing={isBulkProcessing}
        processingLabel={bulkProcessingLabel}
      >
        <Button
          variant="primary"
          size="sm"
          icon={<Check className="w-3.5 h-3.5 text-zinc-950" />}
          onClick={handleBulkComplete}
        >
          Complete
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={<Calendar className="w-3.5 h-3.5" />}
          onClick={() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setRescheduleDate(tomorrow.toISOString().slice(0, 10));
            setIsBulkRescheduleModalOpen(true);
          }}
        >
          Reschedule
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={<Archive className="w-3.5 h-3.5" />}
          onClick={handleBulkArchive}
        >
          Archive
        </Button>

        <Button
          variant="destructive"
          size="sm"
          icon={<Trash2 className="w-3.5 h-3.5" />}
          onClick={() => setIsBulkDeleteModalOpen(true)}
        >
          Delete
        </Button>
      </BulkActionToolbar>

      {/* 6. Modals */}
      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={() => setIsFormModalOpen(false)}
        taskToEdit={taskToEdit}
        availableGoals={availableGoals}
        availableProjects={availableProjects}
        timezone={timezone}
      />

      <DeleteTaskModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        taskTitle={taskToDelete?.title || ''}
        isDeleting={isDeleting}
      />

      {/* Bulk Delete Modal */}
      <DeleteTaskModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkConfirmDelete}
        taskTitle={`${selectedCount} selected tasks`}
        isDeleting={isBulkProcessing}
      />

      {/* Bulk Reschedule Modal */}
      {isBulkRescheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <GlassCard variant="default" padding="md" className="w-full max-w-sm space-y-4 text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Reschedule {selectedCount} Tasks</h3>
              <button
                type="button"
                onClick={() => setIsBulkRescheduleModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Select a new deadline date for all {selectedCount} selected tasks.
            </p>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">New Deadline Date</label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsBulkRescheduleModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleBulkConfirmReschedule}
                disabled={!rescheduleDate || isBulkProcessing}
              >
                Apply Deadline
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
