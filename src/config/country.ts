/**
 * Country-specific configuration
 * 
 * Supports multiple countries via VITE_COUNTRY environment variable.
 * Default: 'nyc' (New York, USA)
 * Options: 'nyc' | 'ch' (Switzerland)
 * 
 * Usage:
 *   import { countryConfig } from '@/config/country';
 *   const location = countryConfig.serviceAreas[0];
 */

export type CountryCode = 'nyc' | 'ch';

export interface CountryConfig {
  code: CountryCode;
  displayName: string;
  locale: string;
  locales: string[]; // Primary + fallbacks
  currency: string;
  currencySymbol: string;
  timezone: string;
  mapCenter: {
    lat: number;
    lng: number;
  };
  mapZoom: number;
  mapBounds?: {
    southwest: { lat: number; lng: number };
    northeast: { lat: number; lng: number };
  };
  serviceAreas: readonly string[];
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  legal: {
    termsUrl?: string;
    privacyUrl?: string;
    disclaimer?: string;
  };
  copy: {
    heroSubtitle: string;
    locationQuestion: string;
    locationDescription: string;
    faqLocationAnswer: string;
    onboardingLocationLabel: string;
    onboardingLocationDescription: string;
  };
  featureFlags?: {
    [key: string]: boolean;
  };
}

const NYC_CONFIG: CountryConfig = {
  code: 'nyc',
  displayName: 'New York',
  locale: 'en-US',
  locales: ['en-US'],
  currency: 'USD',
  currencySymbol: '$',
  timezone: 'America/New_York',
  mapCenter: {
    lat: 40.7128,
    lng: -74.0060, // New York City
  },
  mapZoom: 10,
  mapBounds: {
    southwest: { lat: 40.4774, lng: -79.7626 },
    northeast: { lat: 45.0159, lng: -71.7775 },
  },
  serviceAreas: [
    "Manhattan",
    "Brooklyn",
    "Queens",
    "Bronx",
    "Staten Island",
    "Long Island (Nassau / Suffolk)",
    "Westchester",
    "Upstate NY",
    "Remote / Anywhere in NY"
  ] as const,
  contact: {
    email: 'support@lawckin.com',
    phone: '+1 (555) 123-4567',
    address: '123 Legal Street, New York, NY 10001, USA',
  },
  legal: {
    termsUrl: '/terms',
    privacyUrl: '/privacy',
    disclaimer: 'Lawckin focuses on connecting clients with verified New York lawyers.',
  },
  copy: {
    heroSubtitle: 'Connect with verified New York lawyers instantly',
    locationQuestion: 'Where in New York are you located?',
    locationDescription: "We'll match you with lawyers in your area",
    faqLocationAnswer: 'Currently, Lawckin focuses on connecting clients with verified New York lawyers. We\'re working to expand to other states in the future.',
    onboardingLocationLabel: 'New York Service Area',
    onboardingLocationDescription: 'Select the primary New York service area where you provide services. This will be visible to clients searching for lawyers.',
  },
};

const CH_CONFIG: CountryConfig = {
  code: 'ch',
  displayName: 'Switzerland',
  locale: 'de-CH',
  locales: ['de-CH', 'fr-CH', 'en-US'], // German (primary), French, English fallback
  currency: 'CHF',
  currencySymbol: 'CHF',
  timezone: 'Europe/Zurich',
  mapCenter: {
    lat: 47.3769,
    lng: 8.5417, // Zurich
  },
  mapZoom: 10,
  mapBounds: {
    southwest: { lat: 45.8180, lng: 5.9559 }, // Southwest Switzerland
    northeast: { lat: 47.8084, lng: 10.4922 }, // Northeast Switzerland
  },
  serviceAreas: [
    "Zurich",
    "Geneva",
    "Basel",
    "Bern",
    "Lausanne",
    "Winterthur",
    "Lucerne",
    "St. Gallen",
    "Lugano",
    "Remote / Anywhere in Switzerland"
  ] as const,
  contact: {
    email: 'support@lawckin.ch',
    phone: '+41 44 123 45 67',
    address: 'Bahnhofstrasse 1, 8001 Zürich, Switzerland',
  },
  legal: {
    termsUrl: '/terms',
    privacyUrl: '/privacy',
    disclaimer: 'Lawckin focuses on connecting clients with verified Swiss lawyers.',
  },
  copy: {
    heroSubtitle: 'Connect with verified Swiss lawyers instantly',
    locationQuestion: 'Where in Switzerland are you located?',
    locationDescription: "We'll match you with lawyers in your area",
    faqLocationAnswer: 'Currently, Lawckin focuses on connecting clients with verified Swiss lawyers. We\'re working to expand to other regions in the future.',
    onboardingLocationLabel: 'Swiss Service Area',
    onboardingLocationDescription: 'Select the primary Swiss service area where you provide services. This will be visible to clients searching for lawyers.',
  },
};

/**
 * Get country code from environment variable
 * Defaults to 'nyc' if not set or invalid
 */
function getCountryCode(): CountryCode {
  const envCountry = import.meta.env.VITE_COUNTRY?.toLowerCase();
  if (envCountry === 'ch' || envCountry === 'switzerland') {
    return 'ch';
  }
  return 'nyc'; // Default to NYC
}

/**
 * Country configuration based on VITE_COUNTRY environment variable
 * 
 * @example
 * import { countryConfig } from '@/config/country';
 * console.log(countryConfig.displayName); // "New York" or "Switzerland"
 * console.log(countryConfig.currency); // "USD" or "CHF"
 */
export const countryConfig: CountryConfig = getCountryCode() === 'ch' ? CH_CONFIG : NYC_CONFIG;

/**
 * Helper to format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(countryConfig.locale, {
    style: 'currency',
    currency: countryConfig.currency,
  }).format(amount);
}

/**
 * Helper to format currency without symbol (for display in forms)
 */
export function formatCurrencyAmount(amount: number): string {
  return new Intl.NumberFormat(countryConfig.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get service areas for current country
 */
export function getServiceAreas(): readonly string[] {
  return countryConfig.serviceAreas;
}

/**
 * Validate if a location is a valid service area for current country
 */
export function isValidServiceArea(location: string): boolean {
  return countryConfig.serviceAreas.includes(location as any);
}

/**
 * Get primary service area from location string or array
 */
export function getPrimaryServiceArea(location: string | string[] | null | undefined): string | null {
  if (!location) return null;
  
  if (Array.isArray(location)) {
    for (const loc of location) {
      if (isValidServiceArea(loc)) {
        return loc;
      }
    }
    return null;
  }
  
  if (isValidServiceArea(location)) {
    return location;
  }
  
  // Try case-insensitive partial match
  const normalized = location.toLowerCase();
  for (const area of countryConfig.serviceAreas) {
    if (area.toLowerCase().includes(normalized) || normalized.includes(area.toLowerCase())) {
      return area;
    }
  }
  
  return null;
}

