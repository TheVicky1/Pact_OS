import { describe, it, expect } from 'vitest';
import {
  encodeGeohash,
  decodeGeohash,
  getGeohashBoundingBox,
  isPointInsideGeohash,
} from '../src/lib/data/geohash';

describe('Geohash Precision Encoder & Proximity Bounding Box', () => {
  // Canonical landmarks for accuracy testing:
  // Eiffel Tower: 48.8584, 2.2945 -> 'u09tunq'
  // Statue of Liberty: 40.6892, -74.0445 -> 'dr5r7p4'
  // Sydney Opera House: -33.8568, 151.2153 -> 'r3gx2ux'

  describe('encodeGeohash', () => {
    it('encodes canonical global landmarks to accurate geohash strings', () => {
      const eiffel = encodeGeohash(48.8584, 2.2945, 7);
      expect(eiffel).toBe('u09tunq');

      const liberty = encodeGeohash(40.6892, -74.0445, 7);
      expect(liberty).toBe('dr5r7p4');

      const sydney = encodeGeohash(-33.8568, 151.2153, 7);
      expect(sydney).toBe('r3gx2ux');
    });

    it('defaults precision to 7 characters if unspecified or invalid', () => {
      const hashDefault = encodeGeohash(37.7749, -122.4194);
      expect(hashDefault).toHaveLength(7);

      const hashInvalid = encodeGeohash(37.7749, -122.4194, 0);
      expect(hashInvalid).toHaveLength(7);

      const hashNan = encodeGeohash(37.7749, -122.4194, NaN);
      expect(hashNan).toHaveLength(7);
    });

    it('rejects non-finite latitude or longitude coordinates', () => {
      expect(() => encodeGeohash(NaN, 0)).toThrow('Latitude must be a finite number');
      expect(() => encodeGeohash(0, NaN)).toThrow('Longitude must be a finite number');
      expect(() => encodeGeohash(Infinity, 0)).toThrow('Latitude must be a finite number');
      expect(() => encodeGeohash(0, -Infinity)).toThrow('Longitude must be a finite number');
    });

    it('clamps latitude and normalizes longitude boundaries', () => {
      // Over-clamped north pole
      const north = encodeGeohash(95.0, 0.0, 5);
      const northDecoded = decodeGeohash(north);
      expect(northDecoded.latitude).toBeGreaterThan(89.0);

      // Over-clamped south pole
      const south = encodeGeohash(-95.0, 0.0, 5);
      const southDecoded = decodeGeohash(south);
      expect(southDecoded.latitude).toBeLessThan(-89.0);

      // Longitude wrapping (> 180 or < -180)
      const wrappedLng = encodeGeohash(0.0, 190.0, 6);
      const normalLng = encodeGeohash(0.0, -170.0, 6);
      expect(wrappedLng).toBe(normalLng);

      // Preserves longitudes just below 180 degrees without rounding to -180
      const nearEdge = encodeGeohash(0.0, 179.99999999999997, 6);
      const decodedNearEdge = decodeGeohash(nearEdge);
      expect(decodedNearEdge.longitude).toBeGreaterThan(170.0);
    });
  });

  describe('decodeGeohash & getGeohashBoundingBox', () => {
    it('decodes geohash center coordinate and symmetric error margins', () => {
      const geohash = 'dr5r7p4';
      const decoded = decodeGeohash(geohash);

      expect(decoded.latitude).toBeCloseTo(40.689, 2);
      expect(decoded.longitude).toBeCloseTo(-74.044, 2);
      expect(decoded.errorMargin.lat).toBeGreaterThan(0);
      expect(decoded.errorMargin.lng).toBeGreaterThan(0);
    });

    it('returns exact bounding box containing the query coordinates', () => {
      const lat = 10.7769;
      const lng = 106.7009; // Ho Chi Minh City
      const geohash = encodeGeohash(lat, lng, 8);
      const box = getGeohashBoundingBox(geohash);

      expect(box.minLat).toBeLessThanOrEqual(lat);
      expect(box.maxLat).toBeGreaterThanOrEqual(lat);
      expect(box.minLng).toBeLessThanOrEqual(lng);
      expect(box.maxLng).toBeGreaterThanOrEqual(lng);
    });

    it('throws descriptive error on invalid base32 characters or whitespace-only geohash', () => {
      expect(() => getGeohashBoundingBox('abc1234')).toThrow(
        'Invalid geohash character'
      );
      expect(() => decodeGeohash('dr5reg@')).toThrow(
        'Invalid geohash character'
      );
      expect(() => decodeGeohash('')).toThrow(
        'Geohash must be a non-empty string'
      );
      expect(() => decodeGeohash('   ')).toThrow(
        'Geohash must be a non-empty string'
      );
    });
  });

  describe('isPointInsideGeohash', () => {
    it('validates whether arbitrary points lie inside or outside the geohash box', () => {
      const targetLat = 21.0285;
      const targetLng = 105.8542; // Hanoi
      const targetGeohash = encodeGeohash(targetLat, targetLng, 7);

      // Exact point is inside
      expect(isPointInsideGeohash(targetLat, targetLng, targetGeohash)).toBe(true);

      // Far away point is outside
      expect(isPointInsideGeohash(21.5, 106.0, targetGeohash)).toBe(false);

      // Antimeridian boundary edge check (box ending at 180 degrees)
      expect(isPointInsideGeohash(60, 180, 'z')).toBe(true);

      // Invalid coordinates return false gracefully
      expect(isPointInsideGeohash(NaN, targetLng, targetGeohash)).toBe(false);
      expect(isPointInsideGeohash(targetLat, NaN, targetGeohash)).toBe(false);
      expect(isPointInsideGeohash(Infinity, targetLng, targetGeohash)).toBe(false);
      expect(isPointInsideGeohash(targetLat, -Infinity, targetGeohash)).toBe(false);
    });
  });
});
