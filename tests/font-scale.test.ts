import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FONT_SCALES,
  DEFAULT_FONT_SCALE,
  FONT_SCALE_CSS_VARIABLE,
  FontScaleTarget,
  applyFontScale,
  resolveFontScale,
} from '../src/lib/ui/font-scale';

function createStubElement(): FontScaleTarget & { properties: Map<string, string | null> } {
  const properties = new Map<string, string | null>();
  return {
    properties,
    style: {
      setProperty(property: string, value: string | null) {
        properties.set(property, value);
      },
    },
  };
}

describe('applyFontScale', () => {
  it('injects every supported scale into the --app-font-scale CSS variable', () => {
    for (const scale of FONT_SCALES) {
      const element = createStubElement();
      applyFontScale(element, scale);
      assert.equal(element.properties.get('--app-font-scale'), scale);
    }
  });

  it('replaces the previous scale when the setting changes', () => {
    const element = createStubElement();
    applyFontScale(element, '125%');
    applyFontScale(element, '90%');

    assert.equal(element.properties.get(FONT_SCALE_CSS_VARIABLE), '90%');
    assert.equal(element.properties.size, 1);
  });
});

describe('resolveFontScale', () => {
  it('keeps every supported stored scale', () => {
    for (const scale of FONT_SCALES) {
      assert.equal(resolveFontScale(scale), scale);
    }
  });

  it('falls back to the standard 100% scale for missing or unsupported values', () => {
    assert.equal(DEFAULT_FONT_SCALE, '100%');

    for (const value of [undefined, null, '', '80%', '150%', '100', 1.1, {}]) {
      assert.equal(resolveFontScale(value), DEFAULT_FONT_SCALE, `Expected default for ${String(value)}`);
    }
  });
});
