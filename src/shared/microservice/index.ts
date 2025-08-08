import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

export async function setupKafkaTranspoter(app: INestApplication) {
  const configService = app.get(ConfigService);

  // const brokers = configService.get<string>('KAFKA_BROKERS')?.split(',') || ['localhost:9092'];
  const groupId = configService.get<string>('KAFKA_GROUP_ID') || 'default-group';

  function getSaslConfig() {
    const mechanism = configService.get('KAFKA_SASL_MECHANISM');
    const username = configService.get('KAFKA_SASL_USERNAME');
    const password = configService.get('KAFKA_SASL_PASSWORD');

    if (mechanism && username && password) {
      return {
        mechanism,
        username,
        password,
      };
    }
    return undefined;
  }

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get('KAFKA_CLIENT_ID'),
        brokers: configService.get('KAFKA_BROKERS')?.split(',') || [],
        ssl: configService.get('KAFKA_SSL') === 'true',
        sasl: getSaslConfig(),
      },
      consumer: {
        groupId,
        allowAutoTopicCreation: true,
        // sessionTimeout: 30000, // Increase if needed
        // heartbeatInterval: 60, // Lower if neede
      },
    },
  });

  await app.startAllMicroservices();
  console.log('Kafka microservice connected 🚀');
}
