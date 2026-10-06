/**
 * Unit tests for the HabitStreakHeatmap 52-week calendar grid.
 * Pure helpers are tested directly; the component is checked via SSR markup
 * (mounting would need a DOM-emulation dependency this project doesn't have).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url, { jsx: true, alias: { '@': path.resolve('src') } });
const {
  HabitStreakHeatmap,
  HEATMAP_WEEKS,
  getCompletionPercent,
  getIntensityTier,
  buildStreakHeatmapWeeks,
  getCellLabel,
  moveGridFocus,
} = jiti('../src/components/analytics/habit-streak-heatmap.tsx') as typeof import('../src/components/analytics/habit-streak-heatmap');

const cellsOf = (weeks: ReturnType<typeof buildStreakHeatmapWeeks>) =>
  weeks.flat().filter((c): c is NonNullable<typeof c> => c !== null);

describe('getIntensityTier', () => {
  it('0 completions is tier 0 regardless of target', () => {
    assert.equal(getIntensityTier(0, 5), 0);
    assert.equal(getIntensityTier(0, 0), 0);
    assert.equal(getIntensityTier(-1, 5), 0);
  });

  it('maps percentage bands to tiers 1–4 with inclusive upper bounds', () => {
    const cases: [number, number, number][] = [
      [1, 100, 1], [25, 100, 1],
      [26, 100, 2], [50, 100, 2],
      [51, 100, 3], [75, 100, 3],
      [76, 100, 4], [100, 100, 4],
      [1, 4, 1], [2, 4, 2], [3, 4, 3], [4, 4, 4],
    ];
    for (const [count, target, tier] of cases) {
      assert.equal(getIntensityTier(count, target), tier, `${count}/${target}`);
    }
  });

  it('exceeding the target stays at the maximum tier', () => {
    assert.equal(getIntensityTier(9, 5), 4);
    assert.equal(getCompletionPercent(9, 5), 100);
  });

  it('completions with no target count as fully achieved', () => {
    assert.equal(getCompletionPercent(2, 0), 100);
    assert.equal(getIntensityTier(2, 0), 4);
  });
});

describe('buildStreakHeatmapWeeks', () => {
  // 2026-10-06 is a Tuesday.
  const weeks = buildStreakHeatmapWeeks([], '2026-10-06');

  it('builds 52 week columns of 7 days, Sunday first', () => {
    assert.equal(weeks.length, HEATMAP_WEEKS);
    assert.ok(weeks.every((w) => w.length === 7));
    assert.equal(weeks[0][0]?.date, '2025-10-12', 'first cell is the Sunday 51 weeks before the end week');
  });

  it('ends on endDate and leaves later days of that week empty', () => {
    const last = weeks[HEATMAP_WEEKS - 1];
    assert.deepEqual(last.slice(0, 3).map((c) => c?.date), ['2026-10-04', '2026-10-05', '2026-10-06']);
    assert.deepEqual(last.slice(3), [null, null, null, null]);
    assert.equal(cellsOf(weeks).length, 51 * 7 + 3);
  });

  it('dates are consecutive with no gaps or duplicates', () => {
    const dates = cellsOf(weeks).map((c) => Date.parse(c.date));
    assert.ok(dates.every((t, i) => i === 0 || t - dates[i - 1] === 86_400_000));
  });

  it('missing dates fall back to zero completions and tier 0', () => {
    assert.ok(cellsOf(weeks).every((c) => c.count === 0 && c.target === 0 && c.tier === 0));
  });

  it('places records on their date with the computed tier and ignores out-of-range records', () => {
    const w = buildStreakHeatmapWeeks(
      [
        { date: '2026-10-06', count: 4, target: 5 },
        { date: '2026-10-01', count: 1, target: 5 },
        { date: '2026-10-07', count: 5, target: 5 }, // after endDate
        { date: '2024-01-01', count: 5, target: 5 }, // before the window
      ],
      '2026-10-06'
    );
    const cells = cellsOf(w);
    assert.deepEqual(cells.find((c) => c.date === '2026-10-06'), { date: '2026-10-06', count: 4, target: 5, tier: 4 });
    assert.equal(cells.find((c) => c.date === '2026-10-01')?.tier, 1);
    assert.equal(cells.filter((c) => c.count > 0).length, 2);
  });

  it('handles a Saturday end date (full last week) and leap days', () => {
    const w = buildStreakHeatmapWeeks([], '2028-03-04'); // Saturday
    assert.equal(w[HEATMAP_WEEKS - 1][6]?.date, '2028-03-04');
    assert.equal(cellsOf(w).length, HEATMAP_WEEKS * 7);
    assert.ok(cellsOf(w).some((c) => c.date === '2028-02-29'));
  });
});

describe('getCellLabel', () => {
  it('describes date and completion against target', () => {
    assert.equal(getCellLabel({ date: '2026-10-06', count: 4, target: 5 }), 'Oct 6, 2026: 4 of 5 habits completed');
    assert.equal(getCellLabel({ date: '2026-01-01', count: 0, target: 1 }), 'Jan 1, 2026: 0 of 1 habit completed');
    assert.equal(getCellLabel({ date: '2026-01-01', count: 0, target: 0 }), 'Jan 1, 2026: 0 habits completed');
  });
});

describe('moveGridFocus', () => {
  const weeks = buildStreakHeatmapWeeks([], '2026-10-06'); // last column: rows 0–2 real, 3–6 future

  it('moves one cell per arrow key', () => {
    assert.deepEqual(moveGridFocus(weeks, [3, 10], 'ArrowUp'), [2, 10]);
    assert.deepEqual(moveGridFocus(weeks, [3, 10], 'ArrowDown'), [4, 10]);
    assert.deepEqual(moveGridFocus(weeks, [3, 10], 'ArrowLeft'), [3, 9]);
    assert.deepEqual(moveGridFocus(weeks, [3, 10], 'ArrowRight'), [3, 11]);
  });

  it('stops at grid edges and before future days', () => {
    assert.equal(moveGridFocus(weeks, [0, 0], 'ArrowUp'), null);
    assert.equal(moveGridFocus(weeks, [0, 0], 'ArrowLeft'), null);
    assert.equal(moveGridFocus(weeks, [6, 50], 'ArrowDown'), null);
    assert.equal(moveGridFocus(weeks, [2, 51], 'ArrowRight'), null);
    assert.equal(moveGridFocus(weeks, [2, 51], 'ArrowDown'), null, 'Oct 7 is in the future');
    assert.equal(moveGridFocus(weeks, [5, 50], 'ArrowRight'), null);
  });

  it('ignores non-arrow keys', () => {
    assert.equal(moveGridFocus(weeks, [3, 10], 'Enter'), null);
  });
});

describe('HabitStreakHeatmap markup', () => {
  const html = renderToStaticMarkup(
    React.createElement(HabitStreakHeatmap, {
      records: [{ date: '2026-10-06', count: 4, target: 5 }],
      endDate: '2026-10-06',
    })
  );

  it('renders an ARIA grid of 7 rows with one labelled gridcell per past day', () => {
    assert.match(html, /role="grid" aria-label="Habit completions over the last 52 weeks"/);
    assert.equal(html.match(/role="row"/g)?.length, 7);
    assert.equal(html.match(/role="gridcell"/g)?.length, 51 * 7 + 3);
    assert.match(html, /aria-label="Oct 6, 2026: 4 of 5 habits completed"/);
  });

  it('puts exactly one cell (the latest day) in the tab order', () => {
    assert.equal(html.match(/tabindex="0"/g)?.length, 1);
    assert.match(html, /data-pos="2-51" tabindex="0" aria-label="Oct 6, 2026/);
  });

  it('applies the tier colour and scrolls horizontally on small screens', () => {
    assert.match(html, /aria-label="Oct 6, 2026: 4 of 5 habits completed" class="[^"]*bg-\[#f0cb46\]/);
    assert.match(html, /class="overflow-x-auto/);
  });
});
