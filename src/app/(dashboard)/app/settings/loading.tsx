import React from 'react';
import { PageContainer } from '@/components/ui/page-container';
import { SettingsSkeleton } from '@/features/settings/components/settings-skeleton';

export default function SettingsLoading() {
  return (
    <PageContainer>
      <SettingsSkeleton />
    </PageContainer>
  );
}
