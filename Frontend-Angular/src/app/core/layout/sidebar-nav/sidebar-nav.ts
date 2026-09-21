import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '../../auth/auth-store';
import { NAVIGATION } from '../navigation';

@Component({
  selector: 'app-sidebar-nav',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav [attr.aria-label]="'nav.main' | translate" class="flex flex-col gap-6">
      @for (section of sections(); track section.labelKey) {
        <div>
          <p class="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
            {{ section.labelKey | translate }}
          </p>
          <ul class="flex flex-col gap-0.5">
            @for (item of section.items; track item.route) {
              <li>
                <a
                  [routerLink]="item.route"
                  routerLinkActive="bg-surface-muted text-primary"
                  ariaCurrentWhenActive="page"
                  (click)="navigate.emit()"
                  class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-fg hover:bg-surface-muted"
                >
                  <i [class]="'pi ' + item.icon + ' text-base'" aria-hidden="true"></i>
                  <span>{{ item.labelKey | translate }}</span>
                </a>
              </li>
            }
          </ul>
        </div>
      }
    </nav>
  `,
})
export class SidebarNav {
  /** Emitted on navigation so the mobile drawer can close itself. */
  readonly navigate = output<void>();
  private readonly auth = inject(AuthStore);

  /** Sections filtered by audience (platform vs company) and permissions. */
  protected readonly sections = computed(() => {
    this.auth.session();
    const audience = this.auth.isSuperAdmin() ? 'platform' : 'company';
    return NAVIGATION.filter((s) => s.audience === 'all' || s.audience === audience)
      .map((s) => ({ ...s, items: s.items.filter((i) => this.auth.canAny(i.permissions ?? [])) }))
      .filter((s) => s.items.length > 0);
  });
}
