'use client';

import { ProjectStatus } from '@/types/domain';
import { ProjectWithGoal } from '@/features/projects/data-access';
import { Edit3, Trash2, Archive, FolderKanban, Target, Layers } from 'lucide-react';

interface ProjectCardProps {
  project: ProjectWithGoal;
  onEdit: (project: ProjectWithGoal) => void;
  onDelete: (project: ProjectWithGoal) => void;
  onArchive: (project: ProjectWithGoal) => void;
}

const statusBadgeConfig: Record<ProjectStatus, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
  },
  completed: {
    label: 'Completed',
    className: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
  },
  paused: {
    label: 'Paused',
    className: 'bg-blue-950/60 text-blue-400 border-blue-800/60',
  },
  archived: {
    label: 'Archived',
    className: 'bg-zinc-900 text-zinc-400 border-zinc-700/80',
  },
};

export function ProjectCard({ project, onEdit, onDelete, onArchive }: ProjectCardProps) {
  const badge = statusBadgeConfig[project.status] || statusBadgeConfig.active;
  const accentColor = project.color_accent || '#d4af37';

  return (
    <div className="glass-card p-5 sm:p-6 rounded-2xl border border-zinc-800/80 flex flex-col justify-between space-y-4 hover:border-zinc-700/80 transition-all group relative overflow-hidden">
      {/* Top Accent Color Bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 opacity-75 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: accentColor }}
      />

      <div className="space-y-3 pt-1">
        {/* Header: Icon, Status Badge, Action Buttons */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `${accentColor}15`,
                borderColor: `${accentColor}40`,
                color: accentColor,
              }}
            >
              <FolderKanban className="w-4 h-4" />
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(project)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors cursor-pointer"
              title="Edit Project"
              aria-label={`Edit project ${project.title}`}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {project.status !== 'archived' && (
              <button
                onClick={() => onArchive(project)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-amber-950/40 transition-colors cursor-pointer"
                title="Archive Project"
                aria-label={`Archive project ${project.title}`}
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => onDelete(project)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Delete Project"
              aria-label={`Delete project ${project.title}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title and Description */}
        <div>
          <h3 className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors line-clamp-2">
            {project.title}
          </h3>
          {project.description ? (
            <p className="text-xs text-zinc-400 mt-1.5 line-clamp-3 leading-relaxed">
              {project.description}
            </p>
          ) : (
            <p className="text-xs text-zinc-600 italic mt-1.5">No description provided.</p>
          )}
        </div>
      </div>

      {/* Footer: Parent Goal Badge */}
      <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
        {project.goals ? (
          <div className="flex items-center gap-1.5 truncate text-[#d4af37]">
            <Target className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate font-medium text-[11px]" title={`Goal: ${project.goals.title}`}>
              Goal: {project.goals.title}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>Independent Project</span>
          </div>
        )}
      </div>
    </div>
  );
}
