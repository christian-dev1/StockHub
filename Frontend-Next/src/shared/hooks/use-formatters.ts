import { useFormatter } from 'next-intl';
import { useSession } from '@/core/auth/use-session';

/**
 * Amounts in the company currency (never chosen by the user) and quantities,
 * formatted for the current language.
 */
export function useFormatters() {
  const format = useFormatter();
  const { session } = useSession();
  const companyCurrency = session?.company?.currency ?? 'XAF';
  return {
    currency: companyCurrency,
    money: (amount: number, currency: string = companyCurrency) =>
      format.number(amount, { style: 'currency', currency }),
    quantity: (value: number) => format.number(value, { maximumFractionDigits: 3 }),
    dateTime: (value: Date) => format.dateTime(value, { dateStyle: 'medium', timeStyle: 'short' }),
  };
}
