/**
 * Canonical IANA timezone constants with parent-readable locality labels.
 * Stores the IANA value internally while showing human-friendly locality text.
 * Follows the glossary/terms.ts pattern from 02-PATTERNS.md.
 *
 * Per D-03: Family onboarding requires canonical IANA timezone while showing readable locality.
 */
export const FAMILY_TIMEZONES = {
  'America/Sao_Paulo': {
    iana: 'America/Sao_Paulo',
    locality: 'Brazil - São Paulo',
  },
  'America/New_York': {
    iana: 'America/New_York',
    locality: 'United States - Eastern',
  },
  'America/Chicago': {
    iana: 'America/Chicago',
    locality: 'United States - Central',
  },
  'America/Denver': {
    iana: 'America/Denver',
    locality: 'United States - Mountain',
  },
  'America/Los_Angeles': {
    iana: 'America/Los_Angeles',
    locality: 'United States - Pacific',
  },
  'America/Mexico_City': {
    iana: 'America/Mexico_City',
    locality: 'Mexico - Central',
  },
  'America/Buenos_Aires': {
    iana: 'America/Buenos_Aires',
    locality: 'Argentina - Buenos Aires',
  },
  'America/Santiago': {
    iana: 'America/Santiago',
    locality: 'Chile - Santiago',
  },
  'America/Bogota': {
    iana: 'America/Bogota',
    locality: 'Colombia - Bogotá',
  },
  'America/Lima': {
    iana: 'America/Lima',
    locality: 'Peru - Lima',
  },
  'Europe/London': {
    iana: 'Europe/London',
    locality: 'United Kingdom - London',
  },
  'Europe/Paris': {
    iana: 'Europe/Paris',
    locality: 'France - Paris',
  },
  'Europe/Berlin': {
    iana: 'Europe/Berlin',
    locality: 'Germany - Berlin',
  },
  'Europe/Lisbon': {
    iana: 'Europe/Lisbon',
    locality: 'Portugal - Lisbon',
  },
  'Europe/Madrid': {
    iana: 'Europe/Madrid',
    locality: 'Spain - Madrid',
  },
  'Africa/Johannesburg': {
    iana: 'Africa/Johannesburg',
    locality: 'South Africa - Johannesburg',
  },
  'Africa/Lagos': {
    iana: 'Africa/Lagos',
    locality: 'Nigeria - Lagos',
  },
  'Africa/Nairobi': {
    iana: 'Africa/Nairobi',
    locality: 'Kenya - Nairobi',
  },
  'Asia/Tokyo': {
    iana: 'Asia/Tokyo',
    locality: 'Japan - Tokyo',
  },
  'Asia/Seoul': {
    iana: 'Asia/Seoul',
    locality: 'South Korea - Seoul',
  },
  'Asia/Shanghai': {
    iana: 'Asia/Shanghai',
    locality: 'China - Shanghai',
  },
  'Asia/Singapore': {
    iana: 'Asia/Singapore',
    locality: 'Singapore',
  },
  'Asia/Manila': {
    iana: 'Asia/Manila',
    locality: 'Philippines - Manila',
  },
  'Asia/Kolkata': {
    iana: 'Asia/Kolkata',
    locality: 'India - Kolkata',
  },
  'Australia/Sydney': {
    iana: 'Australia/Sydney',
    locality: 'Australia - Sydney',
  },
  'Pacific/Auckland': {
    iana: 'Pacific/Auckland',
    locality: 'New Zealand - Auckland',
  },
} as const

export type IanaTimezone = keyof typeof FAMILY_TIMEZONES

export type TimezoneEntry = {
  iana: IanaTimezone
  locality: string
}

/** Returns all timezones as an array for UI rendering (dropdowns, comboboxes). */
export function getTimezoneOptions(): TimezoneEntry[] {
  return Object.entries(FAMILY_TIMEZONES).map(([iana, entry]) => ({
    iana: iana as IanaTimezone,
    locality: entry.locality,
  }))
}

/** Validates that a string is a known IANA timezone from the closed set. */
export function isValidTimezone(value: string): value is IanaTimezone {
  return value in FAMILY_TIMEZONES
}

/** Gets the readable locality for a timezone, or returns the value if unknown. */
export function getTimezoneLocality(iana: string): string {
  const entry = FAMILY_TIMEZONES[iana as IanaTimezone]
  return entry?.locality ?? iana
}
