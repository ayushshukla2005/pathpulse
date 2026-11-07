import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const redisUrl = this.configService.get<string>("redisUrl");
    if (!redisUrl) {
      this.logger.warn("Redis URL is not configured. Cache will operate in degraded mode.");
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
          if (times > 3) {
            return null;
          }
          return Math.min(times * 100, 1000);
        },
      });

      this.client.on("connect", () => {
        this.isConnected = true;
      });

      this.client.on("ready", () => {
        this.isConnected = true;
      });

      this.client.on("error", (err: Error) => {
        this.isConnected = false;
        this.logger.warn(`Redis connection error: ${err.message}`);
      });

      this.client.on("close", () => {
        this.isConnected = false;
      });

      await this.client.connect().catch((err: Error) => {
        this.logger.warn(`Initial Redis connection failed: ${err.message}`);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to initialize Redis client: ${msg}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }
    try {
      const data = await this.client.get(key);
      if (!data) {
        return null;
      }
      return JSON.parse(data) as T;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis get failed for key "${key}": ${msg}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, serialized, "EX", ttlSeconds);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis set failed for key "${key}": ${msg}`);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }
    try {
      await this.client.del(key);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis del failed for key "${key}": ${msg}`);
      return false;
    }
  }

  async deleteByPattern(pattern: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }
    try {
      let count = 0;
      const stream = this.client.scanStream({
        match: pattern,
        count: 100,
      });

      for await (const resultKeys of stream) {
        const keys = resultKeys as string[];
        if (keys.length > 0) {
          await this.client.del(...keys);
          count += keys.length;
        }
      }
      return count;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis deleteByPattern failed for pattern "${pattern}": ${msg}`);
      return 0;
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }
    try {
      const pong = await this.client.ping();
      return pong === "PONG";
    } catch {
      return false;
    }
  }
}
