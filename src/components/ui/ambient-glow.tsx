import React from 'react';

/**
 * PACT Cinematic Lighting Primitives
 * Reusable directional spotlights and diffuse warm ambient lights from the Visual North Star.
 */

export function GoldSpotlight({
  position = 'top-right',
  className = '',
}: {
  position?: 'top-right' | 'top-left' | 'center';
  className?: string;
}) {
  const positionStyles = {
    'top-right': '-top-10 -right-10',
    'top-left': '-top-10 -left-10',
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  }[position];

  return (
    <div
      aria-hidden="true"
      className={`absolute ${positionStyles} w-48 h-48 rounded-full bg-gradient-to-br from-[#d4af37]/25 via-[#d4af37]/8 to-transparent blur-2xl pointer-events-none ${className}`}
    />
  );
}

export function AmberBacklight({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 bg-gradient-to-tr from-[#e2c056]/15 via-[#aa820a]/8 to-transparent pointer-events-none ${className}`}
    />
  );
}

export function CanvasAmbientLight({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#d4af37]/12 via-[#d4af37]/4 to-transparent blur-[120px] rounded-full pointer-events-none ${className}`}
    />
  );
}
