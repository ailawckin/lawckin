import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { env } from "@/config/env";
import { logEvent } from "@/lib/observability";

const SLOW_REQUEST_THRESHOLD_MS = 1500;

const instrumentedFetch: typeof fetch = async (input, init) => {
  const startedAt = performance.now();
  try {
    const response = await fetch(input, init);
    const duration = Math.round(performance.now() - startedAt);

    if (!response.ok) {
      logEvent("warn", "Supabase HTTP request failed", {
        url: typeof input === "string" ? input : input.url,
        status: response.status,
        durationMs: duration,
      });
    } else if (duration >= SLOW_REQUEST_THRESHOLD_MS) {
      logEvent("warn", "Supabase HTTP request is slow", {
        url: typeof input === "string" ? input : input.url,
        status: response.status,
        durationMs: duration,
      });
    }

    return response;
  } catch (error) {
    const duration = Math.round(performance.now() - startedAt);
    logEvent("error", "Supabase HTTP request threw", {
      url: typeof input === "string" ? input : input.url,
      durationMs: duration,
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const supabase = createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: instrumentedFetch,
  },
});