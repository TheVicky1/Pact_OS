export const FONT_SCALES = ['90%', '100%', '110%', '125%'] as const;

export type FontScale = (typeof FONT_SCALES)[number];

export const DEFAULT_FONT_SCALE: FontScale = '100%';

export const FONT_SCALE_CSS_VARIABLE = '--app-font-scale';

/** Subset of `HTMLElement` the scale is written to; `document.documentElement` satisfies it. */
export interface FontScaleTarget {
  style: Pick<CSSStyleDeclaration, 'setProperty'>;
}

/** Narrows a stored value to a supported scale, falling back to the default for anything unknown. */
export function resolveFontScale(value: unknown): FontScale {
  return FONT_SCALES.find((scale) => scale === value) ?? DEFAULT_FONT_SCALE;
}

export function applyFontScale(target: FontScaleTarget, scale: FontScale): void {
  target.style.setProperty(FONT_SCALE_CSS_VARIABLE, scale);
}
