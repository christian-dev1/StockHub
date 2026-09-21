import { ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/20/solid';
import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

const TONES = {
  danger: {
    classes: 'border-danger/30 bg-danger/10 text-danger',
    icon: ExclamationCircleIcon,
    role: 'alert',
  },
  info: { classes: 'border-info/30 bg-info/10 text-info', icon: InformationCircleIcon, role: 'status' },
} as const;

export function Alert({
  tone,
  children,
}: {
  readonly tone: keyof typeof TONES;
  readonly children: ReactNode;
}) {
  const { classes, icon: Icon, role } = TONES[tone];
  return (
    <div role={role} className={cn('flex items-start gap-2 rounded-lg border p-3 text-sm', classes)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
