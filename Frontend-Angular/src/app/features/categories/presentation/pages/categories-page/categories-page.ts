import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TextareaModule } from 'primeng/textarea';
import { AuthStore } from '../../../../../core/auth/auth-store';
import { AppError } from '../../../../../core/errors/app-error';
import { Confirmation } from '../../../../../shared/ui/confirm/confirmation';
import { EmptyState } from '../../../../../shared/ui/empty-state/empty-state';
import { ErrorState } from '../../../../../shared/ui/error-state/error-state';
import { FormField } from '../../../../../shared/ui/form-field/form-field';
import { Notifier } from '../../../../../shared/ui/notifier';
import { PageHeader } from '../../../../../shared/ui/page-header/page-header';
import { SearchField } from '../../../../../shared/ui/search-field/search-field';
import { StatusBadge } from '../../../../../shared/ui/status-badge/status-badge';
import { applyServerErrors } from '../../../../../shared/utils/server-errors';
import {
  Category,
  canDelete,
  hasChildren,
  possibleParents,
} from '../../../domain/entities/category';
import { categoryForm, toCategoryDraft } from '../../forms/category-form';
import { CategoriesStore } from '../../state/categories.store';

@Component({
  selector: 'app-categories-page',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    SkeletonModule,
    TextareaModule,
    EmptyState,
    ErrorState,
    FormField,
    PageHeader,
    SearchField,
    StatusBadge,
  ],
  providers: [CategoriesStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './categories-page.html',
})
export class CategoriesPage implements OnInit {
  protected readonly store = inject(CategoriesStore);
  private readonly auth = inject(AuthStore);
  private readonly confirmation = inject(Confirmation);
  private readonly notifier = inject(Notifier);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly canManage = computed(() => this.auth.can('CATEGORY_MANAGE'));
  protected readonly search = signal('');
  protected readonly visible = computed(() => {
    const term = this.search().toLocaleLowerCase();
    return term
      ? this.store.categories().filter((c) => c.name.toLocaleLowerCase().includes(term))
      : this.store.categories();
  });
  protected readonly skeletons = [0, 1, 2, 3];

  protected readonly dialogOpen = signal(false);
  protected readonly editing = signal<Category | null>(null);
  protected readonly saving = signal(false);
  protected readonly form = categoryForm(this.fb);
  protected readonly parentOptions = computed(() =>
    possibleParents(this.store.categories(), this.editing()).map((c) => ({
      value: c.id,
      label: c.name,
    })),
  );
  protected readonly parentLocked = computed(() => {
    const category = this.editing();
    return !!category && hasChildren(this.store.categories(), category.id);
  });

  ngOnInit(): void {
    this.store.load();
  }

  protected deletable(category: Category): boolean {
    return canDelete(this.store.categories(), category);
  }

  protected openCreate(parent?: Category): void {
    this.editing.set(null);
    this.form.reset(categoryForm(this.fb).getRawValue());
    if (parent) this.form.controls.parentId.setValue(parent.id);
    this.dialogOpen.set(true);
  }

  protected openEdit(category: Category): void {
    this.editing.set(category);
    this.form.reset(categoryForm(this.fb, category).getRawValue());
    this.dialogOpen.set(true);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const existing = this.editing();
    this.saving.set(true);
    this.store.save(toCategoryDraft(this.form), existing).subscribe({
      next: (category) => {
        this.saving.set(false);
        this.dialogOpen.set(false);
        this.notifier.success(existing ? 'common.saved' : 'categories.saved.created', {
          name: category.name,
        });
      },
      error: (error: AppError) => {
        this.saving.set(false);
        if (!applyServerErrors(this.form, error)) this.notifier.error(error);
      },
    });
  }

  protected async remove(category: Category): Promise<void> {
    const confirmed = await this.confirmation.ask({
      titleKey: 'categories.actions.delete',
      messageKey: 'categories.confirm.delete',
      params: { name: category.name },
      acceptKey: 'categories.actions.delete',
      destructive: true,
    });
    if (!confirmed) return;
    this.store.delete(category).subscribe({
      next: () => this.notifier.success('categories.saved.deleted', { name: category.name }),
      error: (error: AppError) => this.notifier.error(error),
    });
  }
}
