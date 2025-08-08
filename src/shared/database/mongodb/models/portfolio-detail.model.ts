import { BaseSchema } from '../common/base.model';
import { Portfolio } from './portfolio.model';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class PortfolioDetail extends BaseSchema {
  @Prop({ type: String })
  code: string;

  @Prop({
    type: Number,
  })
  quantity: number;

  @Prop({
    type: Number,
  })
  buyPrice: number;

  @Prop({
    ref: Portfolio.name,
  })
  portfolioId: string;
}

export type PortfolioDetailDocument = PortfolioDetail & Document;
export const PortfolioDetailSchema = SchemaFactory.createForClass(PortfolioDetail);
