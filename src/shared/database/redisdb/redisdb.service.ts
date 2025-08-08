import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis, RedisOptions } from 'ioredis';

@Injectable()
export class RedisdbService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  async onModuleInit() {
    const options: RedisOptions = {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: +(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || undefined,
    };
    this.client = new Redis(options);

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  async set(key: string, value: string, expireSeconds?: number): Promise<void> {
    if (expireSeconds) {
      await this.client.set(key, value, 'EX', expireSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  // Add more Redis command wrappers as needed.
}
