'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  GitCommit,
  GitPullRequest,
  Flame,
  Trophy,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  FolderGit2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { GitHubActivitySummary } from '@/lib/integrations/proof-of-work/github';
import { GitHubContributionHeatmap } from './github-contribution-heatmap';
import { getGitHubActivitySummaryAction } from '../github-actions';

function GitHubIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

interface GitHubProofOfWorkCardProps {
  initialSummary?: GitHubActivitySummary | null;
  isConnected: boolean;
  username?: string;
  verifiedProofsCount?: number;
}

export function GitHubProofOfWorkCard({
  initialSummary,
  isConnected: initialIsConnected,
  username: initialUsername,
  verifiedProofsCount: initialVerifiedCount = 0,
}: GitHubProofOfWorkCardProps) {
  const [summary, setSummary] = useState<GitHubActivitySummary | null | undefined>(initialSummary);
  const [isConnected, setIsConnected] = useState<boolean>(initialIsConnected);
  const [username, setUsername] = useState<string | undefined>(initialUsername);
  const [verifiedCount, setVerifiedCount] = useState<number>(initialVerifiedCount);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await getGitHubActivitySummaryAction(true);
      if (res.success && res.data) {
        setSummary(res.data);
        setIsConnected(res.isConnected);
        if (res.username) setUsername(res.username);
        if (typeof res.verifiedProofsCount === 'number') {
          setVerifiedCount(res.verifiedProofsCount);
        }
      } else if (!res.isConnected) {
        setIsConnected(false);
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    });
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 30) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  // 1. Disconnected State Banner
  if (!isConnected) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-[#121217]/80 backdrop-blur-md p-6 shadow-lg shadow-black/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400">
              <GitHubIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                GitHub Proof of Work
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                  Not Connected
                </span>
              </h3>
              <p className="text-xs text-zinc-400 max-w-xl">
                Connect your GitHub account in Settings to automatically sync and visualize your daily
                commits, pull requests, contribution streaks, and fulfill accountability commitments with cryptographically verifiable proof.
              </p>
            </div>
          </div>

          <Link
            href="/app/settings"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 transition-colors shrink-0"
          >
            <GitHubIcon className="w-4 h-4" />
            Connect GitHub in Settings
          </Link>
        </div>
      </div>
    );
  }

  const maxRepoCount = summary?.topRepositories?.[0]?.totalCount || 1;

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#121217]/80 backdrop-blur-md p-6 shadow-lg shadow-black/40 space-y-6">
      {/* 1. Header with Account Details and Live Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400">
            <GitHubIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-zinc-100">
                GitHub Proof of Work
              </h3>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Verified contribution history and execution metrics for{' '}
              <span className="text-amber-400 font-mono">@{username || summary?.username}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {summary?.syncedAt && (
            <span className="text-[11px] text-zinc-500 hidden md:inline-block">
              Synced {formatRelativeTime(summary.syncedAt)}
            </span>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 disabled:opacity-50 transition-colors"
            title="Refresh GitHub activity"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isPending ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Key Proof-of-Work Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Contributions */}
        <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Contributions</span>
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-zinc-100">
            {summary ? summary.totalContributions.toLocaleString() : '—'}
          </div>
          <div className="text-[10px] text-zinc-500">
            {summary ? `${summary.last30DaysCount} in last 30d` : 'Past 365 days'}
          </div>
        </div>

        {/* Current Streak */}
        <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Current Streak</span>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-400">
            {summary ? `${summary.currentStreak} ${summary.currentStreak === 1 ? 'day' : 'days'}` : '—'}
          </div>
          <div className="text-[10px] text-zinc-500">
            Active daily cadence
          </div>
        </div>

        {/* Longest Streak */}
        <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Longest Streak</span>
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-zinc-100">
            {summary ? `${summary.longestStreak} ${summary.longestStreak === 1 ? 'day' : 'days'}` : '—'}
          </div>
          <div className="text-[10px] text-zinc-500">
            All-time record
          </div>
        </div>

        {/* Total Commits */}
        <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Total Commits</span>
            <GitCommit className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-zinc-100">
            {summary ? summary.totalCommits.toLocaleString() : '—'}
          </div>
          <div className="text-[10px] text-zinc-500">
            Verified pushes
          </div>
        </div>

        {/* Total PRs */}
        <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Pull Requests</span>
            <GitPullRequest className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-zinc-100">
            {summary ? summary.totalPRs.toLocaleString() : '—'}
          </div>
          <div className="text-[10px] text-zinc-500">
            Merged & open
          </div>
        </div>

        {/* Verified Proofs */}
        <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>PACT Proofs</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">
            {verifiedCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500">
            Fulfillments recorded
          </div>
        </div>
      </div>

      {/* 3. Heatmap Visualization */}
      <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
        <GitHubContributionHeatmap
          dailyContributions={summary?.dailyContributions || []}
          username={username || summary?.username}
          totalContributions={summary?.totalContributions}
        />
      </div>

      {/* 4. Lower Two-Column Section: Top Repositories & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Top Repositories */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-amber-400" />
              Active Repositories
            </h4>
            <span className="text-[11px] text-zinc-500">
              {summary?.topRepositories?.length || 0} active
            </span>
          </div>

          <div className="space-y-2">
            {!summary || summary.topRepositories.length === 0 ? (
              <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-500">
                No recent repository activity found.
              </div>
            ) : (
              summary.topRepositories.map((repo) => {
                const percentage = Math.round((repo.totalCount / maxRepoCount) * 100);
                return (
                  <div
                    key={repo.name}
                    className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <a
                        href={`https://github.com/${repo.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-zinc-200 hover:text-amber-400 transition-colors flex items-center gap-1 truncate max-w-[260px]"
                      >
                        <span className="truncate">{repo.name}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 text-zinc-500" />
                      </a>
                      <span className="text-zinc-400 font-medium shrink-0">
                        {repo.totalCount} {repo.totalCount === 1 ? 'event' : 'events'}
                      </span>
                    </div>

                    {/* Proportional Activity Bar */}
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
                        style={{ width: `${Math.max(percentage, 8)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span>{repo.commitCount} commits</span>
                      <span>{repo.prCount} PRs</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <GitCommit className="w-3.5 h-3.5 text-amber-400" />
              Recent Verified Activity
            </h4>
            <span className="text-[11px] text-zinc-500">
              Latest {summary?.recentActivities?.length || 0} events
            </span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
            {!summary || summary.recentActivities.length === 0 ? (
              <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-500">
                No recent commits or pull requests found.
              </div>
            ) : (
              summary.recentActivities.map((act) => {
                const isCommit = act.type === 'commit';
                return (
                  <div
                    key={act.id}
                    className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`p-1.5 rounded mt-0.5 shrink-0 ${
                          isCommit
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}
                      >
                        {isCommit ? (
                          <GitCommit className="w-3.5 h-3.5" />
                        ) : (
                          <GitPullRequest className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-xs font-medium text-zinc-200 line-clamp-1">
                          {act.title}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 truncate">
                          <span className="font-mono text-zinc-400 truncate">{act.repository}</span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-zinc-500 shrink-0">{formatRelativeTime(act.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    {act.url && (
                      <a
                        href={act.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-zinc-500 hover:text-amber-400 transition-colors shrink-0"
                        title="View on GitHub"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
