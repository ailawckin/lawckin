import { SPECIFIC_ISSUES } from "@/lib/practiceAreaIssues";

export type AiClassification = {
  practiceArea: string;
  lawyerType: string;
  confidence: number;
  matchedKeywords: string[];
  specificIssue?: string;
};

type Category = {
  practiceArea: string;
  lawyerType: string;
  keywords: string[];
};

const CATEGORIES: Category[] = [
  {
    practiceArea: "Family & Divorce",
    lawyerType: "Family Law Attorney",
    keywords: [
      "divorce",
      "custody",
      "child support",
      "alimony",
      "domestic violence",
      "restraining order",
      "prenup",
      "postnup",
      "adoption",
      "guardianship",
    ],
  },
  {
    practiceArea: "Immigration",
    lawyerType: "Immigration Attorney",
    keywords: [
      "visa",
      "green card",
      "citizenship",
      "asylum",
      "deportation",
      "removal",
      "daca",
      "tps",
      "work permit",
      "naturalization",
    ],
  },
  {
    practiceArea: "Business / Startup",
    lawyerType: "Business Lawyer",
    keywords: [
      "llc",
      "incorporate",
      "startup",
      "founder",
      "shareholder",
      "cap table",
      "contract",
      "nda",
      "terms",
      "partnership",
      "acquisition",
    ],
  },
  {
    practiceArea: "Criminal Defense",
    lawyerType: "Criminal Defense Lawyer",
    keywords: [
      "arrest",
      "charged",
      "police",
      "dui",
      "dwi",
      "felony",
      "misdemeanor",
      "arraignment",
      "bail",
      "record",
    ],
  },
  {
    practiceArea: "Employment / Workplace",
    lawyerType: "Employment Lawyer",
    keywords: [
      "fired",
      "termination",
      "layoff",
      "harassment",
      "discrimination",
      "overtime",
      "wages",
      "severance",
      "noncompete",
      "retaliation",
    ],
  },
  {
    practiceArea: "Real Estate (Transactions)",
    lawyerType: "Real Estate Attorney",
    keywords: [
      "closing",
      "title",
      "mortgage",
      "purchase",
      "sale",
      "condo",
      "co-op",
      "lease",
      "commercial property",
      "inspection",
    ],
  },
  {
    practiceArea: "Landlord–Tenant (Housing)",
    lawyerType: "Landlord–Tenant Lawyer",
    keywords: [
      "eviction",
      "rent",
      "landlord",
      "tenant",
      "lease",
      "security deposit",
      "habitability",
      "repairs",
      "housing court",
    ],
  },
  {
    practiceArea: "Personal Injury",
    lawyerType: "Personal Injury Lawyer",
    keywords: [
      "accident",
      "injury",
      "car crash",
      "slip and fall",
      "medical malpractice",
      "insurance claim",
      "damages",
      "hospital",
    ],
  },
  {
    practiceArea: "Estate & Probate",
    lawyerType: "Estate Planning Attorney",
    keywords: [
      "will",
      "trust",
      "probate",
      "estate",
      "inheritance",
      "power of attorney",
      "executor",
      "beneficiary",
    ],
  },
  {
    practiceArea: "Bankruptcy & Debt",
    lawyerType: "Bankruptcy Attorney",
    keywords: [
      "bankruptcy",
      "debt",
      "collections",
      "creditor",
      "garnishment",
      "chapter 7",
      "chapter 13",
      "insolvency",
    ],
  },
  {
    practiceArea: "Intellectual Property",
    lawyerType: "IP Attorney",
    keywords: [
      "trademark",
      "copyright",
      "patent",
      "infringement",
      "licensing",
      "brand",
      "dmca",
    ],
  },
  {
    practiceArea: "Consumer / Small Claims",
    lawyerType: "Consumer Protection Lawyer",
    keywords: [
      "refund",
      "chargeback",
      "small claims",
      "contractor",
      "lemon law",
      "scam",
      "fraud",
    ],
  },
];

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const tokenize = (value: string) =>
  normalize(value).split(" ").filter(Boolean);

const scoreCategory = (description: string, keywords: string[]) => {
  const normalizedDescription = normalize(description);
  const matches: string[] = [];
  let score = 0;

  keywords.forEach((keyword) => {
    const normalizedKeyword = normalize(keyword);
    if (!normalizedKeyword) return;
    if (normalizedDescription.includes(normalizedKeyword)) {
      matches.push(keyword);
      score += normalizedKeyword.split(" ").length > 1 ? 2 : 1;
    }
  });

  return { score, matches };
};

const findBestIssue = (practiceArea: string, description: string) => {
  const issues: string[] = SPECIFIC_ISSUES?.[practiceArea] || [];
  const descriptionTokens = new Set(tokenize(description));
  let bestIssue = "";
  let bestScore = 0;

  issues.forEach((issue) => {
    const tokens = tokenize(issue).filter((token) => token.length >= 3);
    const score = tokens.reduce((sum, token) => sum + (descriptionTokens.has(token) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestIssue = issue;
    }
  });

  if (bestScore === 0) {
    return "";
  }

  return bestIssue;
};

export const classifyLegalIssue = (description: string): AiClassification => {
  const normalizedDescription = normalize(description);
  if (!normalizedDescription) {
    return {
      practiceArea: "",
      lawyerType: "General Practice Lawyer",
      confidence: 0,
      matchedKeywords: [],
    };
  }

  let bestCategory: Category | null = null;
  let bestScore = 0;
  let bestMatches: string[] = [];

  CATEGORIES.forEach((category) => {
    const { score, matches } = scoreCategory(normalizedDescription, category.keywords);
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
      bestMatches = matches;
    }
  });

  if (!bestCategory || bestScore === 0) {
    return {
      practiceArea: "",
      lawyerType: "General Practice Lawyer",
      confidence: 25,
      matchedKeywords: [],
    };
  }

  const confidence = Math.min(95, 35 + bestScore * 12);
  const specificIssue = findBestIssue(bestCategory.practiceArea, description);

  return {
    practiceArea: bestCategory.practiceArea,
    lawyerType: bestCategory.lawyerType,
    confidence,
    matchedKeywords: bestMatches,
    specificIssue: specificIssue || undefined,
  };
};
