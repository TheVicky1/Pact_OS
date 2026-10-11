/**
 * Haptic Feedback Vibration Helper with Fallback.
 * Wraps navigator.vibrate with predefined tactile patterns for micro-interactions,
 * safely falling back in SSR or unsupported environments.
 */

export type HapticType = 'light' | 'success' | 'warning' | 'error';

export const HAPTIC_PATTERNS: Record<HapticType, number[]> = {
  light: [15],
  success: [20, 50, 30],
  warning: [40, 60, 40],
  error: [60, 50, 60, 50, 80],
};

export function triggerHaptic(typeOrPattern: HapticType | number[]): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return false;
  }

  try {
    const pattern = Array.isArray(typeOrPattern)
      ? typeOrPattern
      : HAPTIC_PATTERNS[typeOrPattern];

    if (!pattern) return false;
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}
