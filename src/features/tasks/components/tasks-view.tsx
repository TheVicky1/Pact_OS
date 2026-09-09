'use client';

import React, { useMemo, useState } from 'react';
import { TaskWithParents } from '../data-access';
import { deleteTaskAction, updateTaskAction, completeTaskAction } from '../actions';
import { TaskCard } from './task-card';
import { TaskFormModal } from './task-form-modal';
import { DeleteTaskModal } from './delete-task-modal';
import { TaskPriority, TaskStatus } from '@/types/domain';
import { Button, GlassCard, Alert } from '@/components/ui';
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
} from 'lucide-react';

export interface TasksViewProps {
  initialTasks: TaskWithParents[];
  availableGoals: Array<{ id: string; title: string }>;
  availableProjects: Array<{ id: string; title: string }>;
  timezone?: string;
}

/**
 * PACT Tasks & Commitments View
 * Phase 4F implementation compliant with Section 8 of docs/ACCOUNTABILITY_UX_SPEC.md.
 * Executive commitment cockpit with stats counters, status filters, rapid search,
 * and speed-first commitment management.
 */
export function TasksView({
  initialTasks,
  availableGoals,
  availableProjects,
  timezone = 'UTC',
}: TasksViewProps) {
  const [tasks, setTasks] = useState<TaskWithParents[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskWithParents | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskWithParents | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      setActionError(res.error || 'Failed to delete commitment.');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setActionError(null);

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    const res =
      newStatus === 'completed'
        ? await completeTaskAction(taskId)
        : await updateTaskAction(taskId, { status: newStatus });

    if (!res.success) {
      setActionError(res.error || 'Failed to update commitment status.');
      // Rollback optimistic update
      setTasks(initialTasks);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Executive Header & Stats Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900/80 border border-white/[0.08] flex items-center justify-center text-[#d4af37]">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
              Tasks & Commitments
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
            Turn intent into disciplined daily action. Every commitment represents a binding pact with yourself.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4 text-zinc-950" />}
            onClick={handleOpenCreateModal}
          >
            New Commitment
          </Button>
        </div>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <Alert
          variant="danger"
          title="Action Rejected"
          onDismiss={() => setActionError(null)}
        >
          {actionError}
        </Alert>
      )}

      {/* 2. Overview Stats Quick Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GlassCard variant="default" padding="sm" className="space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Active</span>
            <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
            {counts.pending + counts.in_progress}
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
                  onClick={() => setActiveTab(tab.id as 'all' | TaskStatus)}
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

          {/* Priority & Search */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Priority Filter */}
            <div className="relative flex items-center">
              <Filter className="w-3.5 h-3.5 text-zinc-400 absolute left-3 pointer-events-none" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
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
            <div className="relative flex-1 min-w-[200px] sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commitments..."
                className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/80 pl-9 pr-8 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-[#d4af37] focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-0.5 rounded cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
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
                  setSearchQuery('');
                  setPriorityFilter('all');
                  setActiveTab('all');
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

      {/* 5. Modals */}
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
    </div>
  );
}
