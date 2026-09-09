'use client';

import React from 'react';
import { Goal } from '@/types/domain';
import { ProjectWithGoal } from '@/features/projects/data-access';
import { TaskWithParents } from '@/features/tasks/data-access';
import { GlassCard, Button, Badge } from '@/components/ui';
import { Target, FolderKanban, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';

export interface DomainSummaryWidgetsProps {
  goals: Goal[];
  projects: ProjectWithGoal[];
  tasks: TaskWithParents[];
}

/**
 * PACT Active Goals & Projects Summary Widgets
 * Renders domain hierarchy cards with progress derived strictly from real linked tasks.
 */
export function DomainSummaryWidgets({
  goals,
  projects,
  tasks,
}: DomainSummaryWidgetsProps) {
  const activeGoals = goals.filter((g) => g.status === 'active');
  const activeProjects = projects.filter((p) => p.status === 'active');

  return (
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
              const linkedTasks = tasks.filter((t) => t.goal_id === goal.id);
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
                      <span className="font-sans text-zinc-400">Progress</span>
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
            <p className="text-xs text-zinc-400 mt-1">
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
              const linkedTasks = tasks.filter((t) => t.project_id === project.id);
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
                      <span className="font-sans text-zinc-400">Execution</span>
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
            <p className="text-xs text-zinc-400 mt-1">
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
  );
}
