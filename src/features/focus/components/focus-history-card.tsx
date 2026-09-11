'use client';

import React from 'react';
import { FocusSession, calculateFocusMetrics } from '@/lib/focus/timer';
import {
  Flame,
  CheckCircle2,
  Clock,
  History,
  TrendingUp,
} from 'lucide-react';

export interface FocusHistoryCardProps {
  history: FocusSession[];
}

export function FocusHistoryCard({ history }: FocusHistoryCardProps) {
  const metrics = calculateFocusMetrics(history);

  return (
    <div className="w-full space-y-6">
      {/* 4-Stat Metric Summary Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Deep Work */}
        <div className="bg-[#121217]/70 border border-white/[0.08] rounded-2xl p-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1.5">
            <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Total Focus</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
            {Math.round(metrics.totalFocusSeconds / 3600 * 10) / 10}h
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Accumulated work</p>
        </div>

        {/* Metric 2: Completed Blocks */}
        <div className="bg-[#121217]/70 border border-white/[0.08] rounded-2xl p-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed Blocks</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
            {metrics.completedSessionsCount}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Full sessions</p>
        </div>

        {/* Metric 3: Today's Deep Work */}
        <div className="bg-[#121217]/70 border border-white/[0.08] rounded-2xl p-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Today&apos;s Focus</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
            {Math.round(metrics.todayFocusSeconds / 60)}m
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Current daily total</p>
        </div>

        {/* Metric 4: Average Duration */}
        <div className="bg-[#121217]/70 border border-white/[0.08] rounded-2xl p-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span>Avg Block</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
            {metrics.averageSessionMinutes}m
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Per session average</p>
        </div>
      </div>

      {/* Recent Sessions Timeline */}
      <div className="bg-[#121217]/70 border border-white/[0.08] rounded-3xl p-6 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-white/[0.06]">
          <History className="w-4 h-4 text-[#d4af37]" />
          <h3 className="text-sm font-semibold text-zinc-200">Recent Focus Activity</h3>
        </div>

        {history.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs">
            No focus sessions logged yet. Begin your first deep work block above.
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.slice(0, 8).map((session) => {
              const isCompleted = session.status === 'completed';
              const isAbandoned = session.status === 'abandoned';
              const startedDate = session.started_at ? new Date(session.started_at).toLocaleDateString() : '';

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/40 border border-white/[0.04] text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`p-2 rounded-xl ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isAbandoned
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-medium text-zinc-200 truncate">
                        {session.tasks?.title || session.notes || 'General Deep Work Session'}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {startedDate} · {session.mode === 'stopwatch' || !session.planned_duration_seconds ? 'Stopwatch' : `${Math.round(session.planned_duration_seconds / 60)} min target`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : isAbandoned
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {session.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
