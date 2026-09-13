import React from 'react';
import { DailySunsetView } from '@/features/rituals/components/daily-sunset-view';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Sunset & Shutdown | PACT OS',
  description: 'Evening ritual for day closeout, task triage, and tomorrow preparation.',
};

export default function DailySunsetPage() {
  return (
    <div className="p-6 md:p-8 min-h-screen">
      <DailySunsetView />
    </div>
  );
}
