type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 12;

export function loginRateLimitKey(cedula: string, ipHint?: string | null): string {
  return `${ipHint?.trim() || "unknown"}:${cedula}`;
}

/** Devuelve true si el intento está permitido. */
export function consumeLoginAttempt(key: string, now = Date.now()): boolean {
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (existing.count >= MAX_ATTEMPTS) {
    return false;
  }
  existing.count += 1;
  return true;
}

export function clearLoginAttempts(key: string): void {
  buckets.delete(key);
}

/** Solo tests. */
export function __resetLoginRateLimitForTests(): void {
  buckets.clear();
}
