import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/ui/page-container';
import { getSettingsData } from '@/features/settings/data-access';
import { SettingsWorkspace } from '@/features/settings/components/settings-workspace';

export const metadata: Metadata = {
  title: 'Settings & Preferences | PACT',
  description:
    'Manage profile, authoritative IANA timezone, accountability rules, security credentials, and external integrations.',
};

export default async function SettingsPage() {
  const data = await getSettingsData();

  if (!data) {
    redirect('/login');
  }

  return (
    <PageContainer>
      <SettingsWorkspace initialData={data} />
    </PageContainer>
  );
}
