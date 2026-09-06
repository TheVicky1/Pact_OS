'use client';

import { TaskWithParents } from '../data-access';
import { deleteTaskAction, updateTaskAction } from '../actions';
import { TaskCard } from './task-card';
import { TaskFormModal } from './task-form-modal';
import { DeleteTaskModal } from './delete-task-modal';
import { TaskPriority, TaskStatus } from '@/types/domain';
import { Plus, Search, CheckSquare, Filter, AlertCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

interface TasksViewProps {
  initialTasks: TaskWithParents[];
  availableGoals: Array<{ id: string; title: string }>;
  availableProjects: Array<{ id: string; title: string }>;
}

export function TasksView({ initialTasks, availableGoals, availableProjects }: TasksViewProps) {
  const [tasks, setTasks] = useState<TaskWithParents[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
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

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Tab status filter
      if (activeTab !== 'all' && task.status !== activeTab) {
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
      setActionError(res.error || 'Failed to delete task.');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setActionError(null);

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    const res = await updateTaskAction(taskId, { status: newStatus });
    if (!res.success) {
      setActionError(res.error || 'Failed to update task status.');
      // Rollback optimistic update
      setTasks(initialTasks);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <CheckSquare className="h-6 w-6 text-amber-400" />
            Tasks & Commitments
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Turn intent into disciplined daily action with clear, actionable commitments.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-semibold text-zinc-950 hover:from-amber-400 hover:to-amber-500 shadow-md shadow-amber-500/10 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/80 p-1 backdrop-blur-sm">
          {(['all', 'pending', 'in_progress', 'completed', 'archived'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-amber-400 text-zinc-950 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {tab === 'all' ? 'All Tasks' : tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Priority Filter & Search Input */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Priority Select */}
          <div className="relative flex items-center">
            <Filter className="absolute left-3 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
              className="rounded-xl border border-zinc-800 bg-zinc-900/80 pl-8 pr-4 py-1.5 text-xs text-zinc-300 focus:border-amber-400/60 focus:outline-none transition-all"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, goals, or projects..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 pl-9 pr-4 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-400/60 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Task List / Grid */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteModal}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-800/80 bg-zinc-900/30 p-12 text-center backdrop-blur-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-amber-400">
            <CheckSquare className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-zinc-200">No Task Commitments Found</h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery || activeTab !== 'all' || priorityFilter !== 'all'
              ? 'No tasks match your filter criteria. Try resetting search or filter tabs.'
              : 'You have no task commitments yet. Create your first task commitment to start taking disciplined action.'}
          </p>
          {!(searchQuery || activeTab !== 'all' || priorityFilter !== 'all') && (
            <button
              onClick={handleOpenCreateModal}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-amber-300 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Task</span>
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={() => {
          setIsFormModalOpen(false);
        }}
        taskToEdit={taskToEdit}
        availableGoals={availableGoals}
        availableProjects={availableProjects}
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
