export type RoundingMode = "half-even" | "half-up" | "truncate";

export interface DecimalFormatOptions {
  precision?: number;
  roundingMode?: RoundingMode;
  commaSeparated?: boolean;
  currencyPrefix?: string;
}

type DecimalParts = { coefficient: bigint; scale: number };

const MAX_PRECISION = 100;
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

function validatePrecision(p: number): void {
  if (!Number.isInteger(p) || p < 0 || p > MAX_PRECISION) {
    throw new RangeError(`Precision must be an integer from 0 to ${MAX_PRECISION}`);
  }
}

function validateMode(mode: RoundingMode): void {
  if (mode !== "half-even" && mode !== "half-up" && mode !== "truncate") {
    throw new RangeError(`Unsupported rounding mode: ${mode}`);
  }
}

function pow10(n: number): bigint {
  return BigInt(10) ** BigInt(n);
}

function parseDecimal(value: number | string): DecimalParts {
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new TypeError("Decimal value must be finite");
  }

  const text = String(value).trim();
  const match =
    /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/.exec(text);

  if (!match) throw new TypeError(`Invalid decimal value: ${text}`);

  const sign = match[1] === "-" ? -BigInt(1) : BigInt(1);
  const integer = match[2] ?? "0";
  const fraction = match[3] ?? match[4] ?? "";
  const exponent = Number(match[5] ?? "0");

  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > MAX_PRECISION) {
    throw new RangeError("Decimal exponent is outside the supported range");
  }

  let coefficient = BigInt((integer + fraction).replace(/^0+(?=\d)/, ""));
  let scale = fraction.length - exponent;

  if (scale < 0) {
    coefficient *= pow10(-scale);
    scale = 0;
  }

  if (scale > MAX_PRECISION * 2) {
    throw new RangeError("Decimal scale is outside the supported range");
  }

  return { coefficient: coefficient * sign, scale };
}

function divideRounded(
  numerator: bigint,
  denominator: bigint,
  mode: RoundingMode,
): bigint {
  if (denominator === BigInt(0)) throw new RangeError("Division by zero");
  validateMode(mode);

  let n = numerator;
  let d = denominator;

  if (d < BigInt(0)) {
    n = -n;
    d = -d;
  }

  const quotient = n / d;
  const remainder = n % d;

  if (remainder === BigInt(0) || mode === "truncate") return quotient;

  const twice = (remainder < BigInt(0) ? -remainder : remainder) * BigInt(2);
  if (twice < d) return quotient;

  const direction = n < BigInt(0) ? -BigInt(1) : BigInt(1);
  if (twice > d || mode === "half-up") return quotient + direction;

  return quotient % BigInt(2) === BigInt(0) ? quotient : quotient + direction;
}

function rescale(
  coefficient: bigint,
  sourceScale: number,
  precision: number,
  mode: RoundingMode,
): bigint {
  if (sourceScale <= precision) {
    return coefficient * pow10(precision - sourceScale);
  }
  return divideRounded(
    coefficient,
    pow10(sourceScale - precision),
    mode,
  );
}

function toResult(scaled: bigint, precision: number): number {
  if (scaled > MAX_SAFE || scaled < -MAX_SAFE) {
    throw new RangeError("Result exceeds the safe integer range at this precision");
  }

  const result = Number(scaled) / 10 ** precision;
  if (!Number.isFinite(result)) throw new RangeError("Result is not finite");
  return result;
}

function addOrSubtract(
  a: number | string,
  b: number | string,
  precision: number,
  subtract: boolean,
): number {
  validatePrecision(precision);

  const left = parseDecimal(a);
  const right = parseDecimal(b);
  const scale = Math.max(left.scale, right.scale);
  const x = left.coefficient * pow10(scale - left.scale);
  const y = right.coefficient * pow10(scale - right.scale);
  const total = x + (subtract ? -y : y);

  return toResult(rescale(total, scale, precision, "half-even"), precision);
}

export function addFixed(
  a: number | string,
  b: number | string,
  precision = 2,
): number {
  return addOrSubtract(a, b, precision, false);
}

export function subFixed(
  a: number | string,
  b: number | string,
  precision = 2,
): number {
  return addOrSubtract(a, b, precision, true);
}

export function mulFixed(
  a: number | string,
  b: number | string,
  precision = 2,
  mode: RoundingMode = "half-even",
): number {
  validatePrecision(precision);
  validateMode(mode);
  const x = parseDecimal(a);
  const y = parseDecimal(b);
  return toResult(
    rescale(x.coefficient * y.coefficient, x.scale + y.scale, precision, mode),
    precision,
  );
}

export function divFixed(
  a: number | string,
  b: number | string,
  precision = 2,
  mode: RoundingMode = "half-even",
): number {
  validatePrecision(precision);
  validateMode(mode);

  const x = parseDecimal(a);
  const y = parseDecimal(b);
  if (y.coefficient === BigInt(0)) throw new RangeError("Division by zero");

  const exponent = precision + y.scale - x.scale;
  const numerator = exponent >= 0
    ? x.coefficient * pow10(exponent)
    : x.coefficient;
  const denominator = exponent >= 0
    ? y.coefficient
    : y.coefficient * pow10(-exponent);

  return toResult(divideRounded(numerator, denominator, mode), precision);
}

export function roundFixed(
  value: number | string,
  precision = 2,
  mode: RoundingMode = "half-even",
): number {
  validatePrecision(precision);
  validateMode(mode);
  const parsed = parseDecimal(value);
  return toResult(rescale(parsed.coefficient, parsed.scale, precision, mode), precision);
}

export function formatFixed(
  value: number | string,
  options: DecimalFormatOptions = {},
): string {
  const {
    precision = 2,
    roundingMode = "half-even",
    commaSeparated = true,
    currencyPrefix = "",
  } = options;

  validatePrecision(precision);
  validateMode(roundingMode);

  const parsed = parseDecimal(value);
  const scaled = rescale(parsed.coefficient, parsed.scale, precision, roundingMode);
  const negative = scaled < BigInt(0);
  const digits = (negative ? -scaled : scaled).toString().padStart(precision + 1, "0");

  let integerPart = precision === 0 ? digits : digits.slice(0, -precision);
  const fractionPart = precision === 0 ? "" : digits.slice(-precision);

  if (commaSeparated) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  return `${negative ? "-" : ""}${currencyPrefix}${integerPart}${
    precision === 0 ? "" : `.${fractionPart}`
  }`;
}

