import { Observable } from 'rxjs';
import {
  GeneratableFormat,
  GeneratedBarcode,
  LabelProduct,
  LabelRequest,
} from '../entities/barcode';

export abstract class BarcodesRepository {
  abstract generate(
    productId: string,
    format: GeneratableFormat,
    replaceExisting: boolean,
  ): Observable<GeneratedBarcode>;
  abstract png(productId: string): Observable<Blob>;
  abstract svg(productId: string): Observable<Blob>;
  abstract labels(request: LabelRequest): Observable<Blob>;
  /** Active products that already have a barcode, for the label picker. */
  abstract searchLabelProducts(text: string): Observable<LabelProduct[]>;
  abstract labelProduct(id: string): Observable<LabelProduct>;
}
