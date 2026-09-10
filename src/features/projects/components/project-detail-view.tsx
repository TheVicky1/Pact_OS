'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Goal } from '@/types/domain';
import { ProjectWithGoal, ProjectTask } from '@/features/projects/data-access';
import { ProjectFormModal } from './project-form-modal';
import { DeleteProjectModal } from './delete-project-modal';
import { ProjectTaskList } from './project-task-list';
import { archiveProjectAction } from '@/features/projects/actions';
import {
  ArrowLeft,
  Edit3,
  Archive,
  Trash2,
  Target,
  Layers,
  Calendar,
  FolderKanban,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

interface ProjectDetailViewProps {
  project: ProjectWithGoal;
  tasks: ProjectTask[];
  availableGoals: Goal[];
}

/**
 * Formats an ISO date string to a readable local date.
 */
function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Computes task-based progress.
 *
 * Progress calculation:
 *   completed tasks / total tasks (where completed = status === 'completed')
 *
 * Returns null if there are no tasks (no data to derive from).
 */
function computeProgress(tasks: ProjectTask[]): { pct: number; completed: number; total: number } | null {
  if (tasks.length === 0) return null;
  const activeTasks = tasks.filter((t) => t.status !== 'archived');
  if (activeTasks.length === 0) return null;
  const completed = activeTasks.filter((t) => t.status === 'completed').length;
  const pct = Math.round((completed / activeTasks.length) * 100);
  return { pct, completed, total: activeTasks.length };
}

const statusBadge: Record<string, { label: string; cls: string; dot: string }> = {
  active: { label: 'Active', cls: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60', dot: 'bg-emerald-400' },
  completed: { label: 'Completed', cls: 'bg-amber-950/60 text-amber-400 border-amber-800/60', dot: 'bg-amber-400' },
  paused: { label: 'Paused', cls: 'bg-blue-950/60 text-blue-400 border-blue-800/60', dot: 'bg-blue-400' },
  archived: { label: 'Archived', cls: 'bg-zinc-900 text-zinc-500 border-zinc-700/80', dot: 'bg-zinc-500' },
};

export function ProjectDetailView({ project, tasks, availableGoals }: ProjectDetailViewProps) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [, startTransition] = useTransition();

  const progress = computeProgress(tasks);
  const accentColor = project.color_accent ?? '#d4af37';
  const config = statusBadge[project.status] ?? statusBadge.active;
  const createdDate = formatDate(project.created_at);
  const updatedDate = formatDate(project.updated_at);
  const isArchived = project.status === 'archived';

  const handleArchive = () => {
    startTransition(async () => {
      await archiveProjectAction(project.id);
      router.refresh();
    });
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    router.refresh();
  };

  const handleDeleteClose = () => {
    setIsDeleteOpen(false);
    router.push('/app/projects');
  };

  return (
    <div className="space-y-8">
      {/* Back navigation */}
      <Link
        href="/app/projects"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors group"
        aria-label="Back to Projects"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
        <span>Back to Projects</span>
      </Link>

      {/* Project Header Card */}
      <div
        className={`glass-card rounded-2xl border overflow-hidden transition-colors ${
          isArchived ? 'border-zinc-800/50 opacity-90' : 'border-zinc-800/80'
        }`}
      >
        {/* Accent bar */}
        <div className="h-[3px] w-full" style={{ backgroundColor: accentColor }} aria-hidden="true" />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              {/* Eyebrow: icon + status */}
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: `${accentColor}14`,
                    borderColor: `${accentColor}38`,
                    color: accentColor,
                  }}
                  aria-hidden="true"
                >
                  <FolderKanban className="w-4 h-4" />
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${config.cls}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
                  {config.label}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 leading-snug">
                {project.title}
              </h1>

              {/* Description */}
              {project.description ? (
                <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">{project.description}</p>
              ) : (
                <p className="text-sm text-zinc-600 italic">No description provided.</p>
              )}
            </div>

            {/* Action buttons */}
            <div
              className="flex items-center gap-1.5 shrink-0"
              role="group"
              aria-label="Project actions"
            >
              <button
                onClick={() => setIsFormOpen(true)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors cursor-pointer border border-transparent hover:border-zinc-700/50"
                aria-label="Edit project"
                title="Edit project"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              {!isArchived && (
                <button
                  onClick={handleArchive}
                  className="p-2 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-amber-950/40 transition-colors cursor-pointer border border-transparent hover:border-amber-800/40"
                  aria-label="Archive project"
                  title="Archive project"
                >
                  <Archive className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => setIsDeleteOpen(true)}
                className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer border border-transparent hover:border-rose-800/40"
                aria-label="Delete project"
                title="Delete project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium uppercase tracking-wide text-[11px]">Task Progress</span>
              {progress ? (
                <span className="font-semibold tabular-nums" style={{ color: accentColor }}>
                  {progress.pct}%
                </span>
              ) : (
                <span className="text-zinc-600 text-[11px]">No tasks yet</span>
              )}
            </div>
            <div
              className="h-2 w-full rounded-full bg-zinc-800/80 overflow-hidden"
              role="progressbar"
              aria-label="Project task completion progress"
              aria-valuenow={progress?.pct ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: progress ? `${progress.pct}%` : '0%',
                  backgroundColor: accentColor,
                  opacity: progress ? 1 : 0,
                }}
              />
            </div>
            {progress && (
              <p className="text-[11px] text-zinc-500">
                {progress.completed} of {progress.total} task{progress.total !== 1 ? 's' : ''} completed
              </p>
            )}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 border-t border-zinc-800/60">
            {/* Goal relationship */}
            {project.goals ? (
              <div className="flex items-center gap-1.5 text-xs">
                <Target className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} aria-hidden="true" />
                <span className="font-medium" style={{ color: accentColor }}>
                  {project.goals.title}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Independent project</span>
              </div>
            )}

            {/* Created date */}
            {createdDate && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Created {createdDate}</span>
              </div>
            )}

            {/* Updated date */}
            {updatedDate && updatedDate !== createdDate && (
              <div className="text-xs text-zinc-600">Updated {updatedDate}</div>
            )}
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <section aria-labelledby="tasks-heading">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <h2
              id="tasks-heading"
              className="text-sm font-semibold text-zinc-200 uppercase tracking-wide"
            >
              Tasks
            </h2>
            {tasks.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" aria-hidden="true" />
                {tasks.filter((t) => t.status === 'completed').length}/{tasks.length}
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-600 hidden sm:block">
            Manage tasks from the{' '}
            <Link
              href="/app/tasks"
              className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition-colors"
            >
              Tasks page
            </Link>
          </p>
        </div>

        <ProjectTaskList tasks={tasks} />
      </section>

      {/* Modals */}
      <ProjectFormModal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        projectToEdit={project}
        availableGoals={availableGoals}
      />

      <DeleteProjectModal
        isOpen={isDeleteOpen}
        onClose={handleDeleteClose}
        project={project}
      />
    </div>
  );
}
