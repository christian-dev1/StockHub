import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NonNullableFormBuilder } from '@angular/forms';
import { linkTracking, productForm, toProductDraft } from './product-form';

describe('product form', () => {
  const build = () => {
    const fb = TestBed.inject(NonNullableFormBuilder);
    return productForm(fb);
  };

  it('requires a name and refuses negative prices', () => {
    const form = build();
    expect(form.controls.name.hasError('required')).toBe(true);
    form.controls.salePrice.setValue(-1);
    expect(form.controls.salePrice.hasError('min')).toBe(true);
  });

  it('refuses expiry tracking without batch tracking', () => {
    const form = build();
    form.patchValue({ name: 'A', expiryTracked: true, batchTracked: false });
    expect(form.hasError('expiryRequiresBatch')).toBe(true);
    form.controls.batchTracked.setValue(true);
    expect(form.hasError('expiryRequiresBatch')).toBe(false);
  });

  it('keeps the tracking switches consistent while editing', () => {
    const form = build();
    linkTracking(form, TestBed.inject(DestroyRef));
    form.controls.expiryTracked.setValue(true);
    expect(form.controls.batchTracked.value).toBe(true);
    form.controls.batchTracked.setValue(false);
    expect(form.controls.expiryTracked.value).toBe(false);
  });

  it('asks for whole quantities with discrete units only', () => {
    const form = build();
    form.patchValue({ name: 'A', unit: 'UNIT', minStock: 1.5 });
    expect(form.hasError('wholeQuantity')).toBe(true);
    form.controls.unit.setValue('KG');
    expect(form.hasError('wholeQuantity')).toBe(false);
  });

  it('leaves the active switch out of the product body', () => {
    const form = build();
    form.patchValue({ name: 'A', active: false });
    expect(toProductDraft(form)).not.toHaveProperty('active');
  });
});
