import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import {
  GeneratableFormat,
  GeneratedBarcode,
  LabelProduct,
  LabelRequest,
} from '../entities/barcode';
import { BarcodesRepository } from '../repositories/barcodes.repository';

@Injectable()
export class GenerateBarcodeUseCase {
  private readonly repository = inject(BarcodesRepository);
  /** An existing barcode is only replaced when explicitly asked (labels may be printed already). */
  execute(
    productId: string,
    format: GeneratableFormat,
    replaceExisting = false,
  ): Observable<GeneratedBarcode> {
    return this.repository.generate(productId, format, replaceExisting);
  }
}

@Injectable()
export class DownloadBarcodeUseCase {
  private readonly repository = inject(BarcodesRepository);
  png(productId: string): Observable<Blob> {
    return this.repository.png(productId);
  }
  svg(productId: string): Observable<Blob> {
    return this.repository.svg(productId);
  }
}

@Injectable()
export class PrintLabelsUseCase {
  private readonly repository = inject(BarcodesRepository);

  execute(request: LabelRequest): Observable<Blob> {
    return this.repository.labels(request);
  }

  search(text: string): Observable<LabelProduct[]> {
    return this.repository.searchLabelProducts(text.trim());
  }

  /** Preselected products (from a product page); unknown ids are skipped. */
  products(ids: readonly string[]): Observable<LabelProduct[]> {
    if (ids.length === 0) return of([]);
    return forkJoin(
      ids.map((id) => this.repository.labelProduct(id).pipe(catchError(() => of(null)))),
    ).pipe(map((products) => products.filter((p): p is LabelProduct => p !== null)));
  }
}
