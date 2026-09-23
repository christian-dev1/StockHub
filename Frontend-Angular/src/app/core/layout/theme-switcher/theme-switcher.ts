import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ThemePreference, ThemeStore } from '../../theme/theme-store';

interface ThemeOption {
  readonly value: ThemePreference;
  readonly icon: string;
}

@Component({
  selector: 'app-theme-switcher',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="radiogroup"
      [attr.aria-label]="'theme.label' | translate"
      class="inline-flex rounded-md border border-border bg-surface-muted p-0.5"
    >
      @for (option of options; track option.value) {
        <button
          type="button"
          role="radio"
          [attr.aria-checked]="theme.preference() === option.value"
          [attr.aria-label]="'theme.' + option.value | translate"
          [title]="'theme.' + option.value | translate"
          (click)="theme.setPreference(option.value)"
          class="flex size-8 items-center justify-center rounded-sm text-fg-muted transition-colors hover:text-fg aria-checked:bg-surface aria-checked:text-primary"
        >
          <i [class]="'pi ' + option.icon" aria-hidden="true"></i>
        </button>
      }
    </div>
  `,
})
export class ThemeSwitcher {
  protected readonly theme = inject(ThemeStore);
  protected readonly options: readonly ThemeOption[] = [
    { value: 'light', icon: 'pi-sun' },
    { value: 'dark', icon: 'pi-moon' },
    { value: 'system', icon: 'pi-desktop' },
  ];
}
