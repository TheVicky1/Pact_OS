import Link from 'next/link';
import { PactLogo } from '@/components/brand/pact-logo';
import { ArrowRight, ShieldCheck, Target, Clock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between p-6 sm:p-12 bg-[#09090b] text-zinc-100 overflow-hidden">
      {/* Ambient Background Backlight */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#d4af37]/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Navigation Header */}
      <header className="w-full max-w-6xl flex items-center justify-between z-10">
        <PactLogo size="md" />
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-zinc-300 hover:text-zinc-100 transition-colors font-medium px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-[#d4af37] text-zinc-950 hover:bg-[#e5c158] transition-all px-4 py-2 rounded-xl shadow-lg shadow-[#d4af37]/10"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-4xl flex flex-col items-center text-center my-auto py-16 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs text-[#e2c056] mb-8">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Personal Operating System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-zinc-100 mb-6 max-w-3xl leading-tight">
          A System for Keeping <span className="text-[#d4af37]">Promises to Yourself.</span>
        </h1>

        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed font-normal">
          Turn Intent Into Discipline. Transform abstract goals into consistent action with server-enforceable commitments, time-blocking, and intentional accountability.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-semibold bg-[#d4af37] text-zinc-950 hover:bg-[#e5c158] transition-all px-8 py-3.5 rounded-xl shadow-xl shadow-[#d4af37]/15"
          >
            <span>Begin Your Pact</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center text-base font-medium bg-zinc-900/60 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 transition-all px-8 py-3.5 rounded-xl"
          >
            Sign In to Account
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mt-20 text-left">
          <div className="glass-card p-6 rounded-2xl border border-zinc-800/80">
            <Target className="w-6 h-6 text-[#d4af37] mb-3" />
            <h3 className="font-semibold text-zinc-100 text-base mb-1">Intentional Focus</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Define commitments with goals and projects. Keep priorities clear and visual noise low.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-zinc-800/80">
            <Clock className="w-6 h-6 text-[#d4af37] mb-3" />
            <h3 className="font-semibold text-zinc-100 text-base mb-1">Timezone Authority</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Server-enforced deadline boundaries with UTC integrity and local timezone daily planning.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-zinc-800/80">
            <ShieldCheck className="w-6 h-6 text-[#d4af37] mb-3" />
            <h3 className="font-semibold text-zinc-100 text-base mb-1">Strict Privacy</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Row-Level Security enforces absolute user data isolation at the database layer.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl flex items-center justify-between py-4 text-xs text-zinc-500 border-t border-zinc-900 z-10">
        <span>PACT OS © 2026</span>
        <span>Turn Intent Into Discipline</span>
      </footer>
    </div>
  );
}
