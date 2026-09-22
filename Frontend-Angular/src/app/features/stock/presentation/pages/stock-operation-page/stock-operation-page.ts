import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TextareaModule } from 'primeng/textarea';
import { merge, startWith } from 'rxjs';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { LanguageStore } from '../../../../../core/i18n/language-store';
import { CalendarDatePipe } from '../../../../../shared/pipes/calendar-date.pipe';
import { QuantityPipe } from '../../../../../shared/pipes/quantity.pipe';
import { Confirmation } from '../../../../../shared/ui/confirm/confirmation';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { Notifier } from '../../../../../shared/ui/notifier';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { ErrorMessages } from '../../../../../shared/utils/error-message';
import {
  StockDocument,
  StockOperation,
  StockProduct,
  adjustedQuantity,
  isWholeUnit,
  locationBalances,
} from '../../../domain/entities/stock';
import {
  StockOperationsUseCase,
  StockReferencesUseCase,
} from '../../../domain/use-cases/stock.use-cases';
import { DocumentLines } from '../../components/document-lines';
import { OperationLinks } from '../../components/operation-links';
import { ProductPicker } from '../../components/product-picker';
import {
  applyProductRules,
  stockOperationForm,
  toAdjustmentCommand,
  toEntryCommand,
  toExitCommand,
  toTransferCommand,
} from '../../forms/stock-operation-form';
import { StockContext } from '../../state/stock-context';
import { StockOperationStore } from '../../state/stock-operation.store';

/**
 * One screen per operation (entry, exit, adjustment, transfer), chosen by the
 * route. Links from the stock list prefill the product and location
 * (`?productId=…&locationId=…`).
 */
