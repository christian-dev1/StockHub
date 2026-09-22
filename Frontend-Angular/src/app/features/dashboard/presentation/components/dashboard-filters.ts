import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { LanguageStore } from '../../../../core/i18n/language-store';
import {
  DashboardFilters,
  LocationRef,
  PERIOD_CODES,
  PeriodCode,
} from '../../domain/entities/dashboard';

/**
 * Period (segmented control, with a custom range) and, for multi-site users,
 * the location. One change refreshes every time-dependent widget.
 */
@Component({
  selector: 'app-dashboard-filters',
  imports: [FormsModule, TranslatePipe, InputTextModule, SelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
      <div
        role="radiogroup"
        [attr.aria-label]="'dashboard.filters.period' | translate"
        class="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface p-1 sm:flex"
      >
        @for (code of periods(); track code) {
          <button
            type="button"
            role="radio"
            [attr.aria-checked]="filters().period === code"
            class="min-h-10 rounded-lg px-3 text-sm font-medium whitespace-nowrap"
            [class]="
              filters().period === code
                ? 'bg-primary text-primary-fg'
                : 'text-fg hover:bg-surface-muted'
            "
            (click)="filtersChange.emit({ period: code })"
          >
            {{ 'dashboard.periods.' + code | translate }}
          </button>
        }
      </div>
      @if (filters().period === 'CUSTOM') {
        <div class="grid grid-cols-2 gap-2">
          <label class="flex min-w-0 flex-col gap-1 text-xs text-fg-muted">
            {{ 'dashboard.filters.from' | translate }}
            <input
              pInputText
              type="date"
              class="w-full"
              [max]="filters().to ?? today()"
              [ngModel]="filters().from ?? ''"
              (ngModelChange)="filtersChange.emit({ from: $event || null })"
            />
          </label>
          <label class="flex min-w-0 flex-col gap-1 text-xs text-fg-muted">
            {{ 'dashboard.filters.to' | translate }}
            <input
              pInputText
              type="date"
              class="w-full"
              [min]="filters().from ?? ''"
              [max]="today()"
              [ngModel]="filters().to ?? ''"
              (ngModelChange)="filtersChange.emit({ to: $event || null })"
            />
          </label>
        </div>
      }
      @if (locations().length > 1) {
        <p-select
          class="min-w-0 lg:ml-auto lg:w-64"
          [options]="locationOptions()"
          optionLabel="label"
          optionValue="value"
          [ngModel]="filters().locationId ?? ''"
          (ngModelChange)="filtersChange.emit({ locationId: $event || null })"
          [ariaLabel]="'dashboard.filters.location' | translate"
          styleClass="w-full"
        />
      }
    </div>
  `,
})
export class DashboardFiltersBar {
  readonly filters = input.required<DashboardFilters>();
  readonly locations = input<readonly LocationRef[]>([]);
  /** Presets offered (the platform view has no custom range). */
  readonly periods = input<readonly PeriodCode[]>(PERIOD_CODES);
  /** Today in the company time zone, upper bound of the custom range. */
  readonly today = input.required<string>();
  readonly filtersChange = output<Partial<DashboardFilters>>();

  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageStore);

  protected readonly locationOptions = computed(() => {
    this.language.language();
    return [
      { value: '', label: this.translate.instant('dashboard.filters.allLocations') as string },
      ...this.locations().map((l) => ({ value: l.id, label: l.name })),
    ];
  });
}
