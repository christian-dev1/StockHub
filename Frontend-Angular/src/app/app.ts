import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ThemeStore } from './core/theme/theme-store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule, ConfirmDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />
    <p-toast position="top-right" />
    <p-confirmdialog [style]="{ width: 'min(28rem, 95vw)' }" />
  `,
})
export class App {
  /** Instantiated eagerly so the theme class is applied before first paint of routes. */
  protected readonly theme = inject(ThemeStore);
}
