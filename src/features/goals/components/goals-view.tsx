'use client';

import { useState, useMemo } from 'react';
import { Goal, GoalStatus } from '@/types/domain';
import { GoalCard } from './goal-card';
import { GoalFormModal } from './goal-form-modal';
import { DeleteGoalModal } from './delete-goal-modal';
import { archiveGoalAction } from '@/features/goals/actions';
import { Plus, Target, Search, Filter, Compass } from 'lucide-react';

interface GoalsViewProps {
  initialGoals: Goal[];
  error?: string | null;
}

export function GoalsView({ initialGoals, error }: GoalsViewProps) {
  const [goals] = useState<Goal[]>(initialGoals);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<GoalStatus | 'all'>('active');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      const matchesTab = activeTab === 'all' || goal.status === activeTab;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        goal.title.toLowerCase().includes(query) ||
        (goal.description && goal.description.toLowerCase().includes(query));

      return matchesTab && matchesSearch;
    });
  }, [goals, activeTab, searchQuery]);

  const activeCount = useMemo(() => goals.filter((g) => g.status === 'active').length, [goals]);
  const completedCount = useMemo(() => goals.filter((g) => g.status === 'completed').length, [goals]);
  const archivedCount = useMemo(() => goals.filter((g) => g.status === 'archived').length, [goals]);

  const handleOpenCreate = () => {
    setGoalToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setGoalToEdit(goal);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (goal: Goal) => {
    setGoalToDelete(goal);
    setIsDeleteOpen(true);
  };

  const handleArchive = async (goal: Goal) => {
    await archiveGoalAction(goal.id);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#d4af37] bg-[#d4af37]/10 border border-[#d4af37]/30 px-3 py-1 rounded-full mb-2">
            <Target className="w-3.5 h-3.5" />
            <span>Long-Term Commitments</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">Goals</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
            Define your highest-level objectives. Goals ground your projects and tasks, turning intent into discipline.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 bg-[#d4af37] hover:bg-[#e5c158] text-zinc-950 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-lg cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Database Fetch Error */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Toolbar: Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
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
            All ({goals.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter goals..."
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-[#d4af37] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Goals Grid / Empty State */}
      {filteredGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
              onArchive={handleArchive}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 rounded-3xl border border-zinc-800/80 text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
            {searchQuery ? <Filter className="w-6 h-6" /> : <Compass className="w-6 h-6 text-[#d4af37]" />}
          </div>

          <div>
            <h3 className="text-base font-semibold text-zinc-200">
              {searchQuery ? 'No matching goals found' : 'No goals defined yet'}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {searchQuery
                ? `No goals matched your filter "${searchQuery}". Try refining your search.`
                : 'Establish your first core goal to anchor your projects, commitments, and daily execution.'}
            </p>
          </div>

          {!searchQuery && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 bg-[#d4af37] hover:bg-[#e5c158] text-zinc-950 font-semibold px-4 py-2 rounded-xl text-xs transition-colors shadow-md cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Goal</span>
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <GoalFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        goalToEdit={goalToEdit}
      />

      <DeleteGoalModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        goal={goalToDelete}
      />
    </div>
  );
}
