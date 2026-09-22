import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  AdjustmentCommand,
  AdjustmentDirection,
  EntryCommand,
  ExitCommand,
  StockOperation,
  StockProduct,
  TransferCommand,
  adjustedQuantity,
  isWholeUnit,
} from '../../domain/entities/stock';

export type StockOperationForm = FormGroup<{
  locationId: FormControl<string | null>;
  destinationLocationId: FormControl<string | null>;
  product: FormControl<StockProduct | null>;
  quantity: FormControl<number | null>;
  direction: FormControl<AdjustmentDirection>;
  batchId: FormControl<string | null>;
  batchNumber: FormControl<string>;
  manufacturingDate: FormControl<string>;
  expirationDate: FormControl<string>;
  reason: FormControl<string>;
  reference: FormControl<string>;
}>;

/** Strictly positive quantity with at most three decimals, whole for discrete units. */
export function quantityValidator(unit: () => string | null): ValidatorFn {
  return (control: AbstractControl<number | null>): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined) return null;
    if (value <= 0) return { positive: true };
    const current = unit();
    if (current && isWholeUnit(current) && !Number.isInteger(value)) return { wholeNumber: true };
    if (Math.round(value * 1000) !== value * 1000) return { maxDecimals: { max: 3 } };
    return null;
  };
}

/** A transfer moves goods between two different locations. */
export const differentLocations: ValidatorFn = (group) => {
  const source = group.get('locationId')?.value as string | null;
  const destination = group.get('destinationLocationId')?.value as string | null;
  return source && destination && source === destination ? { sameLocation: true } : null;
};

/** A batch cannot expire before it was made. */
export const datesInOrder: ValidatorFn = (group) => {
  const made = group.get('manufacturingDate')?.value as string;
  const expires = group.get('expirationDate')?.value as string;
  return made && expires && expires < made ? { dateOrder: true } : null;
};

export function stockOperationForm(
  fb: NonNullableFormBuilder,
  operation: StockOperation,
): StockOperationForm {
  const form: StockOperationForm = fb.group(
    {
      locationId: fb.control<string | null>(null, Validators.required),
      destinationLocationId: fb.control<string | null>(
        null,
        operation === 'transfer' ? Validators.required : [],
      ),
      product: fb.control<StockProduct | null>(null, Validators.required),
      quantity: fb.control<number | null>(null, [
        Validators.required,
        quantityValidator(() => form.controls.product.value?.unit ?? null),
      ]),
      direction: fb.control<AdjustmentDirection>('INCREASE'),
      batchId: fb.control<string | null>(null),
      batchNumber: fb.control('', Validators.maxLength(100)),
      manufacturingDate: fb.control(''),
      expirationDate: fb.control(''),
      reason: fb.control(
        '',
        operation === 'adjustment'
          ? [Validators.required, Validators.maxLength(500)]
          : Validators.maxLength(500),
      ),
      reference: fb.control('', Validators.maxLength(100)),
    },
    { validators: operation === 'transfer' ? differentLocations : datesInOrder },
  );
  return form;
}

/**
 * Batch fields depend on the product: an entry of a batch-tracked product
 * needs a batch number (and an expiry date when expiry is tracked); an
 * adjustment of such a product targets one batch. Exits and transfers let the
 * backend pick the batches (FEFO).
 */
export function applyProductRules(
  form: StockOperationForm,
  operation: StockOperation,
  product: StockProduct | null,
): void {
  const { batchNumber, expirationDate, batchId, quantity } = form.controls;
  const tracked = !!product?.batchTracked;
  batchNumber.setValidators(
    operation === 'entry' && tracked
      ? [Validators.required, Validators.maxLength(100)]
      : Validators.maxLength(100),
  );
  expirationDate.setValidators(
    operation === 'entry' && !!product?.expiryTracked ? Validators.required : [],
  );
  batchId.setValidators(operation === 'adjustment' && tracked ? Validators.required : []);
  if (!tracked) {
    batchNumber.reset('');
    form.controls.manufacturingDate.reset('');
    batchId.reset(null);
  }
  if (!product?.expiryTracked) expirationDate.reset('');
  for (const control of [batchNumber, expirationDate, batchId, quantity]) {
    control.updateValueAndValidity({ emitEvent: false });
  }
}

/** Only called on a valid form: required values are present. */
export function toEntryCommand(form: StockOperationForm): EntryCommand {
  const v = form.getRawValue();
  const product = v.product as StockProduct;
  return {
    locationId: v.locationId as string,
    productId: product.id,
    quantity: v.quantity as number,
    reason: v.reason,
    reference: v.reference,
    batch: product.batchTracked
      ? {
          batchNumber: v.batchNumber,
          manufacturingDate: v.manufacturingDate || null,
          expirationDate: product.expiryTracked ? v.expirationDate || null : null,
        }
      : null,
  };
}

export function toExitCommand(form: StockOperationForm): ExitCommand {
  const v = form.getRawValue();
  return {
    locationId: v.locationId as string,
    productId: (v.product as StockProduct).id,
    quantity: v.quantity as number,
    reason: v.reason,
    reference: v.reference,
  };
}

export function toTransferCommand(form: StockOperationForm): TransferCommand {
  const v = form.getRawValue();
  return {
    sourceLocationId: v.locationId as string,
    destinationLocationId: v.destinationLocationId as string,
    productId: (v.product as StockProduct).id,
    quantity: v.quantity as number,
    reason: v.reason,
    reference: v.reference,
  };
}

/** `current` is the quantity of the level, or of the chosen batch for a batch-tracked product. */
export function toAdjustmentCommand(form: StockOperationForm, current: number): AdjustmentCommand {
  const v = form.getRawValue();
  const product = v.product as StockProduct;
  return {
    locationId: v.locationId as string,
    productId: product.id,
    batchId: product.batchTracked ? v.batchId : null,
    countedQuantity: adjustedQuantity(current, v.quantity as number, v.direction),
    reason: v.reason,
  };
}
