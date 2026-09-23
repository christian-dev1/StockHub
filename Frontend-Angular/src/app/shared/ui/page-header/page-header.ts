import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Page title block with optional subtitle and projected actions. */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        <h1 class="text-h1 text-balance break-words text-fg">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="mt-1 text-sm text-fg-muted">{{ subtitle() }}</p>
        }
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <ng-content select="[actions]" />
      </div>
    </header>
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
