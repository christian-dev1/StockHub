import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { AppError } from '../../../../../core/errors/app-error';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';
import { LanguageStore } from '../../../../../core/i18n/language-store';
import { Confirmation } from '../../../../../shared/ui/confirm/confirmation';
import { Notifier } from '../../../../../shared/ui/notifier';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { StatusBadge } from '../../../../../shared/ui/status-badge/status-badge';
import { DateTimePipe } from '../../../../../shared/pipes/date-time.pipe';
import { ErrorMessages } from '../../../../../shared/utils/error-message';
import { MAX_IMPORT_BYTES, saveBlob } from '../../../../../shared/utils/files';
import { ImportAction, ImportIssue } from '../../../domain/entities/product-import';
import { ProductImportStore } from '../../state/product-import.store';

const ACTION_TONES = { CREATE: 'success', UPDATE: 'info', ERROR: 'danger' } as const;

@Component({
  selector: 'app-product-import-page',
  imports: [
    FormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    CheckboxModule,
    DateTimePipe,
    PageHeader,
    StatusBadge,
  ],
  providers: [ProductImportStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-import-page.html',
})
export class ProductImportPage {
  protected readonly store = inject(ProductImportStore);
  private readonly notifier = inject(Notifier);
  private readonly confirmation = inject(Confirmation);
  private readonly errors = inject(ErrorMessages);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageStore);

  protected readonly routes = APP_ROUTES;
  protected readonly maxMb = MAX_IMPORT_BYTES / 1024 / 1024;
  protected readonly tones = ACTION_TONES;
  protected readonly errorsOnly = signal(false);
  protected readonly rows = computed(() => {
    const rows = this.store.preview()?.rows ?? [];
    return this.errorsOnly() ? rows.filter((r) => r.action === 'ERROR') : rows;
  });
  protected readonly steps = ['file', 'preview', 'done'] as const;

  protected pick(input: HTMLInputElement): void {
    this.store.choose(input.files?.[0] ?? null);
    input.value = '';
  }

  protected downloadTemplate(): void {
    this.store.template().subscribe({
      next: (blob) => saveBlob(blob, 'stockhub-products-template.csv'),
      error: (error: AppError) => this.notifier.error(error),
    });
  }

  protected analyse(): void {
    this.store.analyse()?.subscribe({
      next: (preview) => this.errorsOnly.set(preview.errorCount > 0),
      error: () => undefined,
    });
  }

  protected async commit(): Promise<void> {
    const preview = this.store.preview();
    if (!preview) return;
    const confirmed = await this.confirmation.ask({
      titleKey: 'imports.confirm.title',
      messageKey: 'imports.confirm.message',
      params: { create: preview.createCount, update: preview.updateCount },
      acceptKey: 'imports.actions.commit',
    });
    if (!confirmed) return;
    this.store.commit()?.subscribe({
      next: () => this.notifier.success('imports.saved'),
      error: () => undefined,
    });
  }

  protected actionLabel(action: ImportAction): string {
    return `imports.actions.row.${action}`;
  }

  /** "Colonne Prix de vente : les prix ne peuvent pas être négatifs." */
  protected issueText(issue: ImportIssue): string {
    this.language.language();
    const message = this.errors.ofField(issue.code, issue.message);
    if (!issue.column) return message;
    const key = `imports.columns.${issue.column}`;
    const label = this.translate.instant(key) as string;
    return `${label === key ? issue.column : label} : ${message}`;
  }

  protected errorText(error: AppError): string {
    return this.errors.of(error);
  }
}
