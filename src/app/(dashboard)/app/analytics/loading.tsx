import { PageContainer } from '@/components/ui';
import { AnalyticsSkeleton } from '@/features/analytics';

export default function AnalyticsLoading() {
  return (
    <PageContainer as="main">
      <AnalyticsSkeleton />
    </PageContainer>
  );
}
