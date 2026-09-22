/** Product category; the tree has two levels (category, sub-category). */
export interface Category {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly parentId: string | null;
  readonly parentName: string | null;
  readonly level: 1 | 2;
  readonly productCount: number;
  readonly version: number;
}

export interface CategoryDraft {
  readonly name: string;
  readonly description: string | null;
  readonly parentId: string | null;
}

/** Categories that may receive `category` as a child: roots other than itself, and only if it has no children. */
export function possibleParents(
  categories: readonly Category[],
  category: Category | null,
): Category[] {
  if (category && hasChildren(categories, category.id)) return [];
  return categories.filter((c) => c.level === 1 && c.id !== category?.id);
}

export function hasChildren(categories: readonly Category[], id: string): boolean {
  return categories.some((c) => c.parentId === id);
}

/** A category can be deleted once it holds no product and no sub-category. */
export function canDelete(categories: readonly Category[], category: Category): boolean {
  return category.productCount === 0 && !hasChildren(categories, category.id);
}
