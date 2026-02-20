export const getLawyerStorageKey = (userId: string | null, suffix: string) =>
  `lawyerDashboard.${suffix}.${userId || "anonymous"}`;
