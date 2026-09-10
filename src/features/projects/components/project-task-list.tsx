'use client';

import { ProjectTask } from '@/features/projects/data-access';
import { TaskPriority, TaskStatus } from '@/types/domain';
import { CheckCircle2, Circle, Clock, AlertCircle, Minus } from 'lucide-react';

interface ProjectTaskListProps {
  tasks: ProjectTask[];
}

/**
 * Status icon configuration.
 * Tasks are displayed as read-only summaries — full lifecycle management
 * remains on the Tasks page. No accountability details are exposed here.
 */
const statusIcon: Record<
  TaskStatus,
  { Icon: React.ElementType; cls: string; label: string }
> = {
  pending: { Icon: Circle, cls: 'text-zinc-500', label: 'Pending' },
  in_progress: { Icon: Clock, cls: 'text-blue-400', label: 'In Progress' },
  completed: { Icon: CheckCircle2, cls: 'text-emerald-400', label: 'Completed' },
  missed: { Icon: AlertCircle, cls: 'text-rose-400', label: 'Missed' },
  archived: { Icon: Minus, cls: 'text-zinc-600', label: 'Archived' },
};

const priorityBadge: Record<TaskPriority, { label: string; cls: string }> = {
  low: { label: 'Low', cls: 'text-zinc-500 bg-zinc-900 border-zinc-700/60' },
  medium: { label: 'Med', cls: 'text-blue-400 bg-blue-950/40 border-blue-800/50' },
  high: { label: 'High', cls: 'text-amber-400 bg-amber-950/40 border-amber-800/50' },
  urgent: { label: 'Urgent', cls: 'text-rose-400 bg-rose-950/40 border-rose-800/50' },
};

/**
 * Formats an ISO deadline to a short display string using local time.
 * Adds urgency coloring when overdue.
 */
function formatDeadline(
  iso: string,
  isCompleted: boolean
): { label: string; urgency: 'overdue' | 'soon' | 'normal' } {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { label: '—', urgency: 'normal' };

  const now = new Date();
  const isOverdue = !isCompleted && d < now;
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const label = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });

  const urgency = isOverdue ? 'overdue' : diffDays <= 2 ? 'soon' : 'normal';
  return { label, urgency };
}

export function ProjectTaskList({ tasks }: ProjectTaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 space-y-2">
        <p className="text-sm text-zinc-400 font-medium">No tasks in this project yet.</p>
        <p className="text-xs text-zinc-600 leading-relaxed max-w-xs mx-auto">
          Tasks assigned to this project will appear here. Create tasks from the Tasks page and
          link them to this project.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-1.5" role="list" aria-label="Project tasks">
      {tasks.map((task) => {
        const status = task.status as TaskStatus;
        const priority = task.priority as TaskPriority;
        const isCompleted = status === 'completed';
        const isArchived = status === 'archived';

        const statusDef = statusIcon[status] ?? statusIcon.pending;
        const priorityDef = priorityBadge[priority] ?? priorityBadge.medium;
        const deadline = formatDeadline(task.deadline_at, isCompleted);

        return (
          <li
            key={task.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
              isArchived
                ? 'border-zinc-800/40 bg-zinc-900/20 opacity-50'
                : isCompleted
                  ? 'border-zinc-800/50 bg-zinc-900/30'
                  : 'border-zinc-800/70 bg-zinc-900/50 hover:border-zinc-700/70 hover:bg-zinc-900/70'
            }`}
          >
            {/* Status icon */}
            <statusDef.Icon
              className={`w-4 h-4 shrink-0 ${statusDef.cls}`}
              aria-label={statusDef.label}
            />

            {/* Task title */}
            <span
              className={`flex-1 text-xs font-medium leading-snug min-w-0 truncate ${
                isCompleted ? 'line-through text-zinc-500' : isArchived ? 'text-zinc-600' : 'text-zinc-200'
              }`}
            >
              {task.title}
            </span>

            {/* Priority badge */}
            <span
              className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${priorityDef.cls}`}
              aria-label={`Priority: ${priority}`}
            >
              {priorityDef.label}
            </span>

            {/* Deadline */}
            <span
              className={`text-[11px] shrink-0 tabular-nums ${
                deadline.urgency === 'overdue'
                  ? 'text-rose-400 font-medium'
                  : deadline.urgency === 'soon'
                    ? 'text-amber-400'
                    : 'text-zinc-500'
              }`}
              aria-label={`Deadline: ${deadline.label}`}
            >
              {deadline.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
