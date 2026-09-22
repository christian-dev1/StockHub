import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { LanguageStore } from '../../../../../core/i18n/language-store';
import { MoneyPipe } from '../../../../../shared/pipes/money.pipe';
import { EmptyState } from '../../../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { SearchField } from '../../../../../shared/ui/search-field/search-field';
import { ErrorMessages } from '../../../../../shared/utils/error-message';
import { printBlob, saveBlob } from '../../../../../shared/utils/files';
import {
  LABEL_LAYOUTS,
  LabelLayout,
  MAX_COPIES,
  MAX_LABELS,
  labelsPerPage,
} from '../../../domain/entities/barcode';
import { LabelsStore } from '../../state/labels.store';

@Component({
  selector: 'app-labels-page',
  imports: [
    FormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    CheckboxModule,
    InputNumberModule,
    SelectModule,
    MoneyPipe,
    EmptyState,
    PageHeader,
    SearchField,
  ],
  providers: [LabelsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './labels-page.html',
})
export class LabelsPage implements OnInit {
  /** Comma-separated product ids to preselect (from a product page). */
  readonly products = input<string>();

  protected readonly store = inject(LabelsStore);
  private readonly errors = inject(ErrorMessages);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageStore);

  protected readonly routes = APP_ROUTES;
  protected readonly maxCopies = MAX_COPIES;
  protected readonly maxLabels = MAX_LABELS;
  protected readonly layoutOptions = computed(() => {
    this.language.language();
    return (Object.keys(LABEL_LAYOUTS) as LabelLayout[]).map((value) => ({
      value,
      label: this.translate.instant('labels.layouts.option', {
        columns: LABEL_LAYOUTS[value].columns,
        rows: LABEL_LAYOUTS[value].rows,
        count: labelsPerPage(value),
      }) as string,
    }));
  });
  protected readonly errorText = computed(() => {
    const error = this.store.error();
    return error ? this.errors.of(error) : null;
  });

  ngOnInit(): void {
    this.store.search('');
    const ids = (this.products() ?? '').split(',').filter(Boolean);
    if (ids.length) this.store.preselect(ids);
  }

  protected download(): void {
    this.store.generate()?.subscribe({
      next: (pdf) => saveBlob(pdf, 'stockhub-labels.pdf'),
      error: () => undefined,
    });
  }

  protected print(): void {
    this.store.generate()?.subscribe({ next: (pdf) => printBlob(pdf), error: () => undefined });
  }
}
