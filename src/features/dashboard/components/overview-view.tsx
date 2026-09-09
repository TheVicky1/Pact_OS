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
  Clock,
  ChevronRight,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { GlassCard, Button, Badge, Alert, GoldSpotlight } from '@/components/ui';

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

  // Derive Time of Day Greeting in profile timezone
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

  // Authoritative Metrics (Strictly derived from real data)
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
      {/* Hero / Daily Focus Area */}
      <GlassCard variant="spotlight" padding="lg" className="relative overflow-hidden">
        <GoldSpotlight position="top-right" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="gold" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                PACT Personal Operating System
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-100">
              {getGreeting()},{' '}
              <span className="text-gradient-gold">{userName || 'Committed User'}</span>
            </h1>

            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              {pendingTasks.length > 0
                ? `You have ${pendingTasks.length} ${
                    pendingTasks.length === 1 ? 'commitment' : 'commitments'
                  } scheduled. Take deliberate, disciplined action.`
                : 'All commitments are in order. Set an intentional target or review your active goals.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/app/tasks">
              <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
                New Commitment
              </Button>
            </Link>
          </div>
        </div>
      </GlassCard>

      {/* Action Error Callout */}
      {actionError && (
        <Alert
          variant="danger"
          title="Action Failed"
          onDismiss={() => setActionError(null)}
        >
          {actionError}
        </Alert>
      )}

      {/* Metrics Grid (Real PACT Data Only) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Pending Commitments */}
        <Link href="/app/tasks" className="block focus-visible:outline-none">
          <GlassCard
            variant="interactive"
            padding="md"
            className="h-full flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-zinc-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Pending Commitments
              </span>
              <CheckSquare className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-zinc-100 font-mono tracking-tight">
                {pendingTasks.length}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5">
                {completedTasks.length} completed
              </p>
            </div>
          </GlassCard>
        </Link>

        {/* Active Goals */}
        <Link href="/app/goals" className="block focus-visible:outline-none">
          <GlassCard
            variant="interactive"
            padding="md"
            className="h-full flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-zinc-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Active Goals
              </span>
              <Target className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-zinc-100 font-mono tracking-tight">
                {activeGoals.length}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5">
                Out of {goals.length} total
              </p>
            </div>
          </GlassCard>
        </Link>

        {/* Active Projects */}
        <Link href="/app/projects" className="block focus-visible:outline-none">
          <GlassCard
            variant="interactive"
            padding="md"
            className="h-full flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-zinc-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Active Projects
              </span>
              <FolderKanban className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-zinc-100 font-mono tracking-tight">
                {activeProjects.length}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5">
                Out of {projects.length} total
              </p>
            </div>
          </GlassCard>
        </Link>

        {/* Missed Commitments */}
        <GlassCard
          variant="default"
          padding="md"
          className="h-full flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Missed Commitments
            </span>
            <Clock className="w-4 h-4 text-zinc-500" />
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-zinc-300 font-mono tracking-tight">
              {missedTasks.length}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Authoritative lifecycle
            </p>
          </div>
        </GlassCard>
      </div>

      {/* UPCOMING COMMITMENTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#d4af37]" />
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-100">
              Upcoming Commitments
            </h2>
          </div>
          <Link
            href="/app/tasks"
            className="text-xs font-medium text-[#d4af37] hover:text-[#e5c158] transition-colors inline-flex items-center gap-1"
          >
            <span>View All Tasks</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcomingTasks.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcomingTasks.map((task) => {
              const priorityVariant =
                task.priority === 'urgent'
                  ? 'danger'
                  : task.priority === 'high'
                  ? 'warning'
                  : 'neutral';

              return (
                <GlassCard
                  key={task.id}
                  variant="default"
                  padding="md"
                  className="flex flex-col justify-between space-y-4 hover:border-white/[0.14] transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={priorityVariant} size="sm">
                        {task.priority.toUpperCase()}
                      </Badge>

                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={completingTaskId === task.id}
                        onClick={() => handleCompleteTask(task.id)}
                        icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      >
                        {completingTaskId === task.id ? 'Completing...' : 'Mark Done'}
                      </Button>
                    </div>

                    <h3 className="font-semibold text-zinc-100 text-base leading-snug">
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400 gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {task.projects && (
                        <Badge
                          variant="neutral"
                          size="sm"
                          icon={<FolderKanban className="w-3 h-3 text-[#d4af37]" />}
                        >
                          <span className="truncate max-w-[120px]">{task.projects.title}</span>
                        </Badge>
                      )}
                      {task.goals && (
                        <Badge
                          variant="neutral"
                          size="sm"
                          icon={<Target className="w-3 h-3 text-[#d4af37]" />}
                        >
                          <span className="truncate max-w-[120px]">{task.goals.title}</span>
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-400 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>{utcToLocal(task.deadline_at, timezone)}</span>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        ) : (
          <GlassCard variant="default" padding="lg" className="text-center py-10">
            <CheckSquare className="w-8 h-8 text-[#d4af37]/70 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-200">
              Make your next commitment
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              You have no pending commitments due. Take disciplined action and schedule a new task.
            </p>
            <div className="mt-4">
              <Link href="/app/tasks">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5 text-[#d4af37]" />}
                >
                  Create Task
                </Button>
              </Link>
            </div>
          </GlassCard>
        )}
      </div>

      {/* DOMAIN HIERARCHY: ACTIVE GOALS & ACTIVE PROJECTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Goals Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#d4af37]" />
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-100">
                Active Goals
              </h2>
            </div>
            <Link
              href="/app/goals"
              className="text-xs font-medium text-[#d4af37] hover:text-[#e5c158] transition-colors inline-flex items-center gap-1"
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
                const progressPct =
                  linkedTasks.length > 0
                    ? Math.round((completedLinkedTasks.length / linkedTasks.length) * 100)
                    : 0;

                return (
                  <GlassCard key={goal.id} variant="default" padding="sm" className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-zinc-100 text-sm">{goal.title}</h3>
                      <Badge variant="neutral" size="sm">
                        {linkedProjects.length}{' '}
                        {linkedProjects.length === 1 ? 'project' : 'projects'}
                      </Badge>
                    </div>

                    {goal.description && (
                      <p className="text-xs text-zinc-400 line-clamp-1">{goal.description}</p>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                        <span className="font-sans text-zinc-500">Progress</span>
                        <span>
                          {progressPct}% ({completedLinkedTasks.length}/{linkedTasks.length} tasks)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-800/80 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#d4af37] to-amber-300 transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          ) : (
            <GlassCard variant="default" padding="lg" className="text-center py-8">
              <Target className="w-7 h-7 text-[#d4af37]/70 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-zinc-200">Start with what matters</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Define long-term objectives to ground your daily commitments.
              </p>
              <div className="mt-4">
                <Link href="/app/goals">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5 text-[#d4af37]" />}
                  >
                    Create Goal
                  </Button>
                </Link>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Active Projects Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-[#d4af37]" />
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-100">
                Active Projects
              </h2>
            </div>
            <Link
              href="/app/projects"
              className="text-xs font-medium text-[#d4af37] hover:text-[#e5c158] transition-colors inline-flex items-center gap-1"
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
                const progressPct =
                  linkedTasks.length > 0
                    ? Math.round((completedTasksCount / linkedTasks.length) * 100)
                    : 0;

                return (
                  <GlassCard key={project.id} variant="default" padding="sm" className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
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
                        <Badge variant="neutral" size="sm">
                          <span className="truncate max-w-[120px]">{project.goals.title}</span>
                        </Badge>
                      )}
                    </div>

                    {project.description && (
                      <p className="text-xs text-zinc-400 line-clamp-1">{project.description}</p>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                        <span className="font-sans text-zinc-500">Execution</span>
                        <span>
                          {progressPct}% ({completedTasksCount}/{linkedTasks.length} tasks)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-800/80 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#d4af37] to-amber-300 transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          ) : (
            <GlassCard variant="default" padding="lg" className="text-center py-8">
              <FolderKanban className="w-7 h-7 text-[#d4af37]/70 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-zinc-200">
                Turn a goal into a body of work
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Break down objectives into structured project streams.
              </p>
              <div className="mt-4">
                <Link href="/app/projects">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5 text-[#d4af37]" />}
                  >
                    Create Project
                  </Button>
                </Link>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Phase 4E Horizon Boundary */}
      <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-500">
        <span className="font-medium text-zinc-400">Timeline Horizon</span>
        <span className="text-[11px] text-zinc-600">Reserved for Phase 4E Timeline & Visualization</span>
      </div>
    </div>
  );
}
