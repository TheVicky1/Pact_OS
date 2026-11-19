import { describe, expect, it } from 'vitest';
import { formatStopwatchTime } from '../src/lib/stopwatch-formatter';

describe('formatStopwatchTime', () => {
  it('formats zero as 00:00.00', () => {
    expect(formatStopwatchTime(0)).toBe('00:00.00');
  });

  it('formats the example from the issue (265180 ms -> 04:25.18)', () => {
    expect(formatStopwatchTime(265180)).toBe('04:25.18');
  });

  it('pads seconds and centiseconds to two digits', () => {
    expect(formatStopwatchTime(5010)).toBe('00:05.01');
  });

  it('truncates sub-centisecond precision', () => {
    expect(formatStopwatchTime(9)).toBe('00:00.00');
    expect(formatStopwatchTime(19)).toBe('00:00.01');
    expect(formatStopwatchTime(999)).toBe('00:00.99');
  });

  it('rolls over seconds and minutes correctly', () => {
    expect(formatStopwatchTime(59990)).toBe('00:59.99');
    expect(formatStopwatchTime(60000)).toBe('01:00.00');
    expect(formatStopwatchTime(3599990)).toBe('59:59.99');
  });

  it('does not cap minutes at 59', () => {
    expect(formatStopwatchTime(3600000)).toBe('60:00.00');
    expect(formatStopwatchTime(4500000)).toBe('75:00.00');
  });

  it('treats negative and non-finite inputs as zero', () => {
    expect(formatStopwatchTime(-1000)).toBe('00:00.00');
    expect(formatStopwatchTime(Number.NaN)).toBe('00:00.00');
    expect(formatStopwatchTime(Number.POSITIVE_INFINITY)).toBe('00:00.00');
  });
});
