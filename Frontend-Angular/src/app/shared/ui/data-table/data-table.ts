import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  computed,
  contentChildren,
  inject,
  input,
  output,
} from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { AppError } from '../../../core/errors/app-error';
import { EmptyState } from '../empty-state/empty-state';
import { ErrorState } from '../error-state/error-state';
import { PageChange, Pagination } from '../pagination/pagination';

export interface TableColumn {
  readonly key: string;
  /** Already translated header. */
  readonly header: string;
  readonly sortable?: boolean;
  /** Column hidden in the desktop table below this breakpoint (always shown in mobile cards). */
  readonly hideBelow?: 'md' | 'lg' | 'xl';
  readonly align?: 'start' | 'end';
  /** Shown as the card title on mobile. */
  readonly primary?: boolean;
}

export interface SortState {
  readonly field: string;
  readonly direction: 'asc' | 'desc';
}

/** Marks the template rendering a column's cell: `<ng-template appCell="email" let-row>`. */
@Directive({ selector: 'ng-template[appCell]' })
export class CellTemplate {
  readonly appCell = input.required<string>();
  readonly template = inject<TemplateRef<{ $implicit: unknown }>>(TemplateRef);
}

const HIDE: Record<NonNullable<TableColumn['hideBelow']>, string> = {
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
};

/**
 * Server-driven data table: sorting, pagination, loading skeleton, empty and
 * error states. Renders a semantic table from md upwards and stacked cards on
 * phones, so lists stay usable on every screen.
 */
@Component({
  selector: 'app-data-table',
  imports: [NgTemplateOutlet, SkeletonModule, EmptyState, ErrorState, Pagination],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-table.html',
})
export class DataTable<T> {
  readonly caption = input.required<string>();
  readonly columns = input.required<readonly TableColumn[]>();
  readonly rows = input<readonly T[]>([]);
  readonly rowKey = input.required<(row: T) => string>();
  readonly loading = input(false);
  readonly error = input<AppError | null>(null);
  readonly total = input(0);
  readonly page = input(0);
  readonly size = input(20);
  readonly sort = input<SortState | null>(null);
  readonly emptyTitle = input.required<string>();
  readonly emptyDescription = input<string>();
  readonly clickable = input(false);

  readonly sortChange = output<SortState>();
  readonly pageChange = output<PageChange>();
  readonly rowSelect = output<T>();
  readonly retry = output<void>();

  private readonly cellTemplates = contentChildren(CellTemplate);
  protected readonly templates = computed(
    () => new Map(this.cellTemplates().map((cell) => [cell.appCell(), cell.template])),
  );
  protected readonly skeletonRows = Array.from({ length: 5 }, (_, i) => i);
  protected readonly hide = HIDE;

  protected ariaSort(column: TableColumn): 'ascending' | 'descending' | 'none' | null {
    if (!column.sortable) return null;
    const sort = this.sort();
    if (sort?.field !== column.key) return 'none';
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  protected toggleSort(column: TableColumn): void {
    const sort = this.sort();
    const direction = sort?.field === column.key && sort.direction === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ field: column.key, direction });
  }

  protected cellValue(row: T, key: string): unknown {
    return (row as Record<string, unknown>)[key];
  }
}
