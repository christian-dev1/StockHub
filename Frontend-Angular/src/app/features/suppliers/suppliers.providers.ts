import { Provider } from '@angular/core';
import { SuppliersDataSource } from './data/datasources/suppliers.datasource';
import { HttpSuppliersRepository } from './data/repositories/http-suppliers.repository';
import { SuppliersRepository } from './domain/repositories/suppliers.repository';
import {
  ChangeSupplierStatusUseCase,
  GetSupplierUseCase,
  SaveSupplierUseCase,
  SearchSuppliersUseCase,
} from './domain/use-cases/supplier.use-cases';

export const SUPPLIERS_PROVIDERS: Provider[] = [
  SuppliersDataSource,
  { provide: SuppliersRepository, useClass: HttpSuppliersRepository },
  SearchSuppliersUseCase,
  GetSupplierUseCase,
  SaveSupplierUseCase,
  ChangeSupplierStatusUseCase,
];
