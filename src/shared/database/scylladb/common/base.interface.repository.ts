export interface IScyllaRepository<T> {
  create(entity: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findOne(whereClause: Record<string, any>): Promise<T | null>;
  find(whereClause?: Record<string, any>): Promise<T[]>;
  update(id: string, updateData: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(whereClause?: Record<string, any>): Promise<number>;
  paginate(
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
  }>;
}