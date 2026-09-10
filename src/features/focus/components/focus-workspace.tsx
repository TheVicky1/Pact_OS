'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FocusSession } from '@/lib/focus/timer';
import { FocusTimerDisplay } from './focus-timer-display';
import { FocusSetupCard, TaskOption } from './focus-setup-card';
import { FocusHistoryCard } from './focus-history-card';

export interface FocusWorkspaceProps {
  initialActiveSession: FocusSession | null;
  initialHistory: FocusSession[];
  availableTasks: TaskOption[];
}

export function FocusWorkspace({
  initialActiveSession,
  initialHistory,
  availableTasks,
}: FocusWorkspaceProps) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30">
              Deep Work Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Focus & Productivity Sessions
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Execute high-stakes deep work intervals backed by deterministic timer authority.
          </p>
        </div>
      </div>

      {/* Main Active Timer or Setup Card */}
      {initialActiveSession ? (
        <FocusTimerDisplay
          session={initialActiveSession}
          onSessionUpdated={handleRefresh}
        />
      ) : (
        <FocusSetupCard
          availableTasks={availableTasks}
          onSessionStarted={handleRefresh}
        />
      )}

      {/* Focus History & Analytics */}
      <FocusHistoryCard history={initialHistory} />
    </div>
  );
}
