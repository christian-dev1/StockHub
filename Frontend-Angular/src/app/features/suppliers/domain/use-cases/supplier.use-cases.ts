import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Page, PageRequest } from '../../../../shared/utils/page';
import { Supplier, SupplierDraft, SupplierFilters } from '../entities/supplier';
import { SuppliersRepository } from '../repositories/suppliers.repository';

@Injectable()
export class SearchSuppliersUseCase {
  private readonly repository = inject(SuppliersRepository);
  execute(request: PageRequest, filters: SupplierFilters): Observable<Page<Supplier>> {
    return this.repository.search(request, { ...filters, text: filters.text.trim() });
  }
}

@Injectable()
export class GetSupplierUseCase {
  private readonly repository = inject(SuppliersRepository);
  execute(id: string): Observable<Supplier> {
    return this.repository.get(id);
  }
}

@Injectable()
export class SaveSupplierUseCase {
  private readonly repository = inject(SuppliersRepository);
  create(draft: SupplierDraft): Observable<Supplier> {
    return this.repository.create(normalizeSupplier(draft));
  }
  update(id: string, draft: SupplierDraft, version: number): Observable<Supplier> {
    return this.repository.update(id, normalizeSupplier(draft), version);
  }
}

@Injectable()
export class ChangeSupplierStatusUseCase {
  private readonly repository = inject(SuppliersRepository);
  activate(id: string): Observable<Supplier> {
    return this.repository.activate(id);
  }
  deactivate(id: string): Observable<Supplier> {
    return this.repository.deactivate(id);
  }
}

/** Trims text, sends blanks as null, upper-cases code and country, lower-cases the email. */
export function normalizeSupplier(draft: SupplierDraft): SupplierDraft {
  const optional = (value: string | null) => value?.trim() || null;
  return {
    code: draft.code.trim().toUpperCase(),
    name: draft.name.trim(),
    contactName: optional(draft.contactName),
    email: optional(draft.email)?.toLowerCase() ?? null,
    phone: optional(draft.phone),
    addressLine: optional(draft.addressLine),
    city: optional(draft.city),
    country: optional(draft.country)?.toUpperCase() ?? null,
    taxId: optional(draft.taxId),
    leadTimeDays: draft.leadTimeDays ?? null,
    notes: optional(draft.notes),
  };
}
