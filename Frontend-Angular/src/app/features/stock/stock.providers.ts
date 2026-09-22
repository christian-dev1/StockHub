import { Provider } from '@angular/core';
import { StockDataSource } from './data/datasources/stock.datasource';
import { HttpStockRepository } from './data/repositories/http-stock.repository';
import { StockRepository } from './domain/repositories/stock.repository';
import {
  SearchBatchesUseCase,
  SearchMovementsUseCase,
  SearchStockLevelsUseCase,
  StockDocumentsUseCase,
  StockOperationsUseCase,
  StockReferencesUseCase,
} from './domain/use-cases/stock.use-cases';
import { StockContext } from './presentation/state/stock-context';
import { StockLookups } from './presentation/state/stock-lookups';

export const STOCK_PROVIDERS: Provider[] = [
  StockDataSource,
  { provide: StockRepository, useClass: HttpStockRepository },
  SearchStockLevelsUseCase,
  SearchMovementsUseCase,
  SearchBatchesUseCase,
  StockDocumentsUseCase,
  StockOperationsUseCase,
  StockReferencesUseCase,
  StockContext,
  StockLookups,
];
