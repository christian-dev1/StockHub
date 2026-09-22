import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { AppError } from '../../../../core/errors/app-error';
import { Confirmation } from '../../../../shared/ui/confirm/confirmation';
import { Notifier } from '../../../../shared/ui/notifier';
import { IMAGE_TYPES, MAX_IMAGE_BYTES, imageFileProblem } from '../../../../shared/utils/files';
import { ProductImageUseCase } from '../../domain/use-cases/product.use-cases';
import { ProductImageCache } from '../state/product-image.cache';
import { ProductThumbnail } from './product-thumbnail';

/**
 * Picture of a product: pick a file, check it locally, preview it, then send
 * it; or remove the current picture. The backend re-checks the content.
 */
@Component({
  selector: 'app-product-image-panel',
  imports: [TranslatePipe, ButtonModule, ProductThumbnail],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="sh-card p-5 sm:p-6" aria-labelledby="img-title">
      <h2 id="img-title" class="mb-4 text-base font-semibold">
        {{ 'products.image.title' | translate }}
      </h2>
      <div class="mx-auto aspect-square w-full max-w-64">
        @if (pending(); as file) {
          <img
            [src]="pendingUrl()"
            [alt]="'products.image.preview' | translate"
            class="size-full rounded-xl object-cover ring-2 ring-primary"
          />
        } @else {
          <app-product-thumbnail
            size="lg"
            [productId]="productId()"
            [hasImage]="hasImage()"
            [alt]="productName()"
          />
        }
      </div>
      @if (problem(); as p) {
        <p class="mt-3 text-sm text-danger" role="alert">
          {{ 'products.image.problems.' + p | translate: { max: maxMb } }}
        </p>
      }
      @if (canEdit()) {
        <input
          #fileInput
          type="file"
          class="sr-only"
          [accept]="accept"
          [attr.aria-label]="'products.image.choose' | translate"
          (change)="pick(fileInput)"
        />
        @if (pending(); as file) {
          <p class="mt-3 truncate text-center text-xs text-fg-muted">{{ file.name }}</p>
          <div class="mt-3 flex flex-wrap justify-center gap-2">
            <p-button
              icon="pi pi-upload"
              [label]="'products.image.upload' | translate"
              [loading]="busy()"
              (onClick)="upload(file)"
            />
            <p-button
              [text]="true"
              [label]="'common.cancel' | translate"
              [disabled]="busy()"
              (onClick)="discard()"
            />
          </div>
        } @else {
          <div class="mt-4 flex flex-wrap justify-center gap-2">
            <p-button
              [outlined]="true"
              icon="pi pi-image"
              [label]="
                (hasImage() ? 'products.image.replace' : 'products.image.choose') | translate
              "
              (onClick)="fileInput.click()"
            />
            @if (hasImage()) {
              <p-button
                [text]="true"
                severity="danger"
                icon="pi pi-trash"
                [label]="'products.image.remove' | translate"
                [loading]="busy()"
                (onClick)="remove()"
              />
            }
          </div>
          <p class="mt-3 text-center text-xs text-fg-muted">
            {{ 'products.image.rules' | translate: { max: maxMb } }}
          </p>
        }
      }
    </section>
  `,
})
export class ProductImagePanel {
  readonly productId = input.required<string>();
  readonly productName = input('');
  readonly hasImage = input.required<boolean>();
  readonly canEdit = input(false);
  readonly changed = output<boolean>();

  private readonly images = inject(ProductImageUseCase);
  private readonly cache = inject(ProductImageCache);
  private readonly notifier = inject(Notifier);
  private readonly confirmation = inject(Confirmation);

  protected readonly accept = IMAGE_TYPES.join(',');
  protected readonly maxMb = MAX_IMAGE_BYTES / 1024 / 1024;
  protected readonly pending = signal<File | null>(null);
  protected readonly pendingUrl = signal<string | null>(null);
  protected readonly problem = signal<'type' | 'size' | null>(null);
  protected readonly busy = signal(false);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.discard());
  }

  protected pick(input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.discard();
    const problem = imageFileProblem(file);
    this.problem.set(problem);
    if (problem) return;
    this.pending.set(file);
    this.pendingUrl.set(URL.createObjectURL(file));
  }

  protected discard(): void {
    const url = this.pendingUrl();
    if (url) URL.revokeObjectURL(url);
    this.pending.set(null);
    this.pendingUrl.set(null);
  }

  protected upload(file: File): void {
    this.busy.set(true);
    this.images.upload(this.productId(), file).subscribe({
      next: () => {
        this.busy.set(false);
        this.discard();
        this.cache.refresh(this.productId());
        this.changed.emit(true);
        this.notifier.success('products.image.saved');
      },
      error: (error: AppError) => {
        this.busy.set(false);
        this.notifier.error(error);
      },
    });
  }

  protected async remove(): Promise<void> {
    const confirmed = await this.confirmation.ask({
      titleKey: 'products.image.remove',
      messageKey: 'products.image.confirmRemove',
      destructive: true,
    });
    if (!confirmed) return;
    this.busy.set(true);
    this.images.remove(this.productId()).subscribe({
      next: () => {
        this.busy.set(false);
        this.cache.clear(this.productId());
        this.changed.emit(false);
        this.notifier.success('products.image.removed');
      },
      error: (error: AppError) => {
        this.busy.set(false);
        this.notifier.error(error);
      },
    });
  }
}
