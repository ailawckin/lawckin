/**
 * @deprecated Use countryConfig from '@/config/country' instead
 * 
 * This file is kept for backward compatibility.
 * New code should use:
 *   import { countryConfig, getServiceAreas, isValidServiceArea, getPrimaryServiceArea } from '@/config/country';
 */

import { 
  countryConfig, 
  getServiceAreas, 
  isValidServiceArea, 
  getPrimaryServiceArea as getPrimaryServiceAreaFromConfig 
} from '@/config/country';

/**
 * @deprecated Use getServiceAreas() from '@/config/country' instead
 */
export const NY_SERVICE_AREAS = getServiceAreas();

/**
 * @deprecated Use isValidServiceArea() from '@/config/country' instead
 */
export type NYServiceArea = typeof NY_SERVICE_AREAS[number];

/**
 * @deprecated Use isValidServiceArea() from '@/config/country' instead
 */
export function isValidNYServiceArea(location: string): location is NYServiceArea {
  return isValidServiceArea(location);
}

/**
 * @deprecated Use getPrimaryServiceArea() from '@/config/country' instead
 */
export function getPrimaryServiceArea(location: string | string[] | null | undefined): string | null {
  return getPrimaryServiceAreaFromConfig(location);
}

