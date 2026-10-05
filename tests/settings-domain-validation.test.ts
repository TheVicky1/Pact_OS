import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  updateProfileSchema,
  updatePasswordSchema,
  updateAccountabilityPreferencesSchema,
  updateNotificationPreferencesSchema,
  updateWorkspacePreferencesSchema,
  updateThemeSettingsSchema,
  hexColorSchema,
} from '../src/lib/validations/settings';
import {
  POPULAR_TIMEZONES,
  formatTimezoneLiveTime,
} from '../src/lib/timezones-data';
import { isValidIanaTimezone } from '../src/lib/time';

describe('PACT Phase 4I-4: Settings Domain Validation Suite', () => {
  // 1. Profile & Timezone Validation
  describe('Profile & Timezone Validation (updateProfileSchema)', () => {
    it('accepts valid full name and canonical IANA timezones', () => {
      const validCases = [
        { fullName: 'Vicky Patel', timezone: 'Asia/Kolkata' },
        { fullName: 'Alex Mercer', timezone: 'America/New_York' },
        { fullName: 'Elena Rostova', timezone: 'Europe/London' },
        { fullName: 'Kenji Sato', timezone: 'Asia/Tokyo' },
        { fullName: 'System Admin', timezone: 'UTC' },
      ];

      for (const validCase of validCases) {
        const res = updateProfileSchema.safeParse(validCase);
        assert.equal(res.success, true, `Expected valid for ${JSON.stringify(validCase)}`);
      }
    });

    it('rejects non-canonical timezone abbreviations and invalid strings', () => {
      const invalidTimezones = [
        'IST',
        'PST',
        'EST',
        'GMT+5:30',
        'Invalid/Timezone',
        'Mars/Curiosity',
        '',
        '   ',
      ];

      for (const tz of invalidTimezones) {
        const res = updateProfileSchema.safeParse({
          fullName: 'Test User',
          timezone: tz,
        });
        assert.equal(
          res.success,
          false,
          `Expected rejection for invalid timezone: ${tz}`
        );
      }
    });

    it('rejects names that are too short, empty, or whitespace-only', () => {
      const invalidNames = ['', ' ', '   ', 'A'];

      for (const name of invalidNames) {
        const res = updateProfileSchema.safeParse({
          fullName: name,
          timezone: 'UTC',
        });
        assert.equal(
          res.success,
          false,
          `Expected rejection for invalid name: "${name}"`
        );
      }
    });

    it('rejects names exceeding 100 characters', () => {
      const longName = 'A'.repeat(101);
      const res = updateProfileSchema.safeParse({
        fullName: longName,
        timezone: 'UTC',
      });
      assert.equal(res.success, false, 'Expected rejection for >100 char name');
    });
  });

  // 2. Password Validation
  describe('Password Security Validation (updatePasswordSchema)', () => {
    it('accepts valid matching password of length >= 8', () => {
      const res = updatePasswordSchema.safeParse({
        newPassword: 'SuperSecurePassword123!',
        confirmPassword: 'SuperSecurePassword123!',
      });
      assert.equal(res.success, true);
    });

    it('rejects passwords shorter than 8 characters', () => {
      const res = updatePasswordSchema.safeParse({
        newPassword: 'short',
        confirmPassword: 'short',
      });
      assert.equal(res.success, false);
      if (!res.success) {
        assert.match(res.error.issues[0]?.message || '', /at least 8 characters/);
      }
    });

    it('rejects mismatched newPassword and confirmPassword', () => {
      const res = updatePasswordSchema.safeParse({
        newPassword: 'Password12345!',
        confirmPassword: 'DifferentPassword12345!',
      });
      assert.equal(res.success, false);
      if (!res.success) {
        assert.match(res.error.issues[0]?.message || '', /do not match/);
      }
    });
  });

  // 3. Accountability Preferences Validation
  describe('Accountability Preferences Validation (updateAccountabilityPreferencesSchema)', () => {
    it('accepts valid UUID default consequence rule and boolean flags', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const res = updateAccountabilityPreferencesSchema.safeParse({
        defaultConsequenceId: validUuid,
        autoApplyDefault: true,
        isEnabled: true,
      });
      assert.equal(res.success, true);
    });

    it('accepts null default consequence rule', () => {
      const res = updateAccountabilityPreferencesSchema.safeParse({
        defaultConsequenceId: null,
        autoApplyDefault: false,
        isEnabled: false,
      });
      assert.equal(res.success, true);
    });

    it('rejects invalid non-UUID defaultConsequenceId', () => {
      const res = updateAccountabilityPreferencesSchema.safeParse({
        defaultConsequenceId: 'not-a-valid-uuid',
        autoApplyDefault: false,
        isEnabled: true,
      });
      assert.equal(res.success, false);
    });
  });

  // 4. Notification Preferences Validation
  describe('Notification Preferences Validation (updateNotificationPreferencesSchema)', () => {
    it('accepts valid boolean notification settings', () => {
      const res = updateNotificationPreferencesSchema.safeParse({
        dailyPlanReminder: true,
        deadlineAlerts: true,
        consequenceAlerts: false,
        weeklyReviewNotice: true,
      });
      assert.equal(res.success, true);
    });

    it('supplies safe defaults for missing notification keys', () => {
      const res = updateNotificationPreferencesSchema.safeParse({});
      assert.equal(res.success, true);
      if (res.success) {
        assert.equal(res.data.dailyPlanReminder, true);
        assert.equal(res.data.deadlineAlerts, true);
        assert.equal(res.data.consequenceAlerts, true);
        assert.equal(res.data.weeklyReviewNotice, true);
      }
    });
  });

  // 5. Curated Timezone Dataset Integrity
  describe('Curated Timezone Dataset Integrity', () => {
    it('ensures all curated timezones in POPULAR_TIMEZONES are valid IANA identifiers', () => {
      const seenValues = new Set<string>();

      for (const tz of POPULAR_TIMEZONES) {
        assert.equal(
          isValidIanaTimezone(tz.value),
          true,
          `Curated timezone ${tz.value} must be valid IANA`
        );
        assert.equal(
          seenValues.has(tz.value),
          false,
          `Duplicate timezone found in curated list: ${tz.value}`
        );
        seenValues.add(tz.value);
      }

      assert.ok(POPULAR_TIMEZONES.length >= 25, 'Should have comprehensive world coverage');
    });

    it('formats live time cleanly for all curated timezones', () => {
      const sampleDate = new Date('2026-10-15T12:00:00.000Z');

      for (const tz of POPULAR_TIMEZONES) {
        const formatted = formatTimezoneLiveTime(tz.value, sampleDate);
        assert.notEqual(
          formatted,
          'Invalid Timezone',
          `Failed to format live time for timezone: ${tz.value}`
        );
        assert.ok(formatted.length > 0);
      }
    });
  });

  // 6. Theme & Hex Color Code Validation
  describe('Theme Settings & Hex Color Validation (updateThemeSettingsSchema / hexColorSchema)', () => {
    it('accepts valid 3-character and 6-character hex color codes (#FFF, #123456, #FF5500)', () => {
      const validColors = ['#FFF', '#fff', '#123456', '#FF5500', '#abc', '#000000', '#ffffff'];

      for (const color of validColors) {
        const schemaRes = hexColorSchema.safeParse(color);
        assert.equal(schemaRes.success, true, `Expected valid hex color for ${color}`);

        const themeRes = updateThemeSettingsSchema.safeParse({ accentColor: color });
        assert.equal(themeRes.success, true, `Expected valid theme accent color for ${color}`);

        const profileRes = updateProfileSchema.safeParse({
          fullName: 'Test User',
          timezone: 'UTC',
          accentColor: color,
        });
        assert.equal(profileRes.success, true, `Expected valid profile accent color for ${color}`);
      }
    });

    it('rejects invalid hex color strings (123456, #GGGGGG, #12, #12345, empty)', () => {
      const invalidColors = [
        '123456', // missing '#' prefix
        '#GGGGGG', // invalid hex characters
        '#12', // too short (2 chars)
        '#1234', // invalid length (4 chars)
        '#12345', // invalid length (5 chars)
        '#1234567', // too long (7 chars)
        '#ZZZ', // non-hex letters
        'red', // named color instead of hex
        '',
        '   ',
      ];

      for (const color of invalidColors) {
        const schemaRes = hexColorSchema.safeParse(color);
        assert.equal(schemaRes.success, false, `Expected rejection for invalid hex color: ${color}`);
        if (!schemaRes.success) {
          assert.match(
            schemaRes.error.issues[0]?.message || '',
            /Invalid hex color code format \(e\.g\. #FF5500\)/
          );
        }

        const themeRes = updateThemeSettingsSchema.safeParse({ accentColor: color });
        assert.equal(themeRes.success, false, `Expected theme rejection for invalid hex color: ${color}`);

        const profileRes = updateProfileSchema.safeParse({
          fullName: 'Test User',
          timezone: 'UTC',
          accentColor: color,
        });
        assert.equal(profileRes.success, false, `Expected profile rejection for invalid accent color: ${color}`);
      }
    });
  });

  // 7. Workspace Preferences Validation
  describe('Workspace Preferences Validation (updateWorkspacePreferencesSchema)', () => {
    it('accepts every supported font scale', () => {
      for (const fontScale of ['90%', '100%', '110%', '125%']) {
        const res = updateWorkspacePreferencesSchema.safeParse({ fontScale });
        assert.equal(res.success, true, `Expected valid font scale: ${fontScale}`);
      }
    });

    it('defaults to the standard 100% font scale when missing', () => {
      const res = updateWorkspacePreferencesSchema.safeParse({});
      assert.equal(res.success, true);
      if (res.success) {
        assert.equal(res.data.fontScale, '100%');
      }
    });

    it('rejects unsupported font scales', () => {
      for (const fontScale of ['80%', '150%', '100', '', 1.1, null]) {
        const res = updateWorkspacePreferencesSchema.safeParse({ fontScale });
        assert.equal(res.success, false, `Expected rejection for font scale: ${String(fontScale)}`);
      }
    });
  });
});
