'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  GitCommit,
  GitPullRequest,
  Flame,
  Trophy,
  RefreshCw,
  ShieldCheck,
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
  const [justSynced, setJustSynced] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    if (isPending) return;
    setErrorMessage(null);
    setJustSynced(false);

    startTransition(async () => {
      const res = await getGitHubActivitySummaryAction(true);
      if (res.success && res.data) {
        setSummary(res.data);
        setIsConnected(res.isConnected);
        if (res.username) setUsername(res.username);
        if (typeof res.verifiedProofsCount === 'number') {
          setVerifiedCount(res.verifiedProofsCount);
        }
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 3000);
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
      <div className="glass-card rounded-3xl p-6 sm:p-7 shadow-xl shadow-black/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-zinc-900 border border-white/[0.08] text-[#d4af37] shrink-0">
              <GitHubIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                GitHub Proof of Work
                <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-white/[0.06]">
                  Not Connected
                </span>
              </h3>
              <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                Connect your GitHub account in Settings to automatically sync and visualize your daily
                commits, pull requests, contribution streaks, and fulfill accountability commitments with cryptographically verifiable proof.
              </p>
            </div>
          </div>

          <Link
            href="/app/settings"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-[#d4af37]/15 text-[#e2c056] border border-[#d4af37]/40 hover:bg-[#d4af37]/25 transition-all shrink-0"
          >
            <GitHubIcon className="w-4 h-4" />
            Connect GitHub in Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-7 shadow-xl shadow-black/40 space-y-6">
      {/* 1. Header with Account Details and Live Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-zinc-900 border border-white/[0.08] text-[#d4af37] shrink-0">
            <GitHubIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-zinc-100">
                GitHub Proof of Work
              </h3>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Verified contribution history and execution metrics for{' '}
              <span className="text-[#e2c056] font-mono">@{username || summary?.username}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {justSynced ? (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in duration-150">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Synced Just now
            </span>
          ) : summary?.syncedAt ? (
            <span className="text-xs text-zinc-400 hidden md:inline-block">
              Synced {formatRelativeTime(summary.syncedAt)}
            </span>
          ) : null}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              isPending
                ? 'bg-[#121217] text-zinc-400 border-white/[0.08] opacity-70 cursor-not-allowed'
                : justSynced
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-sm'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/[0.08] hover:border-white/[0.16]'
            }`}
            title="Refresh GitHub activity"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isPending
                  ? 'animate-spin text-[#d4af37]'
                  : justSynced
                  ? 'text-emerald-400'
                  : 'text-[#d4af37]'
              }`}
            />
            <span>{isPending ? 'Syncing...' : justSynced ? 'Synced' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            className="self-start sm:self-auto px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Key Proof-of-Work Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Contributions */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Contributions</span>
            <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
          </div>
          <div className="text-xl font-bold text-zinc-100">
            {summary ? summary.totalContributions.toLocaleString() : '—'}
          </div>
          <div className="text-[10px] text-zinc-500">
            {summary ? `${summary.last30DaysCount} in last 30d` : 'Past year calendar'}
          </div>
        </div>

        {/* Current Streak */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-1">
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
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Longest Streak</span>
            <Trophy className="w-3.5 h-3.5 text-[#d4af37]" />
          </div>
          <div className="text-xl font-bold text-zinc-100">
            {summary ? `${summary.longestStreak} ${summary.longestStreak === 1 ? 'day' : 'days'}` : '—'}
          </div>
          <div className="text-[10px] text-zinc-500">
            All-time record
          </div>
        </div>

        {/* Total Commits */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Total Commits</span>
            <GitCommit className="w-3.5 h-3.5 text-[#d4af37]" />
          </div>
          <div className="text-xl font-bold text-zinc-100">
            {summary ? summary.totalCommits.toLocaleString() : '—'}
          </div>
          <div className="text-[10px] text-zinc-500">
            Verified pushes
          </div>
        </div>

        {/* Total PRs */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Pull Requests</span>
            <GitPullRequest className="w-3.5 h-3.5 text-[#d4af37]" />
          </div>
          <div className="text-xl font-bold text-zinc-100">
            {summary ? summary.totalPRs.toLocaleString() : '—'}
          </div>
          <div className="text-[10px] text-zinc-500">
            Merged & open
          </div>
        </div>

        {/* Verified Proofs */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-1">
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
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.06]">
        <GitHubContributionHeatmap
          dailyContributions={summary?.dailyContributions || []}
          username={username || summary?.username}
        />
      </div>
    </div>
  );
}
