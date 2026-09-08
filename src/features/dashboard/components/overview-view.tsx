'use client';

import { Goal } from '@/types/domain';
import { TaskWithParents } from '@/features/tasks/data-access';
import { ProjectWithGoal } from '@/features/projects/data-access';
import { completeTaskAction } from '@/features/tasks/actions';
import { utcToLocal } from '@/lib/time';
import Link from 'next/link';
import { useState } from 'react';
import {
  Target,
  FolderKanban,
  CheckSquare,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Plus,
  ShieldCheck,
} from 'lucide-react';

interface OverviewViewProps {
  goals: Goal[];
  projects: ProjectWithGoal[];
  tasks: TaskWithParents[];
  userName: string;
  timezone: string;
}

export function OverviewView({
  goals,
  projects,
  tasks: initialTasks,
  userName,
  timezone,
}: OverviewViewProps) {
  const [tasksList, setTasksList] = useState<TaskWithParents[]>(initialTasks);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Sync state if initialTasks updates from server revalidation
  const [prevTasks, setPrevTasks] = useState(initialTasks);
  if (initialTasks !== prevTasks) {
    setPrevTasks(initialTasks);
    setTasksList(initialTasks);
  }

  // Derive Time of Day Greeting
  const getGreeting = () => {
    try {
      const hour = parseInt(
        new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour: 'numeric',
          hour12: false,
        }).format(new Date()),
        10
      );
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
    } catch {
      return 'Welcome back';
    }
  };

  // Metrics
  const activeGoals = goals.filter((g) => g.status === 'active');
  const activeProjects = projects.filter((p) => p.status === 'active');
  const pendingTasks = tasksList.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = tasksList.filter((t) => t.status === 'completed');
  const missedTasks = tasksList.filter((t) => t.status === 'missed');

  // Nearest upcoming active commitments (sorted by deadline_at ascending)
  const upcomingTasks = [...pendingTasks]
    .sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime())
    .slice(0, 4);

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTaskId(taskId);
    setActionError(null);

    // Optimistic UI update
    setTasksList((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'completed' } : t))
    );

    const res = await completeTaskAction(taskId);
    setCompletingTaskId(null);

    if (!res.success) {
      setActionError(res.error || 'Failed to complete task.');
      // Rollback on failure
      setTasksList(initialTasks);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-[#121217] via-[#0d0d12] to-[#09090b] p-6 sm:p-8 backdrop-blur-xl shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[#d4af37]/5 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-medium text-[#d4af37]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PACT Personal Operating System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
              {getGreeting()}, <span className="text-[#d4af37]">{userName}</span>
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              Focus on intentional commitments, take daily disciplined action, and track authoritative progress.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/app/tasks"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89528] px-4 py-2.5 text-xs font-semibold text-zinc-950 hover:from-[#e5be48] hover:to-[#c9a432] shadow-md shadow-[#d4af37]/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Commitment</span>
            </Link>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Active Goals */}
        <Link
          href="/app/goals"
          className="group rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 backdrop-blur-sm transition-all hover:border-[#d4af37]/40 hover:bg-zinc-900/80"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Active Goals</span>
            <Target className="w-4 h-4 text-[#d4af37] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{activeGoals.length}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Out of {goals.length} total</p>
        </Link>

        {/* Active Projects */}
        <Link
          href="/app/projects"
          className="group rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 backdrop-blur-sm transition-all hover:border-[#d4af37]/40 hover:bg-zinc-900/80"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Active Projects</span>
            <FolderKanban className="w-4 h-4 text-[#d4af37] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{activeProjects.length}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Out of {projects.length} total</p>
        </Link>

        {/* Pending Tasks */}
        <Link
          href="/app/tasks"
          className="group rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 backdrop-blur-sm transition-all hover:border-[#d4af37]/40 hover:bg-zinc-900/80"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Pending Tasks</span>
            <CheckSquare className="w-4 h-4 text-[#d4af37] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{pendingTasks.length}</div>
          <p className="text-[11px] text-zinc-500 mt-1">{completedTasks.length} completed</p>
        </Link>

        {/* Missed Tasks Status */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Missed Tasks</span>
            <Clock className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-300">{missedTasks.length}</div>
          <p className="text-[11px] text-zinc-500 mt-1">Lifecycle state visible</p>
        </div>
      </div>

      {/* TODAY & UPCOMING COMMITMENTS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#d4af37]" />
            <h2 className="text-lg font-bold tracking-tight text-zinc-100">Upcoming Commitments</h2>
          </div>
          <Link
            href="/app/tasks"
            className="text-xs font-medium text-[#d4af37] hover:underline inline-flex items-center gap-1"
          >
            <span>View All Tasks</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcomingTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingTasks.map((task) => (
              <div
                key={task.id}
                className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur-sm transition-all hover:border-[#d4af37]/30 hover:bg-zinc-900/90 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        task.priority === 'urgent'
                          ? 'border-red-500/40 bg-red-500/10 text-red-400'
                          : task.priority === 'high'
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                          : 'border-zinc-700 bg-zinc-800/60 text-zinc-400'
                      }`}
                    >
                      {task.priority}
                    </span>

                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      disabled={completingTaskId === task.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-800/60 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{completingTaskId === task.id ? 'Completing...' : 'Mark Done'}</span>
                    </button>
                  </div>

                  <h3 className="font-semibold text-zinc-100 text-base group-hover:text-[#d4af37] transition-colors">
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    {task.projects && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/50">
                        <FolderKanban className="w-3 h-3 text-[#d4af37]" />
                        <span className="truncate max-w-[100px]">{task.projects.title}</span>
                      </span>
                    )}
                    {task.goals && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/50">
                        <Target className="w-3 h-3 text-[#d4af37]" />
                        <span className="truncate max-w-[100px]">{task.goals.title}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 font-mono text-[11px] text-zinc-400">
                    <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>{utcToLocal(task.deadline_at, timezone)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-800/80 bg-zinc-900/30 p-8 text-center backdrop-blur-sm">
            <CheckSquare className="w-8 h-8 text-[#d4af37] mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-semibold text-zinc-200">Make your next commitment.</h3>
            <p className="text-xs text-zinc-500 mt-1">You have no pending task commitments due. Create a task to start execution.</p>
            <Link
              href="/app/tasks"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Create Task</span>
            </Link>
          </div>
        )}
      </div>

      {/* ACTIVE WORK & DOMAIN HIERARCHY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Goals Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#d4af37]" />
              <h2 className="text-lg font-bold tracking-tight text-zinc-100">Active Goals</h2>
            </div>
            <Link
              href="/app/goals"
              className="text-xs font-medium text-[#d4af37] hover:underline inline-flex items-center gap-1"
            >
              <span>Manage Goals</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeGoals.length > 0 ? (
            <div className="space-y-3">
              {activeGoals.slice(0, 3).map((goal) => {
                const linkedProjects = projects.filter((p) => p.goal_id === goal.id);
                const linkedTasks = tasksList.filter((t) => t.goal_id === goal.id);
                const completedLinkedTasks = linkedTasks.filter((t) => t.status === 'completed');
                const progressPct = linkedTasks.length > 0 ? Math.round((completedLinkedTasks.length / linkedTasks.length) * 100) : 0;

                return (
                  <div
                    key={goal.id}
                    className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 backdrop-blur-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-zinc-100 text-sm">{goal.title}</h3>
                      <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/50">
                        {linkedProjects.length} {linkedProjects.length === 1 ? 'project' : 'projects'}
                      </span>
                    </div>

                    {goal.description && (
                      <p className="text-xs text-zinc-400 line-clamp-1">{goal.description}</p>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>Progress</span>
                        <span>{progressPct}% ({completedLinkedTasks.length}/{linkedTasks.length} tasks)</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#d4af37] to-amber-300 transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-800/80 bg-zinc-900/30 p-8 text-center backdrop-blur-sm">
              <Target className="w-8 h-8 text-[#d4af37] mx-auto mb-2 opacity-80" />
              <h3 className="text-sm font-semibold text-zinc-200">Start with what matters most.</h3>
              <p className="text-xs text-zinc-500 mt-1">Define long-term objectives to ground your work.</p>
              <Link
                href="/app/goals"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Create Goal</span>
              </Link>
            </div>
          )}
        </div>

        {/* Active Projects Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-[#d4af37]" />
              <h2 className="text-lg font-bold tracking-tight text-zinc-100">Active Projects</h2>
            </div>
            <Link
              href="/app/projects"
              className="text-xs font-medium text-[#d4af37] hover:underline inline-flex items-center gap-1"
            >
              <span>Manage Projects</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeProjects.length > 0 ? (
            <div className="space-y-3">
              {activeProjects.slice(0, 3).map((project) => {
                const linkedTasks = tasksList.filter((t) => t.project_id === project.id);
                const completedTasksCount = linkedTasks.filter((t) => t.status === 'completed').length;
                const progressPct = linkedTasks.length > 0 ? Math.round((completedTasksCount / linkedTasks.length) * 100) : 0;

                return (
                  <div
                    key={project.id}
                    className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 backdrop-blur-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {project.color_accent && (
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: project.color_accent }}
                          />
                        )}
                        <h3 className="font-semibold text-zinc-100 text-sm">{project.title}</h3>
                      </div>

                      {project.goals && (
                        <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/50 truncate max-w-[120px]">
                          {project.goals.title}
                        </span>
                      )}
                    </div>

                    {project.description && (
                      <p className="text-xs text-zinc-400 line-clamp-1">{project.description}</p>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>Project Execution</span>
                        <span>{completedTasksCount}/{linkedTasks.length} tasks completed</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#d4af37] to-amber-300 transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-800/80 bg-zinc-900/30 p-8 text-center backdrop-blur-sm">
              <FolderKanban className="w-8 h-8 text-[#d4af37] mx-auto mb-2 opacity-80" />
              <h3 className="text-sm font-semibold text-zinc-200">Turn a goal into a body of work.</h3>
              <p className="text-xs text-zinc-500 mt-1">Break down objectives into structured project streams.</p>
              <Link
                href="/app/projects"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Create Project</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
