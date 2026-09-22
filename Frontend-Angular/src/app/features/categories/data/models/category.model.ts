/** Wire format of CategoryResponse. */
export interface CategoryModel {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly parentId: string | null;
  readonly parentName: string | null;
  readonly productCount: number;
  readonly version: number;
}
