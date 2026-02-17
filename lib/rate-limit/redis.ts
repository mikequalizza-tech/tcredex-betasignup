/**
 * Redis-based Rate Limiter
 *
 * Production-ready distributed rate limiting using Upstash Redis.
 * Replaces in-memory Map-based rate limiting in middleware.
 *
 * SETUP:
 * 1. Create Upstash Redis database at https://console.upstash.com
 * 2. Add env vars to .env.local (dev) and Vercel (production):
 *    - UPSTASH_REDIS_REST_URL
 *    - UPSTASH_REDIS_REST_TOKEN
 *
 * FALLBACK:
 * If Redis is not configured, falls back to in-memory rate limiting
 * with warning logs (dev only).
 */

import { Redis } from '@upstash/redis';

// Rate limit configuration
export const RATE_LIMITS = {
  // API routes: 100 requests per minute per IP
  api: { maxRequests: 100, windowMs: 60 * 1000 },
  // Auth routes: 10 requests per minute per IP
  auth: { maxRequests: 10, windowMs: 60 * 1000 },
  // General pages: 1000 requests per hour per IP
  general: { maxRequests: 1000, windowMs: 60 * 60 * 1000 },
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

// Initialize Redis client (lazy)
let redis: Redis | null = null;
let redisError: Error | null = null;

function getRedisClient(): Redis | null {
  if (redis) return redis;
  if (redisError) return null;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Rate Limit] Redis not configured - using in-memory fallback');
    }
    return null;
  }

  try {
    redis = new Redis({ url, token });
    return redis;
  } catch (error) {
    redisError = error as Error;
    console.error('[Rate Limit] Failed to initialize Redis:', error);
    return null;
  }
}

// Fallback in-memory store (dev only)
const memoryStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for a given IP and type
 * Returns true if allowed, false if rate limit exceeded
 */
export async function checkRateLimit(
  ip: string,
  type: RateLimitType
): Promise<boolean> {
  const redis = getRedisClient();
  const limit = RATE_LIMITS[type];
  const key = `ratelimit:${type}:${ip}`;

  // Use Redis if available
  if (redis) {
    try {
      const count = await redis.incr(key);

      // Set expiration on first request
      if (count === 1) {
        await redis.expire(key, Math.ceil(limit.windowMs / 1000));
      }

      return count <= limit.maxRequests;
    } catch (error) {
      console.error('[Rate Limit] Redis error:', error);
      // Fall through to memory store on Redis failure
    }
  }

  // Fallback to in-memory store
  const now = Date.now();
  const record = memoryStore.get(key);

  // Clean up expired entries periodically
  if (Math.random() < 0.001) {
    for (const [k, rec] of memoryStore.entries()) {
      if (now > rec.resetTime) {
        memoryStore.delete(k);
      }
    }
  }

  if (!record || now > record.resetTime) {
    memoryStore.set(key, { count: 1, resetTime: now + limit.windowMs });
    return true;
  }

  if (record.count >= limit.maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Get remaining requests for an IP
 * Useful for adding X-RateLimit-Remaining header
 */
export async function getRateLimitRemaining(
  ip: string,
  type: RateLimitType
): Promise<number> {
  const redis = getRedisClient();
  const limit = RATE_LIMITS[type];
  const key = `ratelimit:${type}:${ip}`;

  if (redis) {
    try {
      const count = await redis.get<number>(key);
      return Math.max(0, limit.maxRequests - (count || 0));
    } catch (error) {
      console.error('[Rate Limit] Redis error:', error);
    }
  }

  // Fallback to memory store
  const record = memoryStore.get(key);
  if (!record || Date.now() > record.resetTime) {
    return limit.maxRequests;
  }
  return Math.max(0, limit.maxRequests - record.count);
}

/**
 * Get rate limit reset time (Unix timestamp)
 */
export async function getRateLimitReset(
  ip: string,
  type: RateLimitType
): Promise<number> {
  const redis = getRedisClient();
  const key = `ratelimit:${type}:${ip}`;

  if (redis) {
    try {
      const ttl = await redis.ttl(key);
      if (ttl > 0) {
        return Math.floor(Date.now() / 1000) + ttl;
      }
    } catch (error) {
      console.error('[Rate Limit] Redis error:', error);
    }
  }

  // Fallback to memory store
  const record = memoryStore.get(key);
  if (record) {
    return Math.floor(record.resetTime / 1000);
  }

  return Math.floor((Date.now() + RATE_LIMITS[type].windowMs) / 1000);
}
