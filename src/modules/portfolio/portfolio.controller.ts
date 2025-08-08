import { CreatePortfolioDto, UpdatePortfolioDto } from './portfolio.dto';
import { PortfolioService } from './portfolio.service';
import { UserEntity } from '@/common/decorators';
import { RolesPermissionsGuard } from '@/common/guards/roles-permisions.guard';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  ArgumentMetadata,
  Inject,
  Injectable,
  PipeTransform,
  UsePipes,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UseInterceptors,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { map, Observable } from 'rxjs';


@ApiBearerAuth()
@UseGuards(RolesPermissionsGuard)
@ApiTags('portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  @ApiOperation({ summary: 'Create portfolio' })
  @ApiResponse({ status: 201, description: 'Portfolio created' })
  create(@Body() createPortfolioDto: CreatePortfolioDto, @UserEntity() user: any) {
    console.log('Creating portfolio for user:', createPortfolioDto);

    return createPortfolioDto;
    return this.portfolioService.create({
      ...createPortfolioDto,
      userId: user.id, // Inject user ID from the request
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all portfolios' })
  @ApiResponse({ status: 200, description: 'List of portfolios' })
  findAll(@UserEntity() user: any) {
    return this.portfolioService.findAllByUserId(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get portfolio by id' })
  @ApiResponse({ status: 200, description: 'Portfolio found' })
  findOne(@Param('id') id: string) {
    return this.portfolioService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update portfolio' })
  @ApiResponse({ status: 200, description: 'Portfolio updated' })
  update(@Param('id') id: string, @Body() updatePortfolioDto: UpdatePortfolioDto) {
    return this.portfolioService.update(id, updatePortfolioDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete portfolio' })
  @ApiResponse({ status: 200, description: 'Portfolio deleted' })
  remove(@Param('id') id: string) {
    return this.portfolioService.remove(id);
  }
}
