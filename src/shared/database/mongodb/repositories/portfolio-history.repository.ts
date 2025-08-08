import { BaseRepository } from '../common/base.abstract.repository';
import { PortfolioHistory, PortfolioHistoryDocument } from '../models/portfolio-history.model';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class PortfolioHistoryRepository extends BaseRepository<PortfolioHistoryDocument> {
  constructor(
    @InjectModel(PortfolioHistory.name)
    private readonly modelInstanceModel: Model<PortfolioHistoryDocument>
  ) {
    super(modelInstanceModel);
  }
}
