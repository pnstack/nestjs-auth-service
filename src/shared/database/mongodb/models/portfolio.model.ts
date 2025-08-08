import { BaseSchema } from '../common/base.model';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Portfolio extends BaseSchema {
  @Prop({ type: String })
  name: string;

  @Prop({ type: Number })
  balance: number;

  @Prop({ type: Number })
  currentBalance: number;

  @Prop({ type: Number })
  balanceChange: number;

  @Prop({ type: Number })
  balanceChangePercent: number;

  @Prop({
    type: String,
    required: true,
  })
  userId: string;
}

export type PortfolioDocument = Portfolio & Document;
export const PortfolioSchema = SchemaFactory.createForClass(Portfolio);
