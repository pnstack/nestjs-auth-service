import { ScylladbConfig } from './scylladb.config';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Client } from 'cassandra-driver';

@Injectable()
export class ScylladbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScylladbService.name);
  private client: Client;

  constructor(private readonly scylladbConfig: ScylladbConfig) {}

  async onModuleInit() {
    try {
      this.client = this.scylladbConfig.createScyllaClient();
      await this.client.connect();
      this.logger.log('Successfully connected to ScyllaDB');
      
      // Ensure keyspace exists
      await this.ensureKeyspace();
    } catch (error) {
      this.logger.error('Failed to connect to ScyllaDB:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.shutdown();
      this.logger.log('ScyllaDB connection closed');
    }
  }

  getClient(): Client {
    if (!this.client) {
      throw new Error('ScyllaDB client is not initialized');
    }
    return this.client;
  }

  async executeQuery(query: string, params?: any[], options?: any) {
    return this.client.execute(query, params, options);
  }

  async executeBatch(queries: Array<{ query: string; params?: any[] }>) {
    return this.client.batch(queries, { prepare: true });
  }

  private async ensureKeyspace() {
    try {
      const keyspace = process.env.SCYLLADB_KEYSPACE || 'nestjs_auth';
      
      // Create keyspace if it doesn't exist
      const createKeyspaceQuery = `
        CREATE KEYSPACE IF NOT EXISTS ${keyspace} 
        WITH replication = {
          'class': 'SimpleStrategy',
          'replication_factor': 1
        }
      `;
      
      await this.client.execute(createKeyspaceQuery);
      this.logger.log(`Keyspace '${keyspace}' ensured`);
    } catch (error) {
      this.logger.warn('Could not ensure keyspace:', error);
    }
  }
}