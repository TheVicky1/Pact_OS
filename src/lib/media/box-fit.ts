export interface BoxSize {
  width: number;
  height: number;
}

export type BoxFitMode = 'contain' | 'cover' | 'fill' | 'inside';

export interface FittedBoxResult {
  width: number;
  height: number;
  /** For fill, this is the horizontal scale; the vertical scale may differ. */
  scale: number;
  offsetX: number;
  offsetY: number;
}

/** Calculates centered rendered dimensions for fitting content into a container. */
export function calculateBoxFit(
  container: BoxSize,
  content: BoxSize,
  mode: BoxFitMode,
): FittedBoxResult {
  for (const [label, size] of [['container', container], ['content', content]] as const) {
    if (size.width <= 0 || size.height <= 0) {
      throw new RangeError(`${label} width and height must be greater than zero`);
    }
  }

  const widthScale = container.width / content.width;
  const heightScale = container.height / content.height;
  const scale = mode === 'cover'
    ? Math.max(widthScale, heightScale)
    : mode === 'inside'
      ? Math.min(1, widthScale, heightScale)
      : Math.min(widthScale, heightScale);

  const width = mode === 'fill' ? container.width : content.width * scale;
  const height = mode === 'fill' ? container.height : content.height * scale;

  return {
    width,
    height,
    // Fill has independent horizontal and vertical scaling; report horizontal scale.
    scale: mode === 'fill' ? widthScale : scale,
    offsetX: Math.round(((container.width - width) / 2) * 100) / 100,
    offsetY: Math.round(((container.height - height) / 2) * 100) / 100,
  };
}
