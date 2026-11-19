/**
 * Formats an elapsed duration in milliseconds as a compact stopwatch string.
 *
 * Output is `MM:SS.cc`, where `cc` is hundredths of a second (e.g. 265180 -> "04:25.18").
 * Fractions of a hundredth are truncated, as a stopwatch would display.
 * Minutes are not capped at 59, so long durations render as e.g. "75:00.00".
 * Negative, NaN, or non-finite inputs are treated as 0.
 */
export function formatStopwatchTime(ms: number): string {
  const safeMs = Number.isFinite(ms) && ms > 0 ? ms : 0;
  const totalCentiseconds = Math.floor(safeMs / 10);

  const minutes = Math.floor(totalCentiseconds / 6000);
  const seconds = Math.floor(totalCentiseconds / 100) % 60;
  const centiseconds = totalCentiseconds % 100;

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
}
