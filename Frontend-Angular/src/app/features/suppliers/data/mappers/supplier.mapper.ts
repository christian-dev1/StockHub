import { Supplier } from '../../domain/entities/supplier';
import { SupplierModel } from '../models/supplier.model';

export function toSupplier(model: SupplierModel): Supplier {
  return {
    id: model.id,
    code: model.code,
    name: model.name,
    contactName: model.contactName ?? null,
    email: model.email ?? null,
    phone: model.phone ?? null,
    addressLine: model.addressLine ?? null,
    city: model.city ?? null,
    country: model.country ?? null,
    taxId: model.taxId ?? null,
    leadTimeDays: model.leadTimeDays ?? null,
    notes: model.notes ?? null,
    active: model.active,
    version: model.version,
  };
}
