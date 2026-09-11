'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Code2,
  Flame,
  Trophy,
  RefreshCw,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Award,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  LeetCodeActivitySummary,
  LeetCodeDailyContribution,
} from '@/lib/integrations/proof-of-work/leetcode';
import { getLeetCodeActivitySummaryAction } from '../leetcode-actions';

function LeetCodeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 4.818 3.585 5.861 5.861 0 0 0 1.991-.079 5.89 5.89 0 0 0 1.932-.869l3.814-3.528 3.96-3.69a1.38 1.38 0 0 0-.022-1.956 1.38 1.38 0 0 0-1.954-.022L13.89 9.94l-3.79 3.507a3.106 3.106 0 0 1-1.024.461 3.12 3.12 0 0 1-1.056.042 3.185 3.185 0 0 1-2.59-1.932 3.14 3.14 0 0 1-.186-.547 3.01 3.01 0 0 1-.035-1.272 2.825 2.825 0 0 1 .65-1.127l3.85-4.123 5.4-5.787a1.378 1.378 0 0 0-.961-2.344zM20.36 15.39a1.376 1.376 0 0 0-1.376 1.376v1.376H4.136a1.376 1.376 0 0 0 0 2.752h14.848v1.376a1.376 1.376 0 0 0 2.752 0v-5.504a1.376 1.376 0 0 0-1.376-1.376z" />
    </svg>
  );
}

interface LeetCodeProofOfWorkCardProps {
  initialSummary?: LeetCodeActivitySummary | null;
  isConnected: boolean;
  username?: string;
  verifiedProofsCount?: number;
}

