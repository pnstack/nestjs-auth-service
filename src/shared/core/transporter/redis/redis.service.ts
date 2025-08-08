import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private publisher: Redis;
  private subscriber: Redis;
  private subscriptions: Map<string, Set<(message: any) => void>>;

  constructor() {
    this.subscriptions = new Map();

    // Create Redis client instances for pub/sub
    this.publisher = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.subscriber = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    // Handle subscriber events
    this.subscriber.on('message', (channel: string, message: string) => {
      const handlers = this.subscriptions.get(channel);
      if (handlers) {
        const parsedMessage = JSON.parse(message);
        handlers.forEach((handler) => handler(parsedMessage));
      }
    });
  }

  async onModuleInit() {
    try {
      // Test Redis connection
      await this.publisher.ping();
      console.log('Redis publisher connection established');
      await this.subscriber.ping();
      console.log('Redis subscriber connection established');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.publisher.quit();
    await this.subscriber.quit();
  }

  /**
   * Publish a message to a channel
   * @param channel The channel to publish to
   * @param message The message to publish
   */
  async publish(channel: string, message: any): Promise<number> {
    try {
      const serializedMessage = JSON.stringify(message);
      return await this.publisher.publish(channel, serializedMessage);
    } catch (error) {
      console.error(`Error publishing to channel ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to a channel
   * @param channel The channel to subscribe to
   * @param callback The callback to execute when a message is received
   */
  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      if (!this.subscriptions.has(channel)) {
        this.subscriptions.set(channel, new Set());
        await this.subscriber.subscribe(channel);
      }
      this.subscriptions.get(channel)?.add(callback);
    } catch (error) {
      console.error(`Error subscribing to channel ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a channel
   * @param channel The channel to unsubscribe from
   * @param callback The callback to remove
   */
  async unsubscribe(channel: string, callback?: (message: any) => void): Promise<void> {
    try {
      if (callback && this.subscriptions.has(channel)) {
        const handlers = this.subscriptions.get(channel);
        handlers?.delete(callback);

        if (handlers?.size === 0) {
          await this.subscriber.unsubscribe(channel);
          this.subscriptions.delete(channel);
        }
      } else if (!callback) {
        await this.subscriber.unsubscribe(channel);
        this.subscriptions.delete(channel);
      }
    } catch (error) {
      console.error(`Error unsubscribing from channel ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Get the Redis publisher instance
   */
  getPublisher(): Redis {
    return this.publisher;
  }

  /**
   * Get the Redis subscriber instance
   */
  getSubscriber(): Redis {
    return this.subscriber;
  }
}
