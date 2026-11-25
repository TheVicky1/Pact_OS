export const MIN_DECIBELS = -60;

function assertNumber(value: unknown, name: string): asserts value is number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new TypeError(`${name} must be a number`);
  }
}

function assertMinimumDecibels(minDecibels: number): void {
  if (minDecibels > 0) {
    throw new RangeError('minDecibels must be less than or equal to 0');
  }
}

export function amplitudeToDecibels(
  amplitude: number,
  minDecibels: number = MIN_DECIBELS
): number {
  assertNumber(amplitude, 'amplitude');
  assertNumber(minDecibels, 'minDecibels');
  assertMinimumDecibels(minDecibels);

  if (amplitude < 0) {
    throw new RangeError('amplitude must not be negative');
  }

  if (amplitude === 0) {
    return minDecibels;
  }

  const decibels = 20 * Math.log10(amplitude);
  const clampedDecibels = Math.min(0, Math.max(minDecibels, decibels));
  const roundedDecibels = Math.round(clampedDecibels * 10) / 10;

  // Preserve the configured floor when it has more than one decimal place.
  return Math.max(minDecibels, roundedDecibels);
}

export function decibelsToAmplitude(
  decibels: number,
  minDecibels: number = MIN_DECIBELS
): number {
  assertNumber(decibels, 'decibels');
  assertNumber(minDecibels, 'minDecibels');
  assertMinimumDecibels(minDecibels);

  // At a zero-decibel floor, full scale takes precedence over the floor.
  if (decibels < 0 && decibels <= minDecibels) {
    return 0;
  }

  if (decibels >= 0) {
    return 1;
  }

  const amplitude = 10 ** (decibels / 20);

  return Math.round(amplitude * 10_000) / 10_000;
}
