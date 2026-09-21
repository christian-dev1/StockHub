import { Button as HeadlessButton } from '@headlessui/react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-primary-fg data-hover:bg-primary-hover',
  secondary: 'border border-border bg-surface text-fg data-hover:bg-surface-muted',
  ghost: 'text-fg-muted data-hover:bg-surface-muted data-hover:text-fg',
  danger: 'bg-danger text-white data-hover:opacity-90',
};

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  readonly className?: string;
  readonly children?: ReactNode;
  readonly variant?: Variant;
  readonly loading?: boolean;
  readonly block?: boolean;
}

/** Touch-friendly button (44px min height) with a busy state announced to assistive tech. */
export function Button({
  variant = 'primary',
  loading = false,
  block = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <HeadlessButton
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'data-focus:outline-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors data-disabled:cursor-not-allowed data-disabled:opacity-60 data-focus:outline-2 data-focus:outline-offset-2',
        VARIANTS[variant],
        block && 'w-full',
        className,
      )}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </HeadlessButton>
  );
}
