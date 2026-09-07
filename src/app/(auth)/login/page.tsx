'use client';

import React, { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { PactLogo } from '@/components/brand/pact-logo';
import { signInAction } from '@/features/auth/actions';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { motion } from 'framer-motion';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Check URL parameters for oauth error flag
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'oauth_failed') {
      setError('Google sign-in was canceled or encountered an authentication error. Please try again.');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signInAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#09090b] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute w-[500px] h-[300px] bg-[#d4af37]/10 blur-[100px] rounded-full pointer-events-none -top-10" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md glass-card p-8 rounded-3xl border border-zinc-800/80 shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <PactLogo size="lg" showText={false} className="mb-4" />
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mb-1">
            Sign In to PACT
          </h1>
          <p className="text-xs text-zinc-400">
            A System for Keeping Promises to Yourself
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-3 p-3.5 mb-6 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 text-xs"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Action */}
        <div className="space-y-4">
          <GoogleSignInButton onError={(err) => setError(err || null)} />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800/80" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-[#121217] px-3 text-zinc-400 font-medium rounded-full border border-zinc-800/50">
                Or continue with email
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-zinc-300 mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[#d4af37] transition-colors outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-zinc-300 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[#d4af37] transition-colors outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-[#d4af37] hover:bg-[#e5c158] text-zinc-950 font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-[#d4af37]/10 disabled:opacity-50 text-sm mt-2 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center text-xs text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-[#e2c056] font-medium hover:underline ml-1"
          >
            Create PACT account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
