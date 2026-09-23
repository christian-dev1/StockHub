import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { debounceTime, filter, map } from 'rxjs';

let nextId = 0;

/**
 * Search box emitting trimmed terms after the user pauses typing. Bind `value`
 * to the applied term so that clearing the filters elsewhere empties the box.
 */
@Component({
  selector: 'app-search-field',
  imports: [ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative" role="search">
      <label [for]="id" class="sr-only">{{ label() }}</label>
      <i
        class="pi pi-search pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-muted"
        aria-hidden="true"
      ></i>
      <input
        [id]="id"
        type="search"
        [formControl]="control"
        [placeholder]="label()"
        autocomplete="off"
        class="w-full rounded-md border border-border bg-surface py-2 pr-11 pl-9 text-base text-fg placeholder:text-fg-muted focus:border-primary"
      />
      @if (control.value) {
        <button
          type="button"
          class="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded text-fg-muted hover:text-fg"
          [attr.aria-label]="'common.clear' | translate"
          (click)="control.setValue('')"
        >
          <i class="pi pi-times text-xs" aria-hidden="true"></i>
        </button>
      }
    </div>
  `,
})
export class SearchField implements OnInit {
  readonly label = input.required<string>();
  readonly value = input('');
  readonly debounce = input(300);
  readonly searchChange = output<string>();

  protected readonly id = `search-${nextId++}`;
  protected readonly control = new FormControl('', { nonNullable: true });
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const value = this.value();
      if (value !== this.control.value.trim()) {
        this.control.setValue(value, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.control.valueChanges
      .pipe(
        debounceTime(this.debounce()),
        map((v) => v.trim()),
        filter((term) => term !== this.value()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((term) => this.searchChange.emit(term));
  }
}
