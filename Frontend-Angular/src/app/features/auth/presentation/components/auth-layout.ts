import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../core/layout/language-switcher/language-switcher';
import { ThemeSwitcher } from '../../../../core/layout/theme-switcher/theme-switcher';

/** Split screen used by sign-in pages: brand panel on large screens, form everywhere. */
@Component({
  selector: 'app-auth-layout',
  imports: [TranslatePipe, LanguageSwitcher, ThemeSwitcher],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid min-h-dvh lg:grid-cols-2">
      <aside
        class="relative hidden overflow-hidden bg-primary p-12 text-primary-fg lg:flex lg:flex-col lg:justify-between"
      >
        <div class="flex items-center gap-3">
          <span class="flex size-10 items-center justify-center rounded-xl bg-primary-fg/15">
            <i class="pi pi-box text-xl" aria-hidden="true"></i>
          </span>
          <span class="text-xl font-semibold tracking-tight">StockHub</span>
        </div>
        <div class="max-w-md">
          <h2 class="text-3xl font-semibold leading-tight">{{ 'auth.brand.title' | translate }}</h2>
          <p class="mt-4 text-primary-fg/80">{{ 'auth.brand.subtitle' | translate }}</p>
          <ul class="mt-8 space-y-3 text-sm text-primary-fg/90">
            @for (key of features; track key) {
              <li class="flex items-center gap-3">
                <i class="pi pi-check-circle" aria-hidden="true"></i
                >{{ 'auth.brand.' + key | translate }}
              </li>
            }
          </ul>
        </div>
        <p class="text-xs text-primary-fg/60">© StockHub</p>
      </aside>
      <main class="flex flex-col bg-bg">
        <div class="flex justify-end gap-2 p-4">
          <app-language-switcher />
          <app-theme-switcher />
        </div>
        <div class="flex flex-1 items-center justify-center px-4 pb-16">
          <div class="w-full max-w-sm">
            <ng-content />
          </div>
        </div>
      </main>
    </div>
  `,
})
export class AuthLayout {
  protected readonly features = ['featureLocations', 'featureTraceability', 'featureForecast'];
}
