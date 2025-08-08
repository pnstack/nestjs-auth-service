# ScyllaDB Module

This module provides ScyllaDB integration for the NestJS Auth Service. ScyllaDB is a high-performance NoSQL database that's compatible with Apache Cassandra.

## Features

- **Global Module**: Available throughout the application
- **Base Repository**: Abstract repository with common CRUD operations
- **Connection Management**: Automatic connection handling and lifecycle management
- **Configuration**: Environment-based configuration
- **Example Implementation**: UserSession repository demonstrating usage

## Configuration

Add the following environment variables to your `.env` file:

```env
# ScyllaDB connection
SCYLLADB_CONTACT_POINTS=localhost
SCYLLADB_LOCAL_DC=datacenter1
SCYLLADB_KEYSPACE=nestjs_auth
SCYLLADB_USERNAME=
SCYLLADB_PASSWORD=
SCYLLADB_CONNECT_TIMEOUT=30000
SCYLLADB_READ_TIMEOUT=30000
SCYLLADB_CORE_CONNECTIONS=2
```

## Usage

### 1. Creating a Model

```typescript
export interface UserSession {
  session_id: string;
  user_id: string;
  created_at: Date;
  expires_at: Date;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
}
```

### 2. Creating a Repository

```typescript
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

  // Implement the required mapRowToEntity method
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

  // Custom methods specific to your use case
  async findActiveSessionsByUserId(userId: string): Promise<UserSession[]> {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE user_id = ? AND is_active = true 
      ALLOW FILTERING
    `;
    
    const result = await this.client.execute(query, [userId], { prepare: true });
    return result.rows.map(row => this.mapRowToEntity(row));
  }
}
```

### 3. Using in a Service

```typescript
import { UserSessionRepository } from './repositories/user-session.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private readonly userSessionRepository: UserSessionRepository
  ) {}

  async createSession(userId: string, sessionData: any) {
    return this.userSessionRepository.create({
      session_id: generateUUID(),
      user_id: userId,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      is_active: true,
      ...sessionData
    });
  }

  async getUserSessions(userId: string) {
    return this.userSessionRepository.findActiveSessionsByUserId(userId);
  }
}
```

## Base Repository Methods

The `BaseScyllaRepository` provides the following methods:

- `create(entity: Partial<T>): Promise<T>`
- `findById(id: string): Promise<T | null>`
- `findOne(whereClause: Record<string, any>): Promise<T | null>`
- `find(whereClause?: Record<string, any>): Promise<T[]>`
- `update(id: string, updateData: Partial<T>): Promise<T | null>`
- `delete(id: string): Promise<boolean>`
- `count(whereClause?: Record<string, any>): Promise<number>`
- `paginate(whereClause, options): Promise<PaginationResult<T>>`

## Important Notes

### ScyllaDB/Cassandra Considerations

1. **Primary Keys**: Always define your primary key structure carefully
2. **Queries**: WHERE clauses are limited - you may need to use `ALLOW FILTERING` for some queries
3. **Pagination**: ScyllaDB doesn't support OFFSET, so pagination is implemented with LIMIT only
4. **Data Modeling**: Design your tables based on your query patterns

### Best Practices

1. **Table Creation**: Create tables during application startup or migrations
2. **Prepared Statements**: The repository uses prepared statements for better performance
3. **Connection Pooling**: The module handles connection pooling automatically
4. **Error Handling**: Always handle potential connection and query errors

## Testing

The module includes comprehensive unit tests that mock the cassandra-driver client. Run tests with:

```bash
npm test -- --testPathPattern=scylladb
```

## Dependencies

- `cassandra-driver`: Main driver for ScyllaDB/Cassandra connectivity
- `@types/cassandra-driver`: TypeScript definitions