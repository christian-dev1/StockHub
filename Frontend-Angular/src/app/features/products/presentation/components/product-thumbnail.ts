import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { ProductImageCache } from '../state/product-image.cache';

const SIZES = { sm: 'size-10 rounded-lg', lg: 'size-full rounded-xl' } as const;

/** Product picture, or a neutral placeholder when there is none. */
@Component({
  selector: 'app-product-thumbnail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block shrink-0' },
  template: `
    @let picture = image();
    <span
      class="flex items-center justify-center overflow-hidden bg-surface-muted text-fg-muted"
      [class]="sizes[size()]"
    >
      @if (picture.status === 'ready') {
        <img [src]="picture.url" [alt]="alt()" class="size-full object-cover" />
      } @else if (picture.status === 'loading') {
        <i class="pi pi-spin pi-spinner text-sm" aria-hidden="true"></i>
      } @else {
        <i class="pi pi-image" [class.text-3xl]="size() === 'lg'" aria-hidden="true"></i>
      }
    </span>
  `,
})
export class ProductThumbnail {
  readonly productId = input.required<string>();
  readonly hasImage = input.required<boolean>();
  readonly alt = input('');
  readonly size = input<keyof typeof SIZES>('sm');

  private readonly cache = inject(ProductImageCache);
  protected readonly sizes = SIZES;
  protected readonly image = computed(() => this.cache.image(this.productId())());

  constructor() {
    effect(() => this.cache.ensure(this.productId(), this.hasImage()));
  }
}
