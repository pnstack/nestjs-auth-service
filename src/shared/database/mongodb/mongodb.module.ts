import { PortfolioDetail, PortfolioDetailSchema } from './models/portfolio-detail.model';
import { PortfolioHistory, PortfolioHistorySchema } from './models/portfolio-history.model';
import { Portfolio, PortfolioSchema } from './models/portfolio.model';
import { StockPriceModel, StockPriceSchema } from './models/stock-price.model';
import { MongodbConfig } from './mongodb.config';
import { MongodbService } from './mongodb.service';
import { PortfolioDetailRepository } from './repositories/portfolio-detail.repository';
import { PortfolioHistoryRepository } from './repositories/portfolio-history.repository';
import { PortfolioRepository } from './repositories/portfolio.repository';
import { StockPriceRepository } from './repositories/stock-price.repository';
import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({ useClass: MongodbConfig }),
    MongooseModule.forFeature([
      {
        name: StockPriceModel.name,
        schema: StockPriceSchema,
      },
      {
        name: Portfolio.name,
        schema: PortfolioSchema,
      },
      {
        name: PortfolioDetail.name,
        schema: PortfolioDetailSchema,
      },
      {
        name: PortfolioHistory.name,
        schema: PortfolioHistorySchema,
      },
    ]),
  ],
  providers: [
    MongodbService,
    StockPriceRepository,
    PortfolioRepository,
    PortfolioDetailRepository,
    PortfolioHistoryRepository,
  ],
  exports: [
    MongodbService,
    StockPriceRepository,
    PortfolioRepository,
    PortfolioDetailRepository,
    PortfolioHistoryRepository,
    MongooseModule,
  ],
})
export class MongodbModule {}
