export const OVERVIEW_POLL_MS = 75000;

export const BASE_LANGUAGE_OPTIONS = [
  "English",
  "Spanish",
  "Chinese",
  "Russian",
  "Korean",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Arabic",
  "Hindi",
  "Japanese",
  "Vietnamese",
  "Polish",
  "Urdu",
  "Turkish",
  "Tagalog",
];

export const MAX_BIO_LENGTH = 1000;
export const MAX_EDUCATION_LENGTH = 500;

export const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "Europe/Zurich", label: "Europe/Zurich (CET)" },
];

export const MEETING_TYPE_OPTIONS = ["In-person", "Video call", "Phone call"];
export const FEE_MODEL_OPTIONS = ["Hourly", "Flat Fee", "Contingency", "Retainer"];
export const SLOT_DURATION_OPTIONS = [
  { value: 30, label: "30 minutes" },
  { value: 60, label: "60 minutes" },
];

export const VALID_LAWYER_TABS = [
  "overview",
  "schedule",
  "consultations",
  "messages",
  "settings",
] as const;
export const VALID_STATUS_FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"] as const;
export const VALID_DATE_RANGE_FILTERS = ["all", "week", "month", "30days"] as const;
export const VALID_CONVERSATION_FILTERS = ["all", "unread"] as const;
export const VALID_MESSAGE_DATE_FILTERS = ["all", "week", "30days", "month", "year"] as const;
