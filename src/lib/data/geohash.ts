/**
 * Pure TypeScript Geohash Precision Encoder & Proximity Bounding Box Calculator.
 * Target: src/lib/data/geohash.ts
 *
 * Implements Gustavo Niemeyer's standard Geohash algorithm:
 * - 32-character base32 alphabet (omitting a, i, l, o).
 * - Binary bisecting tree with interleaved longitude/latitude bits.
 * - Zero external dependencies.
 */

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface DecodedGeohash {
  latitude: number;
  longitude: number;
  errorMargin: {
    lat: number;
    lng: number;
  };
}

export interface GeohashNeighbors {
  n: string;
  ne: string;
  e: string;
  se: string;
  s: string;
  sw: string;
  w: string;
  nw: string;
}

export type GeohashDirection = 'n' | 's' | 'e' | 'w';

// Standard Gustavo Niemeyer 32-character alphabet (omitting 'a', 'i', 'l', 'o')
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
const BITS = [16, 8, 4, 2, 1];

// Precompute lookup table for decode
const DECODE_MAP: { [char: string]: number } = {};
for (let i = 0; i < BASE32.length; i++) {
  DECODE_MAP[BASE32[i]] = i;
}

/**
 * Normalizes longitude to [-180, 180) degrees.
 * Applies modulo before range shifting to preserve precision near antimeridian boundaries.
 */
function normalizeLongitude(lng: number): number {
  let normalized = lng % 360;
  if (normalized < -180) {
    normalized += 360;
  }
  if (normalized >= 180) {
    normalized -= 360;
  }
  return normalized;
}

/**
 * Clamps latitude to [-90, 90] degrees.
 */
function clampLatitude(lat: number): number {
  if (lat > 90) return 90;
  if (lat < -90) return -90;
  return lat;
}

/**
 * Encodes a latitude and longitude pair into a canonical base32 Geohash string.
 *
 * @param latitude - Latitude in degrees [-90.0, 90.0]
 * @param longitude - Longitude in degrees [-180.0, 180.0]
 * @param precision - Length of geohash string (default: 7, ~152m resolution)
 * @returns Base32 encoded geohash string
 */
export function encodeGeohash(
  latitude: number,
  longitude: number,
  precision: number = 7
): string {
  if (typeof latitude !== 'number' || !Number.isFinite(latitude)) {
    throw new Error('Latitude must be a finite number');
  }
  if (typeof longitude !== 'number' || !Number.isFinite(longitude)) {
    throw new Error('Longitude must be a finite number');
  }

  if (typeof precision !== 'number' || isNaN(precision) || precision < 1) {
    precision = 7;
  }
  precision = Math.min(Math.floor(precision), 24); // Cap max precision

  const lat = clampLatitude(latitude);
  const lng = normalizeLongitude(longitude);

  const latInterval: [number, number] = [-90.0, 90.0];
  const lngInterval: [number, number] = [-180.0, 180.0];

  let geohash = '';
  let isEven = true; // Even bits correspond to longitude, odd to latitude
  let ch = 0;
  let bit = 0;

  while (geohash.length < precision) {
    let mid: number;
    if (isEven) {
      mid = (lngInterval[0] + lngInterval[1]) / 2;
      if (lng >= mid) {
        ch |= BITS[bit];
        lngInterval[0] = mid;
      } else {
        lngInterval[1] = mid;
      }
    } else {
      mid = (latInterval[0] + latInterval[1]) / 2;
      if (lat >= mid) {
        ch |= BITS[bit];
        latInterval[0] = mid;
      } else {
        latInterval[1] = mid;
      }
    }

    isEven = !isEven;

    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}

/**
 * Computes the latitude/longitude bounding box for a given geohash.
 *
 * @param geohash - Target base32 geohash string
 * @returns BoundingBox with minLat, maxLat, minLng, maxLng
 */
export function getGeohashBoundingBox(geohash: string): BoundingBox {
  if (!geohash || typeof geohash !== 'string') {
    throw new Error('Geohash must be a non-empty string');
  }

  const cleanGeohash = geohash.toLowerCase().trim();
  if (cleanGeohash.length === 0) {
    throw new Error('Geohash must be a non-empty string');
  }

  const latInterval: [number, number] = [-90.0, 90.0];
  const lngInterval: [number, number] = [-180.0, 180.0];
  let isEven = true;

  for (let i = 0; i < cleanGeohash.length; i++) {
    const c = cleanGeohash[i];
    const cd = DECODE_MAP[c];
    if (cd === undefined) {
      throw new Error(`Invalid geohash character: "${c}"`);
    }

    for (const mask of BITS) {
      if (isEven) {
        const mid = (lngInterval[0] + lngInterval[1]) / 2;
        if ((cd & mask) !== 0) {
          lngInterval[0] = mid;
        } else {
          lngInterval[1] = mid;
        }
      } else {
        const mid = (latInterval[0] + latInterval[1]) / 2;
        if ((cd & mask) !== 0) {
          latInterval[0] = mid;
        } else {
          latInterval[1] = mid;
        }
      }
      isEven = !isEven;
    }
  }

  return {
    minLat: latInterval[0],
    maxLat: latInterval[1],
    minLng: lngInterval[0],
    maxLng: lngInterval[1],
  };
}

/**
 * Decodes a geohash string into its center latitude, longitude, and precision error margins.
 *
 * @param geohash - Target base32 geohash string
 * @returns DecodedGeohash containing coordinates and error margin
 */
export function decodeGeohash(geohash: string): DecodedGeohash {
  const box = getGeohashBoundingBox(geohash);

  const latitude = (box.minLat + box.maxLat) / 2;
  const longitude = (box.minLng + box.maxLng) / 2;
  const latErr = (box.maxLat - box.minLat) / 2;
  const lngErr = (box.maxLng - box.minLng) / 2;

  return {
    latitude,
    longitude,
    errorMargin: {
      lat: latErr,
      lng: lngErr,
    },
  };
}

/**
 * Determines whether a given coordinate point lies inside a target geohash bounding box.
 *
 * @param latitude - Latitude of query point
 * @param longitude - Longitude of query point
 * @param targetGeohash - Geohash string to test against
 * @returns boolean true if inside, false otherwise
 */
export function isPointInsideGeohash(
  latitude: number,
  longitude: number,
  targetGeohash: string
): boolean {
  if (
    typeof latitude !== 'number' ||
    !Number.isFinite(latitude) ||
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude)
  ) {
    return false;
  }

  const lat = clampLatitude(latitude);
  const lng = normalizeLongitude(longitude);

  const box = getGeohashBoundingBox(targetGeohash);
  const longitudeInside =
    (lng >= box.minLng && lng <= box.maxLng) ||
    (lng === -180 && box.maxLng === 180);

  return (
    lat >= box.minLat &&
    lat <= box.maxLat &&
    longitudeInside
  );
}

