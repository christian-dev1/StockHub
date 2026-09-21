export interface Option {
  readonly value: string;
  readonly label: string;
}

const FALLBACK_CURRENCIES = ['XAF', 'XOF', 'EUR', 'USD', 'GBP', 'NGN', 'MAD', 'CAD', 'CHF'];
const FALLBACK_ZONES = ['Africa/Douala', 'Africa/Lagos', 'Africa/Abidjan', 'Europe/Paris', 'UTC'];

type IntlWithValues = typeof Intl & { supportedValuesOf?: (key: string) => string[] };

/** ISO 4217 currencies known to the browser, labelled "XAF — Franc CFA (BEAC)". */
export function currencyOptions(locale = 'fr'): Option[] {
  const codes = (Intl as IntlWithValues).supportedValuesOf?.('currency') ?? FALLBACK_CURRENCIES;
  const names = new Intl.DisplayNames([locale], { type: 'currency' });
  return codes.map((code) => ({ value: code, label: `${code} — ${names.of(code) ?? code}` }));
}

/** IANA time zones known to the browser. */
export function timeZoneOptions(): string[] {
  return (Intl as IntlWithValues).supportedValuesOf?.('timeZone') ?? FALLBACK_ZONES;
}
