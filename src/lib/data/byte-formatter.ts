export type ByteStandard = 'si' | 'iec';

export interface ByteFormatOptions {
  /** Number of decimal places (default: 2) */
  precision?: number;
  /** Measurement standard ('si' | 'iec', default: 'si') */
  standard?: ByteStandard;
  /** Include space between number and unit (default: true) */
  space?: boolean;
}

const SI_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;
const IEC_UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'] as const;

export function formatByteSize(
  bytes: number,
  options?: ByteFormatOptions
): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || Number.isNaN(bytes)) {
    throw new TypeError(`Expected bytes to be a finite number, received ${bytes}`);
  }

  const precision = options?.precision ?? 2;
  const standard = options?.standard ?? 'si';
  const space = options?.space ?? true;

  if (typeof precision !== 'number' || !Number.isFinite(precision) || precision < 0) {
    throw new TypeError(`Expected precision to be a non-negative finite number, received ${precision}`);
  }

  const delimiter = space ? ' ' : '';

  if (bytes === 0) {
    return `0${delimiter}B`;
  }

  const isNegative = bytes < 0;
  const absBytes = Math.abs(bytes);

  const base = standard === 'iec' ? 1024 : 1000;
  const units = standard === 'iec' ? IEC_UNITS : SI_UNITS;

  // Determine exponent/unit tier
  let exponent = Math.floor(Math.log(absBytes) / Math.log(base));

  // Handle precision boundaries (e.g. 999.999 B rounding up to 1000 B -> 1 KB)
  if (exponent < 0) {
    exponent = 0;
  } else if (exponent >= units.length) {
    exponent = units.length - 1;
  }

  let scaled = absBytes / Math.pow(base, exponent);

  // Check if rounding at requested precision bumps it into next unit tier
  const factor = Math.pow(10, precision);
  if (Math.round(scaled * factor) / factor >= base && exponent < units.length - 1) {
    exponent += 1;
    scaled = absBytes / Math.pow(base, exponent);
  }

  const unit = units[exponent];
  let formattedNumber: string;

  if (exponent === 0) {
    formattedNumber = Math.round(scaled).toString();
  } else {
    formattedNumber = scaled.toFixed(precision);
  }

  const sign = isNegative ? '-' : '';
  return `${sign}${formattedNumber}${delimiter}${unit}`;
}
