import { BaseRepository } from '../common/base.abstract.repository';
import { StockPriceModel, StockPriceDocument } from '../models/stock-price.model';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class StockPriceRepository extends BaseRepository<StockPriceDocument> {
  constructor(
    @InjectModel(StockPriceModel.name) private readonly stockPriceModel: Model<StockPriceDocument>
  ) {
    super(stockPriceModel);
  }
}
