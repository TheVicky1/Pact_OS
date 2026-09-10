'use client';

import { ProjectStatus } from '@/types/domain';
import { ProjectWithGoal } from '@/features/projects/data-access';
import { Edit3, Trash2, Archive, FolderKanban, Target, Layers, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ProjectCardProps {
  project: ProjectWithGoal;
  onEdit: (project: ProjectWithGoal) => void;
  onDelete: (project: ProjectWithGoal) => void;
  onArchive: (project: ProjectWithGoal) => void;
}

const statusConfig: Record<ProjectStatus, { label: string; badgeCls: string; dot: string }> = {
  active: {
    label: 'Active',
    badgeCls: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    dot: 'bg-emerald-400',
  },
  completed: {
    label: 'Completed',
    badgeCls: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
    dot: 'bg-amber-400',
  },
  paused: {
    label: 'Paused',
    badgeCls: 'bg-blue-950/60 text-blue-400 border-blue-800/60',
    dot: 'bg-blue-400',
  },
  archived: {
    label: 'Archived',
    badgeCls: 'bg-zinc-900 text-zinc-500 border-zinc-700/80',
    dot: 'bg-zinc-500',
  },
};

/**
 * Formats an ISO date string to a short month/year string using local time.
 */
function formatShortDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ProjectCard({ project, onEdit, onDelete, onArchive }: ProjectCardProps) {
  const config = statusConfig[project.status] ?? statusConfig.active;
  const accentColor = project.color_accent ?? '#d4af37';
  const isArchived = project.status === 'archived';

  const createdDate = formatShortDate(project.created_at);

  return (
    <div
      className={`glass-card rounded-2xl border flex flex-col overflow-hidden transition-all duration-200 group relative ${
        isArchived
          ? 'border-zinc-800/50 opacity-75 hover:opacity-90'
          : 'border-zinc-800/80 hover:border-zinc-700/80 hover:shadow-[0_4px_24px_0_rgba(0,0,0,0.4)]'
      }`}
    >
      {/* Top accent color bar */}
      <div
        className="h-[3px] w-full flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: accentColor }}
        aria-hidden="true"
      />

      <div className="p-5 sm:p-6 flex flex-col space-y-4 flex-1">
        {/* Header: Icon + Status + Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `${accentColor}14`,
                borderColor: `${accentColor}38`,
                color: accentColor,
              }}
            >
              <FolderKanban className="w-4 h-4" />
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${config.badgeCls}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
              {config.label}
            </span>
          </div>

          {/* Action buttons — visible on hover */}
          <div
            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            role="group"
            aria-label="Project actions"
          >
            <button
              onClick={(e) => { e.preventDefault(); onEdit(project); }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors cursor-pointer"
              title="Edit project"
              aria-label={`Edit project: ${project.title}`}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {!isArchived && (
              <button
                onClick={(e) => { e.preventDefault(); onArchive(project); }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-amber-950/40 transition-colors cursor-pointer"
                title="Archive project"
                aria-label={`Archive project: ${project.title}`}
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={(e) => { e.preventDefault(); onDelete(project); }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Delete project"
              aria-label={`Delete project: ${project.title}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title + Description */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors line-clamp-2 leading-snug">
            {project.title}
          </h3>
          {project.description ? (
            <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          ) : (
            <p className="text-xs text-zinc-600 italic mt-1.5">No description provided.</p>
          )}
        </div>

        {/* Progress — task-based, honest */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500 font-medium uppercase tracking-wide">Progress</span>
            <span className="text-zinc-500">Tracked via tasks</span>
          </div>
          <div
            className="h-1 w-full rounded-full bg-zinc-800/80 overflow-hidden"
            role="progressbar"
            aria-label="Project task progress"
            aria-valuenow={0}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {/* Width driven by real data in ProjectDetail; here honestly shows 0 */}
            <div className="h-full w-0 rounded-full" style={{ backgroundColor: accentColor }} />
          </div>
        </div>

        {/* Footer: Goal link + Created date + Detail link */}
        <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2 text-xs">
          {project.goals ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <Target
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: accentColor }}
                aria-hidden="true"
              />
              <span className="truncate text-[11px] font-medium" style={{ color: accentColor }}>
                {project.goals.title}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-zinc-600 text-[11px]">
              <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Independent</span>
            </div>
          )}

          <div className="flex items-center gap-3 shrink-0">
            {/* Created date */}
            {createdDate && (
              <div className="hidden sm:flex items-center gap-1 text-zinc-600 text-[11px]">
                <Calendar className="w-3 h-3" aria-hidden="true" />
                <span>{createdDate}</span>
              </div>
            )}

            {/* Navigate to detail */}
            <Link
              href={`/app/projects/${project.id}`}
              className="inline-flex items-center gap-0.5 text-[11px] text-zinc-400 hover:text-zinc-100 transition-colors"
              aria-label={`Open project: ${project.title}`}
              title="View project detail"
            >
              <span>Open</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
