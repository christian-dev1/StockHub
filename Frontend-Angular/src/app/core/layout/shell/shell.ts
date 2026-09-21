import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DrawerModule } from 'primeng/drawer';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { SidebarNav } from '../sidebar-nav/sidebar-nav';
import { ThemeSwitcher } from '../theme-switcher/theme-switcher';

/**
 * Authenticated application frame: persistent sidebar on large screens,
 * off-canvas drawer below the lg breakpoint.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, TranslatePipe, DrawerModule, SidebarNav, ThemeSwitcher, LanguageSwitcher],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
})
export class Shell {
  protected readonly mobileNavOpen = signal(false);
}
