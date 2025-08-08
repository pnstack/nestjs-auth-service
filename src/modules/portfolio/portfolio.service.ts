import { CreatePortfolioDto, UpdatePortfolioDto } from './portfolio.dto';
import { Portfolio } from '@/shared/database/mongodb/models/portfolio.model';
import { PortfolioDetailRepository } from '@/shared/database/mongodb/repositories/portfolio-detail.repository';
import { PortfolioHistoryRepository } from '@/shared/database/mongodb/repositories/portfolio-history.repository';
import { PortfolioRepository } from '@/shared/database/mongodb/repositories/portfolio.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly portfolioRepository: PortfolioRepository,
    private readonly protfolioDetailRepository: PortfolioDetailRepository,
    private readonly portfolioHistoryRepository: PortfolioHistoryRepository
  ) {}

  async create(createPortfolioDto: CreatePortfolioDto): Promise<Portfolio> {
    return this.portfolioRepository.create(createPortfolioDto as any);
  }

  async findAll(): Promise<Portfolio[]> {
    return this.portfolioRepository.find();
  }

  async findOne(id: string): Promise<Portfolio | null> {
    return this.portfolioRepository.findById(id);
  }

  async update(id: string, updatePortfolioDto: UpdatePortfolioDto): Promise<Portfolio | null> {
    return this.portfolioRepository.findByIdAndUpdate(id, updatePortfolioDto as any);
  }

  async remove(id: string): Promise<boolean> {
    return this.portfolioRepository.deleteById(id);
  }

  async findAllByUserId(userId: string): Promise<Portfolio[]> {
    return this.portfolioRepository.find({ userId });
  }
}
