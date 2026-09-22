import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { APP_ROUTES } from '../../../../core/config/routes/app.routes';
import { AppError } from '../../../../core/errors/app-error';
import { Confirmation } from '../../../../shared/ui/confirm/confirmation';
import { Notifier } from '../../../../shared/ui/notifier';
import { saveBlob } from '../../../../shared/utils/files';
import {
  GENERATABLE_FORMATS,
  GeneratableFormat,
  GeneratedBarcode,
} from '../../domain/entities/barcode';
import {
  DownloadBarcodeUseCase,
  GenerateBarcodeUseCase,
} from '../../domain/use-cases/barcode.use-cases';

/**
 * Barcode of a product. Without a barcode it offers generation (EAN-13 or
 * CODE128); with one it shows a preview and downloads, and replacement only
 * after an explicit confirmation (labels may already be stuck on shelves).
 */
@Component({
  selector: 'app-barcode-panel',
  imports: [RouterLink, TranslatePipe, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './barcode-panel.html',
})
export class BarcodePanel {
  readonly productId = input.required<string>();
  readonly sku = input.required<string>();
  readonly barcode = input<string | null>(null);
  readonly barcodeFormat = input<string | null>(null);
  readonly canGenerate = input(false);
  readonly canPrint = input(false);
  readonly generated = output<GeneratedBarcode>();

  private readonly generate = inject(GenerateBarcodeUseCase);
  private readonly download = inject(DownloadBarcodeUseCase);
  private readonly notifier = inject(Notifier);
  private readonly confirmation = inject(Confirmation);

  protected readonly routes = APP_ROUTES;
  protected readonly formats = GENERATABLE_FORMATS;
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly previewFailed = signal(false);
  protected readonly busy = signal<GeneratableFormat | 'png' | 'svg' | null>(null);

  constructor() {
    effect(() => {
      const productId = this.productId();
      const barcode = this.barcode();
      untracked(() => this.loadPreview(productId, barcode));
    });
    inject(DestroyRef).onDestroy(() => this.setPreview(null));
  }

  protected async create(format: GeneratableFormat): Promise<void> {
    const replacing = !!this.barcode();
    if (replacing) {
      const confirmed = await this.confirmation.ask({
        titleKey: 'barcodes.actions.replace',
        messageKey: 'barcodes.confirm.replace',
        params: { format: format, current: this.barcode() },
        destructive: true,
      });
      if (!confirmed) return;
    }
    this.busy.set(format);
    this.generate.execute(this.productId(), format, replacing).subscribe({
      next: (barcode) => {
        this.busy.set(null);
        this.generated.emit(barcode);
        this.notifier.success('barcodes.saved.generated', { barcode: barcode.barcode });
      },
      error: (error: AppError) => {
        this.busy.set(null);
        this.notifier.error(error);
      },
    });
  }

  protected save(kind: 'png' | 'svg'): void {
    this.busy.set(kind);
    const request =
      kind === 'png' ? this.download.png(this.productId()) : this.download.svg(this.productId());
    request.subscribe({
      next: (blob) => {
        this.busy.set(null);
        saveBlob(blob, `barcode-${this.sku()}.${kind}`);
      },
      error: (error: AppError) => {
        this.busy.set(null);
        this.notifier.error(error);
      },
    });
  }

  private loadPreview(productId: string, barcode: string | null): void {
    this.setPreview(null);
    this.previewFailed.set(false);
    if (!barcode) return;
    this.download.svg(productId).subscribe({
      next: (blob) => this.setPreview(URL.createObjectURL(blob)),
      error: () => this.previewFailed.set(true),
    });
  }

  private setPreview(url: string | null): void {
    const previous = this.previewUrl();
    if (previous) URL.revokeObjectURL(previous);
    this.previewUrl.set(url);
  }
}
