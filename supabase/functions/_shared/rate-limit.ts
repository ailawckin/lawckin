type LimitConfig = {
  key: string;
  windowMs: number;
  maxRequests: number;
};

type Counter = {
  count: number;
  resetAt: number;
};

const memoryStore = new Map<string, Counter>();

const getClientIp = (req: Request) => {
  const header = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  return header.split(",")[0]?.trim() || "unknown";
};

export const enforceRateLimit = (req: Request, config: LimitConfig) => {
  const ip = getClientIp(req);
  const now = Date.now();
  const bucketKey = `${config.key}:${ip}`;
  const current = memoryStore.get(bucketKey);

  if (!current || current.resetAt <= now) {
    memoryStore.set(bucketKey, { count: 1, resetAt: now + config.windowMs });
    return { ok: true as const };
  }

  if (current.count >= config.maxRequests) {
    const retryAfterSec = Math.ceil((current.resetAt - now) / 1000);
    return {
      ok: false as const,
      retryAfterSec,
      message: `Rate limit exceeded. Retry in ${retryAfterSec}s.`,
    };
  }

  current.count += 1;
  memoryStore.set(bucketKey, current);
  return { ok: true as const };
};
