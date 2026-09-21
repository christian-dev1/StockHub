import { Company, CompanyProfile } from '../../domain/entities/company';
import { CompanyModel } from '../models/company.model';

export function toCompany(model: CompanyModel): Company {
  return {
    id: model.id,
    name: model.name,
    legalName: model.legalName ?? null,
    email: model.email ?? null,
    phone: model.phone ?? null,
    addressLine: model.addressLine ?? null,
    city: model.city ?? null,
    country: model.country ?? null,
    currency: model.currency,
    timezone: model.timezone,
    locale: model.locale === 'en' ? 'en' : 'fr',
    status: model.status,
    settings: { ...model.settings },
    version: model.version,
  };
}

/** Empty strings become null so the backend stores "no value" rather than "". */
export function toProfilePayload(profile: CompanyProfile): Record<string, string | null> {
  const clean = (value: string | null) => (value && value.trim() ? value.trim() : null);
  return {
    name: profile.name.trim(),
    legalName: clean(profile.legalName),
    email: clean(profile.email),
    phone: clean(profile.phone),
    addressLine: clean(profile.addressLine),
    city: clean(profile.city),
    country: clean(profile.country)?.toUpperCase() ?? null,
  };
}
