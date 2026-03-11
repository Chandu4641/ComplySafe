/**
 * Rate Limiting Implementation
 * 
 * Uses sliding window algorithm per organization to prevent abuse
 * and ensure fair usage across tenants.
 * 
 * TODO: Replace in-memory storage with Redis for production serverless deployments.
 * Current implementation does NOT work correctly in serverless/multi-instance deployments.
 * See: https://vercel.com/docs/speed-insights#footnotes
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
  resetAt: number;
}

// In-memory store for rate limiting
// In production, this would be Redis
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval to prevent memory leaks
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;    // Max requests per window
  keyPrefix: string;      // Prefix for rate limit keys
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  // Standard API: 100 requests per minute
  standard: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    keyPrefix: "rl:std"
  },
  // Read-heavy endpoints: 300 requests per minute
  read: {
    windowMs: 60 * 1000,
    maxRequests: 300,
    keyPrefix: "rl:read"
  },
  // Write operations: 30 requests per minute
  write: {
    windowMs: 60 * 1000,
    maxRequests: 30,
    keyPrefix: "rl:write"
  },
  // Auth endpoints: 10 requests per minute (login, etc)
  auth: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    keyPrefix: "rl:auth"
  }
} as const;

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Check and update rate limit for a given key
 */
function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowEnd = now + config.windowMs;
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetAt) {
    // New window
    const newEntry: RateLimitEntry = {
      count: 1,
      windowStart: now,
      resetAt: windowEnd
    };
    rateLimitStore.set(key, newEntry);
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: windowEnd
    };
  }
  
  // Within current window
  if (entry.count < config.maxRequests) {
    entry.count++;
    rateLimitStore.set(key, entry);
    
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt
    };
  }
  
  // Rate limit exceeded
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
  
  return {
    allowed: false,
    remaining: 0,
    resetAt: entry.resetAt,
    retryAfter
  };
}

/**
 * Get rate limit key for an organization
 */
export function getRateLimitKey(orgId: string, config: RateLimitConfig): string {
  return `${config.keyPrefix}:${orgId}`;
}

/**
 * Check rate limit for an organization
 */
export function checkOrgRateLimit(
  orgId: string,
  config: RateLimitConfig = RATE_LIMITS.standard
): RateLimitResult {
  const key = getRateLimitKey(orgId, config);
  return checkRateLimit(key, config);
}

/**
 * Check rate limit for a user within an organization
 */
export function checkUserRateLimit(
  orgId: string,
  userId: string,
  config: RateLimitConfig = RATE_LIMITS.standard
): RateLimitResult {
  const key = `${getRateLimitKey(orgId, config)}:${userId}`;
  return checkRateLimit(key, config);
}

/**
 * Check rate limit by IP address
 */
export function checkIpRateLimit(
  ip: string,
  config: RateLimitConfig = RATE_LIMITS.standard
): RateLimitResult {
  const key = `${config.keyPrefix}:ip:${ip}`;
  return checkRateLimit(key, config);
}

/**
 * Reset rate limit for an organization (for testing or admin reset)
 */
export function resetOrgRateLimit(orgId: string): void {
  for (const key of rateLimitStore.keys()) {
    if (key.includes(`:${orgId}:`) || key.endsWith(`:${orgId}`)) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Clean up expired rate limit entries
 * Runs every 5 minutes
 */
function startCleanup(): void {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  
  // Prevent interval from keeping process alive
  cleanupInterval.unref();
}

/**
 * Initialize rate limiter (call on server start)
 */
export function initRateLimiter(): void {
  startCleanup();
  console.log("[RateLimiter] Initialized with in-memory store");
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  orgId: string,
  config: RateLimitConfig = RATE_LIMITS.standard
): RateLimitResult {
  const key = getRateLimitKey(orgId, config);
  const entry = rateLimitStore.get(key);
  const now = Date.now();
  
  if (!entry || now > entry.resetAt) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs
    };
  }
  
  return {
    allowed: entry.count < config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.resetAt
  };
}
