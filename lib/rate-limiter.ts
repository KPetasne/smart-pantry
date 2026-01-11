// Rate limiter using in-memory Map
// Key: IP address, Value: array of timestamps

interface RateLimitEntry {
  attempts: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if IP is rate limited
 * @param ip - IP address to check
 * @returns true if rate limited, false otherwise
 */
export function checkRateLimit(ip: string): { limited: boolean; remainingAttempts: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry) {
    // First attempt
    rateLimitStore.set(ip, { attempts: [now] });
    return { limited: false, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  // Filter out old attempts outside the window
  const recentAttempts = entry.attempts.filter(timestamp => now - timestamp < WINDOW_MS);

  if (recentAttempts.length >= MAX_ATTEMPTS) {
    // Rate limited
    return { limited: true, remainingAttempts: 0 };
  }

  // Add current attempt
  recentAttempts.push(now);
  rateLimitStore.set(ip, { attempts: recentAttempts });

  return { limited: false, remainingAttempts: MAX_ATTEMPTS - recentAttempts.length };
}

/**
 * Reset rate limit for an IP (e.g., after successful login)
 * @param ip - IP address to reset
 */
export function resetRateLimit(ip: string): void {
  rateLimitStore.delete(ip);
}

/**
 * Clean up old entries (optional, for memory management)
 * Should be called periodically
 */
export function cleanupRateLimiter(): void {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    const recentAttempts = entry.attempts.filter(timestamp => now - timestamp < WINDOW_MS);
    if (recentAttempts.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, { attempts: recentAttempts });
    }
  }
}

// Clean up every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimiter, 60 * 60 * 1000);
}
