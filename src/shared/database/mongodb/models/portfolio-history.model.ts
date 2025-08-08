import { BaseSchema } from '../common/base.model';
import { Portfolio } from './portfolio.model';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class PortfolioHistory extends BaseSchema {
  @Prop({
    type: Number,
  })
  currentBalance: number;

  @Prop({
    type: Number,
  })
  balanceChange: number;

  @Prop({
    type: Number,
  })
  balanceChangePercent: number;

  @Prop({
    ref: Portfolio.name,
  })
  portfolioId: string;
}

export type PortfolioHistoryDocument = PortfolioHistory & Document;
export const PortfolioHistorySchema = SchemaFactory.createForClass(PortfolioHistory);
