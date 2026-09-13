'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { PageContainer, GlassCard, Button } from '@/components/ui';

export default function ProjectDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error internally without leaking confidential data
    console.error('Project Detail Error Boundary Captured:', error);
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
            Unable to load Project Details
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            An error occurred while loading this project workspace. Please try again or return to the projects overview.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => reset()}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Try Again
          </Button>

          <Link href="/app/projects">
            <Button
              variant="ghost"
              size="md"
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Projects
            </Button>
          </Link>
        </div>
      </GlassCard>
    </PageContainer>
  );
}
