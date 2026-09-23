import type { Category, SellableProduct } from '../../domain/entities/sellable-product';
import type { CategoryModel, SellableProductModel } from '../models/catalogue.model';

export function toSellableProduct(model: SellableProductModel): SellableProduct {
  return {
    id: model.id,
    sku: model.sku,
    barcode: model.barcode ?? null,
    name: model.name,
    description: model.description ?? null,
    categoryId: model.categoryId ?? null,
    categoryName: model.categoryName ?? null,
    unit: model.unit,
    salePrice: Number(model.salePrice),
    batchTracked: model.batchTracked,
    availableQuantity: Number(model.availableQuantity),
  };
}

export function toCategory(model: CategoryModel): Category {
  return { id: model.id, name: model.name, parentId: model.parentId ?? null };
}
