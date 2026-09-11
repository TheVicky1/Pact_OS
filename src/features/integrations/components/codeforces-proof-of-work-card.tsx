'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Terminal,
  Flame,
  Trophy,
  RefreshCw,
  ShieldCheck,
  Calendar,
  AlertCircle,
  TrendingUp,
  BarChart2,
  CheckCircle2,
} from 'lucide-react';
import {
  CodeforcesActivitySummary,
  CodeforcesDailyActivity,
  CodeforcesRatingRecord,
} from '@/lib/integrations/proof-of-work/codeforces';
import { getCodeforcesActivitySummaryAction } from '../codeforces-actions';

function CodeforcesIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M4.5 7.5A1.5 1.5 0 0 1 6 9v10.5A1.5 1.5 0 0 1 4.5 21h-3A1.5 1.5 0 0 1 0 19.5V9a1.5 1.5 0 0 1 1.5-1.5h3zm7.5-4.5A1.5 1.5 0 0 1 13.5 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 7.5 19.5V4.5A1.5 1.5 0 0 1 9 3h3zm7.5 7.5A1.5 1.5 0 0 1 21 12v7.5a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5V12a1.5 1.5 0 0 1 1.5-1.5h3z" />
    </svg>
  );
}

interface CodeforcesProofOfWorkCardProps {
  initialSummary?: CodeforcesActivitySummary | null;
  isConnected: boolean;
  handle?: string;
  verifiedProofsCount?: number;
}

