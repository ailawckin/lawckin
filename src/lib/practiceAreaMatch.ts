const PRACTICE_AREA_SEARCH_MAP: Record<string, string> = {
  "family law": "Family Law",
  "family & divorce": "Family Law",
  "divorce": "Family Law",
  "family": "Family Law",
  "child custody": "Family Law",
  "business law": "Corporate Law",
  "business / startup": "Corporate Law",
  "corporate law": "Corporate Law",
  "startup law": "Corporate Law",
  "business": "Corporate Law",
  "employment law": "Employment Law",
  "employment / workplace": "Employment Law",
  "workplace": "Employment Law",
  "real estate (transactions)": "Real Estate",
  "real estate": "Real Estate",
  "property law": "Real Estate",
  "estate & probate": "Estate Planning",
  "estate planning": "Estate Planning",
  "probate": "Estate Planning",
  "bankruptcy & debt": "Bankruptcy",
  "bankruptcy": "Bankruptcy",
  "debt": "Bankruptcy",
  "immigration law": "Immigration",
  "immigration": "Immigration",
  "citizenship": "Immigration",
  "personal injury": "Personal Injury",
  "criminal defense": "Criminal Defense",
  "criminal law": "Criminal Defense",
  "dui": "Criminal Defense",
  "civil rights": "Civil Rights",
  "civil litigation": "Civil Litigation",
  "litigation": "Civil Litigation",
};

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/law|legal|practice/gi, "")
    .replace(/[&/()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const getPracticeAreaSearchTerm = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const lookup = PRACTICE_AREA_SEARCH_MAP[trimmed.toLowerCase()];
  return lookup || trimmed;
};

/** Exact match only (canonical form via PRACTICE_AREA_SEARCH_MAP + normalizeKey). No fuzzy/partial matching. */
export const practiceAreaMatches = (selected: string, areas: string[]) => {
  const selectedKey = normalizeKey(getPracticeAreaSearchTerm(selected));
  if (!selectedKey) return true;
  return areas.some((area) => {
    const areaKey = normalizeKey(getPracticeAreaSearchTerm(area));
    return areaKey === selectedKey;
  });
};