export function LeetCodeProofOfWorkCard({
  initialSummary,
  isConnected: initialIsConnected,
  username: initialUsername,
  verifiedProofsCount: initialVerifiedCount = 0,
}: LeetCodeProofOfWorkCardProps) {
  const [summary, setSummary] = useState<LeetCodeActivitySummary | null | undefined>(initialSummary);
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
      const res = await getLeetCodeActivitySummaryAction(true);
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
            <div className="p-3 rounded-2xl bg-zinc-900 border border-white/[0.08] text-amber-400 shrink-0">
              <LeetCodeIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                LeetCode Proof of Work
                <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-white/[0.06]">
                  Not Connected
                </span>
              </h3>
              <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                Connect your LeetCode profile in Settings to automatically verify problem-solving cadences,
                track Easy/Medium/Hard distributions, monitor contest ratings, and fulfill accountability commitments with objective algorithmic proof.
              </p>
            </div>
          </div>

          <Link
            href="/app/settings"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 transition-all shrink-0"
          >
            <LeetCodeIcon className="w-4 h-4" />
            Connect LeetCode in Settings
          </Link>
        </div>
      </div>
    );
  }

  const easyStats = summary?.difficultyStats.find((d) => d.difficulty === 'Easy');
  const mediumStats = summary?.difficultyStats.find((d) => d.difficulty === 'Medium');
  const hardStats = summary?.difficultyStats.find((d) => d.difficulty === 'Hard');

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-7 shadow-xl shadow-black/40 space-y-6">
      {/* 1. Header with Account Details and Live Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-zinc-900 border border-white/[0.08] text-amber-400 shrink-0">
            <LeetCodeIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-zinc-100">
                LeetCode Proof of Work
              </h3>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Verified problem-solving metrics and contest ratings for{' '}
              <span className="text-amber-400 font-mono">@{username || summary?.username}</span>
              {summary?.profile.ranking ? (
                <span className="text-zinc-500 ml-2">· Global Rank #{summary.profile.ranking.toLocaleString()}</span>
              ) : null}
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
            title="Refresh LeetCode activity"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isPending
                  ? 'animate-spin text-amber-400'
                  : justSynced
                  ? 'text-emerald-400'
                  : 'text-amber-400'
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

      {/* 2. Key Metric Cards (6 cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Solved */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Problems Solved</span>
            <Code2 className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-zinc-100">
            {summary ? summary.totalSolved.toLocaleString() : '—'}
          </div>
          <div className="text-[10px] text-zinc-500">
            {summary ? `${summary.totalAvailable ? Math.round((summary.totalSolved / summary.totalAvailable) * 100) : 0}% of library` : 'Algorithmic problems'}
          </div>
        </div>

        {/* Easy Solved */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Easy</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">
            {summary ? summary.easySolved.toLocaleString() : '—'}
          </div>
          <div className="text-[10px] text-zinc-500">
            {easyStats ? `${easyStats.solved} / ${easyStats.total}` : 'Fundamentals'}
          </div>
        </div>

        {/* Medium Solved */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Medium</span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400">
            {summary ? summary.mediumSolved.toLocaleString() : '—'}
          </div>
          <div className="text-[10px] text-zinc-500">
            {mediumStats ? `${mediumStats.solved} / ${mediumStats.total}` : 'Core problems'}
          </div>
        </div>

        {/* Hard Solved */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Hard</span>
            <span className="w-2 h-2 rounded-full bg-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400">
            {summary ? summary.hardSolved.toLocaleString() : '—'}
          </div>
          <div className="text-[10px] text-zinc-500">
            {hardStats ? `${hardStats.solved} / ${hardStats.total}` : 'Advanced algorithms'}
          </div>
        </div>

        {/* Contest Rating */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Contest Rating</span>
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-zinc-100">
            {summary?.contestRating ? summary.contestRating.toLocaleString() : '—'}
          </div>
          <div className="text-[10px] text-zinc-500">
            {summary?.topPercentage ? `Top ${summary.topPercentage}%` : summary?.attendedContestsCount ? `${summary.attendedContestsCount} contests` : 'Unrated'}
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

      {/* 3. Difficulty Breakdown & Streaks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Difficulty Progress Bar (7 cols) */}
        <div className="lg:col-span-7 p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              Difficulty Distribution
            </span>
            <span className="text-[11px] text-zinc-400">
              {summary ? `${summary.totalSolved} solved` : ''}
            </span>
          </div>

          {/* Progress Stack */}
          <div className="w-full h-3.5 rounded-full bg-zinc-800 overflow-hidden flex">
            {summary && summary.totalSolved > 0 ? (
              <>
                <div
                  style={{ width: `${(summary.easySolved / summary.totalSolved) * 100}%` }}
                  className="h-full bg-emerald-500 transition-all"
                  title={`Easy: ${summary.easySolved}`}
                />
                <div
                  style={{ width: `${(summary.mediumSolved / summary.totalSolved) * 100}%` }}
                  className="h-full bg-amber-500 transition-all"
                  title={`Medium: ${summary.mediumSolved}`}
                />
                <div
                  style={{ width: `${(summary.hardSolved / summary.totalSolved) * 100}%` }}
                  className="h-full bg-rose-500 transition-all"
                  title={`Hard: ${summary.hardSolved}`}
                />
              </>
            ) : (
              <div className="h-full w-full bg-zinc-800" />
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
            <div className="p-2 rounded-xl bg-[#121217] border border-white/[0.04] space-y-0.5">
              <div className="text-[11px] text-emerald-400 font-medium">Easy</div>
              <div className="text-sm font-semibold text-zinc-100">{summary?.easySolved || 0}</div>
              <div className="text-[10px] text-zinc-500">{(easyStats?.percentage || 0)}% of category</div>
            </div>
            <div className="p-2 rounded-xl bg-[#121217] border border-white/[0.04] space-y-0.5">
              <div className="text-[11px] text-amber-400 font-medium">Medium</div>
              <div className="text-sm font-semibold text-zinc-100">{summary?.mediumSolved || 0}</div>
              <div className="text-[10px] text-zinc-500">{(mediumStats?.percentage || 0)}% of category</div>
            </div>
            <div className="p-2 rounded-xl bg-[#121217] border border-white/[0.04] space-y-0.5">
              <div className="text-[11px] text-rose-400 font-medium">Hard</div>
              <div className="text-sm font-semibold text-zinc-100">{summary?.hardSolved || 0}</div>
              <div className="text-[10px] text-zinc-500">{(hardStats?.percentage || 0)}% of category</div>
            </div>
          </div>
        </div>

        {/* Right: Cadence & Badges (5 cols) */}
        <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              Cadence & Badges
            </span>
            <span className="text-[11px] text-zinc-400">
              {summary ? `${summary.totalActiveDays} active days` : ''}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#121217] border border-white/[0.04] space-y-1">
              <div className="text-[11px] text-zinc-400">Current Streak</div>
              <div className="text-lg font-bold text-amber-400">
                {summary ? `${summary.currentStreak} ${summary.currentStreak === 1 ? 'day' : 'days'}` : '—'}
              </div>
              <div className="text-[10px] text-zinc-500">Consecutive cadence</div>
            </div>

            <div className="p-3 rounded-xl bg-[#121217] border border-white/[0.04] space-y-1">
              <div className="text-[11px] text-zinc-400">Longest Streak</div>
              <div className="text-lg font-bold text-zinc-100">
                {summary ? `${summary.longestStreak} ${summary.longestStreak === 1 ? 'day' : 'days'}` : '—'}
              </div>
              <div className="text-[10px] text-zinc-500">Personal best</div>
            </div>
          </div>

          {/* Badges preview */}
          {summary?.badges && summary.badges.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Earned Badges ({summary.badges.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {summary.badges.slice(0, 4).map((b) => (
                  <span
                    key={b.id}
                    className="px-2 py-0.5 rounded-lg bg-zinc-800 text-[11px] text-zinc-300 border border-white/[0.06] flex items-center gap-1"
                  >
                    {b.displayName}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* 4. LeetCode Activity Calendar Heatmap */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            LeetCode Submission Calendar
          </span>
          <span className="text-zinc-500 text-[11px]">
            {summary ? `${summary.last30DaysCount} submissions in last 30d` : 'Past year submissions'}
          </span>
        </div>

        <LeetCodeHeatmapGrid dailyContributions={summary?.dailyContributions || []} />
      </div>

      {/* 5. Languages & Skills Topics */}
      {summary && (summary.languageStats.length > 0 || summary.topicStats.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Languages */}
          {summary.languageStats.length > 0 && (
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.06] space-y-3">
              <div className="text-xs font-semibold text-zinc-200">Programming Languages</div>
              <div className="flex flex-wrap gap-2">
                {summary.languageStats.map((l) => (
                  <div
                    key={l.languageName}
                    className="px-2.5 py-1.5 rounded-xl bg-[#121217] border border-white/[0.06] text-xs flex items-center gap-2"
                  >
                    <span className="text-zinc-300 font-medium">{l.languageName}</span>
                    <span className="text-[11px] text-amber-400 font-mono font-semibold">
                      {l.problemsSolved}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Topics */}
          {summary.topicStats.length > 0 && (
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.06] space-y-3">
              <div className="text-xs font-semibold text-zinc-200">Top Problem Topics</div>
              <div className="flex flex-wrap gap-1.5">
                {summary.topicStats.map((t) => (
                  <span
                    key={t.tagName}
                    className="px-2 py-1 rounded-lg bg-[#121217] text-[11px] text-zinc-300 border border-white/[0.04]"
                  >
                    {t.tagName} <strong className="text-amber-400 ml-1 font-mono">{t.problemsSolved}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Clean SVG-based LeetCode Heatmap Grid
 */
function LeetCodeHeatmapGrid({
  dailyContributions,
}: {
  dailyContributions: LeetCodeDailyContribution[];
}) {
  const [hoveredDay, setHoveredDay] = useState<LeetCodeDailyContribution | null>(null);

  // Group into columns of 7 days (Sunday to Saturday)
  const columns: LeetCodeDailyContribution[][] = [];
  let currentColumn: LeetCodeDailyContribution[] = [];

  for (let i = 0; i < dailyContributions.length; i++) {
    currentColumn.push(dailyContributions[i]);
    if (currentColumn.length === 7 || i === dailyContributions.length - 1) {
      columns.push(currentColumn);
      currentColumn = [];
    }
  }

  const getCellColor = (level: number) => {
    switch (level) {
      case 4:
        return 'bg-amber-400';
      case 3:
        return 'bg-amber-500';
      case 2:
        return 'bg-amber-600/80';
      case 1:
        return 'bg-amber-700/40';
      case 0:
      default:
        return 'bg-[#18181f]';
    }
  };

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="flex gap-1 min-w-max p-1">
          {columns.map((col, cIdx) => (
            <div key={cIdx} className="flex flex-col gap-1">
              {col.map((day) => (
                <div
                  key={day.date}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`w-3 h-3 rounded-[3px] border border-white/[0.03] transition-colors cursor-pointer ${getCellColor(
                    day.level
                  )} hover:ring-2 hover:ring-amber-400 hover:ring-offset-1 hover:ring-offset-black`}
                  title={`${day.date}: ${day.count} submissions`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-white/[0.04]">
        <div>
          {hoveredDay ? (
            <span className="text-zinc-200">
              <strong className="text-amber-400">{hoveredDay.count}</strong> submission{hoveredDay.count === 1 ? '' : 's'} on{' '}
              {new Date(hoveredDay.date + 'T12:00:00Z').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          ) : (
            <span>Hover over squares for details</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#18181f]" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-amber-700/40" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-amber-600/80" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-amber-500" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-amber-400" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
