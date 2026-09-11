'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Goal, ProjectStatus } from '@/types/domain';
import { ProjectWithGoal } from '@/features/projects/data-access';
import { ProjectCard } from './project-card';
import { ProjectFormModal } from './project-form-modal';
import { DeleteProjectModal } from './delete-project-modal';
import { archiveProjectAction } from '@/features/projects/actions';
import { Plus, FolderKanban, Search, Layers } from 'lucide-react';
import { useUrlState } from '@/hooks/use-url-state';
import {
  ProjectsUrlState,
  DEFAULT_PROJECTS_URL_STATE,
  parseProjectsUrlState,
  serializeProjectsUrlState,
} from '@/lib/url-state';

interface ProjectsViewProps {
  initialProjects: ProjectWithGoal[];
  availableGoals: Goal[];
  error?: string | null;
}

type ProjectFilter = ProjectStatus | 'all';

const FILTER_TABS: { value: ProjectFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' },
];

export function ProjectsView({ initialProjects, availableGoals, error }: ProjectsViewProps) {
  const router = useRouter();
  const [urlState, setUrlState] = useUrlState<ProjectsUrlState>({
    parse: parseProjectsUrlState,
    serialize: serializeProjectsUrlState,
    defaultValue: DEFAULT_PROJECTS_URL_STATE,
    debounceMs: 250,
  });

  const activeFilter = urlState.status;
  const goalFilter = urlState.goal;
  const searchQuery = urlState.q;

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<ProjectWithGoal | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectWithGoal | null>(null);

  const [, startTransition] = useTransition();

  // Counts per status
  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = {
      active: 0,
      completed: 0,
      paused: 0,
      archived: 0,
      all: 0,
    };
    for (const p of initialProjects) {
      counts[p.status] = (counts[p.status] ?? 0) + 1;
      counts.all += 1;
    }
    return counts;
  }, [initialProjects]);

  const filteredProjects = useMemo(() => {
    return initialProjects.filter((project) => {
      const matchesStatus = activeFilter === 'all' || project.status === activeFilter;

      let matchesGoal = true;
      if (goalFilter === 'independent') {
        matchesGoal = !project.goal_id;
      } else if (goalFilter !== 'all') {
        matchesGoal = project.goal_id === goalFilter;
      }

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        project.title.toLowerCase().includes(q) ||
        (project.description && project.description.toLowerCase().includes(q));

      return matchesStatus && matchesGoal && matchesSearch;
    });
  }, [initialProjects, activeFilter, goalFilter, searchQuery]);

  const handleOpenCreate = () => {
    setProjectToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (project: ProjectWithGoal) => {
    setProjectToEdit(project);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (project: ProjectWithGoal) => {
    setProjectToDelete(project);
    setIsDeleteOpen(true);
  };

  const handleArchive = (project: ProjectWithGoal) => {
    startTransition(async () => {
      await archiveProjectAction(project.id);
      router.refresh();
    });
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setProjectToEdit(null);
    router.refresh();
  };

  const handleDeleteClose = () => {
    setIsDeleteOpen(false);
    setProjectToDelete(null);
    router.refresh();
  };

  const isFiltered = !!searchQuery.trim() || goalFilter !== 'all';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#d4af37] bg-[#d4af37]/8 border border-[#d4af37]/25 px-3 py-1 rounded-full mb-3 tracking-wide uppercase">
            <FolderKanban className="w-3 h-3" aria-hidden="true" />
            <span>Initiatives &amp; Execution Streams</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">Projects</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 max-w-md leading-relaxed">
            Organize commitments under structured initiatives. Projects bridge long-term goals with
            day-to-day execution.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 bg-[#d4af37] hover:bg-[#e5c158] active:bg-[#c9a832] text-zinc-950 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-lg cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          aria-label="Create new project"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>New Project</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2"
        >
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {/* Toolbar: Status Filters + Goal Filter + Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Status filter pills */}
        <div
          className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl text-xs overflow-x-auto"
          role="tablist"
          aria-label="Filter projects by status"
        >
          {FILTER_TABS.map(({ value, label }) => {
            const isActive = activeFilter === value;
            return (
              <button
                key={value}
                role="tab"
                aria-selected={isActive}
                onClick={() => setUrlState((prev) => ({ ...prev, status: value }))}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                {label}
                <span
                  className={`ml-1.5 tabular-nums ${isActive ? 'text-zinc-300' : 'text-zinc-600'}`}
                >
                  ({countByStatus[value] ?? 0})
                </span>
              </button>
            );
          })}
        </div>

        {/* Goal filter + Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Goal association filter */}
          <select
            value={goalFilter}
            onChange={(e) => setUrlState((prev) => ({ ...prev, goal: e.target.value }))}
            aria-label="Filter by goal association"
            className="bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-100 focus:border-[#d4af37] focus:outline-none transition-colors cursor-pointer"
          >
            <option value="all">All Goal Links</option>
            <option value="independent">Independent (No Goal)</option>
            {availableGoals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative sm:w-56">
            <Search
              className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setUrlState((prev) => ({ ...prev, q: e.target.value }))}
              placeholder="Search projects..."
              aria-label="Search projects"
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-[#d4af37] focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Projects Grid / Empty State */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
              onArchive={handleArchive}
            />
          ))}
        </div>
      ) : (
        <ProjectsEmptyState
          isFiltered={isFiltered}
          searchQuery={searchQuery.trim()}
          onCreateProject={handleOpenCreate}
          onClearFilters={() => {
            setUrlState({
              ...DEFAULT_PROJECTS_URL_STATE,
            });
          }}
        />
      )}

      {/* Modals */}
      <ProjectFormModal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        projectToEdit={projectToEdit}
        availableGoals={availableGoals}
      />

      <DeleteProjectModal
        isOpen={isDeleteOpen}
        onClose={handleDeleteClose}
        project={projectToDelete}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Empty State
// ──────────────────────────────────────────────────────────────────────────────

interface ProjectsEmptyStateProps {
  isFiltered: boolean;
  searchQuery: string;
  onCreateProject: () => void;
  onClearFilters: () => void;
}

function ProjectsEmptyState({
  isFiltered,
  searchQuery,
  onCreateProject,
  onClearFilters,
}: ProjectsEmptyStateProps) {
  return (
    <div className="glass-card p-12 rounded-3xl border border-zinc-800/60 text-center flex flex-col items-center justify-center space-y-5 max-w-md mx-auto my-8">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
          isFiltered
            ? 'bg-zinc-900 border border-zinc-800 text-zinc-500'
            : 'bg-[#d4af37]/8 border border-[#d4af37]/25 text-[#d4af37]'
        }`}
        aria-hidden="true"
      >
        <Layers className="w-6 h-6" />
      </div>

      <div>
        <h3 className="text-base font-semibold text-zinc-200">
          {isFiltered ? 'No projects match your filters.' : 'Turn a goal into a body of work.'}
        </h3>
        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
          {searchQuery
            ? `No projects matched "${searchQuery}".`
            : isFiltered
              ? 'Try clearing your filters to see all projects.'
              : 'Create your first project to structure commitments under a focused initiative.'}
        </p>
      </div>

      {isFiltered ? (
        <button
          onClick={onClearFilters}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-700/60 transition-colors cursor-pointer"
        >
          Clear filters
        </button>
      ) : (
        <button
          onClick={onCreateProject}
          className="inline-flex items-center gap-2 bg-[#d4af37] hover:bg-[#e5c158] text-zinc-950 font-semibold px-4 py-2 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Create Your First Project</span>
        </button>
      )}
    </div>
  );
}