/**
 * Calculates the adjacent neighboring geohash in a given cardinal direction ('n', 's', 'e', 'w').
 *
 * @param geohash - Base geohash string
 * @param direction - Cardinal direction ('n' | 's' | 'e' | 'w')
 * @returns Adjacent neighboring geohash string with identical precision
 */
export function getGeohashNeighbor(
  geohash: string,
  direction: GeohashDirection
): string {
  const cleanGeohash = geohash.toLowerCase().trim();
  const box = getGeohashBoundingBox(cleanGeohash);
  const latSpan = box.maxLat - box.minLat;
  const lngSpan = box.maxLng - box.minLng;
  const centerLat = (box.minLat + box.maxLat) / 2;
  const centerLng = (box.minLng + box.maxLng) / 2;

  let targetLat = centerLat;
  let targetLng = centerLng;

  switch (direction.toLowerCase()) {
    case 'n':
      targetLat = centerLat + latSpan;
      break;
    case 's':
      targetLat = centerLat - latSpan;
      break;
    case 'e':
      targetLng = centerLng + lngSpan;
      break;
    case 'w':
      targetLng = centerLng - lngSpan;
      break;
    default:
      throw new Error(`Invalid direction: "${direction}". Must be 'n', 's', 'e', or 'w'`);
  }

  return encodeGeohash(targetLat, targetLng, cleanGeohash.length);
}

/**
 * Calculates all 8 surrounding neighboring geohash cells (N, NE, E, SE, S, SW, W, NW).
 *
 * @param geohash - Base geohash string
 * @returns GeohashNeighbors object containing all 8 adjacent geohash strings
 */
export function getGeohashNeighbors(geohash: string): GeohashNeighbors {
  const cleanGeohash = geohash.toLowerCase().trim();
  const n = getGeohashNeighbor(cleanGeohash, 'n');
  const s = getGeohashNeighbor(cleanGeohash, 's');
  const e = getGeohashNeighbor(cleanGeohash, 'e');
  const w = getGeohashNeighbor(cleanGeohash, 'w');

  return {
    n,
    ne: getGeohashNeighbor(n, 'e'),
    e,
    se: getGeohashNeighbor(s, 'e'),
    s,
    sw: getGeohashNeighbor(s, 'w'),
    w,
    nw: getGeohashNeighbor(n, 'w'),
  };
}
