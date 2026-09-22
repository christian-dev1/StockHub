import { Provider } from '@angular/core';
import { ProductsDataSource } from './data/datasources/products.datasource';
import { HttpProductsRepository } from './data/repositories/http-products.repository';
import { ProductsRepository } from './domain/repositories/products.repository';
import {
  ChangeProductStatusUseCase,
  GetProductReferencesUseCase,
  GetProductUseCase,
  ProductImageUseCase,
  ProductImportUseCase,
  SaveProductUseCase,
  SearchProductsUseCase,
} from './domain/use-cases/product.use-cases';
import { ProductImageCache } from './presentation/state/product-image.cache';

export const PRODUCTS_PROVIDERS: Provider[] = [
  ProductsDataSource,
  { provide: ProductsRepository, useClass: HttpProductsRepository },
  SearchProductsUseCase,
  GetProductUseCase,
  SaveProductUseCase,
  ChangeProductStatusUseCase,
  ProductImageUseCase,
  GetProductReferencesUseCase,
  ProductImportUseCase,
  ProductImageCache,
];
