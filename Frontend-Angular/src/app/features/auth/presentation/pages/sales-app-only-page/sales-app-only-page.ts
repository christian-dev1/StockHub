import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';
import { AuthStore } from '../../../../../core/auth/auth-store';
import { APP_ROUTES } from '../../../../../core/config/routes/app.routes';

/**
 * Shown to signed-in users whose role is not allowed in the back-office
 * (sellers). Logging out is the only way forward, so it is the main action.
 */
@Component({
  selector: 'app-sales-app-only-page',
  imports: [TranslatePipe, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="flex min-h-dvh items-center justify-center bg-bg px-4">
      <section class="sh-card w-full max-w-lg p-8 text-center" aria-labelledby="sales-only-title">
        <span
          class="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-surface-muted text-primary"
        >
          <i class="pi pi-shopping-cart text-2xl" aria-hidden="true"></i>
        </span>
        <p class="text-sm font-semibold text-primary">403</p>
        <h1 id="sales-only-title" class="mt-2 text-2xl font-semibold text-fg">
          {{ 'auth.salesAppOnly.title' | translate }}
        </h1>
        <p class="mt-2 text-fg-muted">
          {{ 'auth.salesAppOnly.description' | translate: { name: auth.displayName() } }}
        </p>
        <p-button
          styleClass="mt-6"
          icon="pi pi-sign-out"
          [label]="'auth.logout' | translate"
          [loading]="loggingOut()"
          (onClick)="logout()"
        />
      </section>
    </main>
  `,
})
export class SalesAppOnlyPage {
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  protected readonly loggingOut = signal(false);

  protected logout(): void {
    this.loggingOut.set(true);
    this.auth
      .logout()
      .pipe(finalize(() => this.loggingOut.set(false)))
      .subscribe(() => void this.router.navigateByUrl(APP_ROUTES.LOGIN));
  }
}
