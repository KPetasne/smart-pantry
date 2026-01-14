/**
 * Enhanced Rate Limiter
 * Provides improved rate limiting for public endpoints with multiple strategies
 */

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  identifier: string;  // Unique identifier (IP, session, etc.)
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory storage (should be replaced with Redis in production)
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

/**
 * Check if a request should be rate limited
 * Returns true if allowed, false if rate limited
 */
export function checkRateLimit(config: RateLimitConfig): boolean {
  const now = Date.now();
  const key = `${config.identifier}`;
  
  const record = rateLimitStore.get(key);
  
  if (!record || record.resetTime < now) {
    // First request or window expired - create new record
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return true;
  }
  
  // Within window
  if (record.count < config.maxRequests) {
    record.count++;
    return true;
  }
  
  // Rate limit exceeded
  return false;
}

/**
 * Get remaining requests and reset time for an identifier
 */
export function getRateLimitInfo(config: RateLimitConfig): {
  remaining: number;
  resetTime: number;
  limited: boolean;
} {
  const now = Date.now();
  const key = `${config.identifier}`;
  const record = rateLimitStore.get(key);
  
  if (!record || record.resetTime < now) {
    return {
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
      limited: false,
    };
  }
  
  const remaining = Math.max(0, config.maxRequests - record.count);
  
  return {
    remaining,
    resetTime: record.resetTime,
    limited: remaining === 0,
  };
}

/**
 * Reset rate limit for an identifier
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Rate limit presets for common use cases
 */
export const RateLimitPresets = {
  // Very strict - for expensive AI operations
  AI_GENERATION: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1,
  },
  
  // Strict - for resource-intensive operations
  STRICT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  },
  
  // Moderate - for general API endpoints
  MODERATE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
  },
  
  // Lenient - for read-only operations
  LENIENT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  
  // Authentication attempts
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  
  // Email submissions
  EMAIL: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
  },
} as const;

/**
 * Extract identifier from request (IP address)
 */
export function getRequestIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Create a rate limit response
 */
export function createRateLimitResponse(resetTime: number) {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Reset': new Date(resetTime).toISOString(),
      },
    }
  );
}
