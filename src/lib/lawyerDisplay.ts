import { getPracticeAreaSearchTerm } from "@/lib/practiceAreaMatch";

export type ExpertiseArea = {
  area: string;
  years?: number | null;
};

type LawyerLike = {
  practice_areas?: string[] | null;
  specialty?: string | null;
  ny_locations?: string[] | null;
  location?: string | null;
  expertise_areas?: unknown;
};

const normalizeList = (values?: (string | null)[] | null) =>
  (values || []).map((value) => (value || "").trim()).filter(Boolean);

const normalizePracticeAreaKey = (value: string) =>
  getPracticeAreaSearchTerm(value)
    .toLowerCase()
    .replace(/[&/()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toNumberOrNull = (value: unknown) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const parsed = Number.parseFloat(String(value));
  return Number.isNaN(parsed) ? null : parsed;
};

export const getExpertiseAreas = (lawyer: LawyerLike): ExpertiseArea[] => {
  const raw = lawyer.expertise_areas;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const area = typeof (entry as { area?: string }).area === "string"
        ? (entry as { area: string }).area
        : typeof (entry as { name?: string }).name === "string"
          ? (entry as { name: string }).name
          : "";
      if (!area) return null;
      const years = toNumberOrNull((entry as { years?: unknown }).years);
      return { area, years };
    })
    .filter((entry): entry is ExpertiseArea => !!entry);
};

const sortExpertiseAreas = (areas: ExpertiseArea[]) =>
  [...areas].sort((a, b) => {
    const yearsA = a.years ?? -1;
    const yearsB = b.years ?? -1;
    if (yearsA !== yearsB) return yearsB - yearsA;
    return a.area.localeCompare(b.area);
  });

export const getDisplayPracticeArea = (lawyer: LawyerLike, preferredArea?: string) => {
  const practiceAreas = getPracticeAreas(lawyer);
  const expertiseAreas = sortExpertiseAreas(getExpertiseAreas(lawyer));
  const normalizedPreferred = preferredArea ? normalizePracticeAreaKey(preferredArea) : "";

  if (normalizedPreferred) {
    const matchedExpertise = expertiseAreas.find(
      (entry) => normalizePracticeAreaKey(entry.area) === normalizedPreferred
    );
    if (matchedExpertise) {
      return { area: matchedExpertise.area, years: matchedExpertise.years, matched: true };
    }

    const matchedPractice = practiceAreas.find(
      (area) => normalizePracticeAreaKey(area) === normalizedPreferred
    );
    if (matchedPractice) {
      return { area: matchedPractice, years: null, matched: true };
    }
  }

  if (expertiseAreas.length > 0) {
    return { area: expertiseAreas[0].area, years: expertiseAreas[0].years, matched: false };
  }

  if (practiceAreas.length > 0) {
    return { area: practiceAreas[0], years: null, matched: false };
  }

  if (lawyer.specialty) {
    return { area: lawyer.specialty, years: null, matched: false };
  }

  return { area: "General", years: null, matched: false };
};

export const formatPracticeAreaLabel = (area: string, years?: number | null) => {
  if (!years || years <= 0) return area;
  const rounded = Math.round(years);
  return `${area} · ${rounded} ${rounded === 1 ? "yr" : "yrs"}`;
};

export const getPracticeAreas = (lawyer: LawyerLike) => {
  const practiceAreas = normalizeList(lawyer.practice_areas || null);
  if (practiceAreas.length > 0) return practiceAreas;
  return normalizeList(lawyer.specialty ? [lawyer.specialty] : []);
};

export const getPrimaryPracticeArea = (lawyer: LawyerLike) => {
  const areas = getPracticeAreas(lawyer);
  return areas[0] || "General";
};

export const getLocations = (lawyer: LawyerLike) => {
  const locations = normalizeList(lawyer.ny_locations || null);
  if (locations.length > 0) return locations;
  return normalizeList(lawyer.location ? [lawyer.location] : []);
};

export const getPrimaryLocation = (lawyer: LawyerLike) => {
  const locations = getLocations(lawyer);
  return locations[0] || "Not specified";
};
