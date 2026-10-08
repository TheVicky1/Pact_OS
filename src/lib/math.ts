/**
 * Mathematical helper utilities.
 */

/**
 * Clamps a number within the inclusive [min, max] range.
 *
 * @param value The numerical value to clamp.
 * @param min The lower bound of the range.
 * @param max The upper bound of the range.
 * @returns The clamped value within [min, max], or NaN if any argument is NaN.
 *          If min > max, the bounds are automatically normalized (swapped).
 */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value) || Number.isNaN(min) || Number.isNaN(max)) {
    return NaN;
  }

  const lower = Math.min(min, max);
  const upper = Math.max(min, max);

  return Math.min(Math.max(value, lower), upper);
}
