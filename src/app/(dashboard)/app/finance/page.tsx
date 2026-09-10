import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserProfileInfo } from '@/lib/auth/profile';
import { getLocalDateString } from '@/lib/time';
import { getFinanceMonthlyOverview } from '@/features/finance/data-access';
import { FinanceWorkspace } from '@/features/finance';
import { PageContainer } from '@/components/ui';

export const metadata = {
  title: 'Finance | PACT OS',
  description: 'Personal financial command center. Track balance, income, expenses, and savings with real data.',
};

export default async function FinancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { timezone } = await getUserProfileInfo(supabase, user.id, user.user_metadata);
  const todayStr = getLocalDateString(new Date(), timezone);
  const currentYearMonth = todayStr.slice(0, 7); // "YYYY-MM"

  const { data: initialOverview } = await getFinanceMonthlyOverview(currentYearMonth, timezone);

  const fallbackData = {
    summary: {
      balanceCents: 0,
      totalIncomeCents: 0,
      totalExpensesCents: 0,
      netSavingsCents: 0,
      savingsRatePercent: 0,
      transactionCount: 0,
    },
    breakdown: [],
    trends: [],
    recentTransactions: [],
    categories: [],
    monthStr: currentYearMonth,
  };

  return (
    <PageContainer as="main">
      <FinanceWorkspace
        initialData={initialOverview || fallbackData}
        userTimeZone={timezone}
        currency="INR"
      />
    </PageContainer>
  );
}
