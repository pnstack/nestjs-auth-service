import { BaseRepository } from '../common/base.abstract.repository';
import { Portfolio, PortfolioDocument } from '../models/portfolio.model';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class PortfolioRepository extends BaseRepository<PortfolioDocument> {
  constructor(
    @InjectModel(Portfolio.name) private readonly modelInstanceModel: Model<PortfolioDocument>
  ) {
    super(modelInstanceModel);
  }
}
