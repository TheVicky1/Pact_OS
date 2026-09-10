'use client';

import React, { useState, useMemo } from 'react';
import { Goal } from '@/types/domain';
import { TaskWithParents } from '@/features/tasks/data-access';
import { ProjectWithGoal } from '@/features/projects/data-access';
import { completeTaskAction } from '@/features/tasks/actions';
import Link from 'next/link';
import {
  Target,
  FolderKanban,
  CheckSquare,
  Clock,
} from 'lucide-react';
import { GlassCard, Alert } from '@/components/ui';

// Modular Phase 4E Dashboard Components
import { DailyFocusHero } from './daily-focus-hero';
import { ActiveFocusCard } from './active-focus-card';
import { FollowThroughWidget } from './follow-through-widget';
import { DailyCadenceWidget } from './daily-cadence-widget';
import { DailyCalendarWidget } from '@/features/calendar';
import { UpcomingCommitmentsWidget } from './upcoming-commitments-widget';
import { DomainSummaryWidgets } from './domain-summary-widgets';

import { useRouter } from 'next/navigation';
import { InterventionBanner } from '@/features/accountability/components/intervention-banner';
import { InterventionModal } from '@/features/accountability/components/intervention-modal';
import type { ActivatedCommitmentDetails, WeeklyWaiverUsage } from '@/features/accountability/data-access';
import { SundayRitualBanner } from '@/features/weekly-review/components';
import { isSundayRitualDay } from '@/lib/weekly-review/week';
import { getLocalDateString } from '@/lib/time';

interface OverviewViewProps {
  goals: Goal[];
  projects: ProjectWithGoal[];
  tasks: TaskWithParents[];
  userName: string;
  timezone: string;
  activatedCommitments?: ActivatedCommitmentDetails[];
  waiverUsage?: WeeklyWaiverUsage;
}

export function OverviewView({
  goals,
  projects,
  tasks: initialTasks,
  userName,
  timezone,
  activatedCommitments = [],
  waiverUsage,
}: OverviewViewProps) {
  const router = useRouter();
  const [tasksList, setTasksList] = useState<TaskWithParents[]>(initialTasks);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedIntervention, setSelectedIntervention] = useState<ActivatedCommitmentDetails | null>(null);

  // Sync state if initialTasks updates from server revalidation
  const [prevTasks, setPrevTasks] = useState(initialTasks);
  if (initialTasks !== prevTasks) {
    setPrevTasks(initialTasks);
    setTasksList(initialTasks);
  }

  // Derive Time of Day Greeting in user's profile IANA timezone
  const greeting = useMemo(() => {
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
  }, [timezone]);

  // Authoritative Derived Metrics (Strictly from real data)
  const activeGoals = useMemo(() => goals.filter((g) => g.status === 'active'), [goals]);
  const activeProjects = useMemo(() => projects.filter((p) => p.status === 'active'), [projects]);
  const pendingTasks = useMemo(
    () => tasksList.filter((t) => t.status === 'pending' || t.status === 'in_progress'),
    [tasksList]
  );
  const completedTasks = useMemo(
    () => tasksList.filter((t) => t.status === 'completed'),
    [tasksList]
  );
  const missedTasks = useMemo(
    () => tasksList.filter((t) => t.status === 'missed'),
    [tasksList]
  );

  const urgentCount = useMemo(
    () => pendingTasks.filter((t) => t.priority === 'urgent').length,
    [pendingTasks]
  );

  // Nearest pending commitment for Active Focus Card
  const immediateFocusTask = useMemo(() => {
    const sorted = [...pendingTasks].sort(
      (a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime()
    );
    return sorted[0] || null;
  }, [pendingTasks]);

  // Top 4 upcoming commitments for Upcoming Commitments section
  const upcomingTasks = useMemo(() => {
    return [...pendingTasks]
      .sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime())
      .slice(0, 4);
  }, [pendingTasks]);

  // Authoritative Task Completion Action (preserving optimistic update & rollback)
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

  const isSunday = useMemo(() => {
    try {
      const localDate = getLocalDateString(new Date(), timezone);
      return isSundayRitualDay(localDate, timezone);
    } catch {
      return false;
    }
  }, [timezone]);

  return (
    <div className="space-y-8 pb-12">
      {/* 0. Accountability Active Intervention Banner */}
      {activatedCommitments.length > 0 && (
        <InterventionBanner
          activatedCount={activatedCommitments.length}
          onReview={() => setSelectedIntervention(activatedCommitments[0])}
        />
      )}

      {/* 0.1 Sunday Weekly Review Ritual Banner */}
      {isSunday && (
        <SundayRitualBanner
          isSunday={true}
          isCompleted={false}
          weekLabel="This Week"
        />
      )}

      {/* 1. Daily Focus Hero & Date Ribbon */}
      <DailyFocusHero
        userName={userName}
        greeting={greeting}
        pendingCount={pendingTasks.length}
        completedCount={completedTasks.length}
        urgentCount={urgentCount}
        timezone={timezone}
      />

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

      {/* 2. Metrics Summary Strip (Real Data Only) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Pending Commitments */}
        <Link href="/app/tasks" className="block focus-visible:outline-none">
          <GlassCard
            variant="interactive"
            padding="md"
            className="h-full flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-zinc-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Pending Commitments
              </span>
              <CheckSquare className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-zinc-100 font-mono tracking-tight">
                {pendingTasks.length}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1.5">
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
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Active Goals
              </span>
              <Target className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-zinc-100 font-mono tracking-tight">
                {activeGoals.length}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1.5">
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
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Active Projects
              </span>
              <FolderKanban className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-zinc-100 font-mono tracking-tight">
                {activeProjects.length}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1.5">
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
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Missed Commitments
            </span>
            <Clock className="w-4 h-4 text-zinc-500" />
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold text-zinc-300 font-mono tracking-tight">
              {missedTasks.length}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5">
              Authoritative lifecycle
            </p>
          </div>
        </GlassCard>
      </div>

      {/* 3. Command Center Featured Cards Grid (Visual North Star Trio) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <ActiveFocusCard
          task={immediateFocusTask}
          timezone={timezone}
          onComplete={handleCompleteTask}
          isCompleting={completingTaskId === immediateFocusTask?.id}
        />

        <FollowThroughWidget
          completedCount={completedTasks.length}
          missedCount={missedTasks.length}
          pendingCount={pendingTasks.length}
        />

        <DailyCadenceWidget
          tasks={tasksList}
          timezone={timezone}
        />
      </div>

      {/* 4. Daily Calendar Widget (Day Planner & Schedule Horizon) */}
      <DailyCalendarWidget
        timezone={timezone}
        projects={projects}
        goals={goals}
        tasks={tasksList}
      />

      {/* 5. Upcoming Commitments Section */}
      <UpcomingCommitmentsWidget
        tasks={upcomingTasks}
        timezone={timezone}
        onComplete={handleCompleteTask}
        completingTaskId={completingTaskId}
      />

      {/* 6. Active Goals & Active Projects Split Grid */}
      <DomainSummaryWidgets
        goals={goals}
        projects={projects}
        tasks={tasksList}
      />

      {/* Accountability Intervention Modal */}
      {selectedIntervention && waiverUsage && (
        <InterventionModal
          isOpen={Boolean(selectedIntervention)}
          onClose={() => setSelectedIntervention(null)}
          commitment={selectedIntervention}
          waiverUsage={waiverUsage}
          timezone={timezone}
          onResolved={() => {
            setSelectedIntervention(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
