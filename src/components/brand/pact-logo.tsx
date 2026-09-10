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
      glow: 'w-6 h-6 blur-md',
    },
    md: {
      box: 'w-9 h-9',
      imgPx: 36,
      text: 'text-2xl',
      glow: 'w-8 h-8 blur-lg',
    },
    lg: {
      box: 'w-16 h-16',
      imgPx: 64,
      text: 'text-3xl',
      glow: 'w-14 h-14 blur-xl',
    },
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official Gold P Logo Image Container */}
      <div className={`relative ${dimensions.box} flex items-center justify-center flex-shrink-0 group`}>
        {/* Subtle Ambient Gold Illumination */}
        <div
          className={`absolute inset-0 m-auto rounded-full bg-[#d4af37]/10 ${dimensions.glow} opacity-50 group-hover:opacity-75 transition-opacity pointer-events-none`}
        />

        {/* Official Brand Mark Asset */}
        <Image
          src="/brand/pact-logo.png"
          alt="PACT"
          width={dimensions.imgPx}
          height={dimensions.imgPx}
          className="relative z-10 object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]"
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

