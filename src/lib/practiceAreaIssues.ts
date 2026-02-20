/**
 * Specific issues for each practice area
 * Maps practice area names (as used in onboarding/dashboard) to their specific issues
 */

// Map from onboarding practice area names to FindLawyerModal practice area names
export const PRACTICE_AREA_NAME_MAP: Record<string, string> = {
  "Family Law": "Family & Divorce",
  "Business Law": "Business / Startup",
  "Employment Law": "Employment / Workplace",
  "Real Estate": "Real Estate (Transactions)",
  "Estate Planning": "Estate & Probate",
  "Bankruptcy": "Bankruptcy & Debt",
  // These match directly
  "Criminal Defense": "Criminal Defense",
  "Immigration": "Immigration",
  "Personal Injury": "Personal Injury",
  "Civil Rights": "Civil Rights", // Will add specific issues below
};

// Specific issues by FindLawyerModal practice area name
const findLawyerModalIssues: Record<string, string[]> = {
  "Family & Divorce": [
    "Divorce (contested)",
    "Divorce (uncontested)",
    "Child custody / visitation",
    "Child support / alimony",
    "Prenup / postnup",
    "Order of protection / domestic violence",
    "Adoption / guardianship"
  ],
  "Immigration": [
    "Green card (family)",
    "Work visa (H-1B, O-1, etc.)",
    "Asylum / removal defense",
    "Naturalization / citizenship",
    "Marriage-based case",
    "DACA / TPS",
    "Waivers / appeals"
  ],
  "Business / Startup": [
    "Company formation (LLC / Corp)",
    "Contracts / agreements",
    "Fundraising / cap table",
    "Partner / shareholder dispute",
    "Commercial lease",
    "Hiring / employment policies",
    "M&A / buying or selling a business"
  ],
  "Criminal Defense": [
    "Arrest / arraignment (urgent)",
    "Misdemeanor",
    "Felony",
    "DWI / DUI",
    "Desk appearance ticket (DAT)",
    "Record sealing / expungement",
    "Orders of protection"
  ],
  "Employment / Workplace": [
    "Wrongful termination",
    "Unpaid wages / overtime",
    "Discrimination / harassment",
    "Severance review / negotiation",
    "Non-compete / non-solicit",
    "Workplace investigation"
  ],
  "Real Estate (Transactions)": [
    "Buy a home / condo",
    "Sell a home / condo",
    "Co-op board review",
    "Title / closing issues",
    "Commercial purchase / sale",
    "Construction contract"
  ],
  "Personal Injury": [
    "Car accident",
    "Slip & fall",
    "Construction accident",
    "Medical malpractice",
    "Product liability",
    "Insurance claim dispute"
  ],
  "Estate & Probate": [
    "Will drafting",
    "Trusts / estate planning",
    "Probate / estate administration",
    "Power of attorney / health care proxy",
    "Will contest",
    "Elder law / Medicaid planning"
  ],
  "Bankruptcy & Debt": [
    "Chapter 7",
    "Chapter 13",
    "Debt settlement / negotiation",
    "Judgment / garnishment",
    "Credit report errors",
    "Small business bankruptcy"
  ],
  "Civil Rights": [
    "Police misconduct / brutality",
    "Discrimination (employment)",
    "Discrimination (housing)",
    "Discrimination (public accommodation)",
    "Voting rights",
    "First Amendment / free speech",
    "Prisoner rights",
    "ADA / disability rights"
  ],
};

/**
 * Get specific issues for a practice area (using onboarding/dashboard naming)
 */
export function getSpecificIssues(practiceArea: string): string[] {
  // First, map to FindLawyerModal name if needed
  const mappedName = PRACTICE_AREA_NAME_MAP[practiceArea] || practiceArea;
  // Return the issues, or empty array if not found
  return findLawyerModalIssues[mappedName] || [];
}

/**
 * Get all specific issues mapped by onboarding/dashboard practice area names
 */
export function getAllSpecificIssues(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  
  // Iterate through onboarding practice areas
  Object.keys(PRACTICE_AREA_NAME_MAP).forEach((onboardingName) => {
    const findLawyerName = PRACTICE_AREA_NAME_MAP[onboardingName];
    if (findLawyerModalIssues[findLawyerName]) {
      result[onboardingName] = findLawyerModalIssues[findLawyerName];
    }
  });
  
  return result;
}

/**
 * Export the raw issues for FindLawyerModal compatibility
 */
export const SPECIFIC_ISSUES = findLawyerModalIssues;

