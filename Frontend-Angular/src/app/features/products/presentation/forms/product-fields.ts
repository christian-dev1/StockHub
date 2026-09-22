import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { startWith, switchMap } from 'rxjs';
import { LanguageStore } from '../../../../core/i18n/language-store';
import { FormField } from '../../../../shared/ui/form-field/form-field';
import { BARCODE_FORMATS, UNITS, isDiscrete } from '../../domain/entities/product';
import { ProductForm } from './product-form';

interface Option<T> {
  readonly value: T;
  readonly label: string;
}

/** Product inputs grouped by topic; shared by the create and detail pages. */
@Component({
  selector: 'app-product-fields',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    ToggleSwitchModule,
    FormField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-fields.html',
})
export class ProductFields {
  readonly form = input.required<ProductForm>();
  readonly categories = input.required<Option<string>[]>();
  readonly suppliers = input.required<Option<string>[]>();
  readonly currency = input('XAF');
  readonly creating = input(false);
  readonly readonly = input(false);

  private readonly translate = inject(TranslateService);
  protected readonly language = inject(LanguageStore);

  protected readonly unitOptions = computed(() => {
    this.language.language();
    return UNITS.map((value) => ({
      value,
      label: this.translate.instant(`products.units.${value}`) as string,
    }));
  });
  protected readonly formatOptions = computed(() => {
    this.language.language();
    return BARCODE_FORMATS.map((value) => ({
      value,
      label: this.translate.instant(`products.barcodeFormats.${value}`) as string,
    }));
  });

  /** Current form values as a signal (the form instance never changes for a page). */
  private readonly values = toSignal(
    toObservable(this.form).pipe(
      switchMap((form) => form.valueChanges.pipe(startWith(form.getRawValue()))),
    ),
  );

  /** Whole numbers for discrete units, three decimals for bulk goods. */
  protected readonly quantityDecimals = computed(() => {
    const unit = this.values()?.unit;
    return unit && isDiscrete(unit) ? 0 : 3;
  });
  protected readonly sellsAtLoss = computed(() => {
    const v = this.values();
    return (v?.salePrice ?? 0) < (v?.purchasePrice ?? 0);
  });
}
