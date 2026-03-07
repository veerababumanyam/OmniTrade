/** FMP Data Hub — Redis Cache Layer */

import Redis from 'ioredis';

const REDIS_PREFIX = 'fmp';

export class RedisCache {
  private client: Redis;

  constructor(redisUrl?: string) {
    this.client = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.error('✅ Redis connected');
    } catch {
      console.error('⚠️  Redis connection failed — continuing without cache');
    }
  }

  /**
   * Build the Redis key for a symbol + category
   */
  private key(symbol: string, category: string): string {
    return `${REDIS_PREFIX}:${symbol.toUpperCase()}:${category}`;
  }

  /**
   * Get cached data for a symbol + category
   * Returns null on cache miss or connection error
   */
  async get(symbol: string, category: string): Promise<any | null> {
    try {
      if (this.client.status !== 'ready') return null;
      const data = await this.client.get(this.key(symbol, category));
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Set cached data with TTL (in seconds)
   */
  async set(symbol: string, category: string, data: any, ttlSeconds: number): Promise<void> {
    try {
      if (this.client.status !== 'ready') return;
      await this.client.set(
        this.key(symbol, category),
        JSON.stringify(data),
        'EX',
        ttlSeconds
      );
    } catch {
      // Cache write failure is non-fatal
    }
  }

  /**
   * Check if a key exists and is not expired
   */
  async exists(symbol: string, category: string): Promise<boolean> {
    try {
      if (this.client.status !== 'ready') return false;
      return (await this.client.exists(this.key(symbol, category))) === 1;
    } catch {
      return false;
    }
  }

  /**
   * Get TTL remaining for a key (in seconds). Returns -1 if no TTL, -2 if missing.
   */
  async ttl(symbol: string, category: string): Promise<number> {
    try {
      if (this.client.status !== 'ready') return -2;
      return await this.client.ttl(this.key(symbol, category));
    } catch {
      return -2;
    }
  }

  /**
   * Delete a specific cache entry
   */
  async del(symbol: string, category: string): Promise<void> {
    try {
      if (this.client.status !== 'ready') return;
      await this.client.del(this.key(symbol, category));
    } catch {
      // Deletion failure is non-fatal
    }
  }

  /**
   * Delete all cache entries for a symbol
   */
  async delAll(symbol: string): Promise<number> {
    try {
      if (this.client.status !== 'ready') return 0;
      const keys = await this.client.keys(`${REDIS_PREFIX}:${symbol.toUpperCase()}:*`);
      if (keys.length === 0) return 0;
      return await this.client.del(...keys);
    } catch {
      return 0;
    }
  }

  async close(): Promise<void> {
    try {
      await this.client.quit();
    } catch {
      // Ignore close errors
    }
  }
}
