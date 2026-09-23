import { Field, Label, Select } from '@headlessui/react';
import type { ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  readonly label: string;
  readonly hint?: string;
  readonly children: ReactNode;
  readonly className?: string;
}

/** Labelled native select: reliable on phones and with screen readers. */
export function SelectField({ label, hint, children, className, ...props }: SelectFieldProps) {
  return (
    <Field className={cn('flex flex-col gap-1.5', className)}>
      <Label className="text-fg text-sm font-medium">{label}</Label>
      <Select
        {...props}
        className="border-border bg-surface text-fg data-focus:border-primary data-focus:outline-focus min-h-11 w-full rounded-lg border px-3 text-base data-focus:outline-2 sm:text-sm"
      >
        {children}
      </Select>
      {hint && <p className="text-fg-muted text-xs">{hint}</p>}
    </Field>
  );
}
