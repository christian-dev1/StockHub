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
          <p
            class="px-2 pb-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-fg-muted"
          >
            {{ section.labelKey | translate }}
          </p>
          <ul class="flex flex-col">
            @for (item of section.items; track item.route) {
              <li>
                <a
                  [routerLink]="item.route"
                  routerLinkActive="border-primary text-fg font-medium"
                  [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                  ariaCurrentWhenActive="page"
                  (click)="navigate.emit()"
                  class="relative flex items-center gap-2.5 border-l-2 border-transparent px-2 py-1.5 text-sm text-fg-muted transition-colors hover:bg-surface-muted/50 hover:text-fg"
                >
                  <i [class]="'pi ' + item.icon + ' text-sm'" aria-hidden="true"></i>
                  <span class="truncate">{{ item.labelKey | translate }}</span>
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
    const role = this.auth.session()?.role;
    const audience = this.auth.isSuperAdmin() ? 'platform' : 'company';
    return NAVIGATION.filter((s) => s.audience === 'all' || s.audience === audience)
      .map((s) => ({
        ...s,
        items: s.items.filter((i) =>
          role === 'VENDEUR'
            ? i.labelKey === 'nav.dashboard' || i.labelKey === 'nav.products'
            : this.auth.canAny(i.permissions ?? []),
        ),
      }))
      .filter((s) => s.items.length > 0);
  });
}
