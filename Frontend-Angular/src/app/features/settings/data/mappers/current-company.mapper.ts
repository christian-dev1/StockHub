import { CurrentCompany } from '../../domain/entities/company-settings';
import { CurrentCompanyModel } from '../models/current-company.model';

export function toCurrentCompany(m: CurrentCompanyModel): CurrentCompany {
  return {
    id: m.id,
    name: m.name,
    legalName: m.legalName ?? null,
    email: m.email ?? null,
    phone: m.phone ?? null,
    addressLine: m.addressLine ?? null,
    city: m.city ?? null,
    country: m.country ?? null,
    currency: m.currency,
    timezone: m.timezone,
    locale: m.locale === 'en' ? 'en' : 'fr',
    allowNegativeStock: m.settings.allowNegativeStock,
    expiryWarningDays: m.settings.expiryWarningDays,
    defaultLeadTimeDays: m.settings.defaultLeadTimeDays,
    version: m.version,
  };
}
