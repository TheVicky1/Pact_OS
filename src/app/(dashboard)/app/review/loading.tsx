import React from 'react';
import { PageContainer } from '@/components/ui';
import { Loader2 } from 'lucide-react';

export default function ReviewLoading() {
  return (
    <PageContainer as="main">
      <div className="w-full max-w-5xl mx-auto space-y-8 py-16 px-4 sm:px-6 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Loading weekly review & Sunday planning ritual...
        </p>
      </div>
    </PageContainer>
  );
}
