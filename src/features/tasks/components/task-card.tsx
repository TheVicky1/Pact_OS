'use client';

import { TaskWithParents } from '../data-access';
import { TaskPriority, TaskStatus } from '@/types/domain';
import { Calendar, CheckCircle2, MoreVertical, Trash2, Edit3, Target, FolderKanban } from 'lucide-react';
import { useState } from 'react';

interface TaskCardProps {
  task: TaskWithParents;
  onEdit: (task: TaskWithParents) => void;
  onDelete: (task: TaskWithParents) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500/40 bg-red-500/10 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]';
      case 'high':
        return 'border-amber-500/40 bg-amber-500/10 text-amber-400';
      case 'medium':
        return 'border-amber-400/30 bg-amber-400/10 text-amber-300';
      case 'low':
      default:
        return 'border-zinc-700 bg-zinc-800/40 text-zinc-400';
    }
  };

  const getStatusStyle = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
      case 'in_progress':
        return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
      case 'missed':
        return 'border-red-500/30 bg-red-500/10 text-red-400';
      case 'archived':
        return 'border-zinc-700 bg-zinc-800/40 text-zinc-500';
      case 'pending':
      default:
        return 'border-zinc-700 bg-zinc-800/60 text-zinc-300';
    }
  };

  const formatDeadline = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="group relative rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all duration-200 hover:border-amber-500/30 hover:bg-zinc-900/80 hover:shadow-lg hover:shadow-amber-500/5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider ${getPriorityStyle(task.priority)}`}>
              {task.priority}
            </span>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusStyle(task.status)}`}>
              {task.status.replace('_', ' ')}
            </span>
          </div>

          <h3 className="font-semibold text-zinc-100 text-lg group-hover:text-amber-400 transition-colors">
            {task.title}
          </h3>

          {task.description && (
            <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Action Menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            aria-label="Task options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-zinc-800 bg-zinc-900 p-1 shadow-xl backdrop-blur-md">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onEdit(task);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5 text-zinc-400" />
                  Edit Task
                </button>
                {onStatusChange && task.status !== 'completed' && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onStatusChange(task.id, 'completed');
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-emerald-400 hover:bg-zinc-800 transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Complete
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDelete(task);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Parent Badges & Footer */}
      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
        <div className="flex items-center gap-2 flex-wrap">
          {task.projects && (
            <span className="inline-flex items-center gap-1 rounded bg-zinc-800/80 px-2 py-0.5 text-zinc-300 border border-zinc-700/50">
              <FolderKanban className="h-3 w-3 text-amber-400" />
              {task.projects.title}
            </span>
          )}
          {task.goals && (
            <span className="inline-flex items-center gap-1 rounded bg-zinc-800/80 px-2 py-0.5 text-zinc-300 border border-zinc-700/50">
              <Target className="h-3 w-3 text-amber-400" />
              {task.goals.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-zinc-400 font-mono">
          <Calendar className="h-3.5 w-3.5 text-amber-400/80" />
          <span>{formatDeadline(task.deadline_at)}</span>
        </div>
      </div>
    </div>
  );
}
