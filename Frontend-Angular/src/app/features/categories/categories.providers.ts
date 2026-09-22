import { Provider } from '@angular/core';
import { CategoriesDataSource } from './data/datasources/categories.datasource';
import { HttpCategoriesRepository } from './data/repositories/http-categories.repository';
import { CategoriesRepository } from './domain/repositories/categories.repository';
import {
  DeleteCategoryUseCase,
  ListCategoriesUseCase,
  SaveCategoryUseCase,
} from './domain/use-cases/category.use-cases';

export const CATEGORIES_PROVIDERS: Provider[] = [
  CategoriesDataSource,
  { provide: CategoriesRepository, useClass: HttpCategoriesRepository },
  ListCategoriesUseCase,
  SaveCategoryUseCase,
  DeleteCategoryUseCase,
];
