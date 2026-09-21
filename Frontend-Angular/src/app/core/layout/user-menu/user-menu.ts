import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { AuthStore } from '../../auth/auth-store';
import { APP_ROUTES } from '../../config/routes/app.routes';
import { LanguageStore } from '../../i18n/language-store';

@Component({
  selector: 'app-user-menu',
  imports: [MenuModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-surface-muted"
      [attr.aria-label]="'nav.userMenu' | translate"
      aria-haspopup="menu"
      (click)="userMenu.toggle($event)"
    >
      <span
        class="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-fg"
        aria-hidden="true"
      >
        {{ initials() }}
      </span>
      <span class="hidden text-left text-sm leading-tight md:block">
        <span class="block font-medium text-fg">{{ auth.displayName() }}</span>
        <span class="block text-xs text-fg-muted">{{
          'roles.' + (auth.session()?.role ?? '') | translate
        }}</span>
      </span>
      <i class="pi pi-angle-down hidden text-xs text-fg-muted md:block" aria-hidden="true"></i>
    </button>
    <p-menu #userMenu [model]="items()" [popup]="true" appendTo="body" />
  `,
})
export class UserMenu {
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageStore);

  protected readonly initials = computed(() => {
    const s = this.auth.session();
    return s ? `${s.firstName.charAt(0)}${s.lastName.charAt(0)}`.toUpperCase() : '';
  });

  protected readonly items = computed<MenuItem[]>(() => {
    this.language.language();
    const t = (key: string) => this.translate.instant(key) as string;
    return [
      { label: this.auth.session()?.email, disabled: true, styleClass: 'text-xs' },
      { separator: true },
      {
        label: t('auth.changePassword.title'),
        icon: 'pi pi-key',
        command: () => void this.router.navigateByUrl(APP_ROUTES.CHANGE_PASSWORD),
      },
      { label: t('auth.logout'), icon: 'pi pi-sign-out', command: () => this.logout() },
    ];
  });

  private logout(): void {
    this.auth.logout().subscribe(() => void this.router.navigateByUrl(APP_ROUTES.LOGIN));
  }
}
