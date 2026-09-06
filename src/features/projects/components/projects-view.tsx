'use client';

import { useState, useMemo } from 'react';
import { Goal, ProjectStatus } from '@/types/domain';
import { ProjectWithGoal } from '@/features/projects/data-access';
import { ProjectCard } from './project-card';
import { ProjectFormModal } from './project-form-modal';
import { DeleteProjectModal } from './delete-project-modal';
import { archiveProjectAction } from '@/features/projects/actions';
import { Plus, FolderKanban, Search, Filter, Layers } from 'lucide-react';

interface ProjectsViewProps {
  initialProjects: ProjectWithGoal[];
  availableGoals: Goal[];
  error?: string | null;
}

export function ProjectsView({ initialProjects, availableGoals, error }: ProjectsViewProps) {
  const [projects] = useState<ProjectWithGoal[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ProjectStatus | 'all'>('active');
  const [goalFilter, setGoalFilter] = useState<string>('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<ProjectWithGoal | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectWithGoal | null>(null);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesTab = activeTab === 'all' || project.status === activeTab;

      let matchesGoal = true;
      if (goalFilter === 'independent') {
        matchesGoal = !project.goal_id;
      } else if (goalFilter !== 'all') {
        matchesGoal = project.goal_id === goalFilter;
      }

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        project.title.toLowerCase().includes(query) ||
        (project.description && project.description.toLowerCase().includes(query));

      return matchesTab && matchesGoal && matchesSearch;
    });
  }, [projects, activeTab, goalFilter, searchQuery]);

  const activeCount = useMemo(() => projects.filter((p) => p.status === 'active').length, [projects]);
  const completedCount = useMemo(() => projects.filter((p) => p.status === 'completed').length, [projects]);
  const pausedCount = useMemo(() => projects.filter((p) => p.status === 'paused').length, [projects]);
  const archivedCount = useMemo(() => projects.filter((p) => p.status === 'archived').length, [projects]);

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

  const handleArchive = async (project: ProjectWithGoal) => {
    await archiveProjectAction(project.id);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#d4af37] bg-[#d4af37]/10 border border-[#d4af37]/30 px-3 py-1 rounded-full mb-2">
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Initiatives & Execution Streams</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">Projects</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
            Organize commitments under structured initiatives. Projects bridge long-term goals with day-to-day execution.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 bg-[#d4af37] hover:bg-[#e5c158] text-zinc-950 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-lg cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Fetch Error */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Toolbar: Search & Status Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'active'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Active ({activeCount})
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'completed'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Completed ({completedCount})
          </button>

          <button
            onClick={() => setActiveTab('paused')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'paused'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Paused ({pausedCount})
          </button>

          <button
            onClick={() => setActiveTab('archived')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'archived'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Archived ({archivedCount})
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({projects.length})
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Goal Association Filter */}
          <select
            value={goalFilter}
            onChange={(e) => setGoalFilter(e.target.value)}
            className="bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-100 focus:border-[#d4af37] focus:outline-none transition-colors cursor-pointer"
          >
            <option value="all">All Goal Links</option>
            <option value="independent">Independent Projects (No Goal)</option>
            {availableGoals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                Goal: {goal.title}
              </option>
            ))}
          </select>

          {/* Search Bar */}
          <div className="relative sm:w-56">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter projects..."
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
        <div className="glass-card p-12 rounded-3xl border border-zinc-800/80 text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
            {searchQuery || goalFilter !== 'all' ? (
              <Filter className="w-6 h-6" />
            ) : (
              <Layers className="w-6 h-6 text-[#d4af37]" />
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold text-zinc-200">
              {searchQuery || goalFilter !== 'all' ? 'No matching projects found' : 'Turn a goal into a body of work.'}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {searchQuery || goalFilter !== 'all'
                ? 'No projects matched your active filters. Try clearing your search or goal selection.'
                : 'Create your first project to structure commitments under a focused initiative.'}
            </p>
          </div>

          {!searchQuery && goalFilter === 'all' && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 bg-[#d4af37] hover:bg-[#e5c158] text-zinc-950 font-semibold px-4 py-2 rounded-xl text-xs transition-colors shadow-md cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Project</span>
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <ProjectFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        projectToEdit={projectToEdit}
        availableGoals={availableGoals}
      />

      <DeleteProjectModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        project={projectToDelete}
      />
    </div>
  );
}
