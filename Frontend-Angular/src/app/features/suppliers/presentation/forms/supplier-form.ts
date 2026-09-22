import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Supplier, SupplierDraft } from '../../domain/entities/supplier';

/** Mirrors SupplierRequest; the code is optional on creation (generated). */
export function supplierForm(fb: NonNullableFormBuilder, supplier?: Supplier | null) {
  const codeValidators = [
    Validators.maxLength(30),
    Validators.pattern(/^[A-Za-z0-9][A-Za-z0-9_-]*$/),
  ];
  return fb.group({
    code: [
      supplier?.code ?? '',
      supplier ? [Validators.required, ...codeValidators] : codeValidators,
    ],
    name: [supplier?.name ?? '', [Validators.required, Validators.maxLength(150)]],
    contactName: [supplier?.contactName ?? '', Validators.maxLength(150)],
    email: [supplier?.email ?? '', [Validators.email, Validators.maxLength(254)]],
    phone: [supplier?.phone ?? '', Validators.maxLength(40)],
    addressLine: [supplier?.addressLine ?? '', Validators.maxLength(255)],
    city: [supplier?.city ?? '', Validators.maxLength(100)],
    country: [supplier?.country ?? '', Validators.pattern(/^[A-Za-z]{2}$/)],
    taxId: [supplier?.taxId ?? '', Validators.maxLength(50)],
    leadTimeDays: fb.control<number | null>(supplier?.leadTimeDays ?? null, [
      Validators.min(0),
      Validators.max(365),
    ]),
    notes: [supplier?.notes ?? '', Validators.maxLength(1000)],
  });
}

export type SupplierForm = ReturnType<typeof supplierForm>;

export function toSupplierDraft(form: SupplierForm): SupplierDraft {
  return form.getRawValue();
}
