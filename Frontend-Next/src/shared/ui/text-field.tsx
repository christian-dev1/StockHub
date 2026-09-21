import { Description, Field, Input, Label } from '@headlessui/react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'children'> {
  readonly label: string;
  readonly hint?: string;
  readonly error?: string | null;
  readonly trailing?: ReactNode;
}

/** Labelled input; Headless UI wires label, description and aria-invalid for us. */
export function TextField({ label, hint, error, trailing, required, ...props }: TextFieldProps) {
  return (
    <Field className="flex flex-col gap-1.5">
      <Label className="text-fg text-sm font-medium">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </Label>
      <div className="relative">
        <Input
          {...props}
          required={required}
          invalid={Boolean(error)}
          className={cn(
            'border-border bg-surface text-fg placeholder:text-fg-muted data-focus:border-primary data-focus:outline-focus min-h-11 w-full rounded-lg border px-3 text-base data-focus:outline-2 sm:text-sm',
            error && 'border-danger',
            trailing ? 'pr-11' : undefined,
          )}
        />
        {trailing && <div className="absolute inset-y-0 right-0 flex items-center">{trailing}</div>}
      </div>
      {error ? (
        <Description className="text-danger text-xs" role="alert">
          {error}
        </Description>
      ) : (
        hint && <Description className="text-fg-muted text-xs">{hint}</Description>
      )}
    </Field>
  );
}
