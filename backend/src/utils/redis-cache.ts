import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

export class RedisCache {
  private client: RedisClientType;
  private connected: boolean = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection limit exceeded');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    this.client.on('error', (err) => {
      logger.error('Redis client error', { error: err });
    });

    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.connected = true;
    });

    this.client.on('disconnect', () => {
      logger.warn('Redis client disconnected');
      this.connected = false;
    });

    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis', { error });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected) {
      logger.warn('Redis not connected, skipping cache get');
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Redis get failed', { error, key });
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.connected) {
      logger.warn('Redis not connected, skipping cache set');
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      logger.error('Redis set failed', { error, key });
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.connected) {
      logger.warn('Redis not connected, skipping cache delete');
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis delete failed', { error, key });
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.connected) {
      logger.warn('Redis not connected, skipping cache delete pattern');
      return;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      logger.error('Redis delete pattern failed', { error, pattern });
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      this.connected = false;
    } catch (error) {
      logger.error('Redis disconnect failed', { error });
    }
  }
}