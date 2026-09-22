import { TestBed } from '@angular/core/testing';
import { NonNullableFormBuilder } from '@angular/forms';
import { StockProduct } from '../../domain/entities/stock';
import {
  applyProductRules,
  stockOperationForm,
  toAdjustmentCommand,
  toEntryCommand,
  toTransferCommand,
} from './stock-operation-form';

const product = (partial: Partial<StockProduct> = {}): StockProduct => ({
  id: 'p1',
  sku: 'PRD-000001',
  name: 'Riz',
  unit: 'UNIT',
  minStock: 0,
  batchTracked: false,
  expiryTracked: false,
  active: true,
  ...partial,
});

describe('stock operation form', () => {
  const fb = () => TestBed.inject(NonNullableFormBuilder);

  it('requires a location, a product and a positive quantity', () => {
    const form = stockOperationForm(fb(), 'exit');
    expect(form.valid).toBe(false);
    form.patchValue({ locationId: 'a', product: product(), quantity: 0 });
    expect(form.controls.quantity.hasError('positive')).toBe(true);
    form.controls.quantity.setValue(5);
    expect(form.valid).toBe(true);
  });

  it('accepts whole quantities only for discrete units, three decimals otherwise', () => {
    const form = stockOperationForm(fb(), 'entry');
    form.patchValue({ locationId: 'a', product: product(), quantity: 1.5 });
    expect(form.controls.quantity.hasError('wholeNumber')).toBe(true);
    form.patchValue({ product: product({ unit: 'KG' }) });
    form.controls.quantity.setValue(1.2345);
    expect(form.controls.quantity.hasError('maxDecimals')).toBe(true);
    form.controls.quantity.setValue(1.234);
    expect(form.controls.quantity.valid).toBe(true);
  });

  it('asks for batch and expiry only for tracked products on entry', () => {
    const form = stockOperationForm(fb(), 'entry');
    form.patchValue({ locationId: 'a', product: product(), quantity: 3 });
    applyProductRules(form, 'entry', product());
    expect(form.valid).toBe(true);

    const tracked = product({ batchTracked: true, expiryTracked: true });
    form.patchValue({ product: tracked });
    applyProductRules(form, 'entry', tracked);
    expect(form.controls.batchNumber.hasError('required')).toBe(true);
    expect(form.controls.expirationDate.hasError('required')).toBe(true);
    form.patchValue({ batchNumber: 'LOT-A', expirationDate: '2026-12-31' });
    expect(form.valid).toBe(true);
    expect(toEntryCommand(form).batch).toEqual({
      batchNumber: 'LOT-A',
      manufacturingDate: null,
      expirationDate: '2026-12-31',
    });
  });

  it('never asks for a batch on exits: the backend applies FEFO', () => {
    const form = stockOperationForm(fb(), 'exit');
    const tracked = product({ batchTracked: true, expiryTracked: true });
    form.patchValue({ locationId: 'a', product: tracked, quantity: 4 });
    applyProductRules(form, 'exit', tracked);
    expect(form.valid).toBe(true);
  });

  it('rejects an expiry before manufacturing', () => {
    const form = stockOperationForm(fb(), 'entry');
    form.patchValue({ manufacturingDate: '2026-09-01', expirationDate: '2026-08-01' });
    expect(form.hasError('dateOrder')).toBe(true);
  });

  it('refuses a transfer to the same location', () => {
    const form = stockOperationForm(fb(), 'transfer');
    form.patchValue({
      locationId: 'a',
      destinationLocationId: 'a',
      product: product(),
      quantity: 7,
    });
    expect(form.hasError('sameLocation')).toBe(true);
    form.patchValue({ destinationLocationId: 'b' });
    expect(form.valid).toBe(true);
    expect(toTransferCommand(form)).toMatchObject({
      sourceLocationId: 'a',
      destinationLocationId: 'b',
      quantity: 7,
    });
  });

  it('makes the reason mandatory for an adjustment and sends the counted quantity', () => {
    const form = stockOperationForm(fb(), 'adjustment');
    form.patchValue({ locationId: 'a', product: product(), quantity: 3, direction: 'DECREASE' });
    expect(form.controls.reason.hasError('required')).toBe(true);
    form.controls.reason.setValue('Casse');
    expect(form.valid).toBe(true);
    expect(toAdjustmentCommand(form, 12)).toEqual({
      locationId: 'a',
      productId: 'p1',
      batchId: null,
      countedQuantity: 9,
      reason: 'Casse',
    });
  });

  it('targets one batch when adjusting a tracked product', () => {
    const form = stockOperationForm(fb(), 'adjustment');
    const tracked = product({ batchTracked: true });
    form.patchValue({ locationId: 'a', product: tracked, quantity: 1, reason: 'Casse' });
    applyProductRules(form, 'adjustment', tracked);
    expect(form.controls.batchId.hasError('required')).toBe(true);
    form.controls.batchId.setValue('b1');
    expect(toAdjustmentCommand(form, 5)).toMatchObject({ batchId: 'b1', countedQuantity: 6 });
  });
});
