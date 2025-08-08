import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, DseClientOptions } from 'cassandra-driver';

@Injectable()
export class ScylladbConfig {
  constructor(private readonly configService: ConfigService) {}

  createScyllaClient(): Client {
    const options: DseClientOptions = {
      contactPoints: this.getContactPoints(),
      localDataCenter: this.configService.get<string>('SCYLLADB_LOCAL_DC', 'datacenter1'),
      keyspace: this.configService.get<string>('SCYLLADB_KEYSPACE', 'nestjs_auth'),
      credentials: this.getCredentials(),
      socketOptions: {
        connectTimeout: this.configService.get<number>('SCYLLADB_CONNECT_TIMEOUT', 30000),
        readTimeout: this.configService.get<number>('SCYLLADB_READ_TIMEOUT', 30000),
      },
      pooling: {
        coreConnectionsPerHost: {
          [1]: this.configService.get<number>('SCYLLADB_CORE_CONNECTIONS', 2),
        },
      },
    };

    return new Client(options);
  }

  private getContactPoints(): string[] {
    const contactPoints = this.configService.get<string>('SCYLLADB_CONTACT_POINTS', 'localhost');
    return contactPoints.split(',').map(cp => cp.trim());
  }

  private getCredentials() {
    const username = this.configService.get<string>('SCYLLADB_USERNAME');
    const password = this.configService.get<string>('SCYLLADB_PASSWORD');
    
    if (username && password) {
      return { username, password };
    }
    
    return undefined;
  }
}