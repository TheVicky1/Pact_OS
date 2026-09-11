'use client';

import React, { useEffect } from 'react';
import { PageContainer, Button } from '@/components/ui';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function HabitsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Habits route error caught:', error);
  }, [error]);

  return (
    <PageContainer as="main">
      <div className="w-full max-w-xl mx-auto my-12 p-6 sm:p-8 bg-[#121217] border border-rose-500/30 rounded-3xl text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Habits Engine Unavailable</h2>
        <p className="text-sm text-zinc-400">
          An error occurred while loading your habit templates, routines, or streaks.
        </p>
        <div className="pt-2 flex justify-center">
          <Button onClick={() => reset()} variant="secondary" className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
