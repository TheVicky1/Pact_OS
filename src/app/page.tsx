'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { UnifiedAuthCard, AuthMode } from '@/components/auth/unified-auth-card';
import { Sparkles } from 'lucide-react';

export default function LandingPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#060608] text-zinc-100 flex flex-col justify-between relative selection:bg-[#d4af37]/30 selection:text-white">

      {/* ========================================================================= */}
      {/* 1. CRYSTAL-CLEAR ULTRA-HD GOLDEN SILK & 3D SPHERE BACKDROP                */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Core Volumetric Razor-Sharp Golden Silk Waves & 3D Sphere Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/brand/pact-landing-bg.png"
            alt="PACT Celestial Horizon"
            fill
            priority
            unoptimized
            className="object-cover object-center w-full h-full opacity-95 transition-opacity duration-700"
          />
        </div>

        {/* Ambient Warm Golden Atmospheric Glow */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Subtle warm rim light boost on the central sphere */}
          <div className="hidden lg:block absolute top-[28%] left-[54%] w-[380px] h-[380px] bg-gradient-to-tr from-transparent via-[#f5c037]/12 to-[#fff0bd]/15 rounded-full blur-[60px] pointer-events-none" />

          {/* Golden loop halo behind the auth card */}
          <div className="hidden lg:block absolute top-[20%] right-[8%] w-[480px] h-[520px] bg-[#d4af37]/10 rounded-full blur-[90px] pointer-events-none" />
        </div>

        {/* Top and Bottom Cinematic Edge Vignettes */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#060608]/90 via-[#060608]/40 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#060608]/95 via-[#060608]/50 to-transparent pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP HEADER NAVIGATION                                                  */}
      {/* ========================================================================= */}
      <header className="relative z-10 w-full max-w-[1440px] mx-auto pt-6 sm:pt-7 lg:pt-8 px-6 sm:px-10 lg:px-14 flex items-center justify-start">
        {/* Brand Anchor Left */}
        <div className="flex items-center gap-3.5 select-none">
          <div className="relative w-8 h-8 sm:w-[34px] sm:h-[34px] flex items-center justify-center flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-[#d4af37]/30 blur-md pointer-events-none" />
            <Image
              src="/brand/pact-logo.png"
              alt="PACT"
              width={34}
              height={34}
              className="relative z-10 w-full h-full object-contain drop-shadow-[0_1px_8px_rgba(212,175,55,0.35)]"
              priority
            />
          </div>
          <span className="text-sm sm:text-[15px] font-semibold tracking-[0.32em] text-white uppercase translate-y-[0.5px]">
            P A C T
          </span>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. MAIN HERO PHILOSOPHY + UNIFIED AUTH CARD GRID                         */}
      {/* ========================================================================= */}
      <main className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 my-auto py-6 lg:py-0 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Hero Philosophy (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-4 sm:space-y-6 relative">
          {/* Top Tag / Pill */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950/80 backdrop-blur-md border border-white/[0.08] text-[10px] sm:text-[11px] font-mono tracking-wider text-[#e2c056] shadow-sm">
              <Sparkles className="w-3 h-3 text-[#d4af37]" />
              <span>PERSONAL OPERATING SYSTEM</span>
            </div>
          </div>

          {/* Main Headline & Vertical Discipline Rail */}
          <div className="flex gap-4 sm:gap-7 items-start">
            {/* Vertical Discipline Rail matching Image 1 */}
            <div className="hidden sm:flex flex-col items-center gap-2.5 text-[11px] font-sans font-semibold tracking-[0.2em] text-white uppercase select-none pt-1">
              <span className="hover:text-amber-300 transition-colors">PLAN</span>
              <div className="w-4 h-[1px] bg-white/30" />
              <span className="hover:text-amber-300 transition-colors">TRACK</span>
              <div className="w-4 h-[1px] bg-white/30" />
              <span className="hover:text-amber-300 transition-colors">IMPROVE</span>
              <div className="w-4 h-[1px] bg-white/30" />
              <span className="hover:text-amber-300 transition-colors">REPEAT</span>
            </div>

            {/* Core Hero Headline & Subtitle */}
            <div className="space-y-3 max-w-lg">
              <h1 className="text-3xl sm:text-5xl xl:text-6xl font-bold tracking-tight text-white leading-[1.08]">
                Build a<br />
                <span className="bg-gradient-to-r from-[#fceabb] via-[#d4af37] to-[#aa820a] bg-clip-text text-transparent">
                  Better You.
                </span>
              </h1>

              <p className="text-xs sm:text-[14px] text-zinc-200 font-normal leading-relaxed max-w-md">
                Plan. Track. Stay Accountable. Achieve what truly matters — with PACT. Transform fleeting intent into consistent, unbreakable daily execution.
              </p>
            </div>
          </div>

          {/* Bottom Left: Editorial Philosophy Quote */}
          <div className="pt-0.5 max-w-sm space-y-1 pl-0.5 select-none">
            <span className="text-amber-400/80 text-xl font-serif leading-none block">
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

      {/* ========================================================================= */}
      {/* 4. FOOTER TICKER & EMBLEMATIC BRANDING                                    */}
      {/* ========================================================================= */}
      <footer className="relative z-10 w-full max-w-[1440px] mx-auto pb-4 sm:pb-5 pt-2 px-6 sm:px-10 lg:px-14 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 font-sans font-medium text-[11px] tracking-[0.14em] text-white select-none">
          <span>PACT OS © 2026</span>
          <span className="text-white/40">•</span>
          <span>Turn Intent Into Discipline</span>
        </div>

        {/* Editorial Philosophy Rule */}
        <div className="font-sans font-medium text-[11px] tracking-[0.14em] text-white uppercase select-none">
          SMALL STEPS, BIGGER TOMORROWS.
        </div>
      </footer>
    </div>
  );
}