export function CodeforcesProofOfWorkCard({
  initialSummary,
  isConnected: initialIsConnected,
  handle: initialHandle,
  verifiedProofsCount: initialVerifiedCount = 0,
}: CodeforcesProofOfWorkCardProps) {
  const [summary, setSummary] = useState<CodeforcesActivitySummary | null | undefined>(initialSummary);
  const [isConnected, setIsConnected] = useState<boolean>(initialIsConnected);
  const [handle, setHandle] = useState<string | undefined>(initialHandle);
  const [verifiedCount, setVerifiedCount] = useState<number>(initialVerifiedCount);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [justSynced, setJustSynced] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    if (isPending) return;
    setErrorMessage(null);
    setJustSynced(false);

    startTransition(async () => {
      const res = await getCodeforcesActivitySummaryAction(true);
      if (res.success && res.data) {
        setSummary(res.data);
        setIsConnected(res.isConnected);
        if (res.handle) setHandle(res.handle);
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

  const getRankColor = (rank?: string | null) => {
    if (!rank) return 'text-zinc-400';
    const r = rank.toLowerCase();
    if (r.includes('grandmaster') || r.includes('legendary') || r.includes('international grandmaster')) {
      return 'text-red-500';
    }
    if (r.includes('master')) return 'text-amber-500';
    if (r.includes('candidate master')) return 'text-purple-400';
    if (r.includes('expert')) return 'text-blue-400';
    if (r.includes('specialist')) return 'text-cyan-400';
    if (r.includes('pupil')) return 'text-emerald-400';
    return 'text-zinc-400';
  };

  // 1. Disconnected State Banner
  if (!isConnected) {
    return (
      <div className="glass-card rounded-3xl p-6 sm:p-7 shadow-xl shadow-black/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-zinc-900 border border-white/[0.08] text-blue-400 shrink-0">
              <CodeforcesIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                Codeforces Proof of Work
                <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-white/[0.06]">
                  Not Connected
                </span>
              </h3>
              <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                Connect your Codeforces handle in Settings to automatically sync and verify competitive programming
                contest ratings, rating progression charts, problem difficulty buckets, and fulfill accountability commitments with cryptographically verifiable submissions.
              </p>
            </div>
          </div>

          <Link
            href="/app/settings"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/40 hover:bg-blue-500/25 transition-all shrink-0"
          >
            <CodeforcesIcon className="w-4 h-4" />
            Connect Codeforces in Settings
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
          <div className="p-2.5 rounded-2xl bg-zinc-900 border border-white/[0.08] text-blue-400 shrink-0">
            <CodeforcesIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-zinc-100">
                Codeforces Proof of Work
              </h3>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Verified competitive ratings and submissions for{' '}
              <span className={`font-mono font-semibold ${getRankColor(summary?.currentRank)}`}>
                @{handle || summary?.handle}
              </span>
              {summary?.currentRank ? (
                <span className="text-zinc-500 ml-2 capitalize">· {summary.currentRank}</span>
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
            title="Refresh Codeforces activity"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isPending
                  ? 'animate-spin text-blue-400'
                  : justSynced
                  ? 'text-emerald-400'
                  : 'text-blue-400'
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
        {/* Current Rating */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Rating</span>
            <Trophy className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className={`text-xl font-bold ${getRankColor(summary?.currentRank)}`}>
            {summary?.currentRating ? summary.currentRating.toLocaleString() : '—'}
          </div>
          <div className="text-[10px] text-zinc-500 capitalize">
            {summary?.currentRank || 'Unrated'}
          </div>
        </div>

        {/* Max Rating */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Max Rating</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#d4af37]" />
          </div>
          <div className="text-xl font-bold text-zinc-100">
            {summary?.maxRating ? summary.maxRating.toLocaleString() : '—'}
          </div>
          <div className="text-[10px] text-zinc-500 capitalize">
            {summary?.maxRank ? `Peak: ${summary.maxRank}` : 'All-time peak'}
          </div>
        </div>

        {/* Contests Count */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Contests</span>
            <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-zinc-100">
            {summary ? summary.contestsCount.toLocaleString() : '—'}
          </div>
          <div className="text-[10px] text-zinc-500">
            Rated rounds
          </div>
        </div>

        {/* Unique Solved Problems */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Problems Solved</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">
            {summary ? summary.uniqueSolvedProblems.toLocaleString() : '—'}
          </div>
          <div className="text-[10px] text-zinc-500">
            Unique accepted
          </div>
        </div>

        {/* Submissions Count */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Submissions</span>
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-zinc-100">
            {summary ? summary.totalSubmissions.toLocaleString() : '—'}
          </div>
          <div className="text-[10px] text-zinc-500">
            {summary?.acceptanceRate !== null && summary?.acceptanceRate !== undefined
              ? `${summary.acceptanceRate}% acceptance`
              : 'Verifiable runs'}
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

      {/* 3. Contest Rating Progression Chart */}
      {summary && summary.ratingHistory.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Contest Rating History
            </span>
            <span className="text-[11px] text-zinc-400">
              {summary.ratingHistory.length} rated contest{summary.ratingHistory.length === 1 ? '' : 's'}
            </span>
          </div>

          <CodeforcesRatingChart history={summary.ratingHistory} />
        </div>
      )}

      {/* 4. Submission Activity Calendar Heatmap */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            Codeforces Submission Calendar
          </span>
          <span className="text-zinc-500 text-[11px]">
            {summary ? `${summary.last30DaysCount} submissions in last 30d` : 'Past year submissions'}
          </span>
        </div>

        <CodeforcesHeatmapGrid dailyActivity={summary?.dailyActivity || []} />
      </div>

      {/* 5. Difficulty Buckets & Top Tags */}
      {summary && (summary.difficultyBuckets.length > 0 || summary.tagStats.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Difficulty Buckets */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.06] space-y-3">
            <div className="text-xs font-semibold text-zinc-200">Solved Problems by Rating</div>
            <div className="space-y-2">
              {summary.difficultyBuckets.map((b) => (
                <div key={b.range} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-mono">{b.range}</span>
                    <span>
                      <strong className="text-zinc-200">{b.count}</strong> ({b.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      style={{ width: `${b.percentage}%` }}
                      className="h-full bg-blue-500 transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Tags & Verdicts */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.06] space-y-4">
            {summary.tagStats.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-zinc-200">Top Problem Tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {summary.tagStats.map((t) => (
                    <span
                      key={t.tag}
                      className="px-2 py-1 rounded-lg bg-[#121217] text-[11px] text-zinc-300 border border-white/[0.04]"
                    >
                      {t.tag} <strong className="text-blue-400 ml-1 font-mono">{t.count}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {summary.languageStats.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                <div className="text-xs font-semibold text-zinc-200">Programming Languages</div>
                <div className="flex flex-wrap gap-2">
                  {summary.languageStats.map((l) => (
                    <div
                      key={l.language}
                      className="px-2.5 py-1 rounded-lg bg-[#121217] border border-white/[0.04] text-[11px] text-zinc-300"
                    >
                      {l.language} ({l.count})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Responsive SVG Line Chart for Codeforces Rating History
 */
function CodeforcesRatingChart({ history }: { history: CodeforcesRatingRecord[] }) {
  const [hoveredPoint, setHoveredPoint] = useState<CodeforcesRatingRecord | null>(null);

  if (history.length === 0) return null;

  const ratings = history.map((h) => h.newRating);
  const minRating = Math.max(0, Math.min(...ratings, ...history.map((h) => h.oldRating)) - 50);
  const maxRating = Math.max(...ratings) + 50;
  const ratingSpan = maxRating - minRating || 1;

  const width = 800;
  const height = 180;
  const paddingX = 30;
  const paddingY = 20;

  const getX = (idx: number) => {
    if (history.length <= 1) return width / 2;
    return paddingX + (idx / (history.length - 1)) * (width - 2 * paddingX);
  };

  const getY = (rating: number) => {
    return height - paddingY - ((rating - minRating) / ratingSpan) * (height - 2 * paddingY);
  };

  const pointsString = history.map((h, i) => `${getX(i)},${getY(h.newRating)}`).join(' ');

  return (
    <div className="space-y-2">
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-36 sm:h-44 overflow-visible"
        >
          {/* Horizontal grid lines */}
          <line
            x1={paddingX}
            y1={getY(minRating + ratingSpan * 0.25)}
            x2={width - paddingX}
            y2={getY(minRating + ratingSpan * 0.25)}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={getY(minRating + ratingSpan * 0.5)}
            x2={width - paddingX}
            y2={getY(minRating + ratingSpan * 0.5)}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={getY(minRating + ratingSpan * 0.75)}
            x2={width - paddingX}
            y2={getY(minRating + ratingSpan * 0.75)}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="4 4"
          />

          {/* Area fill */}
          <polygon
            points={`${getX(0)},${height - paddingY} ${pointsString} ${getX(
              history.length - 1
            )},${height - paddingY}`}
            fill="url(#cf-gradient)"
            opacity="0.25"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="cf-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Line */}
          <polyline
            points={pointsString}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {history.map((h, i) => (
            <circle
              key={h.contestId}
              cx={getX(i)}
              cy={getY(h.newRating)}
              r={hoveredPoint?.contestId === h.contestId ? 5 : 3}
              className={`transition-all cursor-pointer ${
                hoveredPoint?.contestId === h.contestId
                  ? 'fill-white stroke-blue-400 stroke-2'
                  : 'fill-blue-500'
              }`}
              onMouseEnter={() => setHoveredPoint(h)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>
      </div>

      {/* Hover Info Banner */}
      <div className="min-h-[28px] text-[11px] text-zinc-400 border-t border-white/[0.04] pt-2 flex items-center justify-between">
        {hoveredPoint ? (
          <div className="flex items-center gap-3 animate-in fade-in duration-100">
            <span className="text-zinc-200 font-medium">{hoveredPoint.contestName}</span>
            <span>
              Rank: <strong className="text-zinc-200">#{hoveredPoint.rank}</strong>
            </span>
            <span>
              Rating:{' '}
              <strong className="text-blue-400 font-mono">{hoveredPoint.newRating}</strong>{' '}
              <span
                className={`font-mono text-[10px] ${
                  hoveredPoint.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                ({hoveredPoint.delta >= 0 ? `+${hoveredPoint.delta}` : hoveredPoint.delta})
              </span>
            </span>
          </div>
        ) : (
          <span className="text-zinc-500">Hover over contest nodes to inspect rating deltas</span>
        )}
      </div>
    </div>
  );
}

/**
 * Clean SVG-based Codeforces Heatmap Grid
 */
function CodeforcesHeatmapGrid({
  dailyActivity,
}: {
  dailyActivity: CodeforcesDailyActivity[];
}) {
  const [hoveredDay, setHoveredDay] = useState<CodeforcesDailyActivity | null>(null);

  const columns: CodeforcesDailyActivity[][] = [];
  let currentColumn: CodeforcesDailyActivity[] = [];

  for (let i = 0; i < dailyActivity.length; i++) {
    currentColumn.push(dailyActivity[i]);
    if (currentColumn.length === 7 || i === dailyActivity.length - 1) {
      columns.push(currentColumn);
      currentColumn = [];
    }
  }

  const getCellColor = (level: number) => {
    switch (level) {
      case 4:
        return 'bg-blue-400';
      case 3:
        return 'bg-blue-500';
      case 2:
        return 'bg-blue-600/80';
      case 1:
        return 'bg-blue-700/40';
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
                  )} hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 hover:ring-offset-black`}
                  title={`${day.date}: ${day.count} submissions (${day.acceptedCount} accepted)`}
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
              <strong className="text-blue-400">{hoveredDay.count}</strong> submission{hoveredDay.count === 1 ? '' : 's'} (
              <strong className="text-emerald-400">{hoveredDay.acceptedCount}</strong> accepted) on{' '}
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
          <div className="w-2.5 h-2.5 rounded-[2px] bg-blue-700/40" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-blue-600/80" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-blue-500" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-blue-400" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
