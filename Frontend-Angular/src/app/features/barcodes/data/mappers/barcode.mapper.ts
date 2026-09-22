import { GeneratedBarcode, LabelProduct, LabelRequest } from '../../domain/entities/barcode';
import { GeneratedBarcodeModel, LabelProductModel } from '../models/barcode.model';

export function toGeneratedBarcode(model: GeneratedBarcodeModel): GeneratedBarcode {
  return { barcode: model.barcode, format: model.barcodeFormat };
}

export function toLabelProduct(model: LabelProductModel): LabelProduct {
  return {
    id: model.id,
    name: model.name,
    sku: model.sku,
    barcode: model.barcode ?? null,
    salePrice: Number(model.salePrice ?? 0),
  };
}

/** Body of PrintLabelsRequest. */
export function toLabelsBody(request: LabelRequest): Record<string, unknown> {
  return {
    items: request.items.map((item) => ({ productId: item.productId, copies: item.copies })),
    layout: request.layout,
    showPrice: request.showPrice,
    startPosition: request.startPosition,
  };
}
