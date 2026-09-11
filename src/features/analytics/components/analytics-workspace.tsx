'use client';

import React, { useState, useTransition } from 'react';
import {
  AnalyticsOverviewData,
  AnalyticsTimeRange,
} from '@/lib/analytics';
import { getAnalyticsOverviewAction } from '../actions';
import { AnalyticsHeader } from './analytics-header';
import { AnalyticsSummaryCards } from './analytics-summary-cards';
import { CommitmentActivityChart } from './commitment-activity-chart';
import { GoalProgressCard } from './goal-progress-card';
import { ProjectProgressCard } from './project-progress-card';
import {
  GitHubProofOfWorkCard,
  GitHubActivityActionResult,
  LeetCodeProofOfWorkCard,
  LeetCodeActivityActionResult,
  CodeforcesProofOfWorkCard,
  CodeforcesActivityActionResult,
} from '@/features/integrations';
import { GitBranch, Code2, Terminal, ShieldCheck } from 'lucide-react';

export type ProofOfWorkPlatform = 'github' | 'leetcode' | 'codeforces';

interface AnalyticsWorkspaceProps {
  initialData: AnalyticsOverviewData;
  userTimeZone: string;
  initialGitHubActivity?: GitHubActivityActionResult | null;
  initialLeetCodeActivity?: LeetCodeActivityActionResult | null;
  initialCodeforcesActivity?: CodeforcesActivityActionResult | null;
}

export function AnalyticsWorkspace({
  initialData,
  userTimeZone,
  initialGitHubActivity,
  initialLeetCodeActivity,
  initialCodeforcesActivity,
}: AnalyticsWorkspaceProps) {
  const [data, setData] = useState<AnalyticsOverviewData>(initialData);
  const [activePlatform, setActivePlatform] = useState<ProofOfWorkPlatform>(() => {
    // Default to first connected provider if available
    if (initialGitHubActivity?.isConnected) return 'github';
    if (initialLeetCodeActivity?.isConnected) return 'leetcode';
    if (initialCodeforcesActivity?.isConnected) return 'codeforces';
    return 'github';
  });
  const [isPending, startTransition] = useTransition();

  const loadData = (timeRange: AnalyticsTimeRange, anchorDateStr: string) => {
    startTransition(async () => {
      const res = await getAnalyticsOverviewAction(timeRange, anchorDateStr, userTimeZone);
      if (res) {
        setData(res);
      }
    });
  };

  const handleTimeRangeChange = (newRange: AnalyticsTimeRange) => {
    loadData(newRange, data.anchorDateStr);
  };

  const handlePrevPeriod = () => {
    const [y, m, d] = data.anchorDateStr.split('-').map(Number);
    const curDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

    if (data.timeRange === 'week') {
      curDate.setUTCDate(curDate.getUTCDate() - 7);
    } else if (data.timeRange === 'month') {
      curDate.setUTCMonth(curDate.getUTCMonth() - 1);
    } else {
      // quarter
      curDate.setUTCMonth(curDate.getUTCMonth() - 3);
    }

    const nextAnchor = `${curDate.getUTCFullYear()}-${String(curDate.getUTCMonth() + 1).padStart(2, '0')}-${String(curDate.getUTCDate()).padStart(2, '0')}`;
    loadData(data.timeRange, nextAnchor);
  };

  const handleNextPeriod = () => {
    const [y, m, d] = data.anchorDateStr.split('-').map(Number);
    const curDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

    if (data.timeRange === 'week') {
      curDate.setUTCDate(curDate.getUTCDate() + 7);
    } else if (data.timeRange === 'month') {
      curDate.setUTCMonth(curDate.getUTCMonth() + 1);
    } else {
      // quarter
      curDate.setUTCMonth(curDate.getUTCMonth() + 3);
    }

    const nextAnchor = `${curDate.getUTCFullYear()}-${String(curDate.getUTCMonth() + 1).padStart(2, '0')}-${String(curDate.getUTCDate()).padStart(2, '0')}`;
    loadData(data.timeRange, nextAnchor);
  };

  const handleCurrentPeriod = () => {
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: userTimeZone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    loadData(data.timeRange, todayStr);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Range Filter and Navigation */}
      <AnalyticsHeader
        timeRange={data.timeRange}
        periodLabel={data.periodLabel}
        onTimeRangeChange={handleTimeRangeChange}
        onPrevPeriod={handlePrevPeriod}
        onNextPeriod={handleNextPeriod}
        onCurrentPeriod={handleCurrentPeriod}
        isLoading={isPending}
      />

      {/* 2. Primary 4 Metric Summary Cards */}
      <AnalyticsSummaryCards
        completion={data.completionMetrics}
        sessions={data.sessionMetrics}
      />

      {/* 3. Primary Execution Chart: Commitment Activity */}
      <CommitmentActivityChart
        activityTrends={data.activityTrends}
        periodLabel={data.periodLabel}
      />

      {/* 4. Mid Grid: Goals & Projects Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoalProgressCard goals={data.goalsProgress} />
        <ProjectProgressCard projects={data.projectsProgress} />
      </div>

      {/* 5. External Proof-of-Work Hub */}
      <div className="space-y-4">
        {/* Platform Selection Tab Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl bg-zinc-900/60 border border-white/[0.06]">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#121217] border border-white/[0.04]">
            {/* GitHub Tab */}
            <button
              type="button"
              onClick={() => setActivePlatform('github')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activePlatform === 'github'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-white/[0.08]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 text-zinc-300" />
              <span>GitHub</span>
              {initialGitHubActivity?.isConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>

            {/* LeetCode Tab */}
            <button
              type="button"
              onClick={() => setActivePlatform('leetcode')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activePlatform === 'leetcode'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-white/[0.08]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-amber-400" />
              <span>LeetCode</span>
              {initialLeetCodeActivity?.isConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>

            {/* Codeforces Tab */}
            <button
              type="button"
              onClick={() => setActivePlatform('codeforces')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activePlatform === 'codeforces'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-white/[0.08]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>Codeforces</span>
              {initialCodeforcesActivity?.isConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 text-xs text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Verifiable External Proof-of-Work</span>
          </div>
        </div>

        {/* Active Proof-of-Work Card */}
        {activePlatform === 'github' && (
          <GitHubProofOfWorkCard
            initialSummary={initialGitHubActivity?.data}
            isConnected={initialGitHubActivity?.isConnected ?? false}
            username={initialGitHubActivity?.username}
            verifiedProofsCount={initialGitHubActivity?.verifiedProofsCount ?? 0}
          />
        )}

        {activePlatform === 'leetcode' && (
          <LeetCodeProofOfWorkCard
            initialSummary={initialLeetCodeActivity?.data}
            isConnected={initialLeetCodeActivity?.isConnected ?? false}
            username={initialLeetCodeActivity?.username}
            verifiedProofsCount={initialLeetCodeActivity?.verifiedProofsCount ?? 0}
          />
        )}

        {activePlatform === 'codeforces' && (
          <CodeforcesProofOfWorkCard
            initialSummary={initialCodeforcesActivity?.data}
            isConnected={initialCodeforcesActivity?.isConnected ?? false}
            handle={initialCodeforcesActivity?.handle}
            verifiedProofsCount={initialCodeforcesActivity?.verifiedProofsCount ?? 0}
          />
        )}
      </div>
    </div>
  );
}
