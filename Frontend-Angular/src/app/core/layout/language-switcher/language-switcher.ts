import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Language, LanguageStore, SUPPORTED_LANGUAGES } from '../../i18n/language-store';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="radiogroup"
      [attr.aria-label]="'language.label' | translate"
      class="inline-flex rounded-lg border border-border bg-surface-muted p-0.5"
    >
      @for (language of languages; track language) {
        <button
          type="button"
          role="radio"
          [attr.aria-checked]="store.language() === language"
          [attr.aria-label]="'language.' + language | translate"
          [attr.lang]="language"
          (click)="select(language)"
          class="h-8 min-w-9 rounded-md px-2 text-xs font-semibold uppercase text-fg-muted transition-colors hover:text-fg aria-checked:bg-surface aria-checked:text-primary aria-checked:shadow-card"
        >
          {{ language }}
        </button>
      }
    </div>
  `,
})
export class LanguageSwitcher {
  protected readonly store = inject(LanguageStore);
  protected readonly languages = SUPPORTED_LANGUAGES;

  protected select(language: Language): void {
    void this.store.setLanguage(language);
  }
}
