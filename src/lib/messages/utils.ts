import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export const formatConversationTimestamp = (timestamp?: string | null) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  if (isYesterday(date)) {
    return `Yesterday ${format(date, "p")}`;
  }
  return format(date, "MMM d, p");
};

export const formatMessageTimestamp = (timestamp?: string | null) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isToday(date)) {
    return format(date, "p");
  }
  if (isYesterday(date)) {
    return `Yesterday ${format(date, "p")}`;
  }
  return format(date, "MMM d, p");
};

export const getConversationFilterLabel = (value: string) => {
  if (value === "unread") return "Unread";
  return "All conversations";
};

export const getMessageDateFilterLabel = (value: string) => {
  if (value === "week") return "Last 7 days";
  if (value === "30days") return "Last 30 days";
  if (value === "month") return "Last month";
  if (value === "year") return "Last year";
  return "All time";
};

export const getDateRangeStartForMessages = (filter: string) => {
  const now = new Date();
  if (filter === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return start;
  }
  if (filter === "month") {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 1);
    return start;
  }
  if (filter === "30days") {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return start;
  }
  if (filter === "year") {
    const start = new Date(now);
    start.setFullYear(start.getFullYear() - 1);
    return start;
  }
  return null;
};

export const getInitials = (value?: string | null) => {
  const cleaned = value?.trim();
  if (!cleaned) return "CL";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "CL";
};

export const getMessageUploadErrorMessage = (error: any) => {
  const raw = error?.message || "Upload failed.";
  const status = error?.statusCode || error?.status || null;
  if (status === 400 || raw.toLowerCase().includes("mime")) {
    return "Upload failed. Ensure the `message-attachments` bucket exists, storage policies allow uploads, and the file type is allowed.";
  }
  if (raw.toLowerCase().includes("bucket")) {
    return "Upload failed. The `message-attachments` bucket is missing or not accessible.";
  }
  return raw;
};

export const getMessageAttachmentPath = (value?: string | null) => {
  if (!value) return null;
  if (!value.startsWith("http")) return value;
  const marker = "/storage/v1/object/";
  const idx = value.indexOf(marker);
  if (idx === -1) return null;
  const pathWithBucket = value.substring(idx + marker.length);
  const normalized = pathWithBucket.startsWith("public/")
    ? pathWithBucket.substring("public/".length)
    : pathWithBucket;
  if (!normalized.startsWith("message-attachments/")) return null;
  return normalized.substring("message-attachments/".length);
};

export const isPublicMessageAttachmentUrl = (value?: string | null) => {
  if (!value?.startsWith("http")) return false;
  return value.includes("/storage/v1/object/public/message-attachments/");
};
