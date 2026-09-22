import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

export interface PageChange {
  readonly page: number;
  readonly size: number;
}

@Component({
  selector: 'app-pagination',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      class="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
      [attr.aria-label]="'table.pagination' | translate"
    >
      <p class="text-fg-muted" aria-live="polite">
        @if (total() > 0) {
          {{ 'table.range' | translate: { from: from(), to: to(), total: total() } }}
        } @else {
          {{ 'table.noResults' | translate }}
        }
      </p>
      <div class="flex items-center gap-2">
        <label class="flex items-center gap-2 text-fg-muted">
          <span>{{ 'table.perPage' | translate }}</span>
          <select
            class="rounded-md border border-border bg-surface px-2 py-1 text-fg"
            [value]="size()"
            (change)="changeSize($any($event.target).value)"
          >
            @for (option of sizes(); track option) {
              <option [value]="option" [selected]="option === size()">{{ option }}</option>
            }
          </select>
        </label>
        <button
          type="button"
          class="flex size-9 items-center justify-center rounded-md border border-border text-fg hover:bg-surface-muted disabled:opacity-40"
          [disabled]="page() === 0"
          [attr.aria-label]="'table.previous' | translate"
          (click)="go(page() - 1)"
        >
          <i class="pi pi-chevron-left" aria-hidden="true"></i>
        </button>
        <span class="min-w-16 text-center text-fg-muted">{{ page() + 1 }} / {{ pages() }}</span>
        <button
          type="button"
          class="flex size-9 items-center justify-center rounded-md border border-border text-fg hover:bg-surface-muted disabled:opacity-40"
          [disabled]="page() + 1 >= pages()"
          [attr.aria-label]="'table.next' | translate"
          (click)="go(page() + 1)"
        >
          <i class="pi pi-chevron-right" aria-hidden="true"></i>
        </button>
      </div>
    </nav>
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly size = input.required<number>();
  readonly total = input.required<number>();
  readonly sizes = input<readonly number[]>([10, 20, 50, 100]);
  readonly pageChange = output<PageChange>();

  protected readonly pages = computed(() => Math.max(1, Math.ceil(this.total() / this.size())));
  protected readonly from = computed(() =>
    this.total() === 0 ? 0 : this.page() * this.size() + 1,
  );
  protected readonly to = computed(() => Math.min(this.total(), (this.page() + 1) * this.size()));

  protected go(page: number): void {
    this.pageChange.emit({ page, size: this.size() });
  }

  protected changeSize(value: string): void {
    this.pageChange.emit({ page: 0, size: Number(value) });
  }
}
