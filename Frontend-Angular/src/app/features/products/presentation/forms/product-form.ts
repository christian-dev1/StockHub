import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  BarcodeFormat,
  Product,
  ProductDraft,
  Unit,
  isDiscrete,
} from '../../domain/entities/product';

const SKU_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

/** Expiry dates live on batches: expiry tracking requires batch tracking. */
export const expiryRequiresBatch: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const value = group.value as { batchTracked?: boolean; expiryTracked?: boolean };
  return value.expiryTracked && !value.batchTracked ? { expiryRequiresBatch: true } : null;
};

/** Whole quantities for discrete units (UNIT, BOX, PACK), like the backend. */
export const wholeForDiscreteUnits: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const value = group.value as {
    unit?: Unit;
    minStock?: number | null;
    reorderQuantity?: number | null;
  };
  if (!value.unit || !isDiscrete(value.unit)) return null;
  const fractional = (n: number | null | undefined) =>
    n !== null && n !== undefined && !Number.isInteger(n);
  return fractional(value.minStock) || fractional(value.reorderQuantity)
    ? { wholeQuantity: true }
    : null;
};

/** Amounts start empty on creation (typing into a pre-filled 0 is error-prone); empty means 0. */
export function productForm(fb: NonNullableFormBuilder, product?: Product | null) {
  return fb.group(
    {
      name: [product?.name ?? '', [Validators.required, Validators.maxLength(200)]],
      description: [product?.description ?? '', Validators.maxLength(2000)],
      sku: [product?.sku ?? '', [Validators.maxLength(50), Validators.pattern(SKU_PATTERN)]],
      barcode: [product?.barcode ?? '', Validators.maxLength(64)],
      barcodeFormat: fb.control<BarcodeFormat | null>(product?.barcodeFormat ?? null),
      categoryId: fb.control<string | null>(product?.categoryId ?? null),
      defaultSupplierId: fb.control<string | null>(product?.defaultSupplierId ?? null),
      unit: fb.control<Unit>(product?.unit ?? 'UNIT', Validators.required),
      purchasePrice: fb.control<number | null>(product?.purchasePrice ?? null, Validators.min(0)),
      salePrice: fb.control<number | null>(product?.salePrice ?? null, Validators.min(0)),
      minStock: fb.control<number | null>(product?.minStock ?? null, Validators.min(0)),
      reorderQuantity: fb.control<number | null>(
        product?.reorderQuantity ?? null,
        Validators.min(0.001),
      ),
      batchTracked: [product?.batchTracked ?? false],
      expiryTracked: [product?.expiryTracked ?? false],
      active: [product?.active ?? true],
    },
    { validators: [expiryRequiresBatch, wholeForDiscreteUnits] },
  );
}

export type ProductForm = ReturnType<typeof productForm>;

/**
 * Keeps the two tracking switches consistent while the user edits them:
 * turning expiry on turns batches on, turning batches off turns expiry off.
 */
export function linkTracking(form: ProductForm, destroyRef: DestroyRef): void {
  const { batchTracked, expiryTracked } = form.controls;
  expiryTracked.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe((expiry) => {
    if (expiry && !batchTracked.value) batchTracked.setValue(true);
  });
  batchTracked.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe((batch) => {
    if (!batch && expiryTracked.value) expiryTracked.setValue(false);
  });
}

/** The `active` switch is applied through the status endpoints, not the product body. */
export function toProductDraft(form: ProductForm): ProductDraft {
  const v = form.getRawValue();
  return {
    sku: v.sku,
    barcode: v.barcode,
    barcodeFormat: v.barcodeFormat,
    name: v.name,
    description: v.description,
    categoryId: v.categoryId,
    defaultSupplierId: v.defaultSupplierId,
    unit: v.unit,
    purchasePrice: v.purchasePrice,
    salePrice: v.salePrice,
    minStock: v.minStock,
    reorderQuantity: v.reorderQuantity,
    batchTracked: v.batchTracked,
    expiryTracked: v.expiryTracked,
  };
}
