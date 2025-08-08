import { BaseSchema } from '../common/base.model';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class StockPriceModel extends BaseSchema {
  @Prop({ required: true })
  symbol: string;

  @Prop({ required: true })
  price: number;
}

export type StockPriceDocument = StockPriceModel & Document;
export const StockPriceSchema = SchemaFactory.createForClass(StockPriceModel);
