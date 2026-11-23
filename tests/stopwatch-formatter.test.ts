import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatStopwatchTime } from '../src/lib/stopwatch-formatter';

describe('formatStopwatchTime', () => {
  it('formats zero as 00:00.00', () => {
    assert.equal(formatStopwatchTime(0), '00:00.00');
  });

  it('formats the example from the issue (265180 ms -> 04:25.18)', () => {
    assert.equal(formatStopwatchTime(265180), '04:25.18');
  });

  it('pads seconds and centiseconds to two digits', () => {
    assert.equal(formatStopwatchTime(5010), '00:05.01');
  });

  it('truncates sub-centisecond precision', () => {
    assert.equal(formatStopwatchTime(9), '00:00.00');
    assert.equal(formatStopwatchTime(19), '00:00.01');
    assert.equal(formatStopwatchTime(999), '00:00.99');
  });

  it('rolls over seconds and minutes correctly', () => {
    assert.equal(formatStopwatchTime(59990), '00:59.99');
    assert.equal(formatStopwatchTime(60000), '01:00.00');
    assert.equal(formatStopwatchTime(3599990), '59:59.99');
  });

  it('does not cap minutes at 59', () => {
    assert.equal(formatStopwatchTime(3600000), '60:00.00');
    assert.equal(formatStopwatchTime(4500000), '75:00.00');
  });

  it('treats negative and non-finite inputs as zero', () => {
    assert.equal(formatStopwatchTime(-1000), '00:00.00');
    assert.equal(formatStopwatchTime(Number.NaN), '00:00.00');
    assert.equal(formatStopwatchTime(Number.POSITIVE_INFINITY), '00:00.00');
  });
});
