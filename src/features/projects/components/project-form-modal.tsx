'use client';

import { useState, useTransition, useEffect } from 'react';
import { Goal, ProjectStatus } from '@/types/domain';
import { ProjectWithGoal } from '@/features/projects/data-access';
import { createProjectAction, updateProjectAction } from '@/features/projects/actions';
import { X, FolderKanban, Loader2, AlertCircle } from 'lucide-react';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: ProjectWithGoal | null;
  availableGoals: Goal[];
}

const PRESET_ACCENT_COLORS = [
  '#d4af37', // PACT Gold
  '#3b82f6', // Sapphire Blue
  '#10b981', // Emerald Green
  '#ec4899', // Rose Pink
  '#8b5cf6', // Violet Purple
  '#f59e0b', // Amber Orange
];

export function ProjectFormModal({
  isOpen,
  onClose,
  projectToEdit,
  availableGoals,
}: ProjectFormModalProps) {
  const isEditing = Boolean(projectToEdit);

  const [title, setTitle] = useState(projectToEdit?.title || '');
  const [description, setDescription] = useState(projectToEdit?.description || '');
  const [goalId, setGoalId] = useState<string>(projectToEdit?.goal_id || '');
  const [colorAccent, setColorAccent] = useState<string>(projectToEdit?.color_accent || '#d4af37');
  const [status, setStatus] = useState<ProjectStatus>(projectToEdit?.status || 'active');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Reset state when projectToEdit changes
  const [prevProjectId, setPrevProjectId] = useState<string | undefined>(projectToEdit?.id);
  if (projectToEdit?.id !== prevProjectId) {
    setPrevProjectId(projectToEdit?.id);
    setTitle(projectToEdit?.title || '');
    setDescription(projectToEdit?.description || '');
    setGoalId(projectToEdit?.goal_id || '');
    setColorAccent(projectToEdit?.color_accent || '#d4af37');
    setStatus(projectToEdit?.status || 'active');
    setErrorMsg(null);
  }

  // Handle ESC key press for closing modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMsg('Project title is required.');
      return;
    }

    if (trimmedTitle.length > 255) {
      setErrorMsg('Project title must not exceed 255 characters.');
      return;
    }

    if (description.length > 2000) {
      setErrorMsg('Description must not exceed 2000 characters.');
      return;
    }

    startTransition(async () => {
      if (isEditing && projectToEdit) {
        const res = await updateProjectAction(projectToEdit.id, {
          title: trimmedTitle,
          description: description.trim() || null,
          goal_id: goalId || null,
          color_accent: colorAccent || null,
          status,
        });

        if (res.success) {
          onClose();
        } else {
          setErrorMsg(res.error || 'Failed to update project.');
        }
      } else {
        const res = await createProjectAction({
          title: trimmedTitle,
          description: description.trim() || null,
          goal_id: goalId || null,
          color_accent: colorAccent || null,
        });

        if (res.success) {
          onClose();
        } else {
          setErrorMsg(res.error || 'Failed to create project.');
        }
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="glass-card max-w-lg w-full rounded-2xl border border-zinc-800 p-6 sm:p-7 space-y-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: `${colorAccent}15`,
                borderColor: `${colorAccent}40`,
                color: colorAccent,
              }}
            >
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-semibold text-zinc-100">
                {isEditing ? 'Edit Project' : 'Create New Project'}
              </h2>
              <p className="text-xs text-zinc-400">
                {isEditing
                  ? 'Update your initiative details and goal association.'
                  : 'Structure commitments under a clear initiative.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="project-title" className="block text-xs font-medium text-zinc-300 mb-1.5">
              Project Title <span className="text-[#d4af37]">*</span>
            </label>
            <input
              id="project-title"
              type="text"
              required
              maxLength={255}
              disabled={isPending}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Auth Engine & Database Migration"
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-[#d4af37] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="project-goal" className="block text-xs font-medium text-zinc-300 mb-1.5">
              Parent Goal (Optional)
            </label>
            <select
              id="project-goal"
              disabled={isPending}
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:border-[#d4af37] focus:outline-none transition-colors cursor-pointer"
            >
              <option value="">No Goal (Independent Project)</option>
              {availableGoals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title} ({goal.status})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-500 mt-1">
              Only goals owned by your account are displayed.
            </p>
          </div>

          <div>
            <label htmlFor="project-description" className="block text-xs font-medium text-zinc-300 mb-1.5">
              Description / Scope
            </label>
            <textarea
              id="project-description"
              rows={3}
              maxLength={2000}
              disabled={isPending}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline project deliverables and scope..."
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-[#d4af37] focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Accent Color
              </label>
              <div className="flex items-center gap-2">
                {PRESET_ACCENT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setColorAccent(color)}
                    className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                      colorAccent === color ? 'scale-110 border-white ring-2 ring-[#d4af37]/50' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select accent color ${color}`}
                  />
                ))}
              </div>
            </div>

            {isEditing && (
              <div>
                <label htmlFor="project-status" className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Status
                </label>
                <select
                  id="project-status"
                  disabled={isPending}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:border-[#d4af37] focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-transparent transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 bg-[#d4af37] hover:bg-[#e5c158] text-zinc-950 font-semibold px-5 py-2 rounded-xl text-xs transition-colors shadow-md cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? 'Update Project' : 'Create Project'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
