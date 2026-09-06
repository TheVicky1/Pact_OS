import React from 'react';

interface PactLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

/**
 * Official PACT Brand Mark (Gold P Monogram)
 * Authoritative visual identity across favicon, header, auth screens, and loading states.
 */
export function PactLogo({ size = 'md', showText = true, className = '' }: PactLogoProps) {
  const dimensions = {
    sm: { box: 'w-7 h-7', icon: 18, text: 'text-lg' },
    md: { box: 'w-10 h-10', icon: 24, text: 'text-2xl' },
    lg: { box: 'w-14 h-14', icon: 34, text: 'text-3xl' },
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Gold P Monogram Icon Container */}
      <div
        className={`${dimensions.box} relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#1c1c24] to-[#0d0d12] border border-[#d4af37]/30 shadow-lg shadow-[#d4af37]/5 group`}
      >
        {/* Subtle Ambient Backlight Glow */}
        <div className="absolute inset-0 rounded-xl bg-[#d4af37]/10 blur-md opacity-75 group-hover:opacity-100 transition-opacity" />

        {/* Monogram SVG */}
        <svg
          width={dimensions.icon}
          height={dimensions.icon}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          <defs>
            <linearGradient id="pactGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5E0A3" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#AA820A" />
            </linearGradient>
          </defs>
          <path
            d="M6 4H14C16.7614 4 19 6.23858 19 9C19 11.7614 16.7614 14 14 14H10V20H6V4Z"
            fill="url(#pactGoldGradient)"
          />
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <span className={`${dimensions.text} font-semibold tracking-wider text-zinc-100`}>
          PACT
        </span>
      )}
    </div>
  );
}
