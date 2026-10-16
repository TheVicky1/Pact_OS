import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBoxFit } from '../src/lib/media/box-fit';

describe('calculateBoxFit', () => {
  it('contains content with centered letterboxing', () => {
    assert.deepEqual(calculateBoxFit({ width: 800, height: 600 }, { width: 1600, height: 900 }, 'contain'), {
      width: 800, height: 450, scale: 0.5, offsetX: 0, offsetY: 75,
    });
  });

  it('covers the container and centers the cropped excess', () => {
    assert.deepEqual(calculateBoxFit({ width: 100, height: 100 }, { width: 200, height: 100 }, 'cover'), {
      width: 200, height: 100, scale: 1, offsetX: -50, offsetY: 0,
    });
  });

  it('stretches content to fill the container', () => {
    assert.deepEqual(calculateBoxFit({ width: 100, height: 100 }, { width: 200, height: 100 }, 'fill'), {
      width: 100, height: 100, scale: 0.5, offsetX: 0, offsetY: 0,
    });
  });

  it('does not enlarge smaller content in inside mode', () => {
    assert.deepEqual(calculateBoxFit({ width: 500, height: 500 }, { width: 200, height: 200 }, 'inside'), {
      width: 200, height: 200, scale: 1, offsetX: 150, offsetY: 150,
    });
  });

  it('rounds offsets to two decimal places', () => {
    assert.equal(calculateBoxFit({ width: 101, height: 100 }, { width: 3, height: 2 }, 'contain').offsetX, 0);
    assert.equal(calculateBoxFit({ width: 100, height: 100 }, { width: 3, height: 2 }, 'contain').offsetY, 16.67);
  });

  it('rejects non-positive dimensions for either box', () => {
    for (const [container, content] of [
      [{ width: 0, height: 1 }, { width: 1, height: 1 }],
      [{ width: 1, height: -1 }, { width: 1, height: 1 }],
      [{ width: 1, height: 1 }, { width: 0, height: 1 }],
      [{ width: 1, height: 1 }, { width: 1, height: -1 }],
    ] as const) {
      assert.throws(() => calculateBoxFit(container, content, 'contain'), RangeError);
    }
  });
});
