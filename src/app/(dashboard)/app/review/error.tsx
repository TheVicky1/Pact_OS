'use client';

import React, { useEffect } from 'react';
import { PageContainer, Button } from '@/components/ui';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function ReviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Weekly Review route error caught:', error);
  }, [error]);

  return (
    <PageContainer as="main">
      <div className="w-full max-w-xl mx-auto my-12 p-6 sm:p-8 bg-card border border-destructive/30 rounded-3xl text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center justify-center text-destructive mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Weekly Review Unavailable</h2>
        <p className="text-sm text-muted-foreground">
          An error occurred while loading weekly metrics, review draft, or historical snapshots.
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
