import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ThemeStore } from './core/theme/theme-store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />
    <p-toast position="top-right" />
  `,
})
export class App {
  /** Instantiated eagerly so the theme class is applied before first paint of routes. */
  protected readonly theme = inject(ThemeStore);
}
