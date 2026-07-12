import "server-only";

const buckets = new Map<string, number[]>();

export function checkRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const timestamps = buckets.get(key) ?? [];
  const windowStart = now - windowMs;
  const recent = timestamps.filter((timestamp) => timestamp >= windowStart);

  if (recent.length >= limit) {
    return {
      allowed: false,
      remaining: 0,
    };
  }

  recent.push(now);
  buckets.set(key, recent);

  return {
    allowed: true,
    remaining: Math.max(limit - recent.length, 0),
  };
}
