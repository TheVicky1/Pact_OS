'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { PageContainer, GlassCard, Button } from '@/components/ui';

export default function AccountabilityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error internally without leaking confidential data
    console.error('Accountability Error Boundary Captured:', error);
  }, [error]);

  return (
    <PageContainer as="main" className="flex items-center justify-center min-h-[60vh]">
      <GlassCard
        variant="elevated"
        padding="lg"
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-950/40 border border-amber-800/40 flex items-center justify-center mx-auto text-[#d4af37]">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
            Unable to load Accountability Cockpit
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            An error occurred while communicating with the server. Your accountability records and commitments remain intact.
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
