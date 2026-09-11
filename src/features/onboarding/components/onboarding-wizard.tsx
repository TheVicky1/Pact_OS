'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StepIndicator } from './step-indicator';
import { StepIdentity } from './step-identity';
import { StepOperatingPreferences } from './step-operating-preferences';
import { StepSummary } from './step-summary';
import { OnboardingStep } from '@/types/domain';
import {
  saveOnboardingStepAction,
  completeOnboardingAction,
  skipOnboardingStepAction,
} from '@/features/onboarding/actions';
import { ShieldCheck } from 'lucide-react';

export interface OnboardingWizardProps {
  initialStep?: OnboardingStep;
  initialFullName?: string;
  initialTimezone?: string;
  initialData?: Record<string, unknown>;
}

export function OnboardingWizard({
  initialStep = 1,
  initialFullName = '',
  initialTimezone = 'UTC',
  initialData = {},
}: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep);

  // In-flight form state
  const [fullName, setFullName] = useState(
    (initialData.fullName as string) || initialFullName || ''
  );
  const [timezone, setTimezone] = useState(
    (initialData.timezone as string) || initialTimezone || 'UTC'
  );
  const [workStartTime, setWorkStartTime] = useState(
    (initialData.workStartTime as string) || '09:00'
  );
  const [workEndTime, setWorkEndTime] = useState(
    (initialData.workEndTime as string) || '18:00'
  );

  const [dailyTaskTarget, setDailyTaskTarget] = useState(
    (initialData.dailyTaskTarget as number) || 5
  );
  const [notificationPreferences, setNotificationPreferences] = useState(
    (initialData.notificationPreferences as {
      dailyPlanReminder: boolean;
      deadlineAlerts: boolean;
      consequenceAlerts: boolean;
      weeklyReviewNotice: boolean;
    }) || {
      dailyPlanReminder: true,
      deadlineAlerts: true,
      consequenceAlerts: true,
      weeklyReviewNotice: true,
    }
  );
  const [initialGoalTitle, setInitialGoalTitle] = useState(
    (initialData.initialGoalTitle as string) || ''
  );
  const [initialProjectTitle, setInitialProjectTitle] = useState(
    (initialData.initialProjectTitle as string) || ''
  );

  const handleStep1Submit = async (data: {
    fullName: string;
    timezone: string;
    workStartTime: string;
    workEndTime: string;
  }) => {
    setFullName(data.fullName);
    setTimezone(data.timezone);
    setWorkStartTime(data.workStartTime);
    setWorkEndTime(data.workEndTime);

    const res = await saveOnboardingStepAction(1, data);
    if (res.error) {
      throw new Error(res.error);
    }
    setCurrentStep(2);
  };

  const handleStep2Submit = async (data: {
    dailyTaskTarget: number;
    notificationPreferences: {
      dailyPlanReminder: boolean;
      deadlineAlerts: boolean;
      consequenceAlerts: boolean;
      weeklyReviewNotice: boolean;
    };
    initialGoalTitle?: string;
    initialProjectTitle?: string;
  }) => {
    setDailyTaskTarget(data.dailyTaskTarget);
    setNotificationPreferences(data.notificationPreferences);
    if (data.initialGoalTitle) setInitialGoalTitle(data.initialGoalTitle);
    if (data.initialProjectTitle) setInitialProjectTitle(data.initialProjectTitle);

    const res = await saveOnboardingStepAction(2, data);
    if (res.error) {
      throw new Error(res.error);
    }
    setCurrentStep(3);
  };

  const handleStep2Skip = async () => {
    const res = await skipOnboardingStepAction(2);
    if (res.error) {
      throw new Error(res.error);
    }
    setCurrentStep(3);
  };

  const handleComplete = async () => {
    const res = await completeOnboardingAction({
      fullName,
      timezone,
      workStartTime,
      workEndTime,
      dailyTaskTarget,
      notificationPreferences,
      initialGoalTitle,
      initialProjectTitle,
    });

    if (res.error) {
      throw new Error(res.error);
    }

    router.push(res.data?.redirectUrl || '/app');
    router.refresh();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Wizard Header Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-8">
        <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#d4af37] font-semibold">
              First-Run Setup
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 mt-1">
              Welcome to PACT OS
            </h1>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121217] border border-white/[0.08] text-xs text-zinc-300">
            <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Secure Setup</span>
          </div>
        </div>

        {/* Step Indicator */}
        <StepIndicator
          currentStep={currentStep}
          onStepClick={(step) => setCurrentStep(step)}
        />

        {/* Step Content */}
        <div className="pt-2">
          {currentStep === 1 && (
            <StepIdentity
              initialFullName={fullName}
              initialTimezone={timezone}
              initialWorkStartTime={workStartTime}
              initialWorkEndTime={workEndTime}
              onNext={handleStep1Submit}
            />
          )}

          {currentStep === 2 && (
            <StepOperatingPreferences
              initialDailyTaskTarget={dailyTaskTarget}
              initialNotificationPreferences={notificationPreferences}
              initialGoalTitle={initialGoalTitle}
              initialProjectTitle={initialProjectTitle}
              onBack={() => setCurrentStep(1)}
              onNext={handleStep2Submit}
              onSkip={handleStep2Skip}
            />
          )}

          {currentStep === 3 && (
            <StepSummary
              fullName={fullName}
              timezone={timezone}
              workStartTime={workStartTime}
              workEndTime={workEndTime}
              dailyTaskTarget={dailyTaskTarget}
              notifications={notificationPreferences}
              initialGoalTitle={initialGoalTitle}
              initialProjectTitle={initialProjectTitle}
              onBack={() => setCurrentStep(2)}
              onComplete={handleComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
