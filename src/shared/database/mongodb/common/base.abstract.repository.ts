import { IRepository } from './base.interface.repository';
import { Injectable } from '@nestjs/common';
import { Document, FilterQuery, Model, UpdateQuery } from 'mongoose';

@Injectable()
export abstract class BaseRepository<T extends Document> implements IRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async create(entity: Partial<T>): Promise<T> {
    const createdEntity = new this.model(entity);
    return createdEntity.save();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async findOne(filterQuery: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filterQuery).exec();
  }

  async find(filterQuery: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find(filterQuery).exec();
  }

  async findOneAndUpdate(
    filterQuery: FilterQuery<T>,
    updateQuery: UpdateQuery<T>,
    options: { new?: boolean; upsert?: boolean } = { new: true }
  ): Promise<T | null> {
    return this.model.findOneAndUpdate(filterQuery, updateQuery, options).exec();
  }

  async findByIdAndUpdate(
    id: string,
    updateQuery: UpdateQuery<T>,
    options: { new?: boolean } = { new: true }
  ): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, updateQuery, options).exec();
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  async deleteOne(filterQuery: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.deleteOne(filterQuery).exec();
    return result.deletedCount > 0;
  }

  async count(filterQuery: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filterQuery).exec();
  }

  async paginate(
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
  }> {
    const { page, limit, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.find(filterQuery).sort(sort).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filterQuery).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
