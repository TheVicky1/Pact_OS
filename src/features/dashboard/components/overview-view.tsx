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
  ArrowUpRight,
} from 'lucide-react';
import { Alert } from '@/components/ui';

// Modular Phase 4E Dashboard Components
import { DailyFocusHero } from './daily-focus-hero';
import { ActiveFocusCard } from './active-focus-card';
import { FollowThroughWidget } from './follow-through-widget';
import { DailyCadenceWidget } from './daily-cadence-widget';
import { DailyCalendarWidget } from '@/features/calendar';

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

      {/* 2. Metrics Summary Strip (Real Data Only — Luxury Dark + Warm Gold) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Pending Commitments */}
        <Link href="/app/tasks" className="block focus-visible:outline-none group">
          <div className="h-full flex flex-col justify-between rounded-3xl bg-[rgba(16,16,22,0.85)] border border-white/[0.08] p-5 sm:p-6 shadow-xl shadow-black/40 backdrop-blur-xl relative overflow-hidden transition-all duration-200 hover:border-[#d4af37]/35 hover:shadow-2xl hover:shadow-[#d4af37]/5 hover:-translate-y-0.5">
            {/* Subtle Orbital Background Accent */}
            <svg
              aria-hidden="true"
              className="absolute -top-6 -right-6 w-24 h-24 text-[#d4af37]/10 group-hover:text-[#d4af37]/20 transition-all pointer-events-none stroke-current"
              viewBox="0 0 100 100"
              fill="none"
            >
              <circle cx="80" cy="20" r="40" strokeWidth="1.5" strokeDasharray="4 4" />
              <circle cx="80" cy="20" r="60" strokeWidth="1" opacity="0.6" />
            </svg>

            <div className="relative z-10 flex items-center justify-between text-zinc-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Pending Commitments
              </span>
              <div className="w-8 h-8 rounded-xl bg-zinc-900/80 border border-white/[0.08] flex items-center justify-center text-[#d4af37] group-hover:border-[#d4af37]/30 transition-colors">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>

            <div className="relative z-10">
              <div className="text-3xl sm:text-4xl font-extrabold text-zinc-100 font-mono tracking-tight">
                {pendingTasks.length}
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mt-1.5">
                <span>{completedTasks.length} completed</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-[#d4af37] transition-colors" />
              </div>
            </div>
          </div>
        </Link>

        {/* Active Goals */}
        <Link href="/app/goals" className="block focus-visible:outline-none group">
          <div className="h-full flex flex-col justify-between rounded-3xl bg-[rgba(16,16,22,0.85)] border border-white/[0.08] p-5 sm:p-6 shadow-xl shadow-black/40 backdrop-blur-xl relative overflow-hidden transition-all duration-200 hover:border-[#d4af37]/35 hover:shadow-2xl hover:shadow-[#d4af37]/5 hover:-translate-y-0.5">
            {/* Subtle Orbital Background Accent */}
            <svg
              aria-hidden="true"
              className="absolute -top-6 -right-6 w-24 h-24 text-[#d4af37]/10 group-hover:text-[#d4af37]/20 transition-all pointer-events-none stroke-current"
              viewBox="0 0 100 100"
              fill="none"
            >
              <circle cx="80" cy="20" r="40" strokeWidth="1.5" strokeDasharray="4 4" />
              <circle cx="80" cy="20" r="60" strokeWidth="1" opacity="0.6" />
            </svg>

            <div className="relative z-10 flex items-center justify-between text-zinc-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Active Goals
              </span>
              <div className="w-8 h-8 rounded-xl bg-zinc-900/80 border border-white/[0.08] flex items-center justify-center text-[#d4af37] group-hover:border-[#d4af37]/30 transition-colors">
                <Target className="w-4 h-4" />
              </div>
            </div>

            <div className="relative z-10">
              <div className="text-3xl sm:text-4xl font-extrabold text-zinc-100 font-mono tracking-tight">
                {activeGoals.length}
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mt-1.5">
                <span>Out of {goals.length} total</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-[#d4af37] transition-colors" />
              </div>
            </div>
          </div>
        </Link>

        {/* Active Projects */}
        <Link href="/app/projects" className="block focus-visible:outline-none group">
          <div className="h-full flex flex-col justify-between rounded-3xl bg-[rgba(16,16,22,0.85)] border border-white/[0.08] p-5 sm:p-6 shadow-xl shadow-black/40 backdrop-blur-xl relative overflow-hidden transition-all duration-200 hover:border-[#d4af37]/35 hover:shadow-2xl hover:shadow-[#d4af37]/5 hover:-translate-y-0.5">
            {/* Subtle Orbital Background Accent */}
            <svg
              aria-hidden="true"
              className="absolute -top-6 -right-6 w-24 h-24 text-[#d4af37]/10 group-hover:text-[#d4af37]/20 transition-all pointer-events-none stroke-current"
              viewBox="0 0 100 100"
              fill="none"
            >
              <circle cx="80" cy="20" r="40" strokeWidth="1.5" strokeDasharray="4 4" />
              <circle cx="80" cy="20" r="60" strokeWidth="1" opacity="0.6" />
            </svg>

            <div className="relative z-10 flex items-center justify-between text-zinc-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Active Projects
              </span>
              <div className="w-8 h-8 rounded-xl bg-zinc-900/80 border border-white/[0.08] flex items-center justify-center text-[#d4af37] group-hover:border-[#d4af37]/30 transition-colors">
                <FolderKanban className="w-4 h-4" />
              </div>
            </div>

            <div className="relative z-10">
              <div className="text-3xl sm:text-4xl font-extrabold text-zinc-100 font-mono tracking-tight">
                {activeProjects.length}
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mt-1.5">
                <span>Out of {projects.length} total</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-[#d4af37] transition-colors" />
              </div>
            </div>
          </div>
        </Link>

        {/* Missed Commitments */}
        <div className="h-full flex flex-col justify-between rounded-3xl bg-[rgba(16,16,22,0.85)] border border-white/[0.08] p-5 sm:p-6 shadow-xl shadow-black/40 backdrop-blur-xl relative overflow-hidden group">
          {/* Subtle Orbital Background Accent */}
          <svg
            aria-hidden="true"
            className="absolute -top-6 -right-6 w-24 h-24 text-zinc-700/10 transition-all pointer-events-none stroke-current"
            viewBox="0 0 100 100"
            fill="none"
          >
            <circle cx="80" cy="20" r="40" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx="80" cy="20" r="60" strokeWidth="1" opacity="0.6" />
          </svg>

          <div className="relative z-10 flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Missed Commitments
            </span>
            <div className="w-8 h-8 rounded-xl bg-zinc-900/80 border border-white/[0.08] flex items-center justify-center text-zinc-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="relative z-10">
            <div className="text-3xl sm:text-4xl font-extrabold text-zinc-200 font-mono tracking-tight">
              {missedTasks.length}
            </div>
            <p className="text-xs text-zinc-400 mt-1.5">
              Authoritative lifecycle
            </p>
          </div>
        </div>
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
