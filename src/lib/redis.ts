/**
 * Redis client — session store, caching, rate limiting.
 * Falls back to in-memory Map when REDIS_URL is not set (dev mode).
 */

interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
}

// In-memory fallback for dev
class MemoryStore implements RedisLike {
  private store = new Map<string, { value: string; expires?: number }>();

  async get(key: string) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expires && Date.now() > entry.expires) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    this.store.set(key, {
      value,
      expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string) {
    this.store.delete(key);
  }

  async incr(key: string) {
    const current = await this.get(key);
    const next = (parseInt(current || "0", 10) || 0) + 1;
    const entry = this.store.get(key);
    this.store.set(key, { value: String(next), expires: entry?.expires });
    return next;
  }

  async expire(key: string, seconds: number) {
    const entry = this.store.get(key);
    if (entry) entry.expires = Date.now() + seconds * 1000;
  }
}

let _client: RedisLike | null = null;
let _mode: "redis" | "memory" = "memory";

export function getRedisMode() {
  return _mode;
}

export async function getRedis(): Promise<RedisLike> {
  if (_client) return _client;

  const disabled = /^(1|true|yes)$/i.test(process.env.DISABLE_REDIS || "");
  const url = process.env.REDIS_URL;
  if (url && !disabled) {
    try {
      const ioredisModule = await (Function('return import("ioredis")')() as Promise<typeof import("ioredis")>);
      const Redis = ioredisModule.default;
      const ioredis = new Redis(url, {
        lazyConnect: true,
        connectTimeout: 2_000,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      });
      ioredis.on("error", (error) => {
        console.warn(`[redis] connection error: ${error.message}`);
      });
      await ioredis.connect();
      await ioredis.ping();

      _mode = "redis";
      _client = {
        async get(key) { return ioredis.get(key); },
        async set(key, value, ttl) {
          if (ttl) await ioredis.set(key, value, "EX", ttl);
          else await ioredis.set(key, value);
        },
        async del(key) { await ioredis.del(key); },
        async incr(key) { return ioredis.incr(key); },
        async expire(key, seconds) { await ioredis.expire(key, seconds); },
      };
      return _client;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      console.warn(`[redis] unavailable (${message}); using in-memory store`);
    }
  }

  _mode = "memory";
  _client = new MemoryStore();
  return _client;
}

/** Simple sliding-window rate limiter */
export async function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = await getRedis();
  const rk = `rl:${key}`;
  const count = await redis.incr(rk);
  if (count === 1) await redis.expire(rk, windowSeconds);
  const allowed = count <= maxRequests;
  return { allowed, remaining: Math.max(0, maxRequests - count) };
}

/** Cache helper with TTL */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const redis = await getRedis();
  const hit = await redis.get(`cache:${key}`);
  if (hit) return JSON.parse(hit) as T;
  const result = await fn();
  await redis.set(`cache:${key}`, JSON.stringify(result), ttlSeconds);
  return result;
}
