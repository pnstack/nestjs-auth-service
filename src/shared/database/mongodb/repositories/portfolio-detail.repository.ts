import { BaseRepository } from '../common/base.abstract.repository';
import { PortfolioDetail, PortfolioDetailDocument } from '../models/portfolio-detail.model';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class PortfolioDetailRepository extends BaseRepository<PortfolioDetailDocument> {
  constructor(
    @InjectModel(PortfolioDetail.name)
    private readonly modelInstanceModel: Model<PortfolioDetailDocument>
  ) {
    super(modelInstanceModel);
  }
}
