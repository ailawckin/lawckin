import {
  BASE_LANGUAGE_OPTIONS,
} from "@/components/lawyer/dashboard/constants";

export const normalizeFeeModels = (models: unknown) => {
  if (Array.isArray(models)) return models.filter(Boolean).map(String);
  if (typeof models === "string") return [models];
  return [];
};

export const normalizeFeeModelRates = (rates: unknown) => {
  if (rates && typeof rates === "object" && !Array.isArray(rates)) {
    return Object.entries(rates as Record<string, any>).reduce((acc, [key, value]) => {
      acc[key] = String(value ?? "");
      return acc;
    }, {} as Record<string, string>);
  }
  return {};
};

export const normalizeLanguage = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const getCustomLanguagesFrom = (languages: string[]) =>
  languages
    .map((lang) => normalizeLanguage(String(lang)))
    .filter(Boolean)
    .filter(
      (lang) =>
        !BASE_LANGUAGE_OPTIONS.some(
          (option) => normalizeLanguage(option) === normalizeLanguage(lang)
        )
    );

interface AddressFields {
  address_street?: string;
  address_unit?: string;
  address_city?: string;
  address_state?: string;
  address_postal_code?: string;
  address_country?: string;
}

export const buildStreetAddress = (data: AddressFields) => {
  const parts = [
    data.address_street,
    data.address_unit ? `Unit ${data.address_unit}` : "",
    data.address_city,
    data.address_state,
    data.address_postal_code,
    data.address_country,
  ]
    .map((part) => part?.trim())
    .filter(Boolean);
  return parts.join(", ");
};

export const getAddressHelpText = (countryCode: string) => {
  if (countryCode === "ch") {
    return "Use Swiss address format (street, postal code, city, canton).";
  }
  return "Use US address format (street, city, state, ZIP).";
};

export const getAddressValidationError = (
  countryCode: string,
  postalCode: string,
  stateValue: string
) => {
  if (countryCode === "ch") {
    if (!stateValue) {
      return "Please provide a canton.";
    }
    return /\b\d{4}\b/.test(postalCode) ? "" : "Swiss postal code must be 4 digits.";
  }
  if (!stateValue) {
    return "Please provide a state.";
  }
  return /\b\d{5}\b/.test(postalCode) ? "" : "US ZIP code must be 5 digits.";
};
