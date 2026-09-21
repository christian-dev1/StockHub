import { InboxIcon } from '@heroicons/react/24/outline';
import type { ComponentType, ReactNode, SVGProps } from 'react';

interface EmptyStateProps {
  readonly title: string;
  readonly description?: string;
  readonly icon?: ComponentType<SVGProps<SVGSVGElement>>;
  readonly children?: ReactNode;
}

export function EmptyState({ title, description, icon: Icon = InboxIcon, children }: EmptyStateProps) {
  return (
    <div role="status" className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="bg-surface-muted text-fg-muted mb-4 flex size-12 items-center justify-center rounded-full">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-fg text-base font-semibold">{title}</h2>
      {description && <p className="text-fg-muted mt-1 max-w-md text-sm">{description}</p>}
      {children && <div className="mt-5 flex gap-2">{children}</div>}
    </div>
  );
}
