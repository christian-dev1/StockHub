import { Provider } from '@angular/core';
import { BarcodesDataSource } from './data/datasources/barcodes.datasource';
import { HttpBarcodesRepository } from './data/repositories/http-barcodes.repository';
import { BarcodesRepository } from './domain/repositories/barcodes.repository';
import {
  DownloadBarcodeUseCase,
  GenerateBarcodeUseCase,
  PrintLabelsUseCase,
} from './domain/use-cases/barcode.use-cases';

export const BARCODES_PROVIDERS: Provider[] = [
  BarcodesDataSource,
  { provide: BarcodesRepository, useClass: HttpBarcodesRepository },
  GenerateBarcodeUseCase,
  DownloadBarcodeUseCase,
  PrintLabelsUseCase,
];
