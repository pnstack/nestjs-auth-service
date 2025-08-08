import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreatePortfolioDto {
  @ApiProperty({ example: 'My Portfolio', description: 'Name of the portfolio' })
  @IsString()
  name: string;

  @ApiProperty({ example: 1000, description: 'Initial balance' })
  @IsNumber()
  balance: number;

  @ApiProperty({ example: 1000, description: 'Current balance' })
  @IsNumber()
  currentBalance: number;

  @ApiProperty({ example: 0, description: 'Balance change' })
  @IsNumber()
  balanceChange: number;

  @ApiProperty({ example: 0, description: 'Balance change percent' })
  @IsNumber()
  balanceChangePercent: number;

  @ApiProperty({ example: 'userId123', description: 'User ID' })
  @IsString()
  userId: string;
}

export class UpdatePortfolioDto {
  @ApiProperty({ example: 'My Portfolio', description: 'Name of the portfolio', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 1000, description: 'Initial balance', required: false })
  @IsOptional()
  @IsNumber()
  balance?: number;

  @ApiProperty({ example: 1000, description: 'Current balance', required: false })
  @IsOptional()
  @IsNumber()
  currentBalance?: number;

  @ApiProperty({ example: 0, description: 'Balance change', required: false })
  @IsOptional()
  @IsNumber()
  balanceChange?: number;

  @ApiProperty({ example: 0, description: 'Balance change percent', required: false })
  @IsOptional()
  @IsNumber()
  balanceChangePercent?: number;

  @ApiProperty({ example: 'userId123', description: 'User ID', required: false })
  @IsOptional()
  @IsString()
  userId?: string;
}
