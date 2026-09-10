import { PageContainer } from '@/components/ui';
import { FinanceSkeleton } from '@/features/finance';

export default function FinanceLoading() {
  return (
    <PageContainer as="main">
      <FinanceSkeleton />
    </PageContainer>
  );
}
