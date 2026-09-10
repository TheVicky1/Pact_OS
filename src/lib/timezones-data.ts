/**
 * Curated dataset of canonical IANA timezones organized by global region.
 * Enables fast search, selection, and live local time preview.
 */

export interface TimezoneOption {
  value: string;
  label: string;
  region: string;
  city: string;
}

export const POPULAR_TIMEZONES: TimezoneOption[] = [
  // Common / Canonical
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', region: 'Universal', city: 'UTC' },

  // Asia
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST — India)', region: 'Asia', city: 'Kolkata / Mumbai / Delhi' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST — UAE)', region: 'Asia', city: 'Dubai / Abu Dhabi' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)', region: 'Asia', city: 'Singapore' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST — Japan)', region: 'Asia', city: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST — China)', region: 'Asia', city: 'Shanghai / Beijing' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (HKT)', region: 'Asia', city: 'Hong Kong' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (ICT — Thailand / Vietnam)', region: 'Asia', city: 'Bangkok / Hanoi' },
  { value: 'Asia/Seoul', label: 'Asia/Seoul (KST — South Korea)', region: 'Asia', city: 'Seoul' },
  { value: 'Asia/Jakarta', label: 'Asia/Jakarta (WIB — Indonesia)', region: 'Asia', city: 'Jakarta' },
  { value: 'Asia/Riyadh', label: 'Asia/Riyadh (AST — Saudi Arabia)', region: 'Asia', city: 'Riyadh' },
  { value: 'Asia/Dhaka', label: 'Asia/Dhaka (BST — Bangladesh)', region: 'Asia', city: 'Dhaka' },
  { value: 'Asia/Karachi', label: 'Asia/Karachi (PKT — Pakistan)', region: 'Asia', city: 'Karachi' },

  // Americas
  { value: 'America/New_York', label: 'America/New_York (Eastern Time — US/Canada)', region: 'Americas', city: 'New York / Toronto' },
  { value: 'America/Chicago', label: 'America/Chicago (Central Time — US/Canada)', region: 'Americas', city: 'Chicago / Dallas' },
  { value: 'America/Denver', label: 'America/Denver (Mountain Time — US/Canada)', region: 'Americas', city: 'Denver / Phoenix' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (Pacific Time — US/Canada)', region: 'Americas', city: 'Los Angeles / San Francisco / Vancouver' },
  { value: 'America/Anchorage', label: 'America/Anchorage (Alaska Time)', region: 'Americas', city: 'Anchorage' },
  { value: 'Pacific/Honolulu', label: 'Pacific/Honolulu (Hawaii Time)', region: 'Americas', city: 'Honolulu' },
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (BRT — Brazil)', region: 'Americas', city: 'São Paulo / Rio de Janeiro' },
  { value: 'America/Buenos_Aires', label: 'America/Buenos_Aires (ART — Argentina)', region: 'Americas', city: 'Buenos Aires' },
  { value: 'America/Mexico_City', label: 'America/Mexico_City (CST — Mexico)', region: 'Americas', city: 'Mexico City' },
  { value: 'America/Bogota', label: 'America/Bogota (COT — Colombia)', region: 'Americas', city: 'Bogotá' },
  { value: 'America/Santiago', label: 'America/Santiago (CLT — Chile)', region: 'Americas', city: 'Santiago' },

  // Europe
  { value: 'Europe/London', label: 'Europe/London (GMT / BST — UK & Ireland)', region: 'Europe', city: 'London / Dublin' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET / CEST — France)', region: 'Europe', city: 'Paris' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET / CEST — Germany)', region: 'Europe', city: 'Berlin / Frankfurt' },
  { value: 'Europe/Amsterdam', label: 'Europe/Amsterdam (CET / CEST — Netherlands)', region: 'Europe', city: 'Amsterdam' },
  { value: 'Europe/Madrid', label: 'Europe/Madrid (CET / CEST — Spain)', region: 'Europe', city: 'Madrid / Barcelona' },
  { value: 'Europe/Rome', label: 'Europe/Rome (CET / CEST — Italy)', region: 'Europe', city: 'Rome / Milan' },
  { value: 'Europe/Zurich', label: 'Europe/Zurich (CET / CEST — Switzerland)', region: 'Europe', city: 'Zurich / Geneva' },
  { value: 'Europe/Stockholm', label: 'Europe/Stockholm (CET / CEST — Sweden)', region: 'Europe', city: 'Stockholm' },
  { value: 'Europe/Athens', label: 'Europe/Athens (EET / EEST — Greece)', region: 'Europe', city: 'Athens' },
  { value: 'Europe/Helsinki', label: 'Europe/Helsinki (EET / EEST — Finland)', region: 'Europe', city: 'Helsinki' },
  { value: 'Europe/Istanbul', label: 'Europe/Istanbul (TRT — Turkey)', region: 'Europe', city: 'Istanbul' },
  { value: 'Europe/Warsaw', label: 'Europe/Warsaw (CET / CEST — Poland)', region: 'Europe', city: 'Warsaw' },

  // Australia & Pacific
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST / AEDT — Australia East)', region: 'Australia & Pacific', city: 'Sydney / Melbourne' },
  { value: 'Australia/Brisbane', label: 'Australia/Brisbane (AEST — Queensland)', region: 'Australia & Pacific', city: 'Brisbane' },
  { value: 'Australia/Adelaide', label: 'Australia/Adelaide (ACST / ACDT — South Australia)', region: 'Australia & Pacific', city: 'Adelaide' },
  { value: 'Australia/Perth', label: 'Australia/Perth (AWST — Western Australia)', region: 'Australia & Pacific', city: 'Perth' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland (NZST / NZDT — New Zealand)', region: 'Australia & Pacific', city: 'Auckland / Wellington' },

  // Africa
  { value: 'Africa/Cairo', label: 'Africa/Cairo (EET — Egypt)', region: 'Africa', city: 'Cairo' },
  { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg (SAST — South Africa)', region: 'Africa', city: 'Johannesburg / Cape Town' },
  { value: 'Africa/Lagos', label: 'Africa/Lagos (WAT — Nigeria)', region: 'Africa', city: 'Lagos' },
  { value: 'Africa/Nairobi', label: 'Africa/Nairobi (EAT — Kenya)', region: 'Africa', city: 'Nairobi' },
];

/**
 * Returns formatted live time and timezone abbreviation for a given IANA timezone.
 */
export function formatTimezoneLiveTime(timeZone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    });
    return formatter.format(date);
  } catch {
    return 'Invalid Timezone';
  }
}
