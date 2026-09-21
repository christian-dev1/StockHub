import { ExclamationTriangleIcon, LockClosedIcon, MapIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';

export type ErrorStatusCode = 403 | 404 | 500;

const ICONS = { 403: LockClosedIcon, 404: MapIcon, 500: ExclamationTriangleIcon } as const;

interface ErrorStatusProps {
  readonly status: ErrorStatusCode;
  readonly title: string;
  readonly description: string;
  readonly action: ReactNode;
}

/** Full-page 403 / 404 / 500 presentation; texts are provided already translated. */
export function ErrorStatus({ status, title, description, action }: ErrorStatusProps) {
  const Icon = ICONS[status];
  return (
    <main className="bg-bg flex min-h-dvh items-center justify-center px-4">
      <section aria-labelledby="error-title" className="sh-card w-full max-w-lg p-8 text-center">
        <span className="bg-surface-muted text-primary mx-auto mb-5 flex size-14 items-center justify-center rounded-full">
          <Icon className="size-7" aria-hidden="true" />
        </span>
        <p className="text-primary text-sm font-semibold">{status}</p>
        <h1 id="error-title" className="text-fg mt-2 text-2xl font-semibold">
          {title}
        </h1>
        <p className="text-fg-muted mt-2">{description}</p>
        <div className="mt-6 flex justify-center">{action}</div>
      </section>
    </main>
  );
}
