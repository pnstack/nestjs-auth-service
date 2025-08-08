import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ConsumeMessage, connect, Options } from 'amqplib';

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private connection;
  private channel: Channel;
  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.handledConnect();
  }

  async handledConnect() {
    try {
      const url =
        this.configService.get<string>('RABBITMQ_URL') || 'amqp://admin:snp2021213@rabbitmq:5672';
      this.connection = await connect(url);
      this.channel = await this.connection.createChannel();
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);

      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch (error) {
      console.error('Error closing RabbitMQ connections:', error);
    }
  }

  async assertQueue(queue: string, options: any = {}) {
    try {
      return await this.channel.assertQueue(queue, { durable: true, ...options });
    } catch (error) {
      console.error('Failed to assert queue:', error);
      throw error;
    }
  }

  async assertExchange(
    exchange: string,
    type: 'direct' | 'fanout' | 'topic' = 'direct',
    options: any = {}
  ) {
    try {
      return await this.channel.assertExchange(exchange, type, { durable: true, ...options });
    } catch (error) {
      console.error('Failed to assert exchange:', error);
      throw error;
    }
  }

  async publish(exchange: string, routingKey: string, content: any, options: any = {}) {
    try {
      // Assert exchange exists before publishing
      await this.assertExchange(exchange);
      const buffer = Buffer.from(JSON.stringify(content));
      return this.channel.publish(exchange, routingKey, buffer, { persistent: true, ...options });
    } catch (error) {
      console.error('Failed to publish message:', error);
      throw error;
    }
  }

  async sendToQueue(queue: string, content: any, options: Options.Publish = {}) {
    try {
      // Assert queue exists before sending
      await this.assertQueue(queue);
      const buffer = Buffer.from(JSON.stringify(content));
      return this.channel.sendToQueue(queue, buffer, { persistent: true, ...options });
    } catch (error) {
      console.error('Failed to send to queue:', error);
      throw error;
    }
  }

  async consume(
    queue: string,
    onMessage: (msg: ConsumeMessage | null) => void,
    options: Options.Consume = {}
  ) {
    try {
      // Assert queue exists before consuming
      await this.assertQueue(queue);
      this.channel.prefetch(2);
      return await this.channel.consume(
        queue,
        async (msg) => {
          try {
            await onMessage(msg);
            this.channel.ack(msg);
          } catch (error) {
            console.error('Error consuming message:', error);
          }
        },
        {
          noAck: false,
          ...options,
        }
      );
    } catch (error) {
      console.error('Failed to consume messages:', error);
      throw error;
    }
  }

  async bindQueue(queue: string, exchange: string, routingKey: string) {
    try {
      // Assert both queue and exchange exist before binding
      await this.assertQueue(queue);
      await this.assertExchange(exchange);
      return await this.channel.bindQueue(queue, exchange, routingKey);
    } catch (error) {
      console.error('Failed to bind queue:', error);
      throw error;
    }
  }

  ack(message: ConsumeMessage) {
    this.channel.ack(message);
  }

  nack(message: ConsumeMessage) {
    this.channel.nack(message);
  }
}
