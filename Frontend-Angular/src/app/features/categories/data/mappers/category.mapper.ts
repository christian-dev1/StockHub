import { Category } from '../../domain/entities/category';
import { CategoryModel } from '../models/category.model';

export function toCategory(model: CategoryModel): Category {
  return {
    id: model.id,
    name: model.name,
    description: model.description ?? null,
    parentId: model.parentId ?? null,
    parentName: model.parentName ?? null,
    level: model.parentId ? 2 : 1,
    productCount: model.productCount ?? 0,
    version: model.version,
  };
}
