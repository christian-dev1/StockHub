import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { Subject, catchError, of, switchMap } from 'rxjs';
import { StockProduct } from '../../domain/entities/stock';
import { StockReferencesUseCase } from '../../domain/use-cases/stock.use-cases';
import { StockLookups } from '../state/stock-lookups';

/**
 * Searches active products by name, SKU or barcode (a scanner typing a code
 * works too) and yields the chosen product. Usable with reactive forms and
 * ngModel; the value is the whole product so that forms know its unit and
 * tracking without another request.
 */
@Component({
  selector: 'app-product-picker',
  imports: [FormsModule, TranslatePipe, AutoCompleteModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ProductPicker), multi: true },
  ],
  host: { class: 'block min-w-0' },
  template: `
    <p-autocomplete
      [inputId]="inputId()"
      [ariaLabelledBy]="labelledBy() ?? undefined"
      [ariaLabel]="ariaLabel() ?? undefined"
      [ngModel]="value()"
      (ngModelChange)="onModelChange($event)"
      [suggestions]="suggestions()"
      (completeMethod)="search($event.query)"
      (onSelect)="choose($event.value)"
      (onClear)="choose(null)"
      (onBlur)="touched()"
      optionLabel="name"
      dataKey="id"
      [forceSelection]="true"
      [dropdown]="true"
      [showClear]="true"
      [delay]="250"
      [minLength]="0"
      [placeholder]="placeholder() ?? ('stock.fields.productSearch' | translate)"
      [emptyMessage]="'stock.picker.empty' | translate"
      [dropdownAriaLabel]="'stock.picker.showAll' | translate"
      [disabled]="disabled()"
      [attr.aria-describedby]="describedBy()"
      appendTo="body"
      styleClass="w-full"
      inputStyleClass="w-full"
    >
      <ng-template #item let-product>
        <div class="flex min-w-0 flex-col">
          <span class="truncate font-medium">{{ product.name }}</span>
          <span class="font-mono text-xs text-fg-muted">
            {{ product.sku }}
            @if (product.batchTracked) {
              · {{ 'stock.picker.batchTracked' | translate }}
            }
          </span>
        </div>
      </ng-template>
    </p-autocomplete>
  `,
})
export class ProductPicker implements ControlValueAccessor {
  readonly inputId = input.required<string>();
  readonly labelledBy = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly describedBy = input<string | null>(null);
  readonly placeholder = input<string | null>(null);

  private readonly references = inject(StockReferencesUseCase);
  private readonly lookups = inject(StockLookups);

  protected readonly value = signal<StockProduct | null>(null);
  protected readonly suggestions = signal<StockProduct[]>([]);
  protected readonly disabled = signal(false);
  private readonly queries = new Subject<string>();
  private onChange: (value: StockProduct | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    this.queries
      .pipe(
        switchMap((term) =>
          this.references.searchProducts(term).pipe(catchError(() => of<StockProduct[]>([]))),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((products) => this.suggestions.set(products));
  }

  writeValue(value: StockProduct | null): void {
    this.value.set(value ?? null);
  }
  registerOnChange(fn: (value: StockProduct | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  protected search(term: string): void {
    this.queries.next(term);
  }

  /** Typing alone never selects: only a picked suggestion (or clearing) changes the value. */
  protected onModelChange(value: StockProduct | string | null): void {
    if (value === null || value === '') this.choose(null);
  }

  protected choose(product: StockProduct | null): void {
    if (product?.id === this.value()?.id) return;
    if (product) this.lookups.remember(product);
    this.value.set(product);
    this.onChange(product);
  }

  protected touched(): void {
    this.onTouched();
  }
}
