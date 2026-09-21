import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center px-6 py-12 text-center" role="status">
      <span
        class="mb-4 flex size-12 items-center justify-center rounded-full bg-surface-muted text-fg-muted"
      >
        <i [class]="'pi ' + icon() + ' text-xl'" aria-hidden="true"></i>
      </span>
      <h2 class="text-base font-semibold text-fg">{{ title() }}</h2>
      @if (description()) {
        <p class="mt-1 max-w-md text-sm text-fg-muted">{{ description() }}</p>
      }
      <div class="mt-5 flex gap-2"><ng-content /></div>
    </div>
  `,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly icon = input('pi-inbox');
}
