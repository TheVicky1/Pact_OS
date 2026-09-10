'use client';

import React from 'react';
import { PageContainer, GlassCard, Button, Alert } from '@/components/ui';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function PlannerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer as="main">
      <div className="py-12 max-w-lg mx-auto">
        <GlassCard variant="default" padding="lg" className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-950/40 border border-red-800/40 flex items-center justify-center mx-auto text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-zinc-100">Planner Unavailable</h2>
            <p className="text-xs text-zinc-400">
              An unexpected error occurred while loading your schedule.
            </p>
          </div>

          <Alert variant="danger">
            {error.message || 'Failed to render planner.'}
          </Alert>

          <Button
            variant="primary"
            size="sm"
            onClick={reset}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            className="w-full justify-center"
          >
            Try Again
          </Button>
        </GlassCard>
      </div>
    </PageContainer>
  );
}
