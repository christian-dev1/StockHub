import { cn } from '../utils/cn';

export function Skeleton({ className }: { readonly className?: string }) {
  return <div aria-hidden="true" className={cn('bg-surface-muted animate-pulse rounded-md', className)} />;
}
