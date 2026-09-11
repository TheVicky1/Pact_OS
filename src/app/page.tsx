'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { UnifiedAuthCard, AuthMode } from '@/components/auth/unified-auth-card';
import { Sparkles } from 'lucide-react';

export default function LandingPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#060608] text-zinc-100 flex flex-col justify-between relative selection:bg-[#d4af37]/30 selection:text-white">
      {/* 1. Atmospheric Ambient Background Lighting & Celestial Gold Arc */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft Radial Gold Diffusion Center-Left */}
        <div className="absolute top-1/2 left-[28%] -translate-x-1/2 -translate-y-1/2 w-[650px] sm:w-[850px] h-[650px] sm:h-[850px] bg-gradient-to-tr from-[#d4af37]/12 via-[#aa820a]/06 to-transparent rounded-full blur-[130px]" />

        {/* Deep Atmospheric Horizon Eclipse Glow */}
        <div className="hidden lg:block absolute top-[16%] left-[24%] w-[540px] h-[540px] rounded-full border border-[#d4af37]/25 shadow-[0_0_90px_rgba(212,175,55,0.2),inset_0_0_70px_rgba(212,175,55,0.1)] opacity-75" />

        {/* Radiant Rim Light Highlight on the Celestial Horizon */}
        <div className="hidden lg:block absolute top-[20%] left-[42%] w-[220px] h-[420px] bg-gradient-to-b from-[#f5e0a3]/35 via-[#d4af37]/20 to-transparent blur-[26px] -rotate-[18deg] rounded-full" />

        {/* Ambient Top Vignette */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />
        {/* Ambient Bottom Vignette */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/90 to-transparent" />
      </div>

      {/* Top Left Brand Anchor */}
      <header className="relative z-10 w-full max-w-[1400px] mx-auto pt-5 sm:pt-6 lg:pt-7 px-5 sm:px-10 lg:px-14 flex items-center justify-start">
        <div className="flex items-center gap-3 select-none">
          <div className="relative w-7 h-7 flex items-center justify-center flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-[#d4af37]/20 blur-md pointer-events-none" />
            <Image
              src="/brand/pact-logo.png"
              alt="PACT"
              width={28}
              height={28}
              className="relative z-10 object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
              priority
            />
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-[0.3em] text-white uppercase">
            P A C T
          </span>
        </div>
      </header>

      {/* Main Single-Screen Hero + Auth Grid Composition */}
      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-5 sm:px-10 lg:px-14 my-auto py-6 lg:py-0 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Hero Philosophy (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-4 sm:space-y-6 relative">
          {/* Top Tag / Pill */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/90 border border-white/[0.08] text-[10px] font-mono tracking-wider text-[#e2c056] shadow-sm">
              <Sparkles className="w-3 h-3 text-[#d4af37]" />
              <span>PERSONAL OPERATING SYSTEM</span>
            </div>
          </div>

          {/* Main Headline & Pillars Row */}
          <div className="flex gap-4 sm:gap-7 items-start">
            {/* Vertical Discipline Rail */}
            <div className="hidden sm:flex flex-col items-center gap-2 text-[9px] font-mono tracking-[0.25em] text-zinc-500 uppercase select-none pt-1.5">
              <span className="hover:text-amber-400/80 transition-colors">PLAN</span>
              <div className="w-3.5 h-[1px] bg-zinc-800" />
              <span className="hover:text-amber-400/80 transition-colors">TRACK</span>
              <div className="w-3.5 h-[1px] bg-zinc-800" />
              <span className="hover:text-amber-400/80 transition-colors">IMPROVE</span>
              <div className="w-3.5 h-[1px] bg-zinc-800" />
              <span className="hover:text-amber-400/80 transition-colors">REPEAT</span>
            </div>

            {/* Core Hero Headline & Subtitle */}
            <div className="space-y-3 max-w-lg">
              <h1 className="text-3xl sm:text-5xl xl:text-6xl font-bold tracking-tight text-white leading-[1.08]">
                Build a<br />
                <span className="bg-gradient-to-r from-[#fceabb] via-[#d4af37] to-[#aa820a] bg-clip-text text-transparent">
                  Better You.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed max-w-md">
                Plan. Track. Stay Accountable. Achieve what truly matters — with PACT. Transform fleeting intent into consistent, unbreakable daily execution.
              </p>
            </div>
          </div>

          {/* Bottom Left: Refined Editorial Philosophy Quote */}
          <div className="pt-0.5 max-w-sm space-y-1 pl-0.5 select-none">
            <span className="text-amber-400/80 text-lg font-serif leading-none block">
              &ldquo;
            </span>
            <p className="text-xs text-zinc-300/90 italic font-light leading-relaxed">
              Discipline today, a brighter tomorrow.
            </p>
            <p className="text-[9px] font-mono tracking-[0.25em] text-zinc-500 uppercase pt-0.5">
              — PACT OS
            </p>
          </div>
        </div>

        {/* Right Column: Seamless Interactive Auth Panel (5 cols on lg) */}
        <div id="auth-panel" className="lg:col-span-5 flex justify-center lg:justify-end w-full">
          <UnifiedAuthCard initialMode={authMode} onModeChange={setAuthMode} />
        </div>
      </main>

      {/* Footer Ticker / Bottom Branding */}
      <footer className="relative z-10 w-full max-w-[1400px] mx-auto pb-4 sm:pb-5 pt-2 px-5 sm:px-10 lg:px-14 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
        <div className="flex items-center gap-3">
          <span>PACT OS © 2026</span>
          <span>•</span>
          <span className="text-zinc-400">Turn Intent Into Discipline</span>
        </div>

        {/* Editorial Philosophy Rule */}
        <div className="text-[10px] font-mono tracking-[0.3em] text-zinc-600 uppercase">
          SMALL STEPS. BIGGER TOMORROWS.
        </div>
      </footer>
    </div>
  );
}
