import { IScyllaRepository } from './base.interface.repository';
import { Injectable } from '@nestjs/common';
import { Client, mapping, types } from 'cassandra-driver';

@Injectable()
export abstract class BaseScyllaRepository<T> implements IScyllaRepository<T> {
  protected abstract tableName: string;
  protected abstract primaryKey: string;

  constructor(protected readonly client: Client) {}

  async create(entity: Partial<T>): Promise<T> {
    const columns = Object.keys(entity).join(', ');
    const values = Object.values(entity);
    const placeholders = values.map(() => '?').join(', ');
    
    const query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    
    await this.client.execute(query, values, { prepare: true });
    
    // Return the created entity (assuming it has an ID)
    return entity as T;
  }

  async findById(id: string): Promise<T | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
    const result = await this.client.execute(query, [id], { prepare: true });
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToEntity(result.rows[0]);
  }

  async findOne(whereClause: Record<string, any>): Promise<T | null> {
    const whereKeys = Object.keys(whereClause);
    const whereValues = Object.values(whereClause);
    const whereConditions = whereKeys.map(key => `${key} = ?`).join(' AND ');
    
    const query = `SELECT * FROM ${this.tableName} WHERE ${whereConditions} LIMIT 1`;
    const result = await this.client.execute(query, whereValues, { prepare: true });
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToEntity(result.rows[0]);
  }

  async find(whereClause: Record<string, any> = {}): Promise<T[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    let queryParams: any[] = [];
    
    if (Object.keys(whereClause).length > 0) {
      const whereKeys = Object.keys(whereClause);
      const whereValues = Object.values(whereClause);
      const whereConditions = whereKeys.map(key => `${key} = ?`).join(' AND ');
      
      query += ` WHERE ${whereConditions}`;
      queryParams = whereValues;
    }
    
    const result = await this.client.execute(query, queryParams, { prepare: true });
    return result.rows.map(row => this.mapRowToEntity(row));
  }

  async update(id: string, updateData: Partial<T>): Promise<T | null> {
    const updateKeys = Object.keys(updateData);
    const updateValues = Object.values(updateData);
    const setClause = updateKeys.map(key => `${key} = ?`).join(', ');
    
    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = ?`;
    const queryParams = [...updateValues, id];
    
    await this.client.execute(query, queryParams, { prepare: true });
    
    // Return the updated entity
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
    const result = await this.client.execute(query, [id], { prepare: true });
    
    // In Cassandra/ScyllaDB, we can't easily check if a row was actually deleted
    // We'll assume success if no error was thrown
    return true;
  }

  async count(whereClause: Record<string, any> = {}): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    let queryParams: any[] = [];
    
    if (Object.keys(whereClause).length > 0) {
      const whereKeys = Object.keys(whereClause);
      const whereValues = Object.values(whereClause);
      const whereConditions = whereKeys.map(key => `${key} = ?`).join(' AND ');
      
      query += ` WHERE ${whereConditions}`;
      queryParams = whereValues;
    }
    
    const result = await this.client.execute(query, queryParams, { prepare: true });
    return result.rows[0]?.count?.toNumber() || 0;
  }

  async paginate(
    whereClause: Record<string, any>,
    options: {
      page: number;
      limit: number;
      orderBy?: Record<string, 'ASC' | 'DESC'>;
    }
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, orderBy } = options;
    
    // Get total count
    const total = await this.count(whereClause);
    
    // Build query for data
    let query = `SELECT * FROM ${this.tableName}`;
    let queryParams: any[] = [];
    
    if (Object.keys(whereClause).length > 0) {
      const whereKeys = Object.keys(whereClause);
      const whereValues = Object.values(whereClause);
      const whereConditions = whereKeys.map(key => `${key} = ?`).join(' AND ');
      
      query += ` WHERE ${whereConditions}`;
      queryParams = whereValues;
    }
    
    // Add ordering if specified
    if (orderBy && Object.keys(orderBy).length > 0) {
      const orderClauses = Object.entries(orderBy).map(([key, direction]) => `${key} ${direction}`);
      query += ` ORDER BY ${orderClauses.join(', ')}`;
    }
    
    // Add pagination
    query += ` LIMIT ?`;
    queryParams.push(limit);
    
    // Note: ScyllaDB doesn't support OFFSET, so we implement basic pagination
    // For production use, you might want to use token-based pagination
    const result = await this.client.execute(query, queryParams, { prepare: true });
    const data = result.rows.map(row => this.mapRowToEntity(row));
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  protected abstract mapRowToEntity(row: types.Row): T;
}