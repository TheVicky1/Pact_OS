import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/ui/page-container';
import { getOnboardingState } from '@/features/onboarding/data-access';
import { OnboardingWizard } from '@/features/onboarding/components/onboarding-wizard';

export const metadata: Metadata = {
  title: 'Onboarding | PACT OS',
  description: 'First-run configuration for identity, timezone, and operating cadence.',
};

export default async function OnboardingPage() {
  const state = await getOnboardingState();

  if (!state) {
    redirect('/login');
  }

  return (
    <PageContainer>
      <div className="py-6 sm:py-12">
        <OnboardingWizard
          initialStep={state.step}
          initialFullName={state.fullName}
          initialTimezone={state.timezone}
          initialData={state.data}
        />
      </div>
    </PageContainer>
  );
}