@Component({
  selector: 'app-stock-operation-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    SkeletonModule,
    TextareaModule,
    QuantityPipe,
    CalendarDatePipe,
    PageHeader,
    FormField,
    ProductPicker,
    DocumentLines,
    OperationLinks,
  ],
  providers: [StockOperationStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stock-operation-page.html',
})
export class StockOperationPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly operations = inject(StockOperationsUseCase);
  private readonly references = inject(StockReferencesUseCase);
  private readonly notifier = inject(Notifier);
  private readonly confirmation = inject(Confirmation);
  private readonly errors = inject(ErrorMessages);
  private readonly translate = inject(TranslateService);
  protected readonly language = inject(LanguageStore);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly context = inject(StockContext);
  protected readonly store = inject(StockOperationStore);

  protected readonly routes = APP_ROUTES;
  protected readonly operation = (this.route.snapshot.data['operation'] ??
    'entry') as StockOperation;
  protected readonly form = stockOperationForm(inject(NonNullableFormBuilder), this.operation);
  private readonly values = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  protected readonly product = computed(() => this.values().product ?? null);
  protected readonly unitLabel = computed(() => {
    this.language.language();
    const unit = this.product()?.unit;
    return unit ? (this.translate.instant(`products.units.${unit}`) as string) : '';
  });
  protected readonly fractionDigits = computed(() => {
    const unit = this.product()?.unit;
    return !unit || isWholeUnit(unit) ? 0 : 3;
  });
  protected readonly tracked = computed(() => !!this.product()?.batchTracked);
  /** FEFO is explained where the backend picks the batches itself. */
  protected readonly showFefo = computed(
    () => this.tracked() && (this.operation === 'exit' || this.operation === 'transfer'),
  );
  protected readonly selectedBatch = computed(() => {
    const id = this.values().batchId;
    return this.store.batches().find((batch) => batch.id === id) ?? null;
  });
  /** Quantity the operation starts from: the batch for a tracked adjustment, else the level. */
  protected readonly current = computed(() =>
    this.operation === 'adjustment' && this.tracked()
      ? (this.selectedBatch()?.quantity ?? null)
      : this.store.available(),
  );
  protected readonly adjustment = computed(() => {
    const current = this.current();
    const change = this.values().quantity;
    if (current === null || change === null || change === undefined || change <= 0) return null;
    const direction = this.values().direction ?? 'INCREASE';
    return {
      current,
      change: direction === 'INCREASE' ? change : -change,
      after: adjustedQuantity(current, change, direction),
    };
  });
  /** Warns (without blocking: the backend decides) when more is asked than available. */
  protected readonly exceedsStock = computed(() => {
    if (this.operation !== 'exit' && this.operation !== 'transfer') return false;
    const available = this.store.available();
    const quantity = this.values().quantity;
    if (available === null || quantity === null || quantity === undefined) return false;
    const negativeAllowed = this.context.allowNegativeStock() && !this.tracked();
    return quantity > available && !negativeAllowed;
  });
  protected readonly destinationOptions = computed(() =>
    this.context.locationOptions().filter((option) => option.value !== this.values().locationId),
  );
  protected readonly directionOptions = computed(() => {
    this.language.language();
    return [
      { value: 'INCREASE', label: this.translate.instant('stock.adjustment.increase') as string },
      { value: 'DECREASE', label: this.translate.instant('stock.adjustment.decrease') as string },
    ];
  });
  protected readonly batchOptions = computed(() =>
    this.store.batches().map((batch) => ({ value: batch.id, batch })),
  );
  protected readonly errorMessage = computed(() => {
    this.language.language();
    const error = this.store.error();
    return error ? this.errors.of(error) : null;
  });
  protected readonly balances = computed(() => {
    const result = this.store.result();
    return result ? locationBalances(result.lines) : [];
  });
  protected readonly titleKey = `stock.operations.${this.operation}Title`;
  protected readonly subtitleKey = `stock.operations.${this.operation}Subtitle`;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const allowed = new Set(this.context.locations().map((l) => l.id));
    const requested = params.get('locationId');
    const source =
      requested && allowed.has(requested) ? requested : this.context.defaultLocationId();
    this.form.controls.locationId.setValue(source);
    if (this.operation === 'transfer') {
      this.form.controls.destinationLocationId.setValue(
        this.destinationOptions()[0]?.value ?? null,
      );
    }
    const productId = params.get('productId');
    if (productId) {
      this.references.product(productId).subscribe({
        next: (product) => this.form.controls.product.setValue(product),
        error: () => undefined,
      });
    }
    this.watchSelection();
  }

  protected locationName(id: string | null): string {
    return this.context.locations().find((l) => l.id === id)?.name ?? '—';
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.operation === 'adjustment') {
      void this.confirmAdjustment();
      return;
    }
    this.run();
  }

  /** Next operation: keeps the location(s), clears the rest. */
  protected another(): void {
    const { locationId, destinationLocationId } = this.form.getRawValue();
    this.form.reset({ locationId, destinationLocationId, direction: 'INCREASE' });
    this.store.reset();
  }

  private async confirmAdjustment(): Promise<void> {
    const preview = this.adjustment();
    if (!preview) return;
    const format = new Intl.NumberFormat(this.language.locale(), {
      maximumFractionDigits: 3,
      signDisplay: 'exceptZero',
    });
    const plain = new Intl.NumberFormat(this.language.locale(), { maximumFractionDigits: 3 });
    const confirmed = await this.confirmation.ask({
      titleKey: 'stock.adjustment.confirmTitle',
      messageKey: 'stock.adjustment.confirmMessage',
      params: {
        product: this.product()?.name ?? '',
        current: plain.format(preview.current),
        change: format.format(preview.change),
        after: plain.format(preview.after),
      },
      acceptKey: 'stock.adjustment.confirm',
    });
    if (confirmed) this.run();
  }

  private run(): void {
    const operation = this.operation;
    const request =
      operation === 'entry'
        ? this.operations.enter(toEntryCommand(this.form))
        : operation === 'exit'
          ? this.operations.exit(toExitCommand(this.form))
          : operation === 'transfer'
            ? this.operations.transfer(toTransferCommand(this.form))
            : this.operations.adjust(toAdjustmentCommand(this.form, this.current() ?? 0));
    this.store.submit(
      request,
      (document) => this.done(document),
      // The stock may have changed meanwhile: show the fresh quantity next to the error.
      () => this.refreshPlace(),
    );
  }

  private done(document: StockDocument): void {
    this.notifier.success(`stock.done.${this.operation}`, { number: document.number });
    this.refreshPlace();
  }

  /** Keeps the available quantity, destination and batches in sync with the form. */
  private watchSelection(): void {
    const { product, locationId, destinationLocationId, batchId } = this.form.controls;
    product.valueChanges
      .pipe(startWith(product.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => applyProductRules(this.form, this.operation, value));
    merge(product.valueChanges, locationId.valueChanges, destinationLocationId.valueChanges)
      .pipe(startWith(null), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.store.clearError();
        this.refreshPlace();
      });
    locationId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((source) => {
      // Choosing the current destination as source swaps to another destination.
      if (this.operation === 'transfer' && source && source === destinationLocationId.value) {
        const other = this.context.locations().find((location) => location.id !== source);
        destinationLocationId.setValue(other?.id ?? null);
      }
    });
    batchId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.store.clearError());
  }

  private refreshPlace(): void {
    const { product, locationId, destinationLocationId } = this.form.getRawValue();
    const productId = (product as StockProduct | null)?.id ?? null;
    this.store.refreshAvailability(productId, locationId);
    if (this.operation === 'transfer') {
      this.store.refreshDestination(productId, destinationLocationId);
    }
    if (this.operation === 'adjustment' && product?.batchTracked) {
      this.store.refreshBatches(productId, locationId);
    }
  }
}
