'use client';

import React from 'react';
import { Check, User, Sliders, Sparkles } from 'lucide-react';
import { OnboardingStep } from '@/types/domain';

export interface StepIndicatorProps {
  currentStep: OnboardingStep;
  onStepClick?: (step: OnboardingStep) => void;
}

const STEPS = [
  { step: 1 as OnboardingStep, label: 'Identity & Time', icon: User },
  { step: 2 as OnboardingStep, label: 'Operating Model', icon: Sliders },
  { step: 3 as OnboardingStep, label: 'Ready & Launch', icon: Sparkles },
];

export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <nav aria-label="Onboarding Progress" className="w-full">
      <ol className="flex items-center justify-between w-full relative">
        {/* Background Connecting Line */}
        <div
          className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-white/[0.08] z-0"
          aria-hidden="true"
        />
        {/* Active Progress Line */}
        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 h-0.5 bg-gradient-to-r from-[#d4af37] to-[#e2c056] z-0 transition-all duration-300"
          style={{
            width:
              currentStep === 1
                ? '0%'
                : currentStep === 2
                ? '50%'
                : '100%',
          }}
          aria-hidden="true"
        />

        {STEPS.map((item) => {
          const isCompleted = currentStep > item.step;
          const isCurrent = currentStep === item.step;
          const Icon = item.icon;

          return (
            <li
              key={item.step}
              className="relative z-10 flex flex-col items-center group"
            >
              <button
                type="button"
                disabled={!isCompleted}
                onClick={() => isCompleted && onStepClick?.(item.step)}
                aria-current={isCurrent ? 'step' : undefined}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border text-xs font-semibold ${
                  isCompleted
                    ? 'bg-[#d4af37] text-zinc-950 border-[#d4af37] shadow-md shadow-[#d4af37]/20 cursor-pointer'
                    : isCurrent
                    ? 'bg-zinc-900 text-[#e2c056] border-[#d4af37] ring-4 ring-[#d4af37]/20 shadow-lg shadow-black/60'
                    : 'bg-zinc-900 text-zinc-500 border-white/[0.1] cursor-not-allowed'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </button>

              <span
                className={`mt-2 text-xs font-medium whitespace-nowrap transition-colors ${
                  isCurrent
                    ? 'text-[#e2c056] font-semibold'
                    : isCompleted
                    ? 'text-zinc-200'
                    : 'text-zinc-500'
                }`}
              >
                {item.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
