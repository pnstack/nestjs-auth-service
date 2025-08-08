import { Document, FilterQuery, UpdateQuery } from 'mongoose';

export interface IRepository<T extends Document> {
  create(entity: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findOne(filterQuery: FilterQuery<T>): Promise<T | null>;
  find(filterQuery?: FilterQuery<T>): Promise<T[]>;
  findOneAndUpdate(
    filterQuery: FilterQuery<T>,
    updateQuery: UpdateQuery<T>,
    options?: { new?: boolean; upsert?: boolean }
  ): Promise<T | null>;
  findByIdAndUpdate(
    id: string,
    updateQuery: UpdateQuery<T>,
    options?: { new?: boolean }
  ): Promise<T | null>;
  deleteById(id: string): Promise<boolean>;
  deleteOne(filterQuery: FilterQuery<T>): Promise<boolean>;
  count(filterQuery?: FilterQuery<T>): Promise<number>;
  paginate(
    filterQuery: FilterQuery<T>,
    options: {
      page: number;
      limit: number;
      sort?: any;
    }
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
}
