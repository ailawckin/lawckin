import { env } from "@/config/env";

type Level = "debug" | "info" | "warn" | "error";

type LogPayload = {
  level: Level;
  message: string;
  context?: Record<string, unknown>;
  ts: string;
  url?: string;
  env?: string;
};

const endpoint = env.VITE_OBSERVABILITY_ENDPOINT;

const emitRemote = (payload: LogPayload) => {
  if (!endpoint) return;
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(endpoint, blob);
    return;
  }

  void fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
};

export const logEvent = (level: Level, message: string, context?: Record<string, unknown>) => {
  const payload: LogPayload = {
    level,
    message,
    context,
    ts: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : undefined,
    env: env.VITE_OBSERVABILITY_ENV,
  };

  if (level === "error") console.error(message, context);
  else if (level === "warn") console.warn(message, context);
  else console.info(message, context);

  emitRemote(payload);
};

export const installGlobalErrorHandlers = () => {
  window.addEventListener("error", (event) => {
    logEvent("error", "Unhandled window error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logEvent("error", "Unhandled promise rejection", {
      reason: String(event.reason),
    });
  });
};
