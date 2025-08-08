import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class SetRedisDto {
  @ApiProperty({ description: 'The key to set in Redis' })
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiProperty({ description: 'The value to store in Redis' })
  @IsNotEmpty()
  @IsString()
  value: string;

  @ApiPropertyOptional({ description: 'Expiration time in seconds' })
  @IsOptional()
  @IsNumber()
  expireSeconds?: number;
}
