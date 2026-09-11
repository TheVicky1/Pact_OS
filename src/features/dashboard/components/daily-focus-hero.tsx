'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui';
import { ShieldCheck, Plus, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export interface DailyFocusHeroProps {
  userName: string;
  greeting: string;
  pendingCount: number;
  completedCount: number;
  urgentCount: number;
  timezone: string;
}

/**
 * PACT Daily Focus Hero & Date Horizon Ribbon
 * Luxury cinematic hero featuring a photorealistic 3D celestial dark planet
 * with volumetric golden rim illumination, atmospheric corona, and restrained authority.
 */
export function DailyFocusHero({
  userName,
  greeting,
  pendingCount,
  completedCount,
  urgentCount,
  timezone,
}: DailyFocusHeroProps) {
  // Get current local day, month, and weekday in user's profile timezone
  const { dayNumber, monthAbbrev, weekdayName } = useMemo(() => {
    try {
      const now = new Date();
      const day = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        day: 'numeric',
      }).format(now);
      const month = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        month: 'short',
      }).format(now);
      const weekday = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'long',
      }).format(now);
      return { dayNumber: day, monthAbbrev: month, weekdayName: weekday };
    } catch {
      return { dayNumber: `${new Date().getDate()}`, monthAbbrev: 'Today', weekdayName: 'Today' };
    }
  }, [timezone]);

  return (
    <div className="space-y-4">
      {/* Primary Hero Banner */}
      <div className="relative rounded-[28px] bg-[#0C0C0F] border border-white/[0.06] p-6 sm:p-8 lg:p-10 shadow-2xl shadow-black/80 overflow-hidden group">
        {/* 1. Cinematic 3D Celestial Planet on the Right (~40% width) */}
        <div
          aria-hidden="true"
          className="absolute -top-20 -right-16 sm:-top-28 sm:-right-20 lg:-top-32 lg:-right-16 w-[340px] sm:w-[480px] lg:w-[580px] h-[340px] sm:h-[480px] lg:h-[580px] pointer-events-none select-none z-0"
        >
          <svg
            className="w-full h-full"
            viewBox="0 0 500 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Outer atmospheric corona glow */}
              <radialGradient id="pactAtmosphereGlow" cx="76%" cy="24%" r="60%" fx="76%" fy="24%">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.32" />
                <stop offset="25%" stopColor="#E6C34A" stopOpacity="0.14" />
                <stop offset="55%" stopColor="#AA820A" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#0C0C0F" stopOpacity="0" />
              </radialGradient>

              {/* Volumetric planet body shading (deep 3D sphere) */}
              <radialGradient id="pactPlanetSphere" cx="72%" cy="28%" r="68%" fx="72%" fy="28%">
                <stop offset="0%" stopColor="#1E1E26" />
                <stop offset="24%" stopColor="#14141A" />
                <stop offset="48%" stopColor="#0E0E12" />
                <stop offset="75%" stopColor="#08080B" />
                <stop offset="100%" stopColor="#050507" />
              </radialGradient>

              {/* Internal atmospheric Rayleigh scattering & crescent light */}
              <radialGradient id="pactAtmosphericScatter" cx="80%" cy="20%" r="50%" fx="80%" fy="20%">
                <stop offset="0%" stopColor="#FFF2C6" stopOpacity="0.85" />
                <stop offset="10%" stopColor="#F5C037" stopOpacity="0.60" />
                <stop offset="26%" stopColor="#D4AF37" stopOpacity="0.25" />
                <stop offset="48%" stopColor="#AA820A" stopOpacity="0.06" />
                <stop offset="70%" stopColor="#0C0C0F" stopOpacity="0" />
              </radialGradient>

              {/* Razor-sharp glowing rim gradient */}
              <linearGradient id="pactRimGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#AA820A" stopOpacity="0" />
                <stop offset="25%" stopColor="#D4AF37" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#FFF5D6" stopOpacity="1" />
                <stop offset="75%" stopColor="#F0B90B" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#AA820A" stopOpacity="0" />
              </linearGradient>

              {/* Golden atmospheric glow filter */}
              <filter id="pactCrescentGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" result="glowBlur" />
                <feMerge>
                  <feMergeNode in="glowBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Subtle distant orbital geometry in background */}
            <circle cx="250" cy="250" r="236" stroke="#D4AF37" strokeWidth="0.75" strokeDasharray="4 6" opacity="0.12" />
            <circle cx="250" cy="250" r="218" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

            {/* Atmospheric Outer Corona */}
            <circle cx="250" cy="250" r="225" fill="url(#pactAtmosphereGlow)" />

            {/* Main Volumetric 3D Planet Sphere (Dissolves naturally into black space on left) */}
            <circle cx="250" cy="250" r="200" fill="url(#pactPlanetSphere)" />

            {/* Atmospheric Rayleigh Scatter overlay */}
            <circle cx="250" cy="250" r="200" fill="url(#pactAtmosphericScatter)" style={{ mixBlendMode: 'screen' }} />

            {/* Specular Upper-Right Rim Arc (Glow) */}
            <path
              d="M 230 52 A 200 200 0 0 1 448 270"
              stroke="url(#pactRimGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              filter="url(#pactCrescentGlow)"
              opacity="0.85"
            />

            {/* Intense Razor-Thin Golden Highlight Line */}
            <path
              d="M 270 54 A 200 200 0 0 1 446 230"
              stroke="#FFF7D6"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.95"
            />
          </svg>
        </div>

        {/* 2. Hero Content */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 lg:gap-8">
          <div className="space-y-3.5 max-w-xl">
            {/* Small Gold Outlined Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#101012] border border-[#D4AF37]/35 text-[11px] font-medium tracking-wide text-[#E8E8E8] shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>PACT Personal Operating System</span>
            </div>

            {/* Large Bold Warm White Greeting */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#F5F5F5]">
              {greeting},{' '}
              <span className="text-[#F5F5F5] font-extrabold">
                {userName || 'Vicky'}
              </span>
            </h1>

            {/* Supporting Copy in Muted Gray */}
            <p className="text-sm sm:text-base text-[#8B8B92] leading-relaxed max-w-lg">
              {pendingCount > 0
                ? `You have ${pendingCount} ${
                    pendingCount === 1 ? 'commitment' : 'commitments'
                  } scheduled today. Take deliberate, disciplined action.`
                : 'All commitments are in order. Set an intentional target or review your active goals.'}
            </p>
          </div>

          {/* New Commitment Button */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/app/tasks">
              <Button
                variant="primary"
                size="md"
                icon={<Plus className="w-4 h-4 text-[#090909]" />}
                className="bg-[#D4AF37] hover:bg-[#E6C34A] text-[#090909] font-semibold border border-[#E6C34A]/50 shadow-xl shadow-[#D4AF37]/20 transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
              >
                New Commitment
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Date Horizon Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3.5">
          {/* Date Squircle */}
          <div className="w-12 h-12 rounded-2xl bg-[#0C0C0F] border border-white/[0.06] flex flex-col items-center justify-center text-center shrink-0 shadow-md">
            <span className="text-base font-extrabold text-[#F5F5F5] leading-none">
              {dayNumber}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] leading-tight mt-0.5">
              {monthAbbrev}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#E8E8E8]">
              <span>{weekdayName}&apos;s Commitments</span>
              <span className="text-[#71717A]">•</span>
              <span className="text-xs font-mono font-medium text-[#A1A1AA]">
                {pendingCount} Pending
                {urgentCount > 0 && (
                  <span className="text-[#D4AF37] ml-1">({urgentCount} Urgent)</span>
                )}
              </span>
            </div>
            <p className="text-xs text-[#71717A] mt-0.5">
              {completedCount > 0
                ? `${completedCount} commitments fulfilled in this cycle.`
                : 'Ready for disciplined execution today.'}
            </p>
          </div>
        </div>

        {/* Informational Day Navigation Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <button
            type="button"
            disabled
            title="Viewing current active day"
            className="w-8 h-8 rounded-xl border border-white/[0.04] bg-[#0C0C0F] text-[#71717A] flex items-center justify-center cursor-not-allowed"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="text-[11px] font-mono text-[#A1A1AA] px-2.5 py-1 rounded-lg bg-[#0C0C0F] border border-white/[0.04] flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-[#D4AF37]" />
            <span>Today</span>
          </div>
          <button
            type="button"
            disabled
            title="Viewing current active day"
            className="w-8 h-8 rounded-xl border border-white/[0.04] bg-[#0C0C0F] text-[#71717A] flex items-center justify-center cursor-not-allowed"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
