'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { PageContainer, GlassCard, Button } from '@/components/ui';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error internally without exposing DB secrets or stack traces to UI
    console.error('Dashboard Error Boundary Captured:', error);
  }, [error]);

  return (
    <PageContainer as="main" className="flex items-center justify-center min-h-[60vh]">
      <GlassCard
        variant="elevated"
        padding="lg"
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-800/40 flex items-center justify-center mx-auto text-red-400">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">
            Unable to load PACT Overview
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            An error occurred while communicating with the server. Your data remains secure.
          </p>
        </div>

        <div>
          <Button
            variant="secondary"
            size="md"
            onClick={() => reset()}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Try Again
          </Button>
        </div>
      </GlassCard>
    </PageContainer>
  );
}
