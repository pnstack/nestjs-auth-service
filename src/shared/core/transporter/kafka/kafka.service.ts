import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, KafkaMessage, ProducerRecord } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: this.configService.get('KAFKA_CLIENT_ID'),
      brokers: this.configService.get<string>('KAFKA_BROKERS')?.split(',') || [],
      ssl: this.configService.get('KAFKA_SSL') === 'true',
      sasl: this.getSaslConfig(),
    });

    this.producer = this.kafka.producer();
  }

  private getSaslConfig() {
    const mechanism = this.configService.get('KAFKA_SASL_MECHANISM');
    const username = this.configService.get('KAFKA_SASL_USERNAME');
    const password = this.configService.get('KAFKA_SASL_PASSWORD');

    if (mechanism && username && password) {
      return {
        mechanism,
        username,
        password,
      };
    }
    return undefined;
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
    } catch (error) {
      console.error(error);
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    for (const consumer of this.consumers.values()) {
      await consumer.disconnect();
    }
  }

  private async createConsumer(groupId: string): Promise<Consumer> {
    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    return consumer;
  }

  async publish<T = any>(topic: string, message: T, key?: string): Promise<void> {
    try {
      const record: ProducerRecord = {
        topic,
        messages: [
          {
            key: key || undefined,
            value: JSON.stringify(message),
          },
        ],
      };

      await this.producer.send(record);
    } catch (error) {
      console.error(`Failed to publish message to topic ${topic}:`, error);
      throw error;
    }
  }

  async subscribe<T = any>(
    topic: string,
    callback: (message: T, partition: number, offset: string) => Promise<void>,
    options: {
      groupId?: string;
      fromBeginning?: boolean;
    } = {}
  ): Promise<void> {
    try {
      const groupId = options.groupId || this.configService.get('KAFKA_CONSUMER_GROUP_ID');
      const consumerKey = `${topic}-${groupId}`;

      if (!this.consumers.has(consumerKey)) {
        const consumer = await this.createConsumer(groupId);
        this.consumers.set(consumerKey, consumer);

        await consumer.subscribe({
          topic,
          fromBeginning: options.fromBeginning ?? false,
        });

        await consumer.run({
          eachMessage: async ({ topic: messageTopic, partition, message }) => {
            const value = message.value?.toString();
            if (value) {
              try {
                const parsedValue = JSON.parse(value) as T;
                await callback(parsedValue, partition, message.offset);
              } catch (error) {
                console.error(`Failed to process message from topic ${messageTopic}:`, error);
              }
            }
          },
        });
      }
    } catch (error) {
      console.error(`Failed to subscribe to topic ${topic}:`, error);
      throw error;
    }
  }

  getProducer(): Producer {
    return this.producer;
  }

  getConsumer(topic: string, groupId: string): Consumer | undefined {
    return this.consumers.get(`${topic}-${groupId}`);
  }

  async disconnectConsumer(topic: string, groupId: string): Promise<void> {
    const consumerKey = `${topic}-${groupId}`;
    const consumer = this.consumers.get(consumerKey);
    if (consumer) {
      await consumer.disconnect();
      this.consumers.delete(consumerKey);
    }
  }
}
