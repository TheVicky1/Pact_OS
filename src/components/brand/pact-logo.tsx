import React from 'react';
import Image from 'next/image';

interface PactLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  priority?: boolean;
}

/**
 * Official PACT Brand Mark (Gold Geometric Monogram)
 * Single Source of Truth visual identity across favicon, header, auth screens, and application branding.
 */
export function PactLogo({
  size = 'md',
  showText = true,
  className = '',
  priority = false,
}: PactLogoProps) {
  const dimensions = {
    sm: {
      box: 'w-7 h-7',
      imgPx: 28,
      text: 'text-lg',
      glow: 'w-7 h-7 blur-sm',
    },
    md: {
      box: 'w-9 h-9',
      imgPx: 36,
      text: 'text-2xl',
      glow: 'w-9 h-9 blur-md',
    },
    lg: {
      box: 'w-16 h-16',
      imgPx: 64,
      text: 'text-3xl',
      glow: 'w-16 h-16 blur-lg',
    },
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official Gold P Logo Image Container */}
      <div className={`relative ${dimensions.box} flex items-center justify-center flex-shrink-0 group`}>
        {/* Ambient Warm Gold Lighting */}
        <div
          className={`absolute inset-0 rounded-full bg-[#d4af37]/25 ${dimensions.glow} opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none`}
        />

        {/* Official Brand Mark Asset */}
        <Image
          src="/brand/pact-logo.png"
          alt="PACT"
          width={dimensions.imgPx}
          height={dimensions.imgPx}
          className="relative z-10 object-contain drop-shadow-[0_2px_8px_rgba(212,175,55,0.35)]"
          priority={priority || size === 'sm'}
        />
      </div>

      {/* Brand Wordmark */}
      {showText && (
        <span className={`${dimensions.text} font-semibold tracking-wider text-zinc-100 select-none`}>
          PACT
        </span>
      )}
    </div>
  );
}

