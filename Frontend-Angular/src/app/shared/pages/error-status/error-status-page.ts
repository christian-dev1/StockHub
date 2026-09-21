import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { APP_ROUTES } from '../../../core/config/routes/app.routes';

export type ErrorStatus = 403 | 404 | 500;

const ICONS: Record<ErrorStatus, string> = {
  403: 'pi-lock',
  404: 'pi-compass',
  500: 'pi-exclamation-triangle',
};

/** Shared 403 / 404 / 500 page; the status comes from route data. */
@Component({
  selector: 'app-error-status-page',
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="flex min-h-dvh items-center justify-center bg-bg px-4">
      <section class="sh-card w-full max-w-lg p-8 text-center" aria-labelledby="error-title">
        <span
          class="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-surface-muted text-primary"
        >
          <i [class]="'pi ' + icon() + ' text-2xl'" aria-hidden="true"></i>
        </span>
        <p class="text-sm font-semibold text-primary">{{ status() }}</p>
        <h1 id="error-title" class="mt-2 text-2xl font-semibold text-fg">
          {{ 'errors.page.' + status() + '.title' | translate }}
        </h1>
        <p class="mt-2 text-fg-muted">
          {{ 'errors.page.' + status() + '.description' | translate }}
        </p>
        <a
          [routerLink]="home"
          class="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-fg hover:bg-primary-hover"
        >
          <i class="pi pi-home" aria-hidden="true"></i>
          {{ 'errors.page.backHome' | translate }}
        </a>
      </section>
    </main>
  `,
})
export class ErrorStatusPage {
  /** Bound from route data thanks to withComponentInputBinding(). */
  readonly status = input<ErrorStatus>(404);
  protected readonly icon = computed(() => ICONS[this.status()]);
  protected readonly home = APP_ROUTES.ROOT;
}
