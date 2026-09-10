import React from 'react';
import { PageContainer } from '@/components/ui';
import { PlannerSkeleton } from '@/features/calendar';

export default function PlannerLoading() {
  return (
    <PageContainer as="main">
      <div className="space-y-6">
        <PlannerSkeleton />
      </div>
    </PageContainer>
  );
}
