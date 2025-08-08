import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { connect, NatsConnection, Subscription, StringCodec, JSONCodec } from 'nats';

@Injectable()
export class NatsService implements OnModuleInit, OnModuleDestroy {
  private connection: NatsConnection;
  private subscriptions: Map<string, Subscription[]>;
  private stringCodec = StringCodec();
  private jsonCodec = JSONCodec();
  private readonly logger = new Logger(NatsService.name);

  constructor() {
    this.subscriptions = new Map();
  }

  async onModuleInit() {
    try {
      this.connection = await connect({
        servers: process.env.NATS_URL || 'nats://localhost:4222',
        maxReconnectAttempts: 10,
        reconnectTimeWait: 2000,
      });

      this.logger.log('Connected to NATS server');

      // Handle connection events
      this.connection.closed().then(() => {
        this.logger.log('NATS connection closed');
      });
    } catch (error) {
      this.logger.error('Failed to connect to NATS server:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.connection) {
      // Unsubscribe from all subscriptions
      for (const subs of this.subscriptions.values()) {
        for (const sub of subs) {
          sub.unsubscribe();
        }
      }

      // Drain and close connection
      await this.connection.drain();
      await this.connection.close();
      this.logger.log('NATS connection closed');
    }
  }

  /**
   * Publish a message to a subject
   * @param subject The subject to publish to
   * @param data The data to publish (string or object)
   */
  async publish(subject: string, data: string | object): Promise<void> {
    try {
      if (!this.connection) {
        throw new Error('NATS connection not established');
      }

      const payload =
        typeof data === 'string' ? this.stringCodec.encode(data) : this.jsonCodec.encode(data);

      await this.connection.publish(subject, payload);
    } catch (error) {
      this.logger.error(`Error publishing to subject ${subject}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to a subject
   * @param subject The subject to subscribe to
   * @param callback The callback to execute when a message is received
   * @param queue Optional queue group name for load balancing
   */
  async subscribe(
    subject: string,
    callback: (data: any) => void | Promise<void>,
    queue?: string
  ): Promise<void> {
    try {
      if (!this.connection) {
        throw new Error('NATS connection not established');
      }

      const subscription = queue
        ? this.connection.subscribe(subject, { queue })
        : this.connection.subscribe(subject);

      // Store subscription for cleanup
      if (!this.subscriptions.has(subject)) {
        this.subscriptions.set(subject, []);
      }
      this.subscriptions.get(subject).push(subscription);

      // Handle messages
      (async () => {
        for await (const msg of subscription) {
          try {
            // Try to parse as JSON first, fallback to string
            let data;
            try {
              data = this.jsonCodec.decode(msg.data);
            } catch {
              data = this.stringCodec.decode(msg.data);
            }

            await Promise.resolve(callback(data));
          } catch (error) {
            this.logger.error(`Error processing message on subject ${subject}:`, error);
          }
        }
      })();

      this.logger.log(`Subscribed to subject: ${subject}${queue ? ` (queue: ${queue})` : ''}`);
    } catch (error) {
      this.logger.error(`Error subscribing to subject ${subject}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a subject
   * @param subject The subject to unsubscribe from
   */
  async unsubscribe(subject: string): Promise<void> {
    try {
      const subs = this.subscriptions.get(subject);
      if (subs) {
        for (const sub of subs) {
          sub.unsubscribe();
        }
        this.subscriptions.delete(subject);
        this.logger.log(`Unsubscribed from subject: ${subject}`);
      }
    } catch (error) {
      this.logger.error(`Error unsubscribing from subject ${subject}:`, error);
      throw error;
    }
  }

  /**
   * Get the NATS connection instance
   */
  getConnection(): NatsConnection {
    return this.connection;
  }
}
