import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { withAppErrors, withBlobAppErrors } from '../../../../core/errors/with-app-errors';
import {
  GeneratableFormat,
  GeneratedBarcode,
  LabelProduct,
  LabelRequest,
} from '../../domain/entities/barcode';
import { BarcodesRepository } from '../../domain/repositories/barcodes.repository';
import { BarcodesDataSource } from '../datasources/barcodes.datasource';
import { toGeneratedBarcode, toLabelProduct, toLabelsBody } from '../mappers/barcode.mapper';

@Injectable()
export class HttpBarcodesRepository extends BarcodesRepository {
  private readonly source = inject(BarcodesDataSource);

  generate(
    productId: string,
    format: GeneratableFormat,
    replaceExisting: boolean,
  ): Observable<GeneratedBarcode> {
    return this.source
      .generate(productId, { format, replaceExisting })
      .pipe(map(toGeneratedBarcode), withAppErrors());
  }
  png(productId: string): Observable<Blob> {
    return this.source.png(productId).pipe(withBlobAppErrors());
  }
  svg(productId: string): Observable<Blob> {
    return this.source.svg(productId).pipe(withBlobAppErrors());
  }
  labels(request: LabelRequest): Observable<Blob> {
    return this.source.labels(toLabelsBody(request)).pipe(withBlobAppErrors());
  }
  searchLabelProducts(text: string): Observable<LabelProduct[]> {
    return this.source.searchProducts(text).pipe(
      map((page) => page.content.map(toLabelProduct)),
      withAppErrors(),
    );
  }
  labelProduct(id: string): Observable<LabelProduct> {
    return this.source.product(id).pipe(map(toLabelProduct), withAppErrors());
  }
}
