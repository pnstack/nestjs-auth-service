import { BaseScyllaRepository } from '../common/base.abstract.repository';
import { UserSession } from '../models/user-session.model';
import { Inject, Injectable } from '@nestjs/common';
import { Client, types } from 'cassandra-driver';

@Injectable()
export class UserSessionRepository extends BaseScyllaRepository<UserSession> {
  protected tableName = 'user_sessions';
  protected primaryKey = 'session_id';

  constructor(@Inject('SCYLLA_CLIENT') client: Client) {
    super(client);
  }

  async createTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        session_id UUID PRIMARY KEY,
        user_id UUID,
        created_at TIMESTAMP,
        expires_at TIMESTAMP,
        ip_address TEXT,
        user_agent TEXT,
        is_active BOOLEAN
      )
    `;
    
    await this.client.execute(createTableQuery);
  }

  async findActiveSessionsByUserId(userId: string): Promise<UserSession[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE user_id = ? AND is_active = true 
      ALLOW FILTERING
    `;
    
    const result = await this.client.execute(query, [userId], { prepare: true });
    return result.rows.map(row => this.mapRowToEntity(row));
  }

  async deactivateSession(sessionId: string): Promise<boolean> {
    const query = `UPDATE ${this.tableName} SET is_active = false WHERE session_id = ?`;
    await this.client.execute(query, [sessionId], { prepare: true });
    return true;
  }

  protected mapRowToEntity(row: types.Row): UserSession {
    return {
      session_id: row.session_id?.toString() || '',
      user_id: row.user_id?.toString() || '',
      created_at: row.created_at || new Date(),
      expires_at: row.expires_at || new Date(),
      ip_address: row.ip_address || undefined,
      user_agent: row.user_agent || undefined,
      is_active: row.is_active || false,
    };
  }
}