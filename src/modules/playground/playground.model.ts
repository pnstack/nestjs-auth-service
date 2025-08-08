import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ strict: false })
export class Playground {}

export const PlaygroundSchema = SchemaFactory.createForClass(Playground);
